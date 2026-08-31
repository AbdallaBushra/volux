// src/database/opportunityData.js
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

// جلب جميع الفرص مع معالجة الحقول الناقصة
export const getOpportunities = async () => {
  try {
    // Fetch active opportunities
    const q = query(collection(db, "Opportunities"), where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    const opportunities = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const oppData = docSnapshot.data();
      const opportunityId = docSnapshot.id;
      
      // Fetch applicant count
      const appQ = query(collection(db, "Applications"), where("opportunityId", "==", opportunityId));
      const appSnap = await getDocs(appQ);
      
      // Fetch organization/team name
      let organizationName = "N/A";
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

      const fallbackName =
        oppData.organizationName ||
        oppData.organization_name ||
        oppData.orgName ||
        oppData.org ||
        oppData.institutionName ||
        oppData.teamName ||
        oppData.createdByName;

      if (oppData.createdBy) {
        try {
          const userRef = doc(db, "Users", oppData.createdBy);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const role = userData.role || "volunteer";
            
            // Get organization/team name based on role
            if (role === "institution" || role === "organization") {
              const profileRef = doc(db, "Users", oppData.createdBy, "Organization_Profile", "info");
              const profileSnap = await getDoc(profileRef);
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                organizationName = pickName(profileData) || pickName(userData) || fallbackName || "Organization";
              } else {
                organizationName = pickName(userData) || fallbackName || "Organization";
              }
            } else if (role === "team") {
              const profileRef = doc(db, "Users", oppData.createdBy, "Volunteer_Team_Profile", "info");
              const profileSnap = await getDoc(profileRef);
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                organizationName = pickName(profileData) || pickName(userData) || fallbackName || "Team";
              } else {
                organizationName = pickName(userData) || fallbackName || "Team";
              }
            } else {
              organizationName = pickName(userData) || fallbackName || "User";
            }
          } else if (fallbackName) {
            organizationName = fallbackName;
          }
        } catch (error) {
          console.log(`Error fetching creator info for opportunity ${opportunityId}:`, error);
        }
      } else if (fallbackName) {
        organizationName = fallbackName;
      }
      
      // Normalize data for consistent display
      const normalizedData = {
        id: opportunityId,
        // Preserve all original data first to avoid overriding computed fields
        ...oppData,
        title: oppData.title_en || oppData.title || oppData.title_ar || "Volunteer Opportunity",
        title_en: oppData.title_en || oppData.title || oppData.title_ar || "Volunteer Opportunity",
        title_ar: oppData.title_ar || oppData.title || oppData.title_en || "فرصة تطوعية",
        org: organizationName,
        organizationName: organizationName,
        category: oppData.category || "General",
        location: oppData.location_en || oppData.location || oppData.location_ar || "N/A",
        location_en: oppData.location_en || oppData.location || oppData.location_ar || "N/A",
        location_ar: oppData.location_ar || oppData.location || oppData.location_en || "N/A",
        state: oppData.state_en || oppData.state || oppData.state_ar || "N/A",
        state_en: oppData.state_en || oppData.state || oppData.state_ar || "N/A",
        state_ar: oppData.state_ar || oppData.state || oppData.state_en || "N/A",
        duration: `${oppData.hours || 0} hours`,
        hours: oppData.hours || 0,
        startDate: oppData.startDate || oppData.date || "N/A",
        endDate: oppData.endDate || "N/A",
        gender: oppData.gender || "both",
        type: oppData.type || "field",
        volunteers: oppData.volunteers || oppData.volunteersNeeded || 0,
        volunteersNeeded: oppData.volunteers || oppData.volunteersNeeded || 0,
        urgency: oppData.urgency || "medium",
        opportunityMode: oppData.opportunityMode || oppData.type || "field",
        imageUrl: oppData.imageUrl || "",
        points: oppData.points || 100,
        description: oppData.description_en || oppData.description || oppData.description_ar || "No description available",
        description_en: oppData.description_en || oppData.description || oppData.description_ar || "No description available",
        description_ar: oppData.description_ar || oppData.description || oppData.description_en || "لا يوجد وصف",
        skills: oppData.skills || [],
        requirements: oppData.requirements || [],
        benefits: oppData.benefits || [],
        contact: oppData.contact || "",
        phone: oppData.phone || "",
        applicantCount: appSnap.size,
        createdBy: oppData.createdBy,
        status: oppData.status || "active"
      };
      
      opportunities.push(normalizedData);
    }
    
    return { success: true, data: opportunities };
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return { success: false, error: error.message };
  }
};

// إضافة فرصة جديدة مع توحيد البيانات
export const addOpportunity = async (opportunityData) => {
  try {
    const creatorId = opportunityData.createdBy;
    const isAutoApprovalRole = ["institution", "organization", "team"].includes(
      String(opportunityData.creatorType || "").toLowerCase()
    );
    let publishedCountBefore = 0;

    if (creatorId && isAutoApprovalRole) {
      const ownerPublishedQ = query(
        collection(db, "Opportunities"),
        where("createdBy", "==", creatorId)
      );
      const ownerPublishedSnap = await getDocs(ownerPublishedQ);
      publishedCountBefore = ownerPublishedSnap.docs.filter((item) =>
        ["active", "completed"].includes(String(item.data()?.status || "").toLowerCase())
      ).length;
    }

    const shouldAutoApprove = isAutoApprovalRole && publishedCountBefore >= 10;
    const nextStatus = shouldAutoApprove ? "active" : "pending";

    // Normalize data before saving
    const normalizedData = {
      title_ar: opportunityData.title_ar || opportunityData.title || "فرصة تطوعية",
      title_en: opportunityData.title_en || opportunityData.title || "Volunteer Opportunity",
      title: opportunityData.title_en || opportunityData.title || "Volunteer Opportunity",
      category: opportunityData.category || "General",
      location_ar: opportunityData.location_ar || opportunityData.location || "موقع غير محدد",
      location_en: opportunityData.location_en || opportunityData.location || "Location not specified",
      location: opportunityData.location_en || opportunityData.location || "Location not specified",
      state_ar: opportunityData.state_ar || opportunityData.state || "ولاية غير محددة",
      state_en: opportunityData.state_en || opportunityData.state || "State not specified",
      state: opportunityData.state_en || opportunityData.state || opportunityData.state_ar || "State not specified",
      volunteers: opportunityData.volunteers || opportunityData.volunteersNeeded || 0,
      hours: opportunityData.hours || 0,
      duration: opportunityData.hours ? `${opportunityData.hours} hours` : "0 hours",
      startDate: opportunityData.startDate || opportunityData.date || new Date().toISOString().split('T')[0],
      date: opportunityData.startDate || opportunityData.date || new Date().toISOString().split('T')[0],
      endDate: opportunityData.endDate || "",
      description_ar: opportunityData.description_ar || opportunityData.description || "لا يوجد وصف",
      description_en: opportunityData.description_en || opportunityData.description || "No description available",
      description: opportunityData.description_en || opportunityData.description || "No description available",
      createdBy: opportunityData.createdBy,
      creatorType: opportunityData.creatorType,
      organizationName: opportunityData.organizationName || "N/A",
      org: opportunityData.organizationName || "N/A",
      ownerName: opportunityData.ownerName || opportunityData.organizationName || "N/A",
      createdByName: opportunityData.createdByName || opportunityData.ownerName || opportunityData.organizationName || "N/A",
      status: nextStatus,
      publishedCountBefore,
      autoApproved: shouldAutoApprove,
      urgency: opportunityData.urgency || "medium",
      opportunityMode: opportunityData.opportunityMode || opportunityData.type || "field",
      type: opportunityData.opportunityMode || opportunityData.type || "field",
      imageUrl: opportunityData.imageUrl || "",
      reviewExpiresAt: shouldAutoApprove ? null : new Date(Date.now() + 72 * 60 * 60 * 1000),
      ...(shouldAutoApprove && { approvedAt: serverTimestamp() }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "Opportunities"), normalizedData);

    if (creatorId && isAutoApprovalRole) {
      try {
        const nextPublishedCount = shouldAutoApprove ? publishedCountBefore + 1 : publishedCountBefore;
        const counterPayload = {
          publishedOpportunitiesCount: nextPublishedCount,
          lastOpportunityCreatedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, "Users", creatorId), counterPayload, { merge: true });
        const profileSub =
          String(opportunityData.creatorType || "").toLowerCase() === "team"
            ? "Volunteer_Team_Profile"
            : "Organization_Profile";
        await setDoc(doc(db, "Users", creatorId, profileSub, "info"), counterPayload, { merge: true });
      } catch (counterError) {
        console.error("Error updating published opportunity counter:", counterError);
      }
    }
    
    // Send notification to admin
    try {
      if (shouldAutoApprove) {
        if (creatorId) {
          const ownerNotifRef = doc(collection(db, "Notifications", creatorId, "in_App"));
          await setDoc(ownerNotifRef, {
            userId: creatorId,
            title_ar: "تم نشر الفرصة مباشرة",
            title_en: "Opportunity Published Automatically",
            message_ar: `تم نشر الفرصة "${normalizedData.title_ar}" مباشرة لأن حسابك تجاوز 10 فرص منشورة.`,
            message_en: `The opportunity "${normalizedData.title_en}" was published automatically because your account has more than 10 published opportunities.`,
            type: "opportunity_auto_approved",
            read: false,
            opportunityId: docRef.id,
            createdAt: serverTimestamp()
          });
        }
      } else {
      const adminNotifRef = doc(collection(db, "AdminNotifications"));
      await setDoc(adminNotifRef, {
        title: "New Opportunity Created",
        message: `A new volunteering opportunity "${normalizedData.title_en}" has been created and is pending approval. It will auto-reject after 72 hours if not reviewed.`,
        type: "new_opportunity",
        opportunityId: docRef.id,
        createdBy: opportunityData.createdBy,
        read: false,
        createdAt: serverTimestamp()
      });
      }
    } catch (notifError) {
      console.error("Error sending admin notification:", notifError);
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// تحديث فرصة مع توحيد البيانات
export const updateOpportunity = async (id, data) => {
  try {
    const docRef = doc(db, "Opportunities", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// حذف فرصة
export const deleteOpportunity = async (id) => {
  try {
    await deleteDoc(doc(db, "Opportunities", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// التقديم على فرصة
export const joinOpportunity = async (userId, opportunityId, additionalData = {}) => {
  try {
    const docRef = await addDoc(collection(db, "Applications"), {
      userId,
      opportunityId,
      status: "registered",
      appliedAt: serverTimestamp(),
      ...additionalData
    });

    // Notify volunteer
    try {
      const notifRef = doc(collection(db, "Notifications", userId, "in_App"));
      await setDoc(notifRef, {
        userId: userId,
        title_ar: "تم التقديم بنجاح",
        title_en: "Application Successful",
        message_ar: `لقد قمت بالتقديم بنجاح على الفرصة التطوعية.`,
        message_en: `You have successfully applied for the volunteering opportunity.`,
        type: "application",
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Reports Functions ---

export const addComplaint = async (reporterId, complaintData) => {
  try {
    const complaintRef = doc(collection(db, "Reports", reporterId, "Complaints"));
    await setDoc(complaintRef, {
      ...complaintData,
      id: complaintRef.id,
      createdAt: serverTimestamp()
    });
    return { success: true, id: complaintRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addSystemReport = async (adminId, reportData) => {
  try {
    const reportRef = doc(collection(db, "Reports", adminId, "Reports"));
    await setDoc(reportRef, {
      ...reportData,
      id: reportRef.id,
      createdAt: serverTimestamp()
    });
    return { success: true, id: reportRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// جلب طلبات التقديم لمستخدم معين
export const getUserApplications = async (userId) => {
  try {
    const q = query(collection(db, "Applications"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const applications = [];
    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: applications };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// جلب طلبات التقديم لفرصة معينة
export const getOpportunityApplications = async (opportunityId) => {
  try {
    const q = query(collection(db, "Applications"), where("opportunityId", "==", opportunityId));
    const querySnapshot = await getDocs(q);
    const applications = [];
    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: applications };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * دالة لضمان توافق بيانات الفرصة
 */
export const normalizeOpportunity = (opportunity) => {
  return {
    id: opportunity.id,
    title: opportunity.title || opportunity.title_en || opportunity.title_ar || "Untitled",
    title_ar: opportunity.title_ar || opportunity.title || opportunity.title_en || "فرصة تطوعية",
    title_en: opportunity.title_en || opportunity.title || opportunity.title_ar || "Volunteer Opportunity",
    org: opportunity.org || opportunity.organizationName || "N/A",
    organizationName: opportunity.organizationName || opportunity.org || "N/A",
    category: opportunity.category || "General",
    location: opportunity.location || opportunity.location_ar || opportunity.location_en || "N/A",
    location_ar: opportunity.location_ar || opportunity.location || opportunity.location_en || "N/A",
    location_en: opportunity.location_en || opportunity.location || opportunity.location_ar || "N/A",
    state: opportunity.state || opportunity.state_ar || opportunity.state_en || "N/A",
    state_ar: opportunity.state_ar || opportunity.state || opportunity.state_en || "N/A",
    state_en: opportunity.state_en || opportunity.state || opportunity.state_ar || "N/A",
    duration: opportunity.duration || `${opportunity.hours || 0} hours`,
    hours: opportunity.hours || 0,
    startDate: opportunity.startDate || opportunity.date || "N/A",
    endDate: opportunity.endDate || "N/A",
    gender: opportunity.gender || "both",
    type: opportunity.type || "field",
    volunteers: opportunity.volunteers || opportunity.volunteersNeeded || 0,
    volunteersNeeded: opportunity.volunteers || opportunity.volunteersNeeded || 0,
    urgency: opportunity.urgency || "medium",
    opportunityMode: opportunity.opportunityMode || opportunity.type || "field",
    imageUrl: opportunity.imageUrl || "",
    points: opportunity.points || 100,
    description: opportunity.description || opportunity.description_en || opportunity.description_ar || "No description available",
    description_en: opportunity.description_en || opportunity.description || opportunity.description_ar || "No description available",
    description_ar: opportunity.description_ar || opportunity.description || opportunity.description_en || "لا يوجد وصف",
    skills: opportunity.skills || [],
    requirements: opportunity.requirements || [],
    benefits: opportunity.benefits || [],
    contact: opportunity.contact || "",
    phone: opportunity.phone || "",
    applicantCount: opportunity.applicantCount || 0,
    status: opportunity.status || "pending"
  };
};
