// src/admin/pages/AdminLoginPage.jsx
import '../../styles/LoginPage.css';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { clearAllAuthData } from '../../auth/authHelpers';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, getProperLoginPage, getLoginError } from '../../auth/loginValidators';

function AdminLoginPage() {
  const { language, toggleLanguage } = useLanguage();
  const { updateUserData } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEn = language === 'en';

  const headerTexts = {
    en: {
      badge: 'ADMIN LOGIN',
      title: 'Admin Access Portal',
      subtitle: 'Secure access to platform administration',
      welcome: 'Admin Login',
      description: 'Sign in to access the admin dashboard.',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      loginBtn: 'Sign In',
      loadingBtn: 'Signing In...',
      showPassword: 'Show',
      hidePassword: 'Hide',
      switchLanguage: 'العربية',
      volunteerPrompt: 'Are you a volunteer?',
      volunteerLogin: 'Volunteer Login',
      institutionPrompt: 'Are you an institution?',
      institutionLogin: 'Institution Login',
      teamPrompt: 'Are you a volunteer team?',
      teamLogin: 'Team Login',
      successLogin: 'Admin login successful.',
      successPartial: 'Admin login successful. Some profile data may be missing.',
      invalidEmail: 'Invalid email address format.',
      disabledAccount: 'This account has been disabled.',
      noAdmin: 'No admin found with this email.',
      wrongPassword: 'Incorrect password. Please try again.',
      tooManyRequests: 'Too many failed attempts. Please try again later.',
      genericError: 'Login failed. Please check your credentials and try again.'
    },
    ar: {
      badge: '\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0627\u0644\u0645\u0634\u0631\u0641\u064a\u0646',
      title: '\u0628\u0648\u0627\u0628\u0629 \u0648\u0635\u0648\u0644 \u0627\u0644\u0645\u0634\u0631\u0641\u064a\u0646',
      subtitle: '\u0648\u0635\u0648\u0644 \u0622\u0645\u0646 \u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629',
      welcome: '\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0627\u0644\u0645\u0634\u0631\u0641\u064a\u0646',
      description: '\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0644\u0648\u062d\u0629 \u062a\u062d\u0643\u0645 \u0627\u0644\u0623\u062f\u0645\u0646.',
      emailLabel: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
      passwordLabel: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
      loginBtn: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644',
      loadingBtn: '\u062c\u0627\u0631\u064a \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644...',
      showPassword: '\u0625\u0638\u0647\u0627\u0631',
      hidePassword: '\u0625\u062e\u0641\u0627\u0621',
      switchLanguage: 'English',
      volunteerPrompt: '\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0637\u0648\u0639\u061f',
      volunteerLogin: '\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0645\u062a\u0637\u0648\u0639',
      institutionPrompt: '\u0647\u0644 \u0623\u0646\u062a \u0645\u0624\u0633\u0633\u0629\u061f',
      institutionLogin: '\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0645\u0624\u0633\u0633\u0629',
      teamPrompt: '\u0647\u0644 \u0623\u0646\u062a \u0641\u0631\u064a\u0642 \u062a\u0637\u0648\u0639\u064a\u061f',
      teamLogin: '\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0641\u0631\u064a\u0642',
      successLogin: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0627\u0644\u0623\u062f\u0645\u0646 \u0628\u0646\u062c\u0627\u062d.',
      successPartial: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0628\u0646\u062c\u0627\u062d\u060c \u0648\u0644\u0643\u0646 \u0628\u0639\u0636 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0644\u0641 \u063a\u064a\u0631 \u0645\u0643\u062a\u0645\u0644\u0629.',
      invalidEmail: '\u062a\u0646\u0633\u064a\u0642 \u0627\u0644\u0628\u0631\u064a\u062f \u063a\u064a\u0631 \u0635\u062d\u064a\u062d.',
      disabledAccount: '\u062a\u0645 \u062a\u0639\u0637\u064a\u0644 \u0647\u0630\u0627 \u0627\u0644\u062d\u0633\u0627\u0628.',
      noAdmin: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0623\u062f\u0645\u0646 \u0628\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064a\u062f.',
      wrongPassword: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.',
      tooManyRequests: '\u0645\u062d\u0627\u0648\u0644\u0627\u062a \u0641\u0627\u0634\u0644\u0629 \u0643\u062b\u064a\u0631\u0629\u060c \u062d\u0627\u0648\u0644 \u0644\u0627\u062d\u0642\u064b\u0627.',
      genericError: '\u0641\u0634\u0644 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644\u060c \u062a\u062d\u0642\u0642 \u0645\u0646 \u0628\u064a\u0627\u0646\u0627\u062a\u0643 \u0648\u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.'
    }
  };

  const t = headerTexts[language] || headerTexts.en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    clearAllAuthData();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, 'Users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error('User data not found in database');
      }

      const userData = userSnap.data();
      const userRole = userData.role || userData.userType || 'volunteer';
      const normalizedRole = normalizeRole(userRole);

      if (normalizedRole !== 'admin') {
        await auth.signOut();
        clearAllAuthData();
        const properPage = getProperLoginPage(normalizedRole);
        setError(getLoginError(normalizedRole, language));
        setLoading(false);
        setTimeout(() => navigate(properPage), 2000);
        return;
      }

      try {
        const profileRef = doc(db, 'Users', user.uid, 'Adminstation', 'info');
        const profileSnap = await getDoc(profileRef);

        let completeUserData = {
          uid: user.uid,
          email: user.email,
          role: userRole,
          ...userData
        };

        if (profileSnap.exists()) {
          completeUserData = { ...completeUserData, ...profileSnap.data() };
        }

        const dataToSave = {
          ...completeUserData,
          userType: 'admin',
          role: 'admin',
          loginTime: new Date().toISOString(),
          source: 'firebase'
        };

        localStorage.setItem('adminData', JSON.stringify(dataToSave));
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('currentAdmin', JSON.stringify(dataToSave));
        localStorage.setItem('currentUser', JSON.stringify({
          uid: dataToSave.uid,
          email: dataToSave.email,
          role: 'admin',
          displayName: dataToSave.displayName || dataToSave.email
        }));

        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminLoginTime', new Date().toISOString());
        updateUserData(dataToSave);

        alert(t.successLogin);
        navigate('/admin/dashboard');
      } catch (profileError) {
        const dataToSave = {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          userType: 'admin',
          loginTime: new Date().toISOString(),
          ...userData
        };

        localStorage.setItem('adminData', JSON.stringify(dataToSave));
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('currentAdmin', JSON.stringify(dataToSave));
        sessionStorage.setItem('isAdmin', 'true');

        updateUserData(dataToSave);
        alert(t.successPartial);
        navigate('/admin/dashboard');
      }
    } catch (authError) {
      clearAllAuthData();
      let errorMessage = '';

      switch (authError.code) {
        case 'auth/invalid-email':
          errorMessage = t.invalidEmail;
          break;
        case 'auth/user-disabled':
          errorMessage = t.disabledAccount;
          break;
        case 'auth/user-not-found':
          errorMessage = t.noAdmin;
          break;
        case 'auth/wrong-password':
          errorMessage = t.wrongPassword;
          break;
        case 'auth/too-many-requests':
          errorMessage = t.tooManyRequests;
          break;
        default:
          errorMessage = authError.message?.includes('not registered as an admin')
            ? authError.message
            : t.genericError;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page admin-login ${isEn ? '' : 'rtl'}`}>
      <div className="login-header-image">
        <img
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Admin"
        />
        <div className="image-overlay">
          <div className="login-badge">{t.badge}</div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <button
            type="button"
            onClick={toggleLanguage}
            style={{
              border: '1px solid #d1d5db',
              background: '#fff',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            {t.switchLanguage}
          </button>
        </div>

        <h2>{t.welcome}</h2>
        <p>{t.description}</p>

        {error && (
          <div
            className="error-message"
            style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #fcc',
              fontSize: '14px'
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
                if (error) setError('');
              }}
              required
              disabled={loading}
              placeholder={isEn ? 'admin@example.com' : '\u0623\u062f\u0645\u0646@\u0645\u062b\u0627\u0644.com'}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                required
                disabled={loading}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
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
            <div className="login-switch-grid admin-switch-grid">
              <Link to="/login" className="login-switch-card">
                <span>{t.volunteerPrompt}</span>
                <strong>{t.volunteerLogin}</strong>
              </Link>

              <Link to="/institution-login" className="login-switch-card">
                <span>{t.institutionPrompt}</span>
                <strong>{t.institutionLogin}</strong>
              </Link>

              <Link to="/team-login" className="login-switch-card">
                <span>{t.teamPrompt}</span>
                <strong>{t.teamLogin}</strong>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;

