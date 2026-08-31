import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import { auth } from "./firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { clearAllAuthData } from "./auth/authHelpers";
import "./styles/ProfilePages.css";

export default function TeamProfilePage() {
  const { language } = useLanguage();
  const { currentUser, userData, loading: authLoading, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const checkLocalData = () => {
      const localRole = localStorage.getItem('userRole');
      const localTeamData = localStorage.getItem('teamData');
      
      console.log("🔍 فحص البيانات المحلية للفريق:", {
        localRole,
        hasTeamData: !!localTeamData
      });
      
      if (localRole && localRole !== 'team') {
        console.error("❌ الدور المحلي ليس فريق:", localRole);
        
        if (localRole === 'volunteer') {
          localStorage.removeItem('volunteerData');
          localStorage.removeItem('currentVolunteer');
        } else if (localRole === 'institution') {
          localStorage.removeItem('institutionData');
          localStorage.removeItem('currentInstitution');
        }
        
        if (localTeamData) {
          console.log("⚠️ تصحيح الدور إلى 'team'");
          localStorage.setItem('userRole', 'team');
        } else {
          navigate('/team-login');
          return;
        }
      }
      
      if (localTeamData) {
        try {
          const parsedData = JSON.parse(localTeamData);
          setTeamData(parsedData);
          console.log("📁 بيانات الفريق من localStorage:", parsedData.uid);
        } catch (e) {
          console.error("❌ خطأ في تحليل بيانات الفريق المحلية:", e);
        }
      }
    };
    
    checkLocalData();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("👤 فريق مسجل دخول:", user.uid, user.email);
        
        if (userData && userData.role === "team") {
          console.log("✅ استخدام بيانات من AuthContext");
          setTeamData(userData);
          setLoading(false);
          return;
        }
        
        try {
          const userRef = doc(db, "Users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const baseData = userSnap.data();
            
            try {
              const profileRef = doc(db, "Users", user.uid, "Volunteer_Team_Profile", "info");
              const profileSnap = await getDoc(profileRef);
              
              let completeData = {
                uid: user.uid,
                email: user.email,
                role: "team",
                ...baseData
              };
              
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                console.log("📊 بيانات بروفايل الفريق:", profileData);
                completeData = { ...completeData, ...profileData };
              }
              
              localStorage.setItem('teamData', JSON.stringify(completeData));
              localStorage.setItem('userRole', 'team');
              localStorage.setItem('currentTeam', JSON.stringify(completeData));
              localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                role: 'team'
              }));
              
              localStorage.removeItem('volunteerData');
              localStorage.removeItem('currentVolunteer');
              localStorage.removeItem('institutionData');
              localStorage.removeItem('currentInstitution');
              
              setTeamData(completeData);
              
              updateUserData(completeData);
              
            } catch (profileError) {
              console.error("❌ خطأ في جلب البروفايل الإضافي:", profileError);
              const basicData = {
                uid: user.uid,
                email: user.email,
                role: "team",
                ...baseData
              };
              
              setTeamData(basicData);
              updateUserData(basicData);
            }
          } else {
            console.warn("⚠️ لم يتم العثور على بيانات الفريق في Firestore");
            const fallbackData = {
              uid: user.uid,
              email: user.email,
              role: "team",
              teamNameAr: "فريق افتراضي",
              teamNameEn: "Default Team"
            };
            
            setTeamData(fallbackData);
            updateUserData(fallbackData);
          }
        } catch (error) {
          console.error("❌ خطأ في جلب بيانات Firestore:", error);
          const localData = localStorage.getItem('teamData');
          if (localData) {
            try {
              const parsedData = JSON.parse(localData);
              setTeamData(parsedData);
            } catch (e) {
              console.error("❌ خطأ في تحليل البيانات المحلية:", e);
            }
          }
        }
      } else {
        console.log("🚶 لا يوجد فريق مسجل دخول");
        navigate("/team-login");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate, userData, updateUserData]);

  const handleLogout = async () => {
    if (window.confirm(language === "en" ? "Are you sure you want to logout?" : "هل أنت متأكد أنك تريد تسجيل الخروج؟")) {
      await signOut(auth);
      clearAllAuthData();
      navigate('/team-login');
    }
  };

  const teamTypeOptions = {
    en: [
      { value: "Youth Band", label: "Youth Band" },
      { value: "Youth Initiative", label: "Youth Initiative" },
      { value: "Community Group", label: "Community Group" },
      { value: "Social Activity Team", label: "Social Activity Team" },
      { value: "Other", label: "Other" }
    ],
    ar: [
      { value: "Youth Band", label: "شباب باند" },
      { value: "Youth Initiative", label: "مبادرة شبابية" },
      { value: "Community Group", label: "مجموعة مجتمعية" },
      { value: "Social Activity Team", label: "فريق نشاط اجتماعي" },
      { value: "Other", label: "أخرى" }
    ]
  };

  const getTeamNameDisplay = () => {
    if (!teamData) return language === "en" ? "Team" : "فريق";
    if (language === "ar" && teamData.teamNameAr) {
      return teamData.teamNameAr;
    }
    return teamData.teamNameEn || teamData.teamNameAr || teamData.displayName || teamData.email || (language === "en" ? "Team" : "فريق");
  };

  const handleEditRequest = () => {
    setEditFormData({
      teamNameAr: teamData?.teamNameAr || "",
      teamNameEn: teamData?.teamNameEn || "",
      email: teamData?.email || "",
      phone: teamData?.phone || "",
      state: teamData?.state || "",
      teamType: teamData?.teamType || "",
      leaderName: teamData?.leaderName || "",
      activities: teamData?.activities || ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "ProfileEditRequests"), {
        requesterId: user.uid,
        requesterRole: "team",
        requesterName: teamData?.teamNameAr || teamData?.teamNameEn || teamData?.email || "Team",
        currentData: teamData || {},
        requestedData: editFormData,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "AdminNotifications"), {
        title: "New Team Profile Edit Request",
        message: `Team ${teamData?.teamNameEn || teamData?.teamNameAr || user.email} submitted an edit request.`,
        type: "profile_edit_request",
        userId: user.uid,
        read: false,
        createdAt: serverTimestamp(),
      });

      alert(language === "en"
        ? "Edit request has been sent to administrators. You will be notified once it's reviewed."
        : "تم إرسال طلب التعديل للإدارة. سيتم إشعارك بعد المراجعة.");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error submitting team edit request:", error);
      alert(language === "en" ? "Failed to submit edit request." : "فشل إرسال طلب التعديل.");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading || authLoading) {
    return (
      <div className="loading-screen" style={{textAlign: 'center', padding: '50px'}}>
        <div style={{fontSize: '40px', marginBottom: '20px'}}>⏳</div>
        <p>{language === "en" ? "Loading Team Profile..." : "جاري تحميل ملف الفريق..."}</p>
        <p style={{color: '#6b7280', fontSize: '14px', marginTop: '10px'}}>
          {language === "en" ? "Checking authentication and loading data..." : "جاري التحقق من المصادقة وجلب البيانات..."}
        </p>
      </div>
    );
  }

  if (!currentUser || !teamData) {
    return (
      <div style={{padding: '50px', textAlign: 'center'}}>
        <h3>{language === "en" ? "Access Denied" : "الوصول مرفوض"}</h3>
        <p style={{marginBottom: '30px'}}>
          {language === "en" 
            ? "You need to log in as a team to view this page." 
            : "يجب تسجيل الدخول كفريق لعرض هذه الصفحة."
          }
        </p>
        <button 
          onClick={() => navigate("/team-login")}
          style={{
            padding: '12px 30px',
            backgroundColor: '#d4a574',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {language === "en" ? "Go to Team Login" : "الذهاب لتسجيل دخول الفريق"}
        </button>
      </div>
    );
  }

  return (
    <div className={`profile-page ${language === "ar" ? "rtl" : ""}`}>
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <h2 style={{margin: 0}}>
                {language === "en" ? "Request Profile Edit" : "طلب تعديل البيانات"}
              </h2>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{marginBottom: '20px', backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px'}}>
              <p style={{margin: 0, color: '#0369a1'}}>
                {language === "en" 
                  ? "Please fill in the fields you want to update. The changes will be reviewed by administrators."
                  : "يرجى ملء الحقول التي تريد تحديثها. سيتم مراجعة التغييرات من قبل المسؤولين."
                }
              </p>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Team Name (Arabic)" : "اسم الفريق (عربي)"}
                </label>
                <input
                  type="text"
                  name="teamNameAr"
                  value={editFormData.teamNameAr}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Team Name (English)" : "اسم الفريق (إنجليزي)"}
                </label>
                <input
                  type="text"
                  name="teamNameEn"
                  value={editFormData.teamNameEn}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Email" : "البريد الإلكتروني"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Phone" : "الهاتف"}
                </label>
                <input
                  type="text"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "State" : "الولاية"}
                </label>
                <input
                  type="text"
                  name="state"
                  value={editFormData.state}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Team Type" : "نوع الفريق"}
                </label>
                <select
                  name="teamType"
                  value={editFormData.teamType}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">{language === "en" ? "Select type" : "اختر النوع"}</option>
                  {teamTypeOptions[language].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Team Leader" : "قائد الفريق"}
                </label>
                <input
                  type="text"
                  name="leaderName"
                  value={editFormData.leaderName}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{gridColumn: 'span 2'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Team Activities" : "أنشطة الفريق"}
                </label>
                <textarea
                  name="activities"
                  value={editFormData.activities}
                  onChange={handleEditChange}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '10px', marginTop: '30px'}}>
              <button
                onClick={handleEditSubmit}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#d4a574',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                {language === "en" ? "Submit to Admin" : "إرسال للإدارة"}
              </button>
              
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                {language === "en" ? "Cancel" : "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-header-section">
        <div className="profile-header-image">
          <img 
            src="https://mybayutcdn.bayut.com/mybayut/wp-content/uploads/volunteers.ae-1-AR21032024.jpg" 
            alt="Team Profile"
          />
          <div className="profile-image-overlay">
            <div className="profile-badge">
              {language === "en" ? "TEAM PROFILE" : "ملف الفريق"}
            </div>
            <h1>{getTeamNameDisplay()}</h1>
            <p>{language === "en" ? "View team information and manage volunteering activities" : "عرض معلومات الفريق وإدارة الأنشطة التطوعية"}</p>
          </div>
        </div>
      </div>

      <main className="profile-main">
        <section className="profile-card">
          <div className="avatar-wrap">
            <img 
              // إضافة: عرض شعار الفريق المرفوع في التسجيل
              src={teamData?.logo || "https://via.placeholder.com/150"} 
              alt="team logo" 
              className="avatar"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
          </div>
          <h2>{getTeamNameDisplay()}</h2>
          <p className="email">{teamData?.email}</p>
          
          <div className="stats">
            <div className="stat">
              <span>{language === "en" ? "Team Type" : "نوع الفريق"}</span>
              <span>
                {teamTypeOptions[language].find(opt => opt.value === teamData?.teamType)?.label || teamData?.teamType || "N/A"}
              </span>
            </div>
            <div className="stat">
              <span>{language === "en" ? "Location" : "الموقع"}</span>
              <span>{teamData?.state || "N/A"}</span>
            </div>
            <div className="stat">
              <span>{language === "en" ? "Team Leader" : "قائد الفريق"}</span>
              <span>{teamData?.leaderName || "N/A"}</span>
            </div>
          </div>
        </section>

        <section className="profile-info-display" style={{flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
          <div className="info-group">
            <h3 style={{borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', marginBottom: '20px'}}>
              {language === "en" ? "Team Information" : "معلومات الفريق"}
            </h3>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
              <p><strong>{language === "en" ? "Team Name (AR):" : "اسم الفريق (عربي):"}</strong> {teamData?.teamNameAr || "-"}</p>
              <p><strong>{language === "en" ? "Team Name (EN):" : "اسم الفريق (إنجليزي):"}</strong> {teamData?.teamNameEn || "-"}</p>
              <p><strong>{language === "en" ? "Email:" : "البريد:"}</strong> {teamData?.email || "-"}</p>
              <p><strong>{language === "en" ? "Phone:" : "الهاتف:"}</strong> {teamData?.phone || "-"}</p>
              <p><strong>{language === "en" ? "State:" : "الولاية:"}</strong> {teamData?.state || "-"}</p>
              <p><strong>{language === "en" ? "Team Type:" : "نوع الفريق:"}</strong> {teamData?.teamType || "-"}</p>
              <p><strong>{language === "en" ? "Leader Name:" : "اسم القائد:"}</strong> {teamData?.leaderName || "-"}</p>
            </div>

            <h4 style={{marginBottom: '15px', color: '#d4a574'}}>
              {language === "en" ? "Team Activities" : "أنشطة الفريق"}
            </h4>
            <div style={{marginBottom: '30px'}}>
              <p style={{backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px'}}>
                {teamData?.activities || (language === "en" ? "No activities description provided" : "لا توجد وصف للأنشطة")}
              </p>
            </div>

            <button 
              onClick={handleEditRequest}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#d4a574',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '20px'
              }}
            >
              {language === "en" ? "Request Profile Edit" : "طلب تعديل البيانات"}
            </button>
          </div>
        </section>

        <nav className="side-menu">
          <h3>{language === "en" ? "Team Menu" : "قائمة الفريق"}</h3>
          <div className="menu-links">
            <button className="menu-btn active">
              {language === "en" ? "Profile Info" : "معلومات الملف الشخصي"}
            </button>
            <button 
              className="menu-btn" 
              onClick={() => navigate("/opportunities-management")}
            >
              {language === "en" ? "Manage Opportunities" : "إدارة الفرص"}
            </button>
            <button 
              className="menu-btn logout-btn" 
              onClick={handleLogout}
            >
              {language === "en" ? "Logout" : "تسجيل الخروج"}
            </button>
          </div>
          
        </nav>
      </main>
    </div>
  );
}



