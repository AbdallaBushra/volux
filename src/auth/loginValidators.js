// src/auth/loginValidators.js

/**
 * دوال للتحقق من صحة مسار تسجيل الدخول
 */

// تحويل الأدوار المختلفة إلى قيم موحدة
export const normalizeRole = (role) => {
  if (!role) return 'volunteer';
  
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('admin')) return 'admin';
  if (roleLower.includes('institution') || roleLower.includes('organization') || roleLower.includes('org')) return 'institution';
  if (roleLower.includes('team') || roleLower.includes('volunteer_team')) return 'team';
  if (roleLower.includes('volunteer') || roleLower.includes('individual') || roleLower.includes('user')) return 'volunteer';
  
  return role;
};

// التحقق من أن المستخدم يحاول الدخول من الصفحة الصحيحة
export const validateUserLoginPath = (userRole, loginPage) => {
  const normalizedRole = normalizeRole(userRole);
  const normalizedPage = normalizeRole(loginPage);
  
  return normalizedRole === normalizedPage;
};

// الحصول على صفحة تسجيل الدخول المناسبة بناءً على الدور
export const getProperLoginPage = (userRole) => {
  const normalizedRole = normalizeRole(userRole);
  
  switch (normalizedRole) {
    case 'admin':
      return '/admin-login';
    case 'institution':
      return '/institution-login';
    case 'team':
      return '/team-login';
    case 'volunteer':
    default:
      return '/login';
  }
};

// رسالة خطأ مناسبة للغة
export const getLoginError = (userRole, language = 'ar') => {
  const properPage = getProperLoginPage(userRole);
  const pageName = properPage.replace('/', '').replace('-login', '');
  
  if (language === 'en') {
    return `❌ This account is registered as ${userRole}. Please use the ${pageName} login page.`;
  } else {
    return `❌ هذا الحساب مسجل كـ ${userRole}. يرجى استخدام صفحة تسجيل دخول ${pageName}.`;
  }
};