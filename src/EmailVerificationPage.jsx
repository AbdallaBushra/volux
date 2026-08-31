import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import "./styles/PendingApprovalPage.css";

const loginPathByRole = {
  volunteer: "/login",
  institution: "/institution-login",
  team: "/team-login",
};

const pageText = {
  en: {
    badge: "EMAIL VERIFICATION",
    title: "Check your email",
    subtitle:
      "We sent a verification link to your inbox. Confirm your email first, then sign in again.",
    emailLabel: "Verification sent to",
    steps: [
      ["Open your inbox", "Look for the message from Firebase or Volux."],
      ["Confirm email", "Click the verification link in the email."],
      ["Sign in", "Return to Volux and sign in with the same account."],
    ],
    login: "Go to login",
    home: "Back to Home",
    footnote: "If you cannot find the email, check spam or try signing in again to resend the link.",
  },
  ar: {
    badge: "تأكيد البريد الإلكتروني",
    title: "اتأكد من بريدك الإلكتروني",
    subtitle:
      "أرسلنا لك رابط تأكيد على بريدك. أكد البريد أولًا، وبعدها سجل الدخول من جديد.",
    emailLabel: "تم إرسال الرابط إلى",
    steps: [
      ["افتح بريدك", "ابحث عن رسالة التأكيد من Firebase أو Volux."],
      ["أكد البريد", "اضغط على رابط التأكيد الموجود داخل الرسالة."],
      ["سجل الدخول", "ارجع إلى Volux وسجل الدخول بنفس الحساب."],
    ],
    login: "الذهاب لتسجيل الدخول",
    home: "العودة للرئيسية",
    footnote: "إذا لم تجد الرسالة، تحقق من البريد غير المرغوب أو جرّب تسجيل الدخول مرة أخرى لإرسال رابط جديد.",
  },
};

const EmailVerificationPage = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const role = search.get("role") || "volunteer";
  const email = search.get("email") || "";
  const t = pageText[language] || pageText.en;
  const loginPath = loginPathByRole[role] || "/login";

  return (
    <div className={`pending-approval ${language === "ar" ? "rtl" : ""}`}>
      <div className="pending-shell">
        <div className="pending-card">
          <div className="pending-header">
            <div className="pending-badge">{t.badge}</div>
            <h2>{t.title}</h2>
            <p>{t.subtitle}</p>
            {email && (
              <p className="pending-email">
                {t.emailLabel}: <strong>{email}</strong>
              </p>
            )}
          </div>

          <div className="pending-steps">
            {t.steps.map(([title, description], index) => (
              <div className="pending-step" key={title}>
                <div className="step-dot">{index + 1}</div>
                <div className="step-text">
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pending-actions">
            <Link to={loginPath} className="pending-btn primary">
              {t.login}
            </Link>
            <Link to="/" className="pending-btn ghost">
              {t.home}
            </Link>
          </div>

          <div className="pending-footnote">{t.footnote}</div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
