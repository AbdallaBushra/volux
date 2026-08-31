// src/authentication/loginUser.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export const loginUser = async (email, password) => {
  try {
    console.log("🔑 محاولة تسجيل الدخول...", email);
    
    // 1. تسجيل الدخول في Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ تم تسجيل الدخول بنجاح:", user.uid);
    
    // 2. التحقق من وجود مستند المستخدم في Firestore
    const userDocRef = doc(db, "users", user.uid);
    
    try {
      // تحديث آخر دخول إذا كان المستند موجوداً
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp()
      });
      console.log("✅ تم تحديث lastLogin");
    } catch (firestoreError) {
      // إذا لم يكن المستند موجوداً، ننشئه
      if (firestoreError.code === 'not-found') {
        console.log("⚠️ لا يوجد مستند للمستخدم، جارٍ إنشاء مستند جديد...");
        
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          volunteeringHours: 0,
          trainingHours: 0,
          opportunitiesJoined: 0,
          trainingCourses: 0,
          level: "Beginner",
          avatar: user.photoURL || "https://via.placeholder.com/150"
        });
        
        console.log("✅ تم إنشاء مستند جديد للمستخدم");
      } else {
        console.error("❌ خطأ في Firestore:", firestoreError);
      }
    }
    
    return { success: true, user: user };
    
  } catch (error) {
    console.error("❌ خطأ في تسجيل الدخول:", error.code, error.message);
    
    let errorMessage = "حدث خطأ أثناء تسجيل الدخول";
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = "المستخدم غير موجود. سجل حساباً جديداً.";
        break;
      case 'auth/wrong-password':
        errorMessage = "كلمة المرور غير صحيحة";
        break;
      case 'auth/invalid-email':
        errorMessage = "البريد الإلكتروني غير صالح";
        break;
      case 'auth/user-disabled':
        errorMessage = "هذا الحساب معطل";
        break;
      case 'auth/too-many-requests':
        errorMessage = "تم محاولة الدخول مرات كثيرة جداً. حاول لاحقاً";
        break;
      default:
        errorMessage = error.message || "خطأ غير معروف";
    }
    
    return { success: false, error: errorMessage };
  }
};