import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/firebase";
import { useLanguage } from "./context/LanguageContext";
import "./styles/PendingApprovalPage.css";

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const search = new URLSearchParams(location.search);
  const email = search.get("email") || "";

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      navigate("/login");
    }
  };

  return (
    <div className={`pending-approval ${language === "ar" ? "rtl" : ""}`}>
      <div className="pending-shell">
        <div className="pending-card">
          <div className="pending-header">
            <div className="pending-badge">
              {language === "en" ? "Pending Approval" : "بانتظار الموافقة"}
            </div>
            <h2>{language === "en" ? "Pending Admin Approval" : "بانتظار موافقة الأدمن"}</h2>
            <p>
              {language === "en"
                ? "Your account is under review. Verify your email and wait for admin approval before signing in."
                : "حسابك قيد المراجعة. أكّد بريدك الإلكتروني وانتظر موافقة الأدمن قبل تسجيل الدخول."}
            </p>
            {email && (
              <p className="pending-email">
                {language === "en" ? "Verification sent to" : "تم إرسال رابط التأكيد إلى"}: <strong>{email}</strong>
              </p>
            )}
          </div>

          <div className="pending-steps">
            <div className="pending-step">
              <div className="step-dot">1</div>
              <div className="step-text">
                <strong>{language === "en" ? "Submission received" : "تم استلام الطلب"}</strong>
                <span>
                  {language === "en"
                    ? "Your registration details have been saved."
                    : "تم حفظ بيانات التسجيل بنجاح."}
                </span>
              </div>
            </div>
            <div className="pending-step">
              <div className="step-dot">2</div>
              <div className="step-text">
                <strong>{language === "en" ? "Email verification" : "تأكيد البريد الإلكتروني"}</strong>
                <span>
                  {language === "en"
                    ? "Open the email verification link sent to your inbox."
                    : "افتح رابط التأكيد المرسل إلى بريدك الإلكتروني."}
                </span>
              </div>
            </div>
            <div className="pending-step">
              <div className="step-dot">3</div>
              <div className="step-text">
                <strong>{language === "en" ? "Admin review" : "مراجعة الإدارة"}</strong>
                <span>
                  {language === "en"
                    ? "We verify authenticity and compliance."
                    : "نراجع البيانات ونتحقق من الالتزام."}
                </span>
              </div>
            </div>
            <div className="pending-step">
              <div className="step-dot">4</div>
              <div className="step-text">
                <strong>{language === "en" ? "Approval & access" : "الموافقة والدخول"}</strong>
                <span>
                  {language === "en"
                    ? "You can sign in as soon as approval is granted."
                    : "يمكنك تسجيل الدخول بعد الموافقة مباشرة."}
                </span>
              </div>
            </div>
          </div>

          <div className="pending-actions">
            <button onClick={() => navigate("/")} className="pending-btn primary">
              {language === "en" ? "Back to Home" : "العودة للرئيسية"}
            </button>
            <button onClick={handleLogout} className="pending-btn ghost">
              {language === "en" ? "Logout" : "تسجيل خروج"}
            </button>
          </div>

          <div className="pending-footnote">
            {language === "en"
              ? "Need help? Contact support@volux.org"
              : "تحتاج للمساعدة؟ تواصل مع support@volux.org"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
