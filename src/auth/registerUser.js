// src/auth/registerUser.js
import { createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { collection, collectionGroup, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { sendAdminNotification } from "../database/adminData";
import { sendVerificationEmailWithSettings } from "./emailFlow";
import { loginPathByRole } from "./emailVerification";

const normalizeName = (value) => String(value || "").trim().toLowerCase();

const normalizeRole = (role) => {
  const raw = String(role || "volunteer").trim().toLowerCase();
  if (raw === "organization") return "institution";
  return raw || "volunteer";
};

const extractNamesFromData = (data = {}) => {
  const fields = [
    "fullName",
    "displayName",
    "name",
    "orgNameAr",
    "orgNameEn",
    "organizationName",
    "institutionName",
    "institutionNameAr",
    "institutionNameEn",
    "teamName",
    "teamNameAr",
    "teamNameEn",
  ];

  const names = [];
  fields.forEach((field) => {
    if (data[field]) names.push(data[field]);
  });

  if (data.firstName || data.lastName) {
    names.push(`${data.firstName || ""} ${data.lastName || ""}`.trim());
  }

  return names.map(normalizeName).filter(Boolean);
};

const getCandidateNames = (userData, role) => {
  if (role === "volunteer") {
    return extractNamesFromData({
      fullName: userData.fullName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      displayName: userData.fullName,
      name: userData.fullName,
    });
  }

  if (role === "institution") {
    return extractNamesFromData({
      orgNameAr: userData.orgNameAr,
      orgNameEn: userData.orgNameEn,
      organizationName: userData.orgNameAr || userData.orgNameEn,
      institutionName: userData.orgNameAr || userData.orgNameEn,
      displayName: userData.orgNameAr || userData.orgNameEn,
      name: userData.orgNameAr || userData.orgNameEn,
    });
  }

  if (role === "team") {
    return extractNamesFromData({
      teamNameAr: userData.teamNameAr,
      teamNameEn: userData.teamNameEn,
      teamName: userData.teamNameAr || userData.teamNameEn,
      displayName: userData.teamNameAr || userData.teamNameEn,
      name: userData.teamNameAr || userData.teamNameEn,
    });
  }

  return [];
};

const isRegistrationNameTaken = async (userData, role) => {
  const candidateNames = getCandidateNames(userData, role);
  if (!candidateNames.length) return false;

  const existingNames = new Set();

  const usersSnap = await getDocs(collection(db, "Users"));
  usersSnap.forEach((docSnap) => {
    extractNamesFromData(docSnap.data()).forEach((name) => existingNames.add(name));
  });

  const profileCollections = ["Volunteer_Profile", "Organization_Profile", "Volunteer_Team_Profile"];
  for (const profileCollection of profileCollections) {
    const profileSnap = await getDocs(collectionGroup(db, profileCollection));
    profileSnap.forEach((docSnap) => {
      extractNamesFromData(docSnap.data()).forEach((name) => existingNames.add(name));
    });
  }

  return candidateNames.some((name) => existingNames.has(name));
};

const resolveLanguage = (language) => {
  if (language === "en" || language === "ar") return language;
  if (typeof localStorage !== "undefined") {
    const storedLanguage = localStorage.getItem("language");
    if (storedLanguage === "en" || storedLanguage === "ar") return storedLanguage;
  }
  return "ar";
};

const isExpiredDateValue = (value) => {
  if (!value) return false;
  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(selectedDate.getTime()) || selectedDate < today;
};

const expiredLicenseRegistrationMessages = {
  en: "Your organization license is expired. Please renew it before applying to the platform.",
  ar: "\u062a\u0631\u062e\u064a\u0635 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0645\u0646\u062a\u0647\u064a. \u064a\u0631\u062c\u0649 \u062a\u062c\u062f\u064a\u062f \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0642\u0628\u0644 \u0627\u0644\u062a\u0642\u062f\u064a\u0645 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629.",
};

export const registerUser = async (userData, role = "volunteer", options = {}) => {
  try {
    const language = resolveLanguage(options.language);
    const normalizedRole = normalizeRole(role);

    if (normalizedRole === "institution" && isExpiredDateValue(userData.licenseExpiryDate)) {
      return {
        success: false,
        error: expiredLicenseRegistrationMessages[language] || expiredLicenseRegistrationMessages.ar,
      };
    }

    const duplicateNameExists = await isRegistrationNameTaken(userData, normalizedRole);
    if (duplicateNameExists) {
      return {
        success: false,
        error:
          language === "en"
            ? "This name is already used on the platform. Please use a different name."
            : "هذا الاسم مستخدم بالفعل في المنصة. يرجى استخدام اسم مختلف.",
      };
    }

    console.log(`Starting ${normalizedRole} registration...`);

    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;

    let displayName = "";
    let subCollectionName = "";

    if (normalizedRole === "volunteer") {
      displayName = userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
      subCollectionName = "Volunteer_Profile";
    } else if (normalizedRole === "institution") {
      displayName = userData.orgNameAr || userData.institutionNameAr || userData.orgNameEn || "";
      subCollectionName = "Organization_Profile";
    } else if (normalizedRole === "team") {
      displayName = userData.teamNameAr || userData.teamNameEn || "";
      subCollectionName = "Volunteer_Team_Profile";
    }

    await updateProfile(user, { displayName });

    const isPending = normalizedRole === "institution" || normalizedRole === "team";
    const userStatus = isPending ? "pending" : "active";

    const userDocRef = doc(db, "Users", user.uid);
    const baseData = {
      uid: user.uid,
      email: userData.email,
      role: normalizedRole,
      displayName,
      fullName: displayName,
      ...(normalizedRole === "institution"
        ? {
            orgNameAr: userData.orgNameAr || "",
            orgNameEn: userData.orgNameEn || "",
            organizationName: userData.orgNameAr || userData.orgNameEn || "",
          }
        : {}),
      ...(normalizedRole === "team"
        ? {
            teamNameAr: userData.teamNameAr || "",
            teamNameEn: userData.teamNameEn || "",
            teamName: userData.teamNameAr || userData.teamNameEn || "",
          }
        : {}),
      status: userStatus,
      emailVerified: Boolean(user.emailVerified),
      emailVerificationRequired: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      points: 0,
      hours: 0,
      completedOpportunities: 0,
      level: "Bronze",
    };

    await setDoc(userDocRef, baseData);

    const profileRef = doc(db, "Users", user.uid, subCollectionName, "info");
    const detailedData = {
      ...userData,
      password: "",
      confirmPassword: "",
      uid: user.uid,
      role: normalizedRole,
      status: userStatus,
      emailVerified: Boolean(user.emailVerified),
      emailVerificationRequired: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(profileRef, detailedData);

    let verificationEmailSent = false;
    try {
      auth.languageCode = language === "en" ? "en" : "ar";
      await sendVerificationEmailWithSettings(user, loginPathByRole[normalizedRole] || "/login");
      verificationEmailSent = true;
      await setDoc(
        userDocRef,
        {
          emailVerificationSentAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (verificationError) {
      console.warn("Failed to send verification email:", verificationError);
    }

    if (isPending) {
      try {
        await sendAdminNotification({
          userId: user.uid,
          userEmail: userData.email,
          userName: displayName,
          userRole: normalizedRole,
          type: "new_registration",
          title: normalizedRole === "institution" ? "مؤسسة جديدة" : "فريق تطوعي جديد",
          message:
            normalizedRole === "institution"
              ? `تم تسجيل مؤسسة جديدة: ${displayName} (${userData.email})`
              : `تم تسجيل فريق تطوعي جديد: ${displayName} (${userData.email})`,
          read: false,
          actionUrl: "/admin/pending-registrations",
        });

        console.log(`Admin notification sent for new ${normalizedRole} registration`);
      } catch (notifError) {
        console.warn("Failed to send admin notification:", notifError);
      }
    }

    if (isPending || normalizedRole === "volunteer") {
      await signOut(auth);
      console.log("Signed out automatically after registration");
    }

    const successMessages = verificationEmailSent
      ? {
          en: isPending
            ? "Registration submitted successfully. Please verify your email, then wait for admin approval before signing in."
            : "Registration successful. Please check your email and verify your account before signing in.",
          ar: isPending
            ? "تم تقديم طلب التسجيل بنجاح. يرجى تأكيد بريدك الإلكتروني، ثم انتظار موافقة الأدمن قبل تسجيل الدخول."
            : "تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني وتأكيد الحساب قبل تسجيل الدخول.",
        }
      : {
          en: isPending
            ? "Registration submitted successfully, but verification email could not be sent now. Try signing in to resend verification, then wait for admin approval."
            : "Registration successful, but verification email could not be sent now. Try signing in to resend verification.",
          ar: isPending
            ? "تم تقديم طلب التسجيل بنجاح، لكن تعذر إرسال رسالة التحقق الآن. جرّب تسجيل الدخول لإعادة إرسال التحقق، ثم انتظر موافقة الأدمن."
            : "تم التسجيل بنجاح، لكن تعذر إرسال رسالة التحقق الآن. جرّب تسجيل الدخول لإعادة إرسال التحقق.",
        };

    return {
      success: true,
      user,
      status: userStatus,
      emailVerified: Boolean(user.emailVerified),
      verificationEmailSent,
      requiresEmailVerification: true,
      message: successMessages[language] || successMessages.ar,
    };
  } catch (error) {
    console.error("Registration Error:", error.code, error.message);

    const messages = {
      generic: {
        en: "An error occurred during registration.",
        ar: "حدث خطأ أثناء التسجيل.",
      },
      "auth/email-already-in-use": {
        en: "This email address is already in use.",
        ar: "البريد الإلكتروني مستخدم بالفعل.",
      },
      "auth/weak-password": {
        en: "Password is too weak.",
        ar: "كلمة المرور ضعيفة جدًا.",
      },
      "auth/admin-restricted-operation": {
        en: "This operation is restricted.",
        ar: "هذه العملية مقيدة.",
      },
    };

    const language = resolveLanguage(options.language);
    const localized = messages[error.code] || messages.generic;
    return { success: false, error: localized[language] || localized.ar };
  }
};
