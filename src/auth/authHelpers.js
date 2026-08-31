// src/auth/authHelpers.js

// تنظيف جميع بيانات المصادقة
export const clearAllAuthData = () => {
  console.log("🧹 Clearing all auth data...");
  
  // الاحتفاظ بالتطبيقات فقط (اللغة، الثيم، إلخ)
  const preferences = {
    language: localStorage.getItem('language'),
    theme: localStorage.getItem('theme')
  };
  
  // مسح جميع البيانات المتعلقة بالمستخدمين
  localStorage.clear();
  sessionStorage.clear();
  
  // إعادة تعيين التفضيلات
  if (preferences.language) localStorage.setItem('language', preferences.language);
  if (preferences.theme) localStorage.setItem('theme', preferences.theme);
  
  console.log("✅ All auth data cleared");
};

// حفظ بيانات المؤسسة
export const saveInstitutionData = (userData) => {
  // تنظيف أولاً مع الاحتفاظ بالتطبيقات
  const preferences = {
    language: localStorage.getItem('language'),
    theme: localStorage.getItem('theme')
  };
  
  // مسح جميع بيانات المستخدم
  const userKeys = [
    'currentUser', 'userData', 'userRole',
    'volunteerData', 'institutionData', 'teamData', 'adminData',
    'currentInstitution', 'currentVolunteer', 'currentTeam', 'currentAdmin',
    'volunteerRegistrationData', 'institutionRegistrationData', 'teamRegistrationData'
  ];
  
  userKeys.forEach(key => localStorage.removeItem(key));
  sessionStorage.clear();
  
  const dataToSave = {
    ...userData,
    userType: 'institution',
    role: 'institution',
    loginTime: new Date().toISOString(),
    source: 'firebase'
  };
  
  console.log("💾 Saving institution data:", dataToSave);
  
  // حفظ البيانات في localStorage
  localStorage.setItem('institutionData', JSON.stringify(dataToSave));
  localStorage.setItem('userRole', 'institution');
  localStorage.setItem('currentInstitution', JSON.stringify(dataToSave));
  localStorage.setItem('currentUser', JSON.stringify({
    uid: dataToSave.uid,
    email: dataToSave.email,
    role: 'institution',
    displayName: dataToSave.orgNameAr || dataToSave.orgNameEn || dataToSave.email
  }));
  
  // حفظ علامة الجلسة
  sessionStorage.setItem('isInstitution', 'true');
  sessionStorage.setItem('institutionLoginTime', new Date().toISOString());
  
  // إعادة تعيين التفضيلات
  if (preferences.language) localStorage.setItem('language', preferences.language);
  if (preferences.theme) localStorage.setItem('theme', preferences.theme);
  
  return dataToSave;
};

// حفظ بيانات المتطوع
export const saveVolunteerData = (userData) => {
  // تنظيف أولاً مع الاحتفاظ بالتطبيقات
  const preferences = {
    language: localStorage.getItem('language'),
    theme: localStorage.getItem('theme')
  };
  
  // مسح جميع بيانات المستخدم
  const userKeys = [
    'currentUser', 'userData', 'userRole',
    'volunteerData', 'institutionData', 'teamData', 'adminData',
    'currentInstitution', 'currentVolunteer', 'currentTeam', 'currentAdmin',
    'volunteerRegistrationData', 'institutionRegistrationData', 'teamRegistrationData'
  ];
  
  userKeys.forEach(key => localStorage.removeItem(key));
  sessionStorage.clear();
  
  const dataToSave = {
    ...userData,
    userType: 'volunteer',
    role: 'volunteer',
    loginTime: new Date().toISOString(),
    source: 'firebase'
  };
  
  console.log("💾 Saving volunteer data:", dataToSave);
  
  localStorage.setItem('volunteerData', JSON.stringify(dataToSave));
  localStorage.setItem('userRole', 'volunteer');
  localStorage.setItem('currentVolunteer', JSON.stringify(dataToSave));
  localStorage.setItem('currentUser', JSON.stringify({
    uid: dataToSave.uid,
    email: dataToSave.email,
    role: 'volunteer',
    displayName: dataToSave.fullName || dataToSave.email
  }));
  
  // حفظ علامة الجلسة
  sessionStorage.setItem('isVolunteer', 'true');
  sessionStorage.setItem('volunteerLoginTime', new Date().toISOString());
  
  // إعادة تعيين التفضيلات
  if (preferences.language) localStorage.setItem('language', preferences.language);
  if (preferences.theme) localStorage.setItem('theme', preferences.theme);
  
  return dataToSave;
};

// حفظ بيانات الفريق
export const saveTeamData = (userData) => {
  // تنظيف أولاً مع الاحتفاظ بالتطبيقات
  const preferences = {
    language: localStorage.getItem('language'),
    theme: localStorage.getItem('theme')
  };
  
  // مسح جميع بيانات المستخدم
  const userKeys = [
    'currentUser', 'userData', 'userRole',
    'volunteerData', 'institutionData', 'teamData', 'adminData',
    'currentInstitution', 'currentVolunteer', 'currentTeam', 'currentAdmin',
    'volunteerRegistrationData', 'institutionRegistrationData', 'teamRegistrationData'
  ];
  
  userKeys.forEach(key => localStorage.removeItem(key));
  sessionStorage.clear();
  
  const dataToSave = {
    ...userData,
    userType: 'team',
    role: 'team',
    loginTime: new Date().toISOString(),
    source: 'firebase'
  };
  
  console.log("💾 Saving team data:", dataToSave);
  
  localStorage.setItem('teamData', JSON.stringify(dataToSave));
  localStorage.setItem('userRole', 'team');
  localStorage.setItem('currentTeam', JSON.stringify(dataToSave));
  localStorage.setItem('currentUser', JSON.stringify({
    uid: dataToSave.uid,
    email: dataToSave.email,
    role: 'team',
    displayName: dataToSave.teamNameAr || dataToSave.teamNameEn || dataToSave.email
  }));
  
  // حفظ علامة الجلسة
  sessionStorage.setItem('isTeam', 'true');
  sessionStorage.setItem('teamLoginTime', new Date().toISOString());
  
  // إعادة تعيين التفضيلات
  if (preferences.language) localStorage.setItem('language', preferences.language);
  if (preferences.theme) localStorage.setItem('theme', preferences.theme);
  
  return dataToSave;
};

// حفظ بيانات الأدمن
export const saveAdminData = (userData) => {
  // تنظيف أولاً مع الاحتفاظ بالتطبيقات
  const preferences = {
    language: localStorage.getItem('language'),
    theme: localStorage.getItem('theme')
  };
  
  // مسح جميع بيانات المستخدم
  const userKeys = [
    'currentUser', 'userData', 'userRole',
    'volunteerData', 'institutionData', 'teamData', 'adminData',
    'currentInstitution', 'currentVolunteer', 'currentTeam', 'currentAdmin',
    'volunteerRegistrationData', 'institutionRegistrationData', 'teamRegistrationData'
  ];
  
  userKeys.forEach(key => localStorage.removeItem(key));
  sessionStorage.clear();
  
  const dataToSave = {
    ...userData,
    userType: 'admin',
    role: 'admin',
    loginTime: new Date().toISOString(),
    source: 'firebase'
  };
  
  console.log("💾 Saving admin data:", dataToSave);
  
  // حفظ البيانات في localStorage
  localStorage.setItem('adminData', JSON.stringify(dataToSave));
  localStorage.setItem('userRole', 'admin');
  localStorage.setItem('currentAdmin', JSON.stringify(dataToSave));
  localStorage.setItem('currentUser', JSON.stringify({
    uid: dataToSave.uid,
    email: dataToSave.email,
    role: 'admin',
    displayName: dataToSave.displayName || dataToSave.email
  }));
  
  // حفظ علامة الجلسة
  sessionStorage.setItem('isAdmin', 'true');
  sessionStorage.setItem('adminLoginTime', new Date().toISOString());
  
  // إعادة تعيين التفضيلات
  if (preferences.language) localStorage.setItem('language', preferences.language);
  if (preferences.theme) localStorage.setItem('theme', preferences.theme);
  
  return dataToSave;
};

// جلب بيانات المستخدم الحالي مع التحقق من التناسق
export const getCurrentUserData = () => {
  const userRole = localStorage.getItem('userRole');
  
  if (!userRole) {
    console.log("❌ No user role found in localStorage");
    return null;
  }
  
  console.log("🔍 Current user role:", userRole);
  
  // التحقق من تناسق البيانات
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const parsedUser = JSON.parse(currentUser);
      if (parsedUser.role !== userRole) {
        console.warn("⚠️ تضارب في الأدوار، جاري التصحيح...");
        localStorage.setItem('userRole', parsedUser.role);
        return getCurrentUserData(); // إعادة المحاولة
      }
    } catch (e) {
      console.error("❌ خطأ في تحليل currentUser:", e);
    }
  }
  
  // جلب البيانات حسب الدور
  if (userRole === 'institution') {
    const data = localStorage.getItem('institutionData');
    return data ? JSON.parse(data) : null;
  } else if (userRole === 'volunteer') {
    const data = localStorage.getItem('volunteerData');
    return data ? JSON.parse(data) : null;
  } else if (userRole === 'team') {
    const data = localStorage.getItem('teamData');
    return data ? JSON.parse(data) : null;
  } else if (userRole === 'admin') {
    const data = localStorage.getItem('adminData');
    return data ? JSON.parse(data) : null;
  }
  
  return null;
};

// التحقق من نوع المستخدم مع التأكد من عدم التضارب
export const getUserRole = () => {
  const userRole = localStorage.getItem('userRole');
  const currentUser = localStorage.getItem('currentUser');
  
  if (!userRole || !currentUser) {
    return null;
  }
  
  try {
    const parsedUser = JSON.parse(currentUser);
    
    // إذا كان هناك تضارب، نصححه
    if (parsedUser.role !== userRole) {
      console.warn(`⚠️ تضارب: currentUser.role=${parsedUser.role}, userRole=${userRole}`);
      localStorage.setItem('userRole', parsedUser.role);
      return parsedUser.role;
    }
    
    return userRole;
  } catch (e) {
    console.error("❌ خطأ في تحليل currentUser:", e);
    return userRole;
  }
};

// التحقق إذا كان المستخدم مؤسسة
export const isInstitution = () => {
  const role = getUserRole();
  if (!role) return false;
  
  // تنظيف أي بيانات متضاربة
  if (role === 'institution') {
    localStorage.removeItem('volunteerData');
    localStorage.removeItem('currentVolunteer');
    localStorage.removeItem('teamData');
    localStorage.removeItem('currentTeam');
    localStorage.removeItem('adminData');
    localStorage.removeItem('currentAdmin');
    sessionStorage.removeItem('isVolunteer');
    sessionStorage.removeItem('isTeam');
    sessionStorage.removeItem('isAdmin');
  }
  
  return role === 'institution';
};

// التحقق إذا كان المستخدم متطوع
export const isVolunteer = () => {
  const role = getUserRole();
  if (!role) return false;
  
  // تنظيف أي بيانات متضاربة
  if (role === 'volunteer') {
    localStorage.removeItem('institutionData');
    localStorage.removeItem('currentInstitution');
    localStorage.removeItem('teamData');
    localStorage.removeItem('currentTeam');
    localStorage.removeItem('adminData');
    localStorage.removeItem('currentAdmin');
    sessionStorage.removeItem('isInstitution');
    sessionStorage.removeItem('isTeam');
    sessionStorage.removeItem('isAdmin');
  }
  
  return role === 'volunteer';
};

// التحقق إذا كان المستخدم فريق
export const isTeam = () => {
  const role = getUserRole();
  if (!role) return false;
  
  // تنظيف أي بيانات متضاربة
  if (role === 'team') {
    localStorage.removeItem('institutionData');
    localStorage.removeItem('currentInstitution');
    localStorage.removeItem('volunteerData');
    localStorage.removeItem('currentVolunteer');
    localStorage.removeItem('adminData');
    localStorage.removeItem('currentAdmin');
    sessionStorage.removeItem('isInstitution');
    sessionStorage.removeItem('isVolunteer');
    sessionStorage.removeItem('isAdmin');
  }
  
  return role === 'team';
};

// التحقق إذا كان المستخدم أدمن
export const isAdmin = () => {
  const role = getUserRole();
  if (!role) return false;
  
  // تنظيف أي بيانات متضاربة
  if (role === 'admin') {
    localStorage.removeItem('volunteerData');
    localStorage.removeItem('currentVolunteer');
    localStorage.removeItem('institutionData');
    localStorage.removeItem('currentInstitution');
    localStorage.removeItem('teamData');
    localStorage.removeItem('currentTeam');
    sessionStorage.removeItem('isVolunteer');
    sessionStorage.removeItem('isInstitution');
    sessionStorage.removeItem('isTeam');
  }
  
  return role === 'admin';
};

// تسجيل الخروج - النسخة المحسنة
export const logoutUser = () => {
  console.log("🚪 Logging out user...");
  
  try {
    // الاحتفاظ بالتطبيقات فقط (اللغة، الثيم، إلخ)
    const preferences = {
      language: localStorage.getItem('language'),
      theme: localStorage.getItem('theme')
    };
    
    // قائمة بجميع مفاتيح بيانات المصادقة
    const authKeys = [
      'currentUser', 'userData', 'userRole',
      'volunteerData', 'institutionData', 'teamData', 'adminData',
      'currentInstitution', 'currentVolunteer', 'currentTeam', 'currentAdmin',
      'volunteerRegistrationData', 'institutionRegistrationData', 'teamRegistrationData',
      'adminToken', 'userToken', 'firebaseToken'
    ];
    
    // مسح جميع بيانات المصادقة من localStorage
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // تنظيف sessionStorage بالكامل
    sessionStorage.clear();
    
    // الاحتفاظ بإعدادات المنصة إذا كانت موجودة (اختياري)
    const platformSettings = localStorage.getItem('voluxAdminSettings');
    
    // تنظيف إضافي لأي بيانات قد تكون مرتبطة بالمستخدمين
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('user') || key.includes('User') || key.includes('auth') || key.includes('Auth')) {
        localStorage.removeItem(key);
      }
    });
    
    // إعادة تعيين التفضيلات
    if (preferences.language) localStorage.setItem('language', preferences.language);
    if (preferences.theme) localStorage.setItem('theme', preferences.theme);
    
    // إعادة حفظ إعدادات المنصة إذا كانت موجودة
    if (platformSettings) {
      localStorage.setItem('voluxAdminSettings', platformSettings);
    }
    
    console.log("✅ User logged out successfully. Auth data cleared.");
    
  } catch (error) {
    console.error("❌ Error during logout:", error);
    // إذا فشلت الطريقة الانتقائية، نستخدم الطريقة الشاملة
    clearAllAuthData();
  }
};

// دالة تسجيل خروج متكاملة مع Firebase (اختيارية)
export const completeLogout = async (auth) => {
  try {
    // 1. تسجيل الخروج من Firebase إذا تم توفير كائن auth
    if (auth) {
      await auth.signOut();
      console.log("✅ Signed out from Firebase successfully");
    }
    
    // 2. تنظيف البيانات المحلية
    logoutUser();
    
    // 3. توجيه المستخدم لصفحة تسجيل الدخول المناسبة
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'admin') {
      window.location.href = '/admin-login';
    } else if (userRole === 'institution') {
      window.location.href = '/institution-login';
    } else if (userRole === 'team') {
      window.location.href = '/team-login';
    } else {
      window.location.href = '/login';
    }
    
  } catch (error) {
    console.error("❌ Complete logout failed:", error);
    // تنظيف البيانات المحلية فقط في حالة الخطأ
    logoutUser();
    window.location.href = '/';
  }
};

// دالة للتحقق من صحة بيانات المستخدم
export const validateUserData = () => {
  const role = getUserRole();
  const userData = getCurrentUserData();
  
  if (!role || !userData) {
    console.log("❌ لا توجد بيانات مستخدم صالحة");
    return false;
  }
  
  // التحقق من تطابق UID إذا كان موجودًا
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const parsedUser = JSON.parse(currentUser);
      if (parsedUser.uid && userData.uid && parsedUser.uid !== userData.uid) {
        console.error("❌ تضارب في UID بين currentUser و userData");
        return false;
      }
    } catch (e) {
      console.error("❌ خطأ في تحليل currentUser:", e);
    }
  }
  
  return true;
};

// إضافة هذه الدالة في App.js لمراقبة تغيرات المسار
export const setupRouteProtection = () => {
  // دالة للتحقق من صلاحية الوصول للصفحة
  const checkPageAccess = () => {
    const path = window.location.pathname;
    const userRole = getUserRole();
    const isValid = validateUserData();
    
    console.log("📍 Route check:", { path, userRole, isValid });
    
    if (!isValid) {
      console.log("⚠️ بيانات المستخدم غير صالحة، جاري إعادة التوجيه...");
      window.location.href = '/login';
      return false;
    }
    
    // قواعد الوصول
    const accessRules = {
      '/admin': 'admin',
      '/admin/dashboard': 'admin',
      '/admin/users': 'admin',
      '/admin/organizations': 'admin',
      '/admin/teams': 'admin',
      '/admin/opportunities': 'admin',
      '/admin/reports': 'admin',
      '/admin/settings': 'admin',
      '/institution-profile': 'institution',
      '/institution-dashboard': 'institution',
      '/manage-opportunities': 'institution',
      '/create-opportunity': 'institution',
      '/profile': 'volunteer',
      '/dashboard': 'volunteer',
      '/opportunities': 'volunteer',
      '/team-profile': 'team'
    };
    
    // التحقق من كل قاعدة
    for (const [route, requiredRole] of Object.entries(accessRules)) {
      if (path.includes(route) && userRole !== requiredRole) {
        console.log(`🚫 Access denied: ${userRole} cannot access ${route}`);
        
        // تنظيف البيانات المتضاربة
        if (requiredRole === 'admin' && userRole !== 'admin') {
          logoutUser();
          window.location.href = '/admin-login';
          return false;
        } else if (requiredRole === 'institution' && userRole !== 'institution') {
          if (userRole === 'volunteer') {
            localStorage.removeItem('volunteerData');
            localStorage.removeItem('currentVolunteer');
          } else if (userRole === 'team') {
            localStorage.removeItem('teamData');
            localStorage.removeItem('currentTeam');
          }
        } else if (requiredRole === 'volunteer' && userRole !== 'volunteer') {
          if (userRole === 'institution') {
            localStorage.removeItem('institutionData');
            localStorage.removeItem('currentInstitution');
          } else if (userRole === 'team') {
            localStorage.removeItem('teamData');
            localStorage.removeItem('currentTeam');
          }
        } else if (requiredRole === 'team' && userRole !== 'team') {
          if (userRole === 'volunteer') {
            localStorage.removeItem('volunteerData');
            localStorage.removeItem('currentVolunteer');
          } else if (userRole === 'institution') {
            localStorage.removeItem('institutionData');
            localStorage.removeItem('currentInstitution');
          }
        }
        
        // توجيه للمسار الصحيح
        if (userRole === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (userRole === 'institution') {
          window.location.href = '/institution-profile';
        } else if (userRole === 'volunteer') {
          window.location.href = '/profile';
        } else if (userRole === 'team') {
          window.location.href = '/team-profile';
        } else {
          window.location.href = '/login';
        }
        
        return false;
      }
    }
    
    return true;
  };
  
  // استدعاء عند تغيير المسار
  window.addEventListener('popstate', checkPageAccess);
  
  // استدعاء عند تحميل الصفحة
  window.addEventListener('load', checkPageAccess);
  
  // مراقبة جميع الروابط
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href) {
      setTimeout(checkPageAccess, 100);
    }
  });
  
  console.log("✅ Route protection setup complete");
};

// دوال جديدة للتحقق من صحة مسار تسجيل الدخول - إضافة جديدة
// =============================================================

// التحقق من أن المستخدم يحاول الدخول من الصفحة المناسبة
export const validateLoginPath = (userData, loginType) => {
  const userRole = userData.role || userData.userType;
  
  console.log(`🔍 Validating login path: User role = ${userRole}, Login type = ${loginType}`);
  
  // تحويل الأدوار المختلفة إلى قيم موحدة
  let normalizedRole = userRole;
  if (normalizedRole === "organization" || normalizedRole === "org") {
    normalizedRole = "institution";
  } else if (normalizedRole === "volunteer_team") {
    normalizedRole = "team";
  }
  
  // قواعد التطابق بين نوع الصفحة ودور المستخدم
  const validMatches = {
    'volunteer': normalizedRole === 'volunteer',
    'institution': normalizedRole === 'institution',
    'team': normalizedRole === 'team',
    'admin': normalizedRole === 'admin'
  };
  
  if (!validMatches[loginType]) {
    console.error(`❌ Invalid login path: ${normalizedRole} trying to login as ${loginType}`);
    return false;
  }
  
  return true;
};

// دالة لتنظيف بيانات المستخدم بناءً على نوع الصفحة
export const cleanupBasedOnLoginType = (loginType) => {
  console.log(`🧹 Cleaning up for login type: ${loginType}`);
  
  // الاحتفاظ بالتفضيلات فقط
  const preferences = {
    language: localStorage.getItem('language'),
    theme: localStorage.getItem('theme')
  };
  
  // مسح جميع بيانات المصادقة
  const authKeys = [
    'currentUser', 'userData', 'userRole',
    'volunteerData', 'institutionData', 'teamData', 'adminData',
    'currentInstitution', 'currentVolunteer', 'currentTeam', 'currentAdmin',
    'volunteerRegistrationData', 'institutionRegistrationData', 'teamRegistrationData',
    'adminToken', 'userToken', 'firebaseToken'
  ];
  
  authKeys.forEach(key => localStorage.removeItem(key));
  sessionStorage.clear();
  
  // إعادة تعيين التفضيلات
  if (preferences.language) localStorage.setItem('language', preferences.language);
  if (preferences.theme) localStorage.setItem('theme', preferences.theme);
  
  return true;
};

// دالة لحفظ بيانات المستخدم مع التحقق من المسار
export const saveUserDataWithValidation = (userData, loginType) => {
  // تنظيف البيانات أولاً
  cleanupBasedOnLoginType(loginType);
  
  // التحقق من المسار
  if (!validateLoginPath(userData, loginType)) {
    console.error(`🚫 User ${userData.email} (role: ${userData.role}) cannot login as ${loginType}`);
    throw new Error(`This account is registered as ${userData.role}, not ${loginType}. Please use the appropriate login page.`);
  }
  
  // حفظ البيانات بناءً على النوع
  switch (loginType) {
    case 'institution':
      return saveInstitutionData(userData);
    case 'volunteer':
      return saveVolunteerData(userData);
    case 'team':
      return saveTeamData(userData);
    case 'admin':
      return saveAdminData(userData);
    default:
      throw new Error(`Unknown login type: ${loginType}`);
  }
};