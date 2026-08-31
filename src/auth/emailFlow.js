import { sendEmailVerification } from "firebase/auth";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const safeOrigin = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
};

export const buildActionCodeSettings = (continuePath = "/login") => {
  const origin = safeOrigin();
  if (!origin) return undefined;

  return {
    url: `${origin}${continuePath}`,
    handleCodeInApp: false,
  };
};

export const sendVerificationEmailWithSettings = async (user, continuePath = "/login") => {
  if (!user) return;

  const actionCodeSettings = buildActionCodeSettings(continuePath);
  if (actionCodeSettings) {
    try {
      await sendEmailVerification(user, actionCodeSettings);
      return;
    } catch (error) {
      const canRetryWithoutContinueUrl =
        error?.code === "auth/unauthorized-continue-uri" ||
        error?.code === "auth/invalid-continue-uri";

      if (!canRetryWithoutContinueUrl) {
        throw error;
      }

      console.warn("Verification email continue URL was rejected. Retrying with Firebase default link.", error);
    }
  }

  await sendEmailVerification(user);
};

export const sendWelcomeNotificationOnce = async ({ uid, displayName, role }) => {
  if (!uid) {
    return { success: false, error: "Missing user id" };
  }

  try {
    const userRef = doc(db, "Users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnap.data() || {};

    if (userData.welcomeMessageSent) {
      return { success: true, skipped: true };
    }

    const resolvedName =
      displayName ||
      userData.displayName ||
      userData.fullName ||
      userData.orgNameAr ||
      userData.orgNameEn ||
      userData.teamNameAr ||
      userData.teamNameEn ||
      userData.email ||
      "";

    const roleTextEn = role || userData.role || "user";
    const roleTextAr =
      roleTextEn === "institution"
        ? "المؤسسة"
        : roleTextEn === "team"
        ? "الفريق"
        : roleTextEn === "volunteer"
        ? "المتطوع"
        : "المستخدم";

    const notifRef = doc(collection(db, "Notifications", uid, "in_App"));
    await setDoc(notifRef, {
      userId: uid,
      type: "welcome",
      read: false,
      title_en: "Welcome to Volux",
      title_ar: "مرحبا بك في Volux",
      message_en: `Welcome ${resolvedName}. Your email has been verified successfully.`,
      message_ar: `مرحبا ${resolvedName}. تم تاكيد بريدك الالكتروني بنجاح.`,
      role_en: roleTextEn,
      role_ar: roleTextAr,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      userRef,
      {
        welcomeMessageSent: true,
        welcomeMessageSentAt: serverTimestamp(),
        emailVerifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, skipped: false };
  } catch (error) {
    console.error("Failed to send welcome notification:", error);
    return { success: false, error: error.message };
  }
};
