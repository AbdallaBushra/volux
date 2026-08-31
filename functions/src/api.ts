import express, {type NextFunction, type Request, type Response} from "express";
import {randomUUID} from "crypto";
import * as admin from "firebase-admin";

type AdminRole = "super_admin" | "content_admin" | "reviewer" | null;
type Permission =
  | "opportunity.create"
  | "opportunity.edit"
  | "opportunity.publish"
  | "opportunity.archive"
  | "opportunity.review"
  | "opportunity.delete"
  | "user.review"
  | "settings.write"
  | "stats.read";

type Message = {
  en: string;
  ar: string;
};

type Principal = {
  uid: string;
  role: string | null;
  adminRole: AdminRole;
  token: admin.auth.DecodedIdToken;
};

type Envelope<T> = {
  ok: boolean;
  code: string;
  message: Message;
  data: T | null;
  errors: Array<{field?: string; message: string}>;
  meta: {
    requestId: string;
    timestamp: string;
  };
};

type ApiRequest = Request & {
  principal?: Principal;
  requestId?: string;
};

type ValidationError = {
  field?: string;
  message: string;
};

const db = admin.firestore();
const app = express();

const ADMIN_ROLE_PERMISSIONS: Record<Exclude<AdminRole, null>, Permission[] | ["*"]> = {
  super_admin: ["*"],
  content_admin: [
    "opportunity.create",
    "opportunity.edit",
    "opportunity.publish",
    "opportunity.archive",
    "opportunity.review",
    "opportunity.delete",
    "stats.read",
  ],
  reviewer: [
    "opportunity.review",
    "user.review",
    "stats.read",
  ],
};

const ALLOWED_TRAINING_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const ALLOWED_OPPORTUNITY_TYPES = ["training", "field", "virtual"] as const;
const ALLOWED_WORKFLOW_STATUS = [
  "draft",
  "pending",
  "active",
  "rejected",
  "archived",
  "completed",
] as const;

const msg = (en: string, ar: string): Message => ({en, ar});

const nowIso = () => new Date().toISOString();

const requestMeta = (req: ApiRequest) => ({
  requestId: req.requestId || randomUUID(),
  timestamp: nowIso(),
});

const sendEnvelope = <T>(
  res: Response,
  req: ApiRequest,
  status: number,
  body: Omit<Envelope<T>, "meta">
) => {
  const payload: Envelope<T> = {
    ...body,
    meta: requestMeta(req),
  };
  res.status(status).json(payload);
};

const ok = <T>(
  res: Response,
  req: ApiRequest,
  code: string,
  message: Message,
  data: T | null = null
) => {
  sendEnvelope<T>(res, req, 200, {
    ok: true,
    code,
    message,
    data,
    errors: [],
  });
};

const created = <T>(
  res: Response,
  req: ApiRequest,
  code: string,
  message: Message,
  data: T | null = null
) => {
  sendEnvelope<T>(res, req, 201, {
    ok: true,
    code,
    message,
    data,
    errors: [],
  });
};

const fail = (
  res: Response,
  req: ApiRequest,
  status: number,
  code: string,
  message: Message,
  errors: ValidationError[] = []
) => {
  sendEnvelope<null>(res, req, status, {
    ok: false,
    code,
    message,
    data: null,
    errors,
  });
};

const hasPermission = (adminRole: AdminRole, permission: Permission): boolean => {
  if (!adminRole) {
    return false;
  }
  const granted = ADMIN_ROLE_PERMISSIONS[adminRole];
  if (granted[0] === "*") {
    return true;
  }
  return (granted as Permission[]).includes(permission);
};

const sanitizeAdminRole = (value: unknown): AdminRole => {
  if (value === "super_admin" || value === "content_admin" || value === "reviewer") {
    return value;
  }
  return null;
};

const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
};

const parseNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
};

const parseString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const parseEnum = <T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] => {
  const normalized = parseString(value).toLowerCase();
  if (allowed.includes(normalized as T[number])) {
    return normalized as T[number];
  }
  return fallback;
};

const buildOpportunityStatus = (
  workflowStatus: string
): "pending" | "active" | "rejected" | "archived" | "completed" => {
  if (workflowStatus === "draft" || workflowStatus === "pending") {
    return "pending";
  }
  if (workflowStatus === "active") {
    return "active";
  }
  if (workflowStatus === "rejected") {
    return "rejected";
  }
  if (workflowStatus === "archived") {
    return "archived";
  }
  return "completed";
};

const normalizeTitle = (input: Record<string, unknown>) => {
  const titleAr = parseString(input.title_ar) || parseString(input.title) || "فرصة تدريبية";
  const titleEn = parseString(input.title_en) || parseString(input.title) || "Training Opportunity";
  return {
    title: titleEn,
    title_ar: titleAr,
    title_en: titleEn,
  };
};

const normalizeDescription = (input: Record<string, unknown>) => {
  const descriptionAr = parseString(input.description_ar) || parseString(input.description);
  const descriptionEn = parseString(input.description_en) || parseString(input.description);
  return {
    description: descriptionEn || descriptionAr,
    description_ar: descriptionAr || descriptionEn,
    description_en: descriptionEn || descriptionAr,
  };
};

const normalizeLocation = (input: Record<string, unknown>) => {
  const locationAr = parseString(input.location_ar) || parseString(input.location);
  const locationEn = parseString(input.location_en) || parseString(input.location);
  return {
    location: locationEn || locationAr,
    location_ar: locationAr || locationEn,
    location_en: locationEn || locationAr,
  };
};

const createAuditLog = async (
  req: ApiRequest,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {}
) => {
  const principal = req.principal;
  if (!principal) {
    return;
  }
  await db.collection("AuditLogs").add({
    action,
    targetType,
    targetId,
    actorId: principal.uid,
    actorRole: principal.role,
    actorAdminRole: principal.adminRole,
    requestId: req.requestId || randomUUID(),
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const authMiddleware = async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.replace("Bearer ", "").trim()
      : "";

    if (!token) {
      fail(
        res,
        req,
        401,
        "AUTH_MISSING_TOKEN",
        msg("Missing authorization token.", "رمز المصادقة غير موجود.")
      );
      return;
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection("Users").doc(decoded.uid).get();
    const profile = userDoc.exists ? userDoc.data() : null;

    const resolvedRole = (typeof decoded.role === "string" ? decoded.role : null) ||
      (typeof profile?.role === "string" ? profile.role : null);
    const resolvedAdminRole = sanitizeAdminRole(decoded.adminRole) ||
      sanitizeAdminRole(profile?.adminRole) ||
      (resolvedRole === "admin" ? "super_admin" : null);

    const principal: Principal = {
      uid: decoded.uid,
      role: resolvedRole,
      adminRole: resolvedAdminRole,
      token: decoded,
    };

    req.principal = principal;
    next();
  } catch (error) {
    fail(
      res,
      req,
      401,
      "AUTH_INVALID_TOKEN",
      msg("Invalid or expired authorization token.", "رمز المصادقة غير صالح أو منتهي.")
    );
  }
};

const requirePermission = (permission: Permission) => {
  return (req: ApiRequest, res: Response, next: NextFunction) => {
    const principal = req.principal;
    if (!principal || principal.role !== "admin") {
      fail(
        res,
        req,
        403,
        "AUTH_FORBIDDEN",
        msg("You do not have access to this resource.", "لا تملك صلاحية الوصول لهذا المورد.")
      );
      return;
    }

    if (!hasPermission(principal.adminRole, permission)) {
      fail(
        res,
        req,
        403,
        "AUTH_INSUFFICIENT_PERMISSION",
        msg("Your admin role is not allowed to perform this action.", "دور الأدمن الحالي لا يسمح بهذا الإجراء.")
      );
      return;
    }

    next();
  };
};

const validateTrainingInput = (payload: Record<string, unknown>) => {
  const errors: ValidationError[] = [];
  const title = parseString(payload.title);
  const titleAr = parseString(payload.title_ar);
  const titleEn = parseString(payload.title_en);

  if (!title && !titleAr && !titleEn) {
    errors.push({
      field: "title",
      message: "At least one of title/title_ar/title_en is required.",
    });
  }

  const trainingHours = parseNumber(payload.trainingHours, 0);
  if (trainingHours < 0) {
    errors.push({
      field: "trainingHours",
      message: "trainingHours must be greater than or equal to 0.",
    });
  }

  const volunteersNeeded = parseNumber(payload.volunteersNeeded, 0);
  if (volunteersNeeded < 0) {
    errors.push({
      field: "volunteersNeeded",
      message: "volunteersNeeded must be greater than or equal to 0.",
    });
  }

  return errors;
};

const buildTrainingOpportunity = (payload: Record<string, unknown>, uid: string) => {
  const workflow = parseEnum(
    payload.statusWorkflow,
    ALLOWED_WORKFLOW_STATUS,
    "draft"
  );

  return {
    ...normalizeTitle(payload),
    ...normalizeDescription(payload),
    ...normalizeLocation(payload),
    category: parseString(payload.category) || "Training",
    startDate: parseString(payload.startDate),
    endDate: parseString(payload.endDate),
    hours: parseNumber(payload.hours, 0),
    volunteersNeeded: parseNumber(payload.volunteersNeeded, 0),
    volunteers: parseNumber(payload.volunteersNeeded, 0),
    opportunityType: parseEnum(
      payload.opportunityType,
      ALLOWED_OPPORTUNITY_TYPES,
      "training"
    ),
    trainingHours: parseNumber(payload.trainingHours, 0),
    trainingLevel: parseEnum(
      payload.trainingLevel,
      ALLOWED_TRAINING_LEVELS,
      "beginner"
    ),
    certificateEligible: parseBoolean(payload.certificateEligible, false),
    statusWorkflow: workflow,
    status: buildOpportunityStatus(workflow),
    createdBy: uid,
    creatorType: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const pickAllowedPatch = (payload: Record<string, unknown>) => {
  const next: Record<string, unknown> = {};
  const assignIfExists = (key: string, value: unknown) => {
    if (value !== undefined) {
      next[key] = value;
    }
  };

  assignIfExists("title", parseString(payload.title) || undefined);
  assignIfExists("title_ar", parseString(payload.title_ar) || undefined);
  assignIfExists("title_en", parseString(payload.title_en) || undefined);
  assignIfExists("description", parseString(payload.description) || undefined);
  assignIfExists("description_ar", parseString(payload.description_ar) || undefined);
  assignIfExists("description_en", parseString(payload.description_en) || undefined);
  assignIfExists("category", parseString(payload.category) || undefined);
  assignIfExists("location", parseString(payload.location) || undefined);
  assignIfExists("location_ar", parseString(payload.location_ar) || undefined);
  assignIfExists("location_en", parseString(payload.location_en) || undefined);
  assignIfExists("startDate", parseString(payload.startDate) || undefined);
  assignIfExists("endDate", parseString(payload.endDate) || undefined);

  if (payload.hours !== undefined) {
    assignIfExists("hours", parseNumber(payload.hours, 0));
  }
  if (payload.volunteersNeeded !== undefined) {
    const volunteers = parseNumber(payload.volunteersNeeded, 0);
    assignIfExists("volunteersNeeded", volunteers);
    assignIfExists("volunteers", volunteers);
  }
  if (payload.opportunityType !== undefined) {
    assignIfExists(
      "opportunityType",
      parseEnum(payload.opportunityType, ALLOWED_OPPORTUNITY_TYPES, "training")
    );
  }
  if (payload.trainingHours !== undefined) {
    assignIfExists("trainingHours", parseNumber(payload.trainingHours, 0));
  }
  if (payload.trainingLevel !== undefined) {
    assignIfExists(
      "trainingLevel",
      parseEnum(payload.trainingLevel, ALLOWED_TRAINING_LEVELS, "beginner")
    );
  }
  if (payload.certificateEligible !== undefined) {
    assignIfExists(
      "certificateEligible",
      parseBoolean(payload.certificateEligible, false)
    );
  }
  if (payload.statusWorkflow !== undefined) {
    const workflow = parseEnum(
      payload.statusWorkflow,
      ALLOWED_WORKFLOW_STATUS,
      "draft"
    );
    assignIfExists("statusWorkflow", workflow);
    assignIfExists("status", buildOpportunityStatus(workflow));
  }

  next.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  return next;
};

app.disable("x-powered-by");
app.use(express.json({limit: "1mb"}));
app.use((req: ApiRequest, _res: Response, next: NextFunction) => {
  req.requestId = (req.headers["x-request-id"] as string) || randomUUID();
  next();
});
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-Id");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  next();
});

app.get("/v1/health", (req: ApiRequest, res: Response) => {
  ok(
    res,
    req,
    "HEALTH_OK",
    msg("Volux API is healthy.", "واجهة Volux تعمل بشكل طبيعي."),
    {service: "volux-api"}
  );
});

app.post(
  "/v1/admin/opportunities/training",
  authMiddleware,
  requirePermission("opportunity.create"),
  async (req: ApiRequest, res: Response) => {
    try {
      const payload = (req.body || {}) as Record<string, unknown>;
      const validationErrors = validateTrainingInput(payload);
      if (validationErrors.length > 0) {
        fail(
          res,
          req,
          400,
          "VALIDATION_ERROR",
          msg("Request validation failed.", "فشل التحقق من صحة البيانات."),
          validationErrors
        );
        return;
      }

      const opportunity = buildTrainingOpportunity(payload, req.principal!.uid);
      const ref = await db.collection("Opportunities").add(opportunity);
      await createAuditLog(req, "opportunity.create.training", "Opportunity", ref.id, {
        opportunityType: "training",
      });

      created(
        res,
        req,
        "OPPORTUNITY_CREATED",
        msg("Training opportunity created successfully.", "تم إنشاء الفرصة التدريبية بنجاح."),
        {id: ref.id}
      );
    } catch (error) {
      fail(
        res,
        req,
        500,
        "INTERNAL_ERROR",
        msg("Failed to create training opportunity.", "تعذر إنشاء الفرصة التدريبية.")
      );
    }
  }
);

app.patch(
  "/v1/admin/opportunities/:id",
  authMiddleware,
  requirePermission("opportunity.edit"),
  async (req: ApiRequest, res: Response) => {
    try {
      const opportunityId = req.params.id;
      const ref = db.collection("Opportunities").doc(opportunityId);
      const snapshot = await ref.get();
      if (!snapshot.exists) {
        fail(
          res,
          req,
          404,
          "NOT_FOUND",
          msg("Opportunity not found.", "الفرصة غير موجودة.")
        );
        return;
      }

      const patch = pickAllowedPatch((req.body || {}) as Record<string, unknown>);
      await ref.update(patch);
      await createAuditLog(req, "opportunity.update", "Opportunity", opportunityId, {
        fields: Object.keys(patch),
      });

      ok(
        res,
        req,
        "OPPORTUNITY_UPDATED",
        msg("Opportunity updated successfully.", "تم تحديث الفرصة بنجاح."),
        {id: opportunityId}
      );
    } catch (error) {
      fail(
        res,
        req,
        500,
        "INTERNAL_ERROR",
        msg("Failed to update opportunity.", "تعذر تحديث الفرصة.")
      );
    }
  }
);

const transitionOpportunity = async (
  req: ApiRequest,
  res: Response,
  options: {
    action: string;
    statusWorkflow: (typeof ALLOWED_WORKFLOW_STATUS)[number];
    code: string;
    message: Message;
    extra?: Record<string, unknown>;
  }
) => {
  try {
    const opportunityId = req.params.id;
    const ref = db.collection("Opportunities").doc(opportunityId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      fail(
        res,
        req,
        404,
        "NOT_FOUND",
        msg("Opportunity not found.", "الفرصة غير موجودة.")
      );
      return;
    }

    const updatePayload: Record<string, unknown> = {
      statusWorkflow: options.statusWorkflow,
      status: buildOpportunityStatus(options.statusWorkflow),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: req.principal!.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(options.extra || {}),
    };

    await ref.update(updatePayload);
    await createAuditLog(req, options.action, "Opportunity", opportunityId, updatePayload);

    ok(res, req, options.code, options.message, {id: opportunityId});
  } catch (error) {
    fail(
      res,
      req,
      500,
      "INTERNAL_ERROR",
      msg("Failed to update opportunity workflow.", "تعذر تحديث حالة سير عمل الفرصة.")
    );
  }
};

app.post(
  "/v1/admin/opportunities/:id/publish",
  authMiddleware,
  requirePermission("opportunity.publish"),
  async (req: ApiRequest, res: Response) => {
    await transitionOpportunity(req, res, {
      action: "opportunity.publish",
      statusWorkflow: "active",
      code: "OPPORTUNITY_PUBLISHED",
      message: msg("Opportunity published successfully.", "تم نشر الفرصة بنجاح."),
      extra: {
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
  }
);

app.post(
  "/v1/admin/opportunities/:id/archive",
  authMiddleware,
  requirePermission("opportunity.archive"),
  async (req: ApiRequest, res: Response) => {
    await transitionOpportunity(req, res, {
      action: "opportunity.archive",
      statusWorkflow: "archived",
      code: "OPPORTUNITY_ARCHIVED",
      message: msg("Opportunity archived successfully.", "تمت أرشفة الفرصة بنجاح."),
      extra: {
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
  }
);

app.post(
  "/v1/admin/opportunities/:id/approve",
  authMiddleware,
  requirePermission("opportunity.review"),
  async (req: ApiRequest, res: Response) => {
    await transitionOpportunity(req, res, {
      action: "opportunity.approve",
      statusWorkflow: "active",
      code: "OPPORTUNITY_APPROVED",
      message: msg("Opportunity approved successfully.", "تم اعتماد الفرصة بنجاح."),
      extra: {
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
  }
);

app.post(
  "/v1/admin/opportunities/:id/reject",
  authMiddleware,
  requirePermission("opportunity.review"),
  async (req: ApiRequest, res: Response) => {
    const reason = parseString((req.body || {}).reason) || "Not specified";
    await transitionOpportunity(req, res, {
      action: "opportunity.reject",
      statusWorkflow: "rejected",
      code: "OPPORTUNITY_REJECTED",
      message: msg("Opportunity rejected successfully.", "تم رفض الفرصة بنجاح."),
      extra: {
        rejectionReason: reason,
      },
    });
  }
);

app.delete(
  "/v1/admin/opportunities/:id",
  authMiddleware,
  requirePermission("opportunity.delete"),
  async (req: ApiRequest, res: Response) => {
    try {
      const opportunityId = req.params.id;
      const ref = db.collection("Opportunities").doc(opportunityId);
      const snapshot = await ref.get();
      if (!snapshot.exists) {
        fail(
          res,
          req,
          404,
          "NOT_FOUND",
          msg("Opportunity not found.", "الفرصة غير موجودة.")
        );
        return;
      }

      await ref.delete();
      await createAuditLog(req, "opportunity.delete", "Opportunity", opportunityId);
      ok(
        res,
        req,
        "OPPORTUNITY_DELETED",
        msg("Opportunity deleted successfully.", "تم حذف الفرصة بنجاح."),
        {id: opportunityId}
      );
    } catch (error) {
      fail(
        res,
        req,
        500,
        "INTERNAL_ERROR",
        msg("Failed to delete opportunity.", "تعذر حذف الفرصة.")
      );
    }
  }
);

const updateRegistrationStatus = async (
  req: ApiRequest,
  res: Response,
  status: "active" | "rejected",
  action: "registration.approve" | "registration.reject",
  code: string,
  successMessage: Message
) => {
  try {
    const userId = req.params.userId;
    const userRef = db.collection("Users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      fail(
        res,
        req,
        404,
        "NOT_FOUND",
        msg("User not found.", "المستخدم غير موجود.")
      );
      return;
    }

    const userData = userSnap.data() || {};
    const reason = parseString((req.body || {}).reason);
    const profileCollection = userData.role === "team"
      ? "Volunteer_Team_Profile"
      : "Organization_Profile";

    await userRef.update({
      status,
      rejectionReason: status === "rejected" ? reason : admin.firestore.FieldValue.delete(),
      approvedAt: status === "active" ?
        admin.firestore.FieldValue.serverTimestamp() :
        admin.firestore.FieldValue.delete(),
      rejectedAt: status === "rejected" ?
        admin.firestore.FieldValue.serverTimestamp() :
        admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: req.principal!.uid,
    });

    const profileRef = userRef.collection(profileCollection).doc("info");
    const profileSnap = await profileRef.get();
    if (profileSnap.exists) {
      await profileRef.update({
        status,
        rejectionReason: status === "rejected" ? reason : admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await db.collection("UserNotifications").add({
      userId,
      type: status === "active" ? "account_approved" : "account_rejected",
      title_en: status === "active" ? "Registration approved" : "Registration rejected",
      title_ar: status === "active" ? "تمت الموافقة على التسجيل" : "تم رفض التسجيل",
      message_en: status === "active" ?
        "Your registration has been approved by the admin." :
        `Your registration was rejected. Reason: ${reason || "Not specified"}`,
      message_ar: status === "active" ?
        "تمت الموافقة على طلب التسجيل من قبل الإدارة." :
        `تم رفض طلب التسجيل. السبب: ${reason || "غير محدد"}`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await createAuditLog(req, action, "User", userId, {status, reason});
    ok(res, req, code, successMessage, {userId, status});
  } catch (error) {
    fail(
      res,
      req,
      500,
      "INTERNAL_ERROR",
      msg("Failed to update registration.", "تعذر تحديث حالة التسجيل.")
    );
  }
};

app.post(
  "/v1/admin/registrations/:userId/approve",
  authMiddleware,
  requirePermission("user.review"),
  async (req: ApiRequest, res: Response) => {
    await updateRegistrationStatus(
      req,
      res,
      "active",
      "registration.approve",
      "REGISTRATION_APPROVED",
      msg("Registration approved successfully.", "تمت الموافقة على التسجيل بنجاح.")
    );
  }
);

app.post(
  "/v1/admin/registrations/:userId/reject",
  authMiddleware,
  requirePermission("user.review"),
  async (req: ApiRequest, res: Response) => {
    await updateRegistrationStatus(
      req,
      res,
      "rejected",
      "registration.reject",
      "REGISTRATION_REJECTED",
      msg("Registration rejected successfully.", "تم رفض التسجيل بنجاح.")
    );
  }
);

app.patch(
  "/v1/admin/users/:userId/status",
  authMiddleware,
  requirePermission("settings.write"),
  async (req: ApiRequest, res: Response) => {
    try {
      const userId = req.params.userId;
      const status = parseString((req.body || {}).status);
      if (!status) {
        fail(
          res,
          req,
          400,
          "VALIDATION_ERROR",
          msg("status is required.", "حقل status مطلوب."),
          [{field: "status", message: "status is required"}]
        );
        return;
      }

      const userRef = db.collection("Users").doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        fail(
          res,
          req,
          404,
          "NOT_FOUND",
          msg("User not found.", "المستخدم غير موجود.")
        );
        return;
      }

      await userRef.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.principal!.uid,
      });

      await createAuditLog(req, "user.status.update", "User", userId, {status});
      ok(
        res,
        req,
        "USER_STATUS_UPDATED",
        msg("User status updated successfully.", "تم تحديث حالة المستخدم بنجاح."),
        {userId, status}
      );
    } catch (error) {
      fail(
        res,
        req,
        500,
        "INTERNAL_ERROR",
        msg("Failed to update user status.", "تعذر تحديث حالة المستخدم.")
      );
    }
  }
);

app.get(
  "/v1/admin/stats",
  authMiddleware,
  requirePermission("stats.read"),
  async (req: ApiRequest, res: Response) => {
    try {
      const [usersSnap, oppsSnap, appsSnap, unreadAdminNotificationsSnap, complaintsSnap] =
        await Promise.all([
          db.collection("Users").get(),
          db.collection("Opportunities").get(),
          db.collection("Applications").get(),
          db.collection("AdminNotifications").where("read", "==", false).get(),
          db.collectionGroup("Complaints").get(),
        ]);

      let volunteers = 0;
      let organizations = 0;
      let teams = 0;
      let pendingApprovals = 0;

      for (const docSnapshot of usersSnap.docs) {
        const data = docSnapshot.data();
        const role = data.role;
        if (role === "volunteer") {
          volunteers += 1;
        } else if (role === "institution" || role === "organization") {
          organizations += 1;
        } else if (role === "team") {
          teams += 1;
        }

        if ((role === "institution" || role === "team") && data.status === "pending") {
          pendingApprovals += 1;
        }
      }

      ok(
        res,
        req,
        "ADMIN_STATS_OK",
        msg("Admin statistics loaded successfully.", "تم تحميل إحصائيات الأدمن بنجاح."),
        {
          totalUsers: usersSnap.size,
          totalVolunteers: volunteers,
          totalOrganizations: organizations,
          totalTeams: teams,
          totalOpportunities: oppsSnap.size,
          totalApplications: appsSnap.size,
          pendingApprovals,
          totalReports: complaintsSnap.size,
          unreadAdminNotifications: unreadAdminNotificationsSnap.size,
        }
      );
    } catch (error) {
      fail(
        res,
        req,
        500,
        "INTERNAL_ERROR",
        msg("Failed to load admin stats.", "تعذر تحميل إحصائيات الأدمن.")
      );
    }
  }
);

app.use((req: ApiRequest, res: Response) => {
  fail(
    res,
    req,
    404,
    "NOT_FOUND",
    msg("Endpoint not found.", "المسار غير موجود.")
  );
});

app.use((error: Error, req: ApiRequest, res: Response, _next: NextFunction) => {
  fail(
    res,
    req,
    500,
    "INTERNAL_ERROR",
    msg(error.message || "Unexpected server error.", "حدث خطأ غير متوقع في الخادم.")
  );
});

export {app};
