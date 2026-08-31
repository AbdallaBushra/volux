// src/auth/teamAuth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export const registerTeam = async (teamData) => {
  try {
    console.log("👥 بدء تسجيل فريق جديد...", teamData.email);
    
    // 1. إنشاء حساب في Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      teamData.email,
      teamData.password
    );
    
    const user = userCredential.user;
    
    // 2. إنشاء مستند الفريق في Firestore
    const teamDocRef = doc(db, "teams", user.uid);
    
    const teamProfile = {
      uid: user.uid,
      email: teamData.email,
      teamNameAr: teamData.teamNameAr || "",
      teamNameEn: teamData.teamNameEn || "",
      leaderName: teamData.leaderName || "",
      phone: teamData.phone || "",
      state: teamData.state || "",
      membersCount: teamData.membersCount || 0,
      activities: teamData.activities || "",
      userType: "team",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      logo: "https://via.placeholder.com/150"
    };
    
    await setDoc(teamDocRef, teamProfile);
    
    return { success: true, userId: user.uid };
    
  } catch (error) {
    console.error("❌ خطأ في تسجيل الفريق:", error);
    return { success: false, error: error.message };
  }
};

export const loginTeam = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const teamDocRef = doc(db, "teams", user.uid);
    await updateDoc(teamDocRef, {
      lastLogin: serverTimestamp()
    });
    
    return { success: true, user: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
