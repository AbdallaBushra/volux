// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { normalizeRole } from "../auth/loginValidators";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // دالة مساعدة للحصول على الدور من Firestore
  const getUserRoleFromFirestore = async (uid) => {
    try {
      const userRef = doc(db, "Users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data().role || "volunteer";
      }
      return "volunteer";
    } catch (error) {
      console.error("❌ خطأ في جلب الدور:", error);
      return "volunteer";
    }
  };

  // تنظيف البيانات المتضاربة بناءً على الدور
  const cleanupConflictingData = (role) => {
    console.log(`🧹 تنظيف البيانات المتضاربة للدور: ${role}`);
    
    // تنظيف جميع بيانات المستخدم القديمة أولاً
    const userDataKeys = [
      'currentUser', 'userData', 'userRole',
      'volunteerData', 'institutionData', 'teamData', 'adminData',
      'currentInstitution', 'currentVolunteer', 'currentTeam', 'currentAdmin'
    ];
    
    userDataKeys.forEach(key => localStorage.removeItem(key));
    
    // حفظ الدور الحالي فقط
    if (role) {
      localStorage.setItem('userRole', role);
    }
  };

  useEffect(() => {
    // مراقبة حالة تسجيل الدخول
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError(null);
        
        if (user) {
          console.log("👤 مستخدم مسجل دخول:", user.uid, user.email);
          
          try {
            // 1. تحديد دور المستخدم
            let userRole = await getUserRoleFromFirestore(user.uid);
            
            // تحويل الأدوار المختلفة إلى قيم موحدة
            let normalizedRole = normalizeRole(userRole);
            
            console.log("🎯 الدور المحدد:", normalizedRole);
            
            // 2. التحقق من أن المستخدم لا يحاول استخدام صفحة غير مناسبة
            // هذا التحقق مهم لمنع الأدمن من استخدام صفحات تسجيل الدخول الأخرى
            const currentPath = window.location.pathname;
            const isLoginPage = currentPath.includes('-login') || currentPath === '/login';
            
            if (isLoginPage && normalizedRole === 'admin' && !currentPath.includes('admin-login')) {
              console.error('🚫 محاولة دخول أدمن من صفحة غير أدمن!');
              await auth.signOut();
              
              // تنظيف جميع البيانات
              const itemsToKeep = ['language', 'theme'];
              const allItems = Object.keys(localStorage);
              allItems.forEach(key => {
                if (!itemsToKeep.includes(key) && (
                  key.includes('user') || 
                  key.includes('Role') || 
                  key.includes('Data') || 
                  key.includes('current') ||
                  key === 'adminData'
                )) {
                  localStorage.removeItem(key);
                }
              });
              
              sessionStorage.clear();
              
              // توجيه لصفحة تسجيل الدخول المناسبة
              window.location.href = '/admin-login';
              return;
            }
            
            // 3. تنظيف البيانات المتضاربة
            cleanupConflictingData(normalizedRole);
            
            // 4. حفظ البيانات الأساسية في localStorage
            const baseUserInfo = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
              role: normalizedRole,
              loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(baseUserInfo));
            localStorage.setItem('userRole', normalizedRole);
            
            // 5. جلب البيانات التفصيلية من Firestore
            let finalUserData = baseUserInfo;
            
            try {
              // جلب البيانات الأساسية
              const userRef = doc(db, "Users", user.uid);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const baseData = userSnap.data();
                finalUserData = { ...finalUserData, ...baseData };
                
                // 6. تحديد وتحميل البيانات من المجموعة الفرعية
                let subCollectionName = "";
                if (normalizedRole === "volunteer") {
                  subCollectionName = "Volunteer_Profile";
                } else if (normalizedRole === "institution") {
                  subCollectionName = "Organization_Profile";
                } else if (normalizedRole === "team") {
                  subCollectionName = "Volunteer_Team_Profile";
                } else if (normalizedRole === "admin") {
                  subCollectionName = "Adminstation";
                }
                
                if (subCollectionName) {
                  try {
                    const profileRef = doc(db, "Users", user.uid, subCollectionName, "info");
                    const profileSnap = await getDoc(profileRef);
                    
                    if (profileSnap.exists()) {
                      const profileData = profileSnap.data();
                      console.log(`📊 بيانات ${subCollectionName}:`, profileData);
                      finalUserData = { ...finalUserData, ...profileData };
                    }
                  } catch (profileError) {
                    console.log(`⚠️ لا يوجد بيانات إضافية في ${subCollectionName}`);
                  }
                }
                
                // 7. حفظ البيانات حسب النوع في localStorage
                if (normalizedRole === "institution") {
                  localStorage.setItem('institutionData', JSON.stringify(finalUserData));
                  localStorage.setItem('currentInstitution', JSON.stringify(finalUserData));
                  // تنظيف أي بيانات أدمن متبقية
                  localStorage.removeItem('adminData');
                  localStorage.removeItem('currentAdmin');
                } else if (normalizedRole === "volunteer") {
                  localStorage.setItem('volunteerData', JSON.stringify(finalUserData));
                  localStorage.setItem('currentVolunteer', JSON.stringify(finalUserData));
                  // تنظيف أي بيانات أدمن متبقية
                  localStorage.removeItem('adminData');
                  localStorage.removeItem('currentAdmin');
                } else if (normalizedRole === "team") {
                  localStorage.setItem('teamData', JSON.stringify(finalUserData));
                  localStorage.setItem('currentTeam', JSON.stringify(finalUserData));
                  // تنظيف أي بيانات أدمن متبقية
                  localStorage.removeItem('adminData');
                  localStorage.removeItem('currentAdmin');
                } else if (normalizedRole === "admin") {
                  localStorage.setItem('adminData', JSON.stringify(finalUserData));
                  localStorage.setItem('currentAdmin', JSON.stringify(finalUserData));
                  // تنظيف أي بيانات أخرى
                  localStorage.removeItem('volunteerData');
                  localStorage.removeItem('currentVolunteer');
                  localStorage.removeItem('institutionData');
                  localStorage.removeItem('currentInstitution');
                  localStorage.removeItem('teamData');
                  localStorage.removeItem('currentTeam');
                }
                
                // 8. حفظ بيانات الجلسة
                sessionStorage.setItem(`is${normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)}`, 'true');
                sessionStorage.setItem('lastLogin', new Date().toISOString());
                
                setCurrentUser(user);
                setUserData(finalUserData);
                
              } else {
                // حالة عدم وجود بيانات في Firestore
                console.warn("⚠️ لا توجد بيانات للمستخدم في Firestore");
                setCurrentUser(user);
                setUserData(baseUserInfo);
              }
              
            } catch (dbError) {
              console.error("❌ خطأ في جلب بيانات Firestore:", dbError);
              setError(dbError.message);
              setCurrentUser(user);
              setUserData(baseUserInfo);
            }
            
          } catch (roleError) {
            console.error("❌ خطأ في تحديد الدور:", roleError);
            // استخدام البيانات المحلية كبديل
            const storedRole = localStorage.getItem('userRole') || "volunteer";
            cleanupConflictingData(storedRole);
            
            const fallbackData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email,
              role: storedRole
            };
            
            localStorage.setItem('currentUser', JSON.stringify(fallbackData));
            setCurrentUser(user);
            setUserData(fallbackData);
          }
          
        } else {
          // حالة تسجيل الخروج
          console.log("🚶 لا يوجد مستخدم مسجل دخول");
          
          // تنظيف البيانات الحساسة فقط، مع الاحتفاظ بالتفضيلات
          const itemsToKeep = ['language', 'theme'];
          const allItems = Object.keys(localStorage);
          allItems.forEach(key => {
            if (!itemsToKeep.includes(key) && (
              key.includes('user') || 
              key.includes('Role') || 
              key.includes('Data') || 
              key.includes('current') ||
              key === 'adminData'
            )) {
              localStorage.removeItem(key);
            }
          });
          
          // تنظيف sessionStorage
          sessionStorage.clear();
          
          setCurrentUser(null);
          setUserData(null);
        }
        
      } catch (error) {
        console.error("❌ خطأ عام في AuthStateChanged:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
    
    // تحديث localStorage أيضًا
    if (newData.role) {
      localStorage.setItem('userRole', newData.role);
      
      if (newData.role === "institution") {
        localStorage.setItem('institutionData', JSON.stringify(newData));
        localStorage.setItem('currentInstitution', JSON.stringify(newData));
        // تنظيف بيانات الأدمن إذا تحول لمؤسسة
        localStorage.removeItem('adminData');
        localStorage.removeItem('currentAdmin');
      } else if (newData.role === "volunteer") {
        localStorage.setItem('volunteerData', JSON.stringify(newData));
        localStorage.setItem('currentVolunteer', JSON.stringify(newData));
        // تنظيف بيانات الأدمن إذا تحول لمتطوع
        localStorage.removeItem('adminData');
        localStorage.removeItem('currentAdmin');
      } else if (newData.role === "team") {
        localStorage.setItem('teamData', JSON.stringify(newData));
        localStorage.setItem('currentTeam', JSON.stringify(newData));
        // تنظيف بيانات الأدمن إذا تحول لفريق
        localStorage.removeItem('adminData');
        localStorage.removeItem('currentAdmin');
      } else if (newData.role === "admin") {
        localStorage.setItem('adminData', JSON.stringify(newData));
        localStorage.setItem('currentAdmin', JSON.stringify(newData));
        // تنظيف جميع البيانات الأخرى
        localStorage.removeItem('volunteerData');
        localStorage.removeItem('currentVolunteer');
        localStorage.removeItem('institutionData');
        localStorage.removeItem('currentInstitution');
        localStorage.removeItem('teamData');
        localStorage.removeItem('currentTeam');
      }
    }
    
    localStorage.setItem('currentUser', JSON.stringify(newData));
  };

  const value = {
    currentUser,
    userData,
    loading,
    error,
    isAuthenticated: !!currentUser,
    updateUserData,
    // دوال مساعدة للتحقق من النوع
    isInstitution: () => userData?.role === "institution",
    isVolunteer: () => userData?.role === "volunteer",
    isTeam: () => userData?.role === "team",
    isAdmin: () => userData?.role === "admin"
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};