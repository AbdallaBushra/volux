// src/database/adminData.js
import { db, auth } from "../firebase/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  serverTimestamp,
  setDoc,
  addDoc
} from "firebase/firestore";

// ================== دوال إشعارات الفرص التطوعية ==================

/**
 * إرسال إشعار قبول فرصة تطوعية للمنظمة أو الفريق
 */
export const sendOpportunityApprovalNotification = async (opportunityId, ownerId, opportunityData) => {
  try {
    if (!ownerId) {
      console.warn("لا يوجد ownerId للإشعار");
      return { success: false, error: "No ownerId provided" };
    }

    const notificationRef = doc(collection(db, "Notifications", ownerId, "in_App"));
    
    await setDoc(notificationRef, {
      title_ar: "تم قبول فرصتك التطوعية",
      title_en: "Opportunity Approved",
      message_ar: `تم قبول فرصتك التطوعية "${opportunityData.title_ar || opportunityData.title || opportunityData.title_en}". يمكنك الآن رؤيتها في قائمة فرصك النشطة.`,
      message_en: `Your volunteering opportunity "${opportunityData.title_en || opportunityData.title || opportunityData.title_ar}" has been approved and is now live.`,
      type: "opportunity_approved",
      read: false,
      opportunityId: opportunityId,
      opportunityTitle: opportunityData.title_ar || opportunityData.title || opportunityData.title_en,
      createdAt: serverTimestamp(),
      metadata: {
        action: "view_opportunity",
        targetId: opportunityId
      }
    });

    console.log(`✅ تم إرسال إشعار قبول فرصة للمستخدم ${ownerId}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending opportunity approval notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * إرسال إشعار رفض فرصة تطوعية للمنظمة أو الفريق
 */
export const sendOpportunityRejectionNotification = async (opportunityId, ownerId, opportunityData, reason = "") => {
  try {
    if (!ownerId) {
      console.warn("لا يوجد ownerId للإشعار");
      return { success: false, error: "No ownerId provided" };
    }

    const notificationRef = doc(collection(db, "Notifications", ownerId, "in_App"));
    
    const notificationData = {
      title_ar: "تم رفض فرصتك التطوعية",
      title_en: "Opportunity Rejected",
      message_ar: `تم رفض فرصتك التطوعية "${opportunityData.title_ar || opportunityData.title || opportunityData.title_en}".`,
      message_en: `Your volunteering opportunity "${opportunityData.title_en || opportunityData.title || opportunityData.title_ar}" has been rejected.`,
      type: "opportunity_rejected",
      read: false,
      opportunityId: opportunityId,
      opportunityTitle: opportunityData.title_ar || opportunityData.title || opportunityData.title_en,
      createdAt: serverTimestamp(),
      metadata: {
        action: "edit_opportunity",
        targetId: opportunityId
      }
    };

    if (reason) {
      notificationData.message_ar += ` السبب: ${reason}`;
      notificationData.message_en += ` Reason: ${reason}`;
      notificationData.rejectionReason = reason;
    } else {
      notificationData.message_ar += ` يمكنك تعديلها وإعادة إرسالها للمراجعة.`;
      notificationData.message_en += ` You can edit and resubmit it for review.`;
    }

    await setDoc(notificationRef, notificationData);

    console.log(`❌ تم إرسال إشعار رفض فرصة للمستخدم ${ownerId}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending opportunity rejection notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * جلب معلومات مالك الفرصة
 */
export const getOpportunityOwnerInfo = async (ownerId) => {
  try {
    if (!ownerId) return null;

    const userRef = doc(db, "Users", ownerId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn(`المستخدم ${ownerId} غير موجود`);
      return null;
    }

    const userData = userSnap.data();
    
    let name = "Unknown";
    const role = userData.role || "user";

    const pickName = (data) => {
      if (!data) return null;
      const fields = [
        "institutionName", "organizationName", "orgName", "orgNameAr", "orgNameEn",
        "teamName", "teamNameAr", "teamNameEn",
        "fullName", "displayName", "name"
      ];
      for (const key of fields) {
        if (data[key]) return data[key];
      }
      return null;
    };

    if (role === "institution" || role === "organization") {
      const profileRef = doc(db, "Users", ownerId, "Organization_Profile", "info");
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        name = pickName(profileData) || pickName(userData) || "Organization";
      } else {
        name = pickName(userData) || "Organization";
      }
    } else if (role === "team") {
      const profileRef = doc(db, "Users", ownerId, "Volunteer_Team_Profile", "info");
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        name = pickName(profileData) || pickName(userData) || "Team";
      } else {
        name = pickName(userData) || "Team";
      }
    } else {
      name = pickName(userData) || "User";
    }

    return {
      id: ownerId,
      role: role,
      name: name
    };
  } catch (error) {
    console.error("Error getting opportunity owner info:", error);
    return null;
  }
};

// ================== دوال الفرص التطوعية ==================

/**
 * جلب كافة الفرص مع معالجة الحقول الناقصة
 */
const toJsDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function expireStalePendingOpportunities() {
  try {
    const pendingQ = query(collection(db, "Opportunities"), where("status", "==", "pending"));
    const pendingSnap = await getDocs(pendingQ);
    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    let expiredCount = 0;

    for (const oppDoc of pendingSnap.docs) {
      const data = oppDoc.data();
      const createdAt = toJsDate(data.createdAt) || toJsDate(data.submittedAt) || toJsDate(data.date);
      const reviewExpiresAt = toJsDate(data.reviewExpiresAt);
      const isExpired = reviewExpiresAt
        ? reviewExpiresAt.getTime() <= Date.now()
        : createdAt && createdAt.getTime() <= cutoff;

      if (!isExpired) continue;

      await updateDoc(doc(db, "Opportunities", oppDoc.id), {
        status: "rejected",
        rejectionReason: "Auto-rejected because it stayed pending for more than 72 hours.",
        autoRejected: true,
        autoRejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      expiredCount += 1;

      if (data.createdBy) {
        try {
          const notifRef = doc(collection(db, "Notifications", data.createdBy, "in_App"));
          await setDoc(notifRef, {
            userId: data.createdBy,
            title_ar: "تم رفض الفرصة تلقائيًا",
            title_en: "Opportunity Auto-Rejected",
            message_ar: `تم رفض الفرصة "${data.title_ar || data.title || data.title_en || "فرصة تطوعية"}" تلقائيًا لأنها لم تحصل على موافقة خلال 72 ساعة.`,
            message_en: `The opportunity "${data.title_en || data.title || data.title_ar || "Volunteer Opportunity"}" was auto-rejected because it was not approved within 72 hours.`,
            type: "opportunity_auto_rejected",
            read: false,
            opportunityId: oppDoc.id,
            createdAt: serverTimestamp()
          });
        } catch (notificationError) {
          console.warn("Auto-rejected opportunity, but notification failed:", notificationError);
        }
      }
    }

    return { success: true, expiredCount };
  } catch (error) {
    console.error("Error expiring stale pending opportunities:", error);
    return { success: false, error: error.message };
  }
}

export const getAllOpportunities = async () => {
  try {
    await expireStalePendingOpportunities();
    const querySnapshot = await getDocs(collection(db, "Opportunities"));
    const opportunities = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const opportunityId = docSnapshot.id;
      
      // جلب بيانات المنظمة/الفريق
      let organizationName = "N/A";
      let category = "N/A";
      let location = "N/A";
      
      try {
        const fallbackName =
          data.organizationName ||
          data.orgName ||
          data.org ||
          data.institutionName ||
          data.teamName ||
          data.createdByName;

        if (data.createdBy) {
          const ownerInfo = await getOpportunityOwnerInfo(data.createdBy);
          if (ownerInfo?.name) {
            organizationName = ownerInfo.name;
          } else if (fallbackName) {
            organizationName = fallbackName;
          }
        } else if (fallbackName) {
          organizationName = fallbackName;
        }
      } catch (error) {
        console.log(`Error getting owner info for opportunity ${opportunityId}:`, error);
      }
      
      // معالجة الحقول الأساسية
      const title = data.title || data.title_en || data.title_ar || "Untitled Opportunity";
      const title_ar = data.title_ar || data.title || data.title_en || "فرصة تطوعية";
      const title_en = data.title_en || data.title || data.title_ar || "Volunteer Opportunity";
      
      // معالجة الحقول الأخرى
      category = data.category || "General";
      location = data.location || data.location_ar || data.location_en || "N/A";
      const location_ar = data.location_ar || data.location || location;
      const location_en = data.location_en || data.location || location;
      const state = data.state || data.state_ar || data.state_en || "N/A";
      const state_ar = data.state_ar || data.state || state;
      const state_en = data.state_en || data.state || state;
      
      const date = data.startDate || data.date || "N/A";
      const endDate = data.endDate || "N/A";
      const hours = data.hours || data.duration || 0;
      const volunteersNeeded = data.volunteers || data.volunteersNeeded || 0;
      
      const description_ar = data.description_ar || data.description || "No description available";
      const description_en = data.description_en || data.description || "No description available";
      
      // جلب عدد المتقدمين
      let applicantCount = 0;
      try {
        const appQ = query(collection(db, "Applications"), where("opportunityId", "==", opportunityId));
        const appSnap = await getDocs(appQ);
        applicantCount = appSnap.size;
      } catch (error) {
        console.log(`Error getting applicant count for ${opportunityId}:`, error);
      }
      
      opportunities.push({
        id: opportunityId,
        ...data,
        title: title,
        title_ar: title_ar,
        title_en: title_en,
        organizationName: organizationName,
        category: category,
        location: location,
        location_ar: location_ar,
        location_en: location_en,
        state: state,
        state_ar: state_ar,
        state_en: state_en,
        date: date,
        startDate: date,
        endDate: endDate,
        hours: hours,
        duration: hours,
        volunteers: volunteersNeeded,
        volunteersNeeded: volunteersNeeded,
        description: description_en,
        description_ar: description_ar,
        description_en: description_en,
        status: data.status || "pending",
        createdBy: data.createdBy,
        applicantCount: applicantCount,
        // الحفاظ على جميع الحقول الأصلية
      });
    }
    
    return opportunities;
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return [];
  }
};

// ================== دوال الإشعارات ==================

export const getAdminNotifications = async () => {
  try {
    const q = query(
      collection(db, "AdminNotifications"),
      where("read", "==", false),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "AdminNotifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
};

export const sendAdminNotification = async (notificationData) => {
  try {
    const notificationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notificationRef = doc(db, "AdminNotifications", notificationId);
    
    await setDoc(notificationRef, {
      id: notificationId,
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
    
    console.log(`📢 تم إرسال إشعار للأدمن: ${notificationData.title}`);
    return { success: true, id: notificationRef.id };
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return { success: false, error: error.message };
  }
};

export const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const q = query(
      collection(db, "AdminNotifications"),
      where("createdAt", "<", cutoffDate)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    console.log(`🗑️ تم حذف ${deletePromises.length} إشعار قديم`);
    return { success: true, deletedCount: deletePromises.length };
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    return { success: false, error: error.message };
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, "AdminNotifications", notificationId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const q = query(
      collection(db, "AdminNotifications"),
      where("read", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
    console.log(`✅ تم تعيين ${updatePromises.length} إشعار كمقروء`);
    return { success: true, markedCount: updatePromises.length };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: error.message };
  }
};

// ================== دوال الطلبات المعلقة ==================

export const getPendingRegistrations = async () => {
  try {
    // Keep this query index-free (single where) then filter role in memory.
    // This avoids "missing composite index" failures in some Firebase projects.
    const q = query(
      collection(db, "Users"),
      where("status", "==", "pending")
    );
    
    const querySnapshot = await getDocs(q);
    const pendingUsers = [];
    
    for (const docSnap of querySnapshot.docs) {
      const userData = docSnap.data();
      const normalizedRole = String(userData.role || "").toLowerCase();
      
      let subCollectionName = "";
      if (normalizedRole === "institution" || normalizedRole === "organization") {
        subCollectionName = "Organization_Profile";
      } else if (normalizedRole === "team") {
        subCollectionName = "Volunteer_Team_Profile";
      } else {
        continue;
      }
      
      try {
        const profileRef = doc(db, "Users", docSnap.id, subCollectionName, "info");
        const profileSnap = await getDoc(profileRef);
        
        pendingUsers.push({
          id: docSnap.id,
          ...userData,
          details: profileSnap.exists() ? profileSnap.data() : {},
          createdAt: userData.createdAt || null
        });
      } catch (error) {
        console.log(`لا توجد بيانات تفصيلية للمستخدم ${docSnap.id}`);
        pendingUsers.push({
          id: docSnap.id,
          ...userData,
          details: {},
          createdAt: userData.createdAt || null
        });
      }
    }
    
    return pendingUsers.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching pending registrations:", error);
    throw error;
  }
};

export const approveRegistration = async (userId) => {
  try {
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    
    await updateDoc(userRef, {
      status: "active",
      approvedAt: serverTimestamp(),
      approvedBy: "admin",
      updatedAt: serverTimestamp()
    });
    
    let subCollectionName = "";
    const normalizedRole = String(userData.role || "").toLowerCase();
    if (normalizedRole === "institution" || normalizedRole === "organization") {
      subCollectionName = "Organization_Profile";
    } else if (normalizedRole === "team") {
      subCollectionName = "Volunteer_Team_Profile";
    }
    
    if (subCollectionName) {
      const profileRef = doc(db, "Users", userId, subCollectionName, "info");
      await setDoc(profileRef, {
        status: "active",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    
    try {
      const approvalNotificationRef = doc(db, "UserNotifications", `${userId}_approved_${Date.now()}`);
      await setDoc(approvalNotificationRef, {
      userId: userId,
      type: "account_approved",
      title: "تمت الموافقة على حسابك",
      message: normalizedRole === "institution" || normalizedRole === "organization"
        ? "تمت الموافقة على تسجيل مؤسستك. يمكنك الآن تسجيل الدخول واستخدام المنصة."
        : "تمت الموافقة على تسجيل فريقك. يمكنك الآن تسجيل الدخول واستخدام المنصة.",
      read: false,
        createdAt: serverTimestamp()
      });
    } catch (notificationError) {
      console.warn("Account approved, but failed to send user notification:", notificationError);
    }
    
    try {
      const notifQ = query(
        collection(db, "AdminNotifications"),
        where("userId", "==", userId)
      );
      
      const notifSnapshot = await getDocs(notifQ);
      const deletePromises = notifSnapshot.docs
        .filter((docSnap) => (docSnap.data()?.type || "") === "new_registration")
        .map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
    } catch (cleanupError) {
      console.warn("Account approved, but failed to clean admin notifications:", cleanupError);
    }
    
    console.log(`✅ تمت الموافقة على حساب ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error approving registration:", error);
    return { success: false, error: error.message };
  }
};

export const rejectRegistration = async (userId, reason = "") => {
  try {
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    
    await updateDoc(userRef, {
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
      rejectedBy: "admin",
      updatedAt: serverTimestamp()
    });
    
    let subCollectionName = "";
    const normalizedRole = String(userData.role || "").toLowerCase();
    if (normalizedRole === "institution" || normalizedRole === "organization") {
      subCollectionName = "Organization_Profile";
    } else if (normalizedRole === "team") {
      subCollectionName = "Volunteer_Team_Profile";
    }
    
    if (subCollectionName) {
      const profileRef = doc(db, "Users", userId, subCollectionName, "info");
      await setDoc(profileRef, {
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    
    try {
      const rejectionNotificationRef = doc(db, "UserNotifications", `${userId}_rejected_${Date.now()}`);
      await setDoc(rejectionNotificationRef, {
      userId: userId,
      type: "account_rejected",
      title: "تم رفض طلب التسجيل الخاص بك",
      message: `تم رفض طلب التسجيل الخاص بك للأسباب التالية: ${reason || "غير محدد"}`,
      read: false,
        createdAt: serverTimestamp()
      });
    } catch (notificationError) {
      console.warn("Account rejected, but failed to send user notification:", notificationError);
    }
    
    try {
      const notifQ = query(
        collection(db, "AdminNotifications"),
        where("userId", "==", userId)
      );
      
      const notifSnapshot = await getDocs(notifQ);
      const deletePromises = notifSnapshot.docs
        .filter((docSnap) => (docSnap.data()?.type || "") === "new_registration")
        .map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
    } catch (cleanupError) {
      console.warn("Account rejected, but failed to clean admin notifications:", cleanupError);
    }
    
    console.log(`❌ تم رفض حساب ${userId} للسبب: ${reason}`);
    return { success: true };
  } catch (error) {
    console.error("Error rejecting registration:", error);
    return { success: false, error: error.message };
  }
};

export const deletePendingRegistration = async (userId) => {
  try {
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    
    let subCollectionName = "";
    const normalizedRole = String(userData.role || "").toLowerCase();
    if (normalizedRole === "institution" || normalizedRole === "organization") {
      subCollectionName = "Organization_Profile";
    } else if (normalizedRole === "team") {
      subCollectionName = "Volunteer_Team_Profile";
    }
    
    if (subCollectionName) {
      const profileRef = doc(db, "Users", userId, subCollectionName, "info");
      await deleteDoc(profileRef);
    }
    
    await deleteDoc(userRef);
    
    const notifQ = query(
      collection(db, "AdminNotifications"),
      where("userId", "==", userId)
    );
    
    const notifSnapshot = await getDocs(notifQ);
    const deletePromises = notifSnapshot.docs
      .filter((docSnap) => (docSnap.data()?.type || "") === "new_registration")
      .map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    
    console.log(`🗑️ تم حذف حساب ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting registration:", error);
    return { success: false, error: error.message };
  }
};

// ================== دوال الإحصائيات والبيانات العامة ==================

export const getAdminStats = async () => {
  try {
    const usersSnap = await getDocs(collection(db, "Users"));
    const opportunitiesSnap = await getDocs(collection(db, "Opportunities"));
    const notificationsSnap = await getDocs(query(collection(db, "AdminNotifications"), where("read", "==", false)));
    
    const totalUsers = usersSnap.size;
    const totalOpportunities = opportunitiesSnap.size;
    const unreadNotifications = notificationsSnap.size;
    
    let volunteers = 0;
    let organizations = 0;
    let teams = 0;
    
    usersSnap.forEach(doc => {
      const role = doc.data().role;
      if (role === 'volunteer') volunteers++;
      else if (role === 'institution' || role === 'organization') organizations++;
      else if (role === 'team') teams++;
    });

    let pendingCount = 0;
    usersSnap.forEach(doc => {
      const userData = doc.data();
      if ((userData.role === 'institution' || userData.role === 'organization' || userData.role === 'team') && 
          userData.status === 'pending') {
        pendingCount++;
      }
    });

    let totalReports = 0;
    for (const userDoc of usersSnap.docs) {
      const complaintsSnap = await getDocs(collection(db, "Reports", userDoc.id, "Complaints"));
      totalReports += complaintsSnap.size;
    }

    return {
      totalVolunteers: volunteers,
      totalOrganizations: organizations,
      totalTeams: teams,
      totalOpportunities: totalOpportunities,
      pendingApprovals: pendingCount,
      totalReports: totalReports,
      unreadNotifications: unreadNotifications
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "Users"));
  const rows = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
    const base = { id: docSnap.id, ...docSnap.data() };
    const role = base.role;
    try {
      const sub = role === "team"
        ? "Volunteer_Team_Profile"
        : (role === "institution" || role === "organization")
        ? "Organization_Profile"
        : "Volunteer_Profile";
      const profileRef = doc(db, "Users", docSnap.id, sub, "info");
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      return { ...base, ...profileData };
    } catch {
      return base;
    }
  }));
  return rows;
};

export const getAllOrganizations = async () => {
  const q = query(collection(db, "Users"), where("role", "in", ["institution", "organization"]));
  const querySnapshot = await getDocs(q);
  const rows = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
    const base = { id: docSnap.id, ...docSnap.data() };
    try {
      const profileRef = doc(db, "Users", docSnap.id, "Organization_Profile", "info");
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      return { ...base, ...profileData };
    } catch {
      return base;
    }
  }));
  return rows;
};

export const getAllTeams = async () => {
  const q = query(collection(db, "Users"), where("role", "==", "team"));
  const querySnapshot = await getDocs(q);
  const rows = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
    const base = { id: docSnap.id, ...docSnap.data() };
    try {
      const profileRef = doc(db, "Users", docSnap.id, "Volunteer_Team_Profile", "info");
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      return { ...base, ...profileData };
    } catch {
      return base;
    }
  }));
  return rows;
};

export const updateUserStatus = async (userId, status) => {
  const userRef = doc(db, "Users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  await updateDoc(userRef, { status: status, updatedAt: serverTimestamp() });

  let subCollectionName = "";
  if (userData.role === "institution" || userData.role === "organization") {
    subCollectionName = "Organization_Profile";
  } else if (userData.role === "team") {
    subCollectionName = "Volunteer_Team_Profile";
  }
  if (subCollectionName) {
    const profileRef = doc(db, "Users", userId, subCollectionName, "info");
    await setDoc(profileRef, { status: status, updatedAt: serverTimestamp() }, { merge: true });
  }
};

export const deleteUser = async (userId) => {
  await deleteDoc(doc(db, "Users", userId));
};

export const deleteOpportunity = async (oppId) => {
  await deleteDoc(doc(db, "Opportunities", oppId));
};

export const updateOpportunityStatus = async (oppId, status) => {
  const oppRef = doc(db, "Opportunities", oppId);
  const oppSnap = await getDoc(oppRef);
  const oppData = oppSnap.exists() ? oppSnap.data() : {};
  await updateDoc(oppRef, { 
    status: status, 
    updatedAt: serverTimestamp(),
    // إذا كان الحالة active، نضيف تاريخ الموافقة
    ...(status === 'active' && { approvedAt: serverTimestamp() })
  });

  if (status === "active" && oppData.createdBy) {
    try {
      const ownerOppsQ = query(collection(db, "Opportunities"), where("createdBy", "==", oppData.createdBy));
      const ownerOppsSnap = await getDocs(ownerOppsQ);
      const publishedCount = ownerOppsSnap.docs.filter((item) => {
        if (item.id === oppId) return true;
        return ["active", "completed"].includes(String(item.data()?.status || "").toLowerCase());
      }).length;
      const counterPayload = {
        publishedOpportunitiesCount: publishedCount,
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, "Users", oppData.createdBy), counterPayload, { merge: true });
      const profileSub =
        String(oppData.creatorType || "").toLowerCase() === "team"
          ? "Volunteer_Team_Profile"
          : "Organization_Profile";
      await setDoc(doc(db, "Users", oppData.createdBy, profileSub, "info"), counterPayload, { merge: true });
    } catch (counterError) {
      console.error("Error refreshing published opportunity counter:", counterError);
    }
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const q = query(
      collection(db, "AdminNotifications"),
      where("read", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
};

export const getRecentNotifications = async (limitCount = 5) => {
  try {
    const q = query(
      collection(db, "AdminNotifications"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting recent notifications:", error);
    return [];
  }
};

export const getPlatformReportContext = async () => {
  try {
    const [usersSnap, opportunitiesSnap, applicationsSnap] = await Promise.all([
      getDocs(collection(db, "Users")),
      getDocs(collection(db, "Opportunities")),
      getDocs(collection(db, "Applications")),
    ]);

    const users = usersSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
    const opportunities = opportunitiesSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
    const applications = applicationsSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
    const owners = users.filter((user) => ["institution", "organization", "team"].includes(String(user.role || "").toLowerCase()));

    const reports = [];
    for (const userDoc of usersSnap.docs) {
      const complaintsSnap = await getDocs(collection(db, "Reports", userDoc.id, "Complaints"));
      complaintsSnap.forEach((complaint) => {
        reports.push({ id: complaint.id, reporterId: userDoc.id, ...complaint.data() });
      });
    }

    return { users, opportunities, applications, owners, reports };
  } catch (error) {
    console.error("Error building platform report context:", error);
    return { users: [], opportunities: [], applications: [], owners: [], reports: [] };
  }
};

/**
 * دالة لضمان توافق بيانات الفرصة
 */
export const normalizeOpportunityData = (opportunity) => {
  return {
    id: opportunity.id,
    title: opportunity.title || opportunity.title_en || opportunity.title_ar || "Untitled",
    title_ar: opportunity.title_ar || opportunity.title || opportunity.title_en || "فرصة تطوعية",
    title_en: opportunity.title_en || opportunity.title || opportunity.title_ar || "Volunteer Opportunity",
    organizationName: opportunity.organizationName || opportunity.org || "N/A",
    category: opportunity.category || "General",
    location: opportunity.location || opportunity.location_ar || opportunity.location_en || "N/A",
    state: opportunity.state || opportunity.state_ar || opportunity.state_en || "N/A",
    state_ar: opportunity.state_ar || opportunity.state || opportunity.state_en || "N/A",
    state_en: opportunity.state_en || opportunity.state || opportunity.state_ar || "N/A",
    date: opportunity.date || opportunity.startDate || "N/A",
    endDate: opportunity.endDate || "N/A",
    hours: opportunity.hours || opportunity.duration || 0,
    volunteers: opportunity.volunteers || opportunity.volunteersNeeded || 0,
    description: opportunity.description || opportunity.description_en || opportunity.description_ar || "No description available",
    status: opportunity.status || "pending",
    createdBy: opportunity.createdBy,
    applicantCount: opportunity.applicantCount || 0
  };
};
