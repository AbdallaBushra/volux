// src/auth/institutionAuth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export const registerInstitution = async (orgData) => {
  try {
    console.log("🏢 بدء تسجيل مؤسسة جديدة...", orgData.email);
    
    // 1. إنشاء حساب في Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      orgData.email,
      orgData.password
    );
    
    const user = userCredential.user;
    
    // 2. إنشاء مستند المؤسسة في Firestore
    const orgDocRef = doc(db, "institutions", user.uid);
    
    const orgProfile = {
      uid: user.uid,
      email: orgData.email,
      orgNameAr: orgData.orgNameAr || "",
      orgNameEn: orgData.orgNameEn || "",
      orgType: orgData.orgType || "",
      phone: orgData.phone || "",
      website: orgData.website || "",
      state: orgData.state || "",
      address: orgData.address || "",
      activities: orgData.activities || "",
      brief: orgData.brief || "",
      contactName: orgData.contactName || "",
      contactEmail: orgData.contactEmail || "",
      contactPhone: orgData.contactPhone || "",
      userType: "institution",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      logo: "https://via.placeholder.com/150"
    };
    
    await setDoc(orgDocRef, orgProfile);
    
    return { success: true, userId: user.uid };
    
  } catch (error) {
    console.error("❌ خطأ في تسجيل المؤسسة:", error);
    return { success: false, error: error.message };
  }
};

export const loginInstitution = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const orgDocRef = doc(db, "institutions", user.uid);
    await updateDoc(orgDocRef, {
      lastLogin: serverTimestamp()
    });
    
    return { success: true, user: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
