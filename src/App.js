// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import HomePage from "./HomePage";
import OpportunitiesPage from "./OpportunitiesPage";
import AboutPage from "./AboutPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PendingApprovalPage from './PendingApprovalPage';
import InstitutionLoginPage from "./InstitutionLoginPage";
import TeamLoginPage from "./TeamLoginPage";
import InstitutionRegister from "./InstitutionRegister";
import TeamRegister from "./TeamRegister";
import ProfilePage from "./ProfilePage";
import ParticipationPage from "./ParticipationPage";
import TeamProfile from "./TeamProfile";
import InstitutionProfile from "./InstitutionProfile";
import OpportunitiesManagement from "./OpportunitiesManagement";
import LeaderboardPage from "./LeaderboardPage";
import ResetPasswordPage from "./ResetPasswordPage";
import EmailVerificationPage from "./EmailVerificationPage";
import FooterInfoPage from "./FooterInfoPage";

// Admin
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminLayout from "./admin/AdminLayout";
import Users from "./admin/pages/Users";
import Organizations from "./admin/pages/Organizations";
import Teams from "./admin/pages/Teams";
import Opportunities from "./admin/pages/Opportunities";
import Reports from "./admin/pages/Reports";
import Settings from "./admin/pages/Settings";
import AdminLoginPage from "./admin/pages/AdminLoginPage";
import PendingRegistrations from "./admin/pages/PendingRegistrations"; 

// مكون بسيط للتحميل
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '20px'
  }}>
    <div style={{ fontSize: '40px' }}>⏳</div>
    <p>جاري التحميل...</p>
  </div>
);

const getStoredStatusByRole = (normalizedRole) => {
  try {
    if (normalizedRole === "team") {
      const teamData = localStorage.getItem("teamData");
      return teamData ? JSON.parse(teamData)?.status : null;
    }
    if (normalizedRole === "institution") {
      const institutionData = localStorage.getItem("institutionData");
      return institutionData ? JSON.parse(institutionData)?.status : null;
    }
  } catch (error) {
    console.warn("Failed to read stored status:", error);
  }
  return null;
};

// PublicRoute للصفحات العامة - محدث لدعم الأدمن
const PublicRoute = ({ children }) => {
  const { currentUser, loading, userData } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // إذا كان المستخدم مسجل دخول، نوجهه للصفحة المناسبة بناءً على الدور
  if (currentUser) {
    console.log("📊 User logged in, checking role...");
    
    // جلب الدور من localStorage أولاً للسرعة
    const localRole = localStorage.getItem('userRole');
    console.log("Local role:", localRole);
    
    // تحويل الأدوار المختلفة إلى قيم موحدة
    let normalizedRole = localRole;
    if (normalizedRole === "organization" || normalizedRole === "org") {
      normalizedRole = "institution";
    } else if (normalizedRole === "volunteer_team") {
      normalizedRole = "team";
    }
    
    const status = userData?.status || getStoredStatusByRole(normalizedRole);
    if ((normalizedRole === "team" || normalizedRole === "institution") && status === "pending") {
      return children;
    }

    if (normalizedRole !== 'admin' && currentUser.emailVerified === false) {
      return children;
    }

    if (normalizedRole === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (normalizedRole === 'institution') {
      return <Navigate to="/institution-profile" />;
    } else if (normalizedRole === 'volunteer') {
      return <Navigate to="/profile" />;
    } else if (normalizedRole === 'team') {
      return <Navigate to="/team-profile" />;
    }
  }
  
  return children;
};

// ProtectedRoute جديد مبسط - محدث لدعم الأدمن
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, userData, loading } = useAuth();
  
  console.log("🔐 ProtectedRoute Check:", {
    currentUser: !!currentUser,
    userRole: userData?.role,
    requiredRole,
    loading
  });
  
  // 1. إذا كان جاري التحميل، نعرض spinner
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // 2. إذا لم يكن هناك مستخدم، نوجه للصفحة الرئيسية
  if (!currentUser) {
    console.log("🚫 No user, redirecting to home");
    return <Navigate to="/" />;
  }
  
  // 3. محاولة جلب الدور من البيانات أو localStorage
  let finalRole = userData?.role;
  if (!finalRole) {
    finalRole = localStorage.getItem('userRole');
    console.log("🔍 Using role from localStorage:", finalRole);
  }
  
  // 4. التحقق من وجود دور
  if (!finalRole) {
    console.log("❌ No role found, redirecting to home");
    return <Navigate to="/" />;
  }
  
  // 5. توحيد قيم الأدوار
  let normalizedRole = finalRole;
  if (normalizedRole === "organization" || normalizedRole === "org") {
    normalizedRole = "institution";
  } else if (normalizedRole === "volunteer_team") {
    normalizedRole = "team";
  }
  
  console.log(`🎯 Normalized role: ${normalizedRole}`);
  
  // 6. إذا كان هناك دور مطلوب، نتحقق منه
  if (requiredRole) {
    console.log(`🎯 Required role: ${requiredRole}, User role: ${normalizedRole}`);
    
    if (normalizedRole !== requiredRole) {
      console.log(`🚫 Role mismatch: ${normalizedRole} != ${requiredRole}`);
      
      // توجيه للصفحة المناسبة حسب الدور الحالي
      if (normalizedRole === 'admin') {
        return <Navigate to="/admin/dashboard" />;
      } else if (normalizedRole === 'institution') {
        return <Navigate to="/institution-profile" />;
      } else if (normalizedRole === 'volunteer') {
        return <Navigate to="/profile" />;
      } else if (normalizedRole === 'team') {
        return <Navigate to="/team-profile" />;
      } else {
        return <Navigate to="/" />;
      }
    }
    
    console.log(`✅ Role check passed: ${normalizedRole}`);
  }
  
  const status = userData?.status || getStoredStatusByRole(normalizedRole);
  if ((normalizedRole === "team" || normalizedRole === "institution") && status === "pending") {
    console.log("🚫 Pending account, redirecting to home");
    return <Navigate to="/" />;
  }

  if (normalizedRole !== 'admin' && currentUser.emailVerified === false) {
    const email = encodeURIComponent(currentUser.email || "");
    return <Navigate to={`/email-verification?role=${normalizedRole}&email=${email}`} />;
  }

  // 7. تنظيف البيانات المتضاربة بناءً على الدور
  const cleanupConflictingData = () => {
    console.log(`🧹 Cleaning up data for role: ${normalizedRole}`);
    
    if (normalizedRole === 'admin') {
      // إذا كان أدمن، ننظف جميع بيانات المستخدمين الأخرى
      localStorage.removeItem('volunteerData');
      localStorage.removeItem('currentVolunteer');
      localStorage.removeItem('institutionData');
      localStorage.removeItem('currentInstitution');
      localStorage.removeItem('teamData');
      localStorage.removeItem('currentTeam');
    } else if (normalizedRole === 'institution') {
      localStorage.removeItem('volunteerData');
      localStorage.removeItem('currentVolunteer');
      localStorage.removeItem('teamData');
      localStorage.removeItem('currentTeam');
      localStorage.removeItem('adminData');
      localStorage.removeItem('currentAdmin');
    } else if (normalizedRole === 'volunteer') {
      localStorage.removeItem('institutionData');
      localStorage.removeItem('currentInstitution');
      localStorage.removeItem('teamData');
      localStorage.removeItem('currentTeam');
      localStorage.removeItem('adminData');
      localStorage.removeItem('currentAdmin');
    } else if (normalizedRole === 'team') {
      localStorage.removeItem('institutionData');
      localStorage.removeItem('currentInstitution');
      localStorage.removeItem('volunteerData');
      localStorage.removeItem('currentVolunteer');
      localStorage.removeItem('adminData');
      localStorage.removeItem('currentAdmin');
    }
  };
  
  cleanupConflictingData();
  
  return children;
};

// Admin Protected Route - مسار خاص ومحمي للأدمن فقط
const AdminProtectedRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();
  
  console.log("🛡️ AdminProtectedRoute Check:", {
    currentUser: !!currentUser,
    userRole: userData?.role,
    loading
  });
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    console.log("🚫 No user, redirecting to admin login");
    return <Navigate to="/admin-login" />;
  }
  
  let finalRole = userData?.role;
  if (!finalRole) {
    finalRole = localStorage.getItem('userRole');
    console.log("🔍 Using role from localStorage:", finalRole);
  }
  
  // توحيد قيم الأدوار
  let normalizedRole = finalRole;
  if (normalizedRole === "organization" || normalizedRole === "org") {
    normalizedRole = "institution";
  }
  
  // التحقق من أن المستخدم أدمن
  if (normalizedRole !== 'admin') {
    console.log(`🚫 Access denied: User is ${normalizedRole}, not admin`);
    
    // توجيه للصفحة المناسبة حسب الدور الحقيقي
    if (normalizedRole === 'institution') {
      return <Navigate to="/institution-profile" />;
    } else if (normalizedRole === 'volunteer') {
      return <Navigate to="/profile" />;
    } else if (normalizedRole === 'team') {
      return <Navigate to="/team-profile" />;
    } else {
      return <Navigate to="/" />;
    }
  }
  
  // تنظيف أي بيانات متضاربة
  localStorage.removeItem('volunteerData');
  localStorage.removeItem('currentVolunteer');
  localStorage.removeItem('institutionData');
  localStorage.removeItem('currentInstitution');
  localStorage.removeItem('teamData');
  localStorage.removeItem('currentTeam');
  
  return children;
};

function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

function AdminOnlyLayout({ children }) {
  // لا نضيف Header أو Footer لصفحات الأدمن
  return <>{children}</>;
}

// مكون لتطبيق الحماية على جميع المسارات
function RouteProtectionWrapper({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  // التحقق من المسار عند تغيير الصفحة
  useEffect(() => {
    const path = location.pathname;
    const userRole = userData?.role;
    
    console.log(`📍 Route protection: ${path}, User role: ${userRole}`);
    
    // منع الأدمن من الوصول لصفحات تسجيل الدخول الأخرى
    if (userRole === 'admin') {
      if (path === '/login' || path === '/institution-login' || path === '/team-login') {
        console.log('🚫 Admin trying to access non-admin login page, redirecting...');
        navigate('/admin-login');
      }
    }
    
    // منع المستخدمين الآخرين من الوصول لصفحة أدمن
    if (path === '/admin-login' && userRole && userRole !== 'admin') {
      console.log(`🚫 ${userRole} trying to access admin login, redirecting...`);
      
      // توجيه للصفحة المناسبة بناءً على الدور
      if (userRole === 'institution') {
        navigate('/institution-login');
      } else if (userRole === 'volunteer') {
        navigate('/login');
      } else if (userRole === 'team') {
        navigate('/team-login');
      } else {
        navigate('/login');
      }
    }
    
  }, [location, userData, navigate]);
  
  return children;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <RouteProtectionWrapper>
            <Routes>
              {/* ========== ADMIN ROUTES ========== */}
              {/* مسار دخول الأدمن - عام */}
              <Route 
                path="/admin-login" 
                element={
                  <PublicRoute>
                    <AdminOnlyLayout><AdminLoginPage /></AdminOnlyLayout>
                  </PublicRoute>
                } 
              />
              
              {/* مسارات الأدمن الرئيسية - محمية بشرط أن يكون أدمن */}
              <Route 
                path="/admin" 
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="organizations" element={<Organizations />} />
                <Route path="teams" element={<Teams />} />
                <Route path="opportunities" element={<Opportunities />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="pending-registrations" element={<PendingRegistrations />} /> {/* ⬅️ تمت إضافة هذا المسار الجديد */}
              </Route>

              {/* ========== PUBLIC ROUTES ========== */}
              {/* الصفحات العامة */}
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/about" element={<Layout><AboutPage /></Layout>} />
              <Route path="/opportunities" element={<Layout><OpportunitiesPage /></Layout>} />
              <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
              <Route path="/faq" element={<Layout><FooterInfoPage /></Layout>} />
              <Route path="/guidelines" element={<Layout><FooterInfoPage /></Layout>} />
              <Route path="/privacy" element={<Layout><FooterInfoPage /></Layout>} />
              <Route path="/terms" element={<Layout><FooterInfoPage /></Layout>} />
              
              {/* صفحات المصادقة - عامة فقط */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Layout><LoginPage /></Layout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/institution-login" 
                element={
                  <PublicRoute>
                    <Layout><InstitutionLoginPage /></Layout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/team-login" 
                element={
                  <PublicRoute>
                    <Layout><TeamLoginPage /></Layout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Layout><RegisterPage /></Layout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/institution-register" 
                element={
                  <PublicRoute>
                    <Layout><InstitutionRegister /></Layout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/team-register" 
                element={
                  <PublicRoute>
                    <Layout><TeamRegister /></Layout>
                  </PublicRoute>
                } 
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <Layout><ResetPasswordPage /></Layout>
                  </PublicRoute>
                }
              />
              <Route
                path="/email-verification"
                element={
                  <PublicRoute>
                    <Layout><EmailVerificationPage /></Layout>
                  </PublicRoute>
                }
              />
              <Route
                path="/pending-approval"
                element={
                  <PublicRoute>
                    <Layout><PendingApprovalPage /></Layout>
                  </PublicRoute>
                }
              />
              
              {/* ========== PROTECTED ROUTES ========== */}
              {/* مسارات المتطوعين المحمية */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <Layout><ProfilePage /></Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/participation" 
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <Layout><ParticipationPage /></Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* مسارات المؤسسات المحمية */}
              <Route 
                path="/institution-profile" 
                element={
                  <ProtectedRoute requiredRole="institution">
                    <Layout><InstitutionProfile /></Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* مسارات الفرق المحمية */}
              <Route 
                path="/team-profile" 
                element={
                  <ProtectedRoute requiredRole="team">
                    <Layout><TeamProfile /></Layout>
                  </ProtectedRoute>
                } 
              />

              {/* مسار إدارة الفرص - متاح للمؤسسات والفرق */}
              <Route 
                path="/opportunities-management" 
                element={
                  <ProtectedRoute>
                    <Layout><OpportunitiesManagement /></Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* ========== 404 PAGE ========== */}
              <Route 
                path="*" 
                element={
                  <Layout>
                    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                      <h1>404 - Page Not Found</h1>
                      <p style={{ marginTop: '20px' }}>
                        <a href="/" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>
                          ← Return to Home
                        </a>
                      </p>
                    </div>
                  </Layout>
                } 
              />
            </Routes>
          </RouteProtectionWrapper>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
