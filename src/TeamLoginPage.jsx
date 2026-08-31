// src/TeamLoginPage.jsx
import "./styles/LoginPage.css";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { clearAllAuthData } from "./auth/authHelpers";
import { useAuth } from "./context/AuthContext";
import { normalizeRole, getProperLoginPage, getLoginError } from "./auth/loginValidators";
import { ensureEmailVerifiedForLogin } from "./auth/emailVerification";

function TeamLoginPage() {
  const { language } = useLanguage();
  const { updateUserData } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    clearAllAuthData();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) throw new Error("User data not found in database");

      const userData = userSnap.data();
      const userRole = userData.role || userData.userType || "volunteer";
      const normalizedRole = normalizeRole(userRole);
      const pendingAccount = userData.status === "pending";

      // Wrong portal
      if (normalizedRole !== "team") {
        await signOut(auth);
        clearAllAuthData();

        const properPage = getProperLoginPage(normalizedRole);
        const errorMsg = getLoginError(normalizedRole, language);
        setError(errorMsg);

        setTimeout(() => navigate(properPage), 2000);
        return;
      }

      const verificationResult = await ensureEmailVerifiedForLogin({
        user,
        role: "team",
        displayName: userData.displayName || userData.teamNameAr || userData.teamNameEn || user.email,
        language,
      });

      if (!verificationResult.verified) {
        setError(verificationResult.message);
        return;
      }

      if (pendingAccount) {
        await signOut(auth);
        clearAllAuthData();
        const encodedEmail = encodeURIComponent(user.email || email);
        navigate(`/pending-approval?role=team&email=${encodedEmail}`);
        return;
      }

      // Optional profile
      let completeUserData = { uid: user.uid, email: user.email, role: userRole, ...userData };
      try {
        const profileRef = doc(db, "Users", user.uid, "Volunteer_Team_Profile", "info");
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) completeUserData = { ...completeUserData, ...profileSnap.data() };
      } catch (e2) {
        console.warn("Team profile load warning:", e2);
      }

      const dataToSave = {
        ...completeUserData,
        userType: "team",
        loginTime: new Date().toISOString(),
        source: "firebase",
      };

      [
        "currentUser",
        "userData",
        "userRole",
        "volunteerData",
        "institutionData",
        "teamData",
        "currentInstitution",
        "currentVolunteer",
        "currentTeam",
      ].forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();

      localStorage.setItem("teamData", JSON.stringify(dataToSave));
      localStorage.setItem("userRole", "team");
      localStorage.setItem("currentTeam", JSON.stringify(dataToSave));
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: "team",
          displayName: dataToSave.teamNameAr || dataToSave.teamNameEn || user.email,
        })
      );

      updateUserData(dataToSave);

      alert(language === "en" ? "Welcome back! Login successful." : "أهلا بعودتك! تم تسجيل الدخول بنجاح.");
      navigate("/team-profile");
    } catch (authError) {
      console.error("Login error:", authError);
      clearAllAuthData();

      let errorMessage = "";
      switch (authError.code) {
        case "auth/invalid-email":
          errorMessage = language === "en" ? "Invalid email address format." : "تنسيق البريد الإلكتروني غير صالح.";
          break;
        case "auth/user-disabled":
          errorMessage = language === "en" ? "This account has been disabled." : "تم تعطيل هذا الحساب.";
          break;
        case "auth/user-not-found":
          errorMessage = language === "en" ? "No team found with this email." : "لا يوجد فريق بهذا البريد الإلكتروني.";
          break;
        case "auth/wrong-password":
          errorMessage = language === "en" ? "Incorrect password. Please try again." : "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.";
          break;
        case "auth/too-many-requests":
          errorMessage = language === "en" ? "Too many failed attempts. Please try again later." : "محاولات كثيرة فاشلة. حاول مرة أخرى لاحقاً.";
          break;
        default:
          errorMessage =
            language === "en"
              ? "Login failed. Please check your credentials and try again."
              : "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد والمحاولة مرة أخرى.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const headerTexts = {
    en: {
      badge: "VOLUNTEER TEAM LOGIN",
      title: "Welcome Back to Your Team",
      subtitle: "Access your team dashboard and continue making impact",
      welcome: "Welcome Back, Team",
      description: "Sign in to manage your team's volunteering activities.",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      loginBtn: "Sign In",
      loadingBtn: "Signing In...",
      noAccount: "Don't have an account?",
      createAccount: "Create one here",
      forgotPassword: "Forgot password?",
      resetPassword: "Reset it here",
      showPassword: "Show",
      hidePassword: "Hide",
    },
    ar: {
      badge: "تسجيل دخول الفريق التطوعي",
      title: "مرحباً بعودتك إلى فريقك",
      subtitle: "ادخل إلى لوحة تحكم فريقك واستمر في صنع التأثير",
      welcome: "مرحباً بعودتك، الفريق",
      description: "سجّل الدخول لإدارة أنشطة التطوع الخاصة بفريقك.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      loginBtn: "تسجيل الدخول",
      loadingBtn: "جاري الدخول...",
      noAccount: "ليس لديك حساب؟",
      createAccount: "أنشئ حساباً جديداً هنا",
      forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إعادة تعيين هنا",
      showPassword: "إظهار",
      hidePassword: "إخفاء",
    },
  };

  const t = headerTexts[language];

  return (
    <div className={`login-page team-login ${language === "ar" ? "rtl" : ""}`}>
      <div className="login-header-image">
        <img
          src="https://media.dohafilm.com/sites/default/files/prod/2025-09/Vol2025-2880x1412.jpg"
          alt="Volunteer Team"
        />
        <div className="image-overlay">
          <div className="login-badge">{t.badge}</div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="login-card">
        <h2>{t.welcome}</h2>
        <p>{t.description}</p>

        {error && (
          <div
            className="error-message"
            style={{
              backgroundColor: "#fee",
              color: "#c33",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #fcc",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              required
              disabled={loading}
              placeholder={language === "en" ? "team@example.com" : "فريق@مثال.com"}
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

          <div className="form-group">
            <label>{t.passwordLabel}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                required
                disabled={loading}
                placeholder="********"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #dbc6ad",
                  borderRadius: "8px",
                  fontSize: "16px",
                  marginTop: "8px",
                  paddingRight: "50px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#9b5f2d",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {showPassword ? t.hidePassword : t.showPassword}
              </button>
            </div>
          </div>

          <div style={{ textAlign: language === "ar" ? "left" : "right", margin: "8px 0 18px" }}>
            <Link to="/reset-password?role=team" style={{ color: "#9b5f2d", fontWeight: "600", fontSize: "14px" }}>
              {t.forgotPassword} {t.resetPassword}
            </Link>
          </div>

          <button
            type="submit"
            className="btn-primary login-submit-btn"
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
              marginBottom: "20px",
              transition: "background-color 0.3s",
            }}
          >
            {loading ? t.loadingBtn : t.loginBtn}
          </button>

          <div className="login-switch-panel">
            <p className="new-account login-switch-primary">
              {t.noAccount}{" "}
              <Link to="/team-register" className="login-register-link">
                {t.createAccount}
              </Link>
            </p>

            <div className="login-switch-grid">
              <Link to="/login" className="login-switch-card">
                <span>{language === "en" ? "Volunteer portal" : "بوابة المتطوعين"}</span>
                <strong>{language === "en" ? "Volunteer Login" : "تسجيل دخول متطوع"}</strong>
              </Link>

              <Link to="/institution-login" className="login-switch-card">
                <span>{language === "en" ? "Organization portal" : "بوابة المؤسسات"}</span>
                <strong>{language === "en" ? "Institution Login" : "تسجيل دخول مؤسسة"}</strong>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeamLoginPage;
