import { db } from "../firebase/firebase";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  serverTimestamp 
} from "firebase/firestore";

/**
 * هيكلية المستخدمين الجديدة تعتمد على Subcollections داخل مجموعة Users
 * - Users/{userId}/Volunteer_Profile
 * - Users/{userId}/Organization_Profile
 * - Users/{userId}/Volunteer_Team_Profile
 */

export const saveUserProfile = async (userId, data, type) => {
  try {
    let subCollectionName = "";
    let displayName = "";

    if (type === "volunteer") {
      subCollectionName = "Volunteer_Profile";
      displayName = data.fullName || "";
    } else if (type === "institution") {
      subCollectionName = "Organization_Profile";
      displayName = data.orgNameAr || data.orgNameEn || "";
    } else if (type === "team") {
      subCollectionName = "Volunteer_Team_Profile";
      displayName = data.teamNameAr || data.teamNameEn || "";
    } else if (type === "admin") {
      subCollectionName = "Adminstation";
    }

    const userRef = doc(db, "Users", userId);
    const profileRef = doc(db, "Users", userId, subCollectionName, "info");

    // حفظ البيانات الأساسية في الوثيقة الرئيسية لضمان ثباتها وسهولة الوصول إليها
    await setDoc(userRef, {
      uid: userId,
      email: data.email || "",
      role: type,
      status: data.status || (type === "volunteer" ? "active" : "pending"),
      displayName: displayName,
      // normalized names to avoid N/A in admin UI
      fullName: data.fullName || (type === "volunteer" ? displayName : ""),
      orgNameAr: data.orgNameAr || (type === "institution" ? displayName : ""),
      orgNameEn: data.orgNameEn || (type === "institution" ? displayName : ""),
      teamNameAr: data.teamNameAr || (type === "team" ? displayName : ""),
      teamNameEn: data.teamNameEn || (type === "team" ? displayName : ""),
      // leaderboard/admin essentials
      points: typeof data.points === "number" ? data.points : 0,
      hours: typeof data.hours === "number" ? data.hours : 0,
      completedOpportunities: typeof data.completedOpportunities === "number" ? data.completedOpportunities : 0,
      level: data.level || "Bronze",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // حفظ البيانات التفصيلية بالكامل في الـ Subcollection
    await setDoc(profileRef, {
      ...data,
      uid: userId,
      userType: type,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error saving profile:", error);
    return { success: false, error: error.message };
  }
};


// Log points transactions (stored under Rewards/{userId}/Levels/points_history to keep within agreed schema)
export const logPointsTransaction = async (userId, tx) => {
  try {
    const { doc, setDoc, serverTimestamp, arrayUnion } = await import("firebase/firestore");
    const histRef = doc(db, "Rewards", userId, "Levels", "points_history");
    await setDoc(histRef, {
      transactions: arrayUnion({
        ...tx,
        createdAt: serverTimestamp()
      })
    }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Rewards Functions ---

export const addCertificate = async (userId, certificateData) => {
  try {
    const certRef = doc(collection(db, "Rewards", userId, "Certificates"));
    await setDoc(certRef, {
      ...certificateData,
      id: certRef.id,
      createdAt: serverTimestamp()
    });
    return { success: true, id: certRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addBadge = async (userId, badgeData) => {
  try {
    const badgeRef = doc(collection(db, "Rewards", userId, "Badges"));
    await setDoc(badgeRef, {
      ...badgeData,
      id: badgeRef.id,
      createdAt: serverTimestamp()
    });
    return { success: true, id: badgeRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateLevel = async (userId, levelData) => {
  try {
    const levelRef = doc(db, "Rewards", userId, "Levels", "current");
    await setDoc(levelRef, {
      ...levelData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateLeaderboard = async (userId, leaderboardData) => {
  try {
    const lbRef = doc(db, "Rewards", userId, "Leaderboard", "stats");
    await setDoc(lbRef, {
      ...leaderboardData,
      userId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId, type) => {
  try {
    if (!userId) return { success: false, error: "User ID is required" };

    let subCollectionName = "";
    if (type === "volunteer") subCollectionName = "Volunteer_Profile";
    else if (type === "institution") subCollectionName = "Organization_Profile";
    else if (type === "team") subCollectionName = "Volunteer_Team_Profile";
    else if (type === "admin") subCollectionName = "Adminstation";

    // جلب البيانات الأساسية أولاً لمعرفة الدور إذا لم يتم تمريره
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    
    let finalType = type;
    if (!finalType && userSnap.exists()) {
      finalType = userSnap.data().role;
      // إعادة تحديد المجموعة الفرعية بناءً على الدور المكتشف
      if (finalType === "volunteer") subCollectionName = "Volunteer_Profile";
      else if (finalType === "institution") subCollectionName = "Organization_Profile";
      else if (finalType === "team") subCollectionName = "Volunteer_Team_Profile";
    }

    if (!subCollectionName) return { success: false, error: "Could not determine user type" };

    const profileRef = doc(db, "Users", userId, subCollectionName, "info");
    const docSnap = await getDoc(profileRef);

    if (docSnap.exists()) {
      // دمج البيانات الأساسية مع البيانات التفصيلية
      const mainData = userSnap.exists() ? userSnap.data() : {};
      return { success: true, data: { ...mainData, ...docSnap.data() } };
    }
    return { success: false, error: "Profile not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// دالة متوافقة مع الكود الحالي للبحث التلقائي
export const getUserData = async (userId) => {
  try {
    if (!userId) return { success: false, error: "معرف المستخدم مطلوب" };
    
    // نحاول جلب البيانات الأساسية أولاً
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const role = userSnap.data().role;
      return await getUserProfile(userId, role);
    }

    // إذا لم نجد الوثيقة الرئيسية، نحاول البحث في المجموعات الفرعية (للتوافق مع البيانات القديمة)
    const types = ["volunteer", "institution", "team"];
    for (const type of types) {
      const result = await getUserProfile(userId, type);
      if (result.success) return result;
    }
    
    return { success: false, error: "User not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserData = async (userId, updatedData) => {
  try {
    if (!userId) return { success: false, error: "معرف المستخدم مطلوب" };
    
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const role = userSnap.data().role;
      return await saveUserProfile(userId, updatedData, role);
    } else {
      return await saveUserProfile(userId, updatedData, "volunteer");
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
