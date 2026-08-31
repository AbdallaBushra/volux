import { signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { clearAllAuthData } from "./authHelpers";
import { sendVerificationEmailWithSettings, sendWelcomeNotificationOnce } from "./emailFlow";

export const loginPathByRole = {
  volunteer: "/login",
  institution: "/institution-login",
  team: "/team-login",
};

const verificationMessages = {
  en: {
    volunteer:
      "Please verify your email before signing in. We sent a new verification link to your inbox.",
    institution:
      "Please verify your email before signing in. If admin approval is still pending, access will open after approval.",
    team:
      "Please verify your email before signing in. If admin approval is still pending, access will open after approval.",
  },
  ar: {
    volunteer:
      "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول. أرسلنا لك رابط تأكيد جديدًا إلى بريدك.",
    institution:
      "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول. إذا كانت موافقة الأدمن ما زالت قيد الانتظار فسيتم فتح الدخول بعد الموافقة.",
    team:
      "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول. إذا كانت موافقة الأدمن ما زالت قيد الانتظار فسيتم فتح الدخول بعد الموافقة.",
  },
};

const resolveMessage = (language, role) => {
  const lang = language === "en" ? "en" : "ar";
  return verificationMessages[lang][role] || verificationMessages[lang].volunteer;
};

export const ensureEmailVerifiedForLogin = async ({ user, role, displayName, language }) => {
  if (!user || role === "admin") {
    return { verified: true };
  }

  await user.reload();
  const freshUser = auth.currentUser || user;

  if (freshUser.emailVerified) {
    await setDoc(
      doc(db, "Users", freshUser.uid),
      {
        emailVerified: true,
        emailVerifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await sendWelcomeNotificationOnce({
      uid: freshUser.uid,
      displayName,
      role,
    });

    return { verified: true };
  }

  try {
    auth.languageCode = language === "en" ? "en" : "ar";
    await sendVerificationEmailWithSettings(freshUser, loginPathByRole[role] || "/login");
  } catch (verificationError) {
    console.warn("Could not resend verification email during login.", verificationError);
  }

  await signOut(auth);
  clearAllAuthData();

  return {
    verified: false,
    message: resolveMessage(language, role),
  };
};
