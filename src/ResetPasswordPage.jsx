import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { useLanguage } from "./context/LanguageContext";
import { auth } from "./firebase/firebase";
import { buildActionCodeSettings } from "./auth/emailFlow";
import "./styles/LoginPage.css";

const roleLoginPathMap = {
  volunteer: "/login",
  institution: "/institution-login",
  team: "/team-login",
};

function ResetPasswordPage() {
  const { language } = useLanguage();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const role = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const roleValue = search.get("role");
    return roleValue && roleLoginPathMap[roleValue] ? roleValue : "volunteer";
  }, [location.search]);

  const backPath = roleLoginPathMap[role];

  const labels = {
    en: {
      title: "Reset Password",
      subtitle: "Enter your account email and we will send a reset link.",
      emailLabel: "Email Address",
      submit: "Send Reset Link",
      sending: "Sending...",
      back: "Back to login",
      sent: "Password reset email sent. Check your inbox and spam folder.",
      unauthorizedDomain:
        "Reset link failed because this domain is not authorized in Firebase Auth. Add this domain in Authentication > Settings > Authorized domains.",
      invalidEmail: "Invalid email format.",
      userNotFound: "No account found for this email.",
      generic: "Failed to send reset email. Please try again.",
    },
    ar: {
      title: "إعادة تعيين كلمة المرور",
      subtitle: "أدخل البريد الإلكتروني وسنرسل لك رابط إعادة التعيين.",
      emailLabel: "البريد الإلكتروني",
      submit: "إرسال رابط التعيين",
      sending: "جارٍ الإرسال...",
      back: "الرجوع لتسجيل الدخول",
      sent: "تم إرسال رسالة إعادة التعيين. تحقق من البريد الوارد والرسائل غير المرغوبة.",
      unauthorizedDomain:
        "فشل إرسال الرابط لأن هذا الدومين غير مضاف في Firebase Authentication. أضف الدومين في Authentication > Settings > Authorized domains.",
      invalidEmail: "تنسيق البريد الإلكتروني غير صحيح.",
      userNotFound: "لا يوجد حساب بهذا البريد الإلكتروني.",
      generic: "تعذر إرسال رابط إعادة التعيين. حاول مرة أخرى.",
    },
  };

  const t = labels[language] || labels.en;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      auth.languageCode = language === "ar" ? "ar" : "en";

      const actionCodeSettings = buildActionCodeSettings(backPath);
      try {
        if (actionCodeSettings) {
          await sendPasswordResetEmail(auth, email, actionCodeSettings);
        } else {
          await sendPasswordResetEmail(auth, email);
        }
      } catch (resetError) {
        const canRetryWithoutContinueUrl =
          actionCodeSettings &&
          (resetError.code === "auth/unauthorized-continue-uri" ||
            resetError.code === "auth/invalid-continue-uri");

        if (!canRetryWithoutContinueUrl) {
          throw resetError;
        }

        await sendPasswordResetEmail(auth, email);
      }

      setSuccess(t.sent);
      setEmail("");
    } catch (resetError) {
      console.error("Reset password error:", resetError);

      let message = t.generic;
      if (resetError.code === "auth/invalid-email") {
        message = t.invalidEmail;
      } else if (resetError.code === "auth/user-not-found") {
        message = t.userNotFound;
      } else if (
        resetError.code === "auth/unauthorized-continue-uri" ||
        resetError.code === "auth/invalid-continue-uri"
      ) {
        message = t.unauthorizedDomain;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${language === "ar" ? "rtl" : ""}`}>
      <div className="login-card" style={{ marginTop: "40px" }}>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div
            style={{
              backgroundColor: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              borderRadius: "10px",
              padding: "10px 12px",
              marginBottom: "14px",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="name@example.com"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #dbc6ad",
                borderRadius: "8px",
                fontSize: "16px",
                marginTop: "8px",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: loading ? "#9ca3af" : "#9b5f2d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "16px",
            }}
          >
            {loading ? t.sending : t.submit}
          </button>

          <div style={{ textAlign: "center", marginTop: "4px" }}>
            <Link to={backPath}>{t.back}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
