// src/LoginPage.jsx
import "./styles/LoginPage.css";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { clearAllAuthData } from "./auth/authHelpers";
import { useAuth } from "./context/AuthContext";
import { normalizeRole, getProperLoginPage, getLoginError } from "./auth/loginValidators";
import { ensureEmailVerifiedForLogin } from "./auth/emailVerification";

function VolunteerLoginPage() {
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
    
    console.log("🚀 Attempting volunteer login for:", email);
    
    // 1. تنظيف جميع البيانات القديمة أولاً
    clearAllAuthData();
    
    try {
      // 2. تسجيل الدخول باستخدام Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("✅ Firebase login successful:", user.uid, user.email);
      
      // 3. جلب بيانات المستخدم من Firestore
      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error("User data not found in database");
      }
      
      const userData = userSnap.data();
      console.log("📄 User data from Firestore:", userData);

      // Check for pending status
      if (userData.status === "pending") {
        navigate("/pending-approval");
        return;
      }
      
      // 4. تحديد نوع المستخدم
      let userRole = userData.role || userData.userType || "volunteer";
      
      console.log("🎯 User role detected:", userRole);
      
      // 5. التحقق من أن المستخدم متطوع باستخدام الدالة الجديدة
      const normalizedRole = normalizeRole(userRole);
      
      if (normalizedRole !== 'volunteer') {
        console.log("❌ User is not a volunteer, logging out");
        await auth.signOut();
        clearAllAuthData();
        
        const properPage = getProperLoginPage(normalizedRole);
        const errorMsg = getLoginError(normalizedRole, language);
        
        setError(errorMsg);
        setLoading(false);
        
        // توجيه للصفحة المناسبة بعد 2 ثانية
        setTimeout(() => {
          navigate(properPage);
        }, 2000);
        
        return;
      }

      const verificationResult = await ensureEmailVerifiedForLogin({
        user,
        role: "volunteer",
        displayName: userData.displayName || userData.fullName || user.email,
        language,
      });

      if (!verificationResult.verified) {
        setError(verificationResult.message);
        return;
      }
      
      // 6. محاولة جلب بيانات البروفايل الإضافية
      try {
        const profileRef = doc(db, "Users", user.uid, "Volunteer_Profile", "info");
        const profileSnap = await getDoc(profileRef);
        
        let completeUserData = {
          uid: user.uid,
          email: user.email,
          role: userRole,
          ...userData
        };
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          console.log("📊 Volunteer profile found:", profileData);
          completeUserData = { ...completeUserData, ...profileData };
        } else {
          console.log("ℹ️ No additional profile data found");
        }
        
        // 7. حفظ بيانات المتطوع في localStorage
        const dataToSave = {
          ...completeUserData,
          userType: 'volunteer',
          role: 'volunteer',
          loginTime: new Date().toISOString(),
          source: 'firebase'
        };
        
        // تنظيف أولاً مع الاحتفاظ بالتطبيقات
        const preferences = {
          language: localStorage.getItem('language'),
          theme: localStorage.getItem('theme')
        };
        
        // مسح جميع بيانات المستخدم
        const userKeys = [
          'currentUser', 'userData', 'userRole',
          'volunteerData', 'institutionData', 'teamData',
          'currentInstitution', 'currentVolunteer', 'currentTeam',
          'volunteerRegistrationData', 'institutionRegistrationData', 'teamRegistrationData'
        ];
        
        userKeys.forEach(key => localStorage.removeItem(key));
        sessionStorage.clear();
        
        // حفظ البيانات في localStorage
        localStorage.setItem('volunteerData', JSON.stringify(dataToSave));
        localStorage.setItem('userRole', 'volunteer');
        localStorage.setItem('currentVolunteer', JSON.stringify(dataToSave));
        localStorage.setItem('currentUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: 'volunteer',
          displayName: dataToSave.fullName || user.email
        }));
        
        // حفظ علامة الجلسة
        sessionStorage.setItem('isVolunteer', 'true');
        sessionStorage.setItem('volunteerLoginTime', new Date().toISOString());
        
        // إعادة تعيين التفضيلات
        if (preferences.language) localStorage.setItem('language', preferences.language);
        if (preferences.theme) localStorage.setItem('theme', preferences.theme);
        
        // 8. تحديث AuthContext بالبيانات الجديدة
        updateUserData(dataToSave);
        
        console.log("💾 Volunteer data saved to localStorage and AuthContext");
        
        // 9. عرض رسالة النجاح
        alert(
          language === "en" 
            ? "✅ Welcome back! Login successful." 
            : "✅ أهلاً بعودتك! تم تسجيل الدخول بنجاح."
        );
        
        // 10. تأكيد حفظ البيانات
        const storedRole = localStorage.getItem('userRole');
        console.log("✅ Role stored in localStorage:", storedRole);
        
        // 11. توجيه لصفحة المتطوع
        navigate("/profile");
        
      } catch (profileError) {
        console.error("⚠️ Error loading profile:", profileError);
        // نستمر بالبيانات الأساسية
        const basicUserData = {
          uid: user.uid,
          email: user.email,
          role: userRole,
          ...userData
        };
        
        const dataToSave = {
          ...basicUserData,
          userType: 'volunteer',
          role: 'volunteer',
          loginTime: new Date().toISOString(),
          source: 'firebase'
        };
        
        // حفظ البيانات
        localStorage.setItem('volunteerData', JSON.stringify(dataToSave));
        localStorage.setItem('userRole', 'volunteer');
        localStorage.setItem('currentVolunteer', JSON.stringify(dataToSave));
        localStorage.setItem('currentUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: 'volunteer'
        }));
        
        updateUserData(dataToSave);
        
        alert(
          language === "en" 
            ? "✅ Login successful! Some profile data may be missing." 
            : "✅ تم تسجيل الدخول بنجاح! بعض بيانات الملف قد تكون مفقودة."
        );
        
        navigate("/profile");
      }
      
    } catch (authError) {
      console.error("❌ Login error:", authError);
      
      // تنظيف البيانات في حالة الخطأ
      clearAllAuthData();
      
      let errorMessage = "";
      
      switch (authError.code) {
        case 'auth/invalid-email':
          errorMessage = language === "en" 
            ? "❌ Invalid email address format." 
            : "❌ تنسيق البريد الإلكتروني غير صالح.";
          break;
        case 'auth/user-disabled':
          errorMessage = language === "en" 
            ? "❌ This account has been disabled." 
            : "❌ تم تعطيل هذا الحساب.";
          break;
        case 'auth/user-not-found':
          errorMessage = language === "en" 
            ? "❌ No volunteer found with this email." 
            : "❌ لا يوجد متطوع بهذا البريد الإلكتروني.";
          break;
        case 'auth/wrong-password':
          errorMessage = language === "en" 
            ? "❌ Incorrect password. Please try again." 
            : "❌ كلمة مرور غير صحيحة. يرجى المحاولة مرة أخرى.";
          break;
        case 'auth/too-many-requests':
          errorMessage = language === "en" 
            ? "❌ Too many failed attempts. Please try again later." 
            : "❌ محاولات كثيرة فاشلة. حاول مرة أخرى لاحقًا.";
          break;
        default:
          if (authError.message.includes("not registered as a volunteer")) {
            errorMessage = authError.message;
          } else {
            errorMessage = language === "en" 
              ? "❌ Login failed. Please check your credentials and try again." 
              : "❌ فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد والمحاولة مرة أخرى.";
          }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // نصوص خاصة للصورة
  const headerTexts = {
    en: {
      badge: "VOLUNTEER LOGIN",
      title: "Welcome Back to Your Volunteer Account",
      subtitle: "Access your volunteer dashboard and continue making a difference",
      welcome: "Welcome Back, Volunteer",
      description: "Sign in to manage your volunteering activities and track your impact.",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      loginBtn: "Sign In",
      loadingBtn: "Signing In...",
      noAccount: "Don't have an account?",
      createAccount: "Create one here",
      forgotPassword: "Forgot password?",
      resetPassword: "Reset it here",
      showPassword: "Show",
      hidePassword: "Hide"
    },
    ar: {
      badge: "تسجيل دخول المتطوع",
      title: "مرحبًا بعودتك إلى حسابك التطوعي",
      subtitle: "ادخل إلى لوحة تحكم متطوعك واستمر في صنع الفرق",
      welcome: "مرحبًا بعودتك، المتطوع",
      description: "سجّل الدخول لإدارة أنشطتك التطوعية وتتبع أثرك.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      loginBtn: "تسجيل الدخول",
      loadingBtn: "جاري الدخول...",
      noAccount: "ليس لديك حساب؟",
      createAccount: "أنشئ حسابًا جديدًا هنا",
      forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إعادة تعيين هنا",
      showPassword: "إظهار",
      hidePassword: "إخفاء"
    }
  };
  
  const t = headerTexts[language];

  return (
    <div className={`login-page ${language === "ar" ? "rtl" : ""}`}>
      
      {/* صورة مع نص فوقها */}
      <div className="login-header-image">
        <img 
          src="https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=1200&q=80" 
          alt="Volunteer"
        />
        <div className="image-overlay">
          <div className="login-badge">
            {t.badge}
          </div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>

      {/* بوكس اللوغ ان */}
      <div className="login-card">
        <h2>{t.welcome}</h2>
        <p>{t.description}</p>

        {error && (
          <div className="error-message" style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fcc',
            fontSize: '14px'
          }}>
            ⚠️ {error}
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
              placeholder={language === "en" ? "volunteer@example.com" : "متطوع@مثال.com"}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dbc6ad',
                borderRadius: '8px',
                fontSize: '16px',
                marginTop: '8px'
              }}
            />
          </div>

          <div className="form-group">
            <label>{t.passwordLabel}</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                required 
                disabled={loading}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dbc6ad',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginTop: '8px',
                  paddingRight: '50px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9b5f2d',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {showPassword ? t.hidePassword : t.showPassword}
              </button>
            </div>
          </div>

          <div style={{ textAlign: language === "ar" ? "left" : "right", margin: "8px 0 18px" }}>
            <Link to="/reset-password?role=volunteer" style={{ color: "#9b5f2d", fontWeight: "600", fontSize: "14px" }}>
              {t.forgotPassword} {t.resetPassword}
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn-primary login-submit-btn"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#9ca3af' : '#9b5f2d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              transition: 'background-color 0.3s'
            }}
          >
            {loading ? t.loadingBtn : t.loginBtn}
          </button>

          <div className="login-switch-panel">
            <p className="new-account login-switch-primary">
              {t.noAccount}{" "}
              <Link to="/register" className="login-register-link">
                {t.createAccount}
              </Link>
            </p>
            
            <div className="login-switch-grid">
              <Link to="/institution-login" className="login-switch-card">
                <span>{language === "en" ? "Organization portal" : "بوابة المؤسسات"}</span>
                <strong>{language === "en" ? "Institution Login" : "تسجيل دخول مؤسسة"}</strong>
              </Link>

              <Link to="/team-login" className="login-switch-card">
                <span>{language === "en" ? "Team portal" : "بوابة الفرق"}</span>
                <strong>{language === "en" ? "Team Login" : "تسجيل دخول فريق"}</strong>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VolunteerLoginPage;

