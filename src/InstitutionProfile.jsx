import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import { auth } from "./firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { clearAllAuthData, isInstitution } from "./auth/authHelpers";
import "./styles/ProfilePages.css";

export default function InstitutionProfilePage() {
  const { language } = useLanguage();
  const { currentUser, userData, loading: authLoading, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [institutionData, setInstitutionData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const checkLocalData = () => {
      const localRole = localStorage.getItem('userRole');
      const localInstitutionData = localStorage.getItem('institutionData');
      const localCurrentUser = localStorage.getItem('currentUser');
      
      console.log("🔍 فحص البيانات المحلية:", {
        localRole,
        hasInstitutionData: !!localInstitutionData,
        hasCurrentUser: !!localCurrentUser
      });
      
      if (localRole && localRole !== 'institution') {
        console.error("❌ الدور المحلي ليس مؤسسة:", localRole);
        
        if (localRole === 'volunteer') {
          localStorage.removeItem('volunteerData');
          localStorage.removeItem('currentVolunteer');
        }
        
        if (localInstitutionData) {
          console.log("⚠️ تصحيح الدور إلى 'institution'");
          localStorage.setItem('userRole', 'institution');
        } else {
          navigate('/institution-login');
          return;
        }
      }
      
      if (localInstitutionData) {
        try {
          const parsedData = JSON.parse(localInstitutionData);
          setInstitutionData(parsedData);
          console.log("📁 بيانات المؤسسة من localStorage:", parsedData.uid);
        } catch (e) {
          console.error("❌ خطأ في تحليل بيانات المؤسسة المحلية:", e);
        }
      }
    };
    
    checkLocalData();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("👤 مؤسسة مسجلة دخول:", user.uid, user.email);
        
        const isUserInstitution = isInstitution();
        if (!isUserInstitution) {
          console.error("❌ هذا المستخدم ليس مؤسسة وفقًا للبيانات المحلية");
          
          try {
            const userRef = doc(db, "Users", user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const role = userData.role || "volunteer";
              
              if (role !== "institution") {
                console.error("❌ الدور من Firestore ليس مؤسسة:", role);
                await auth.signOut();
                clearAllAuthData();
                navigate("/institution-login");
                return;
              } else {
                console.log("✅ تصحيح البيانات المحلية لتكون مؤسسة");
                localStorage.setItem('userRole', 'institution');
                localStorage.setItem('currentUser', JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  role: 'institution'
                }));
              }
            }
          } catch (error) {
            console.error("❌ خطأ في التحقق من الدور:", error);
          }
        }
        
        if (userData && userData.role === "institution") {
          console.log("✅ استخدام بيانات من AuthContext");
          setInstitutionData(userData);
          setLoading(false);
          return;
        }
        
        try {
          const userRef = doc(db, "Users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const baseData = userSnap.data();
            
            try {
              const profileRef = doc(db, "Users", user.uid, "Organization_Profile", "info");
              const profileSnap = await getDoc(profileRef);
              
              let completeData = {
                uid: user.uid,
                email: user.email,
                role: "institution",
                ...baseData
              };
              
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                console.log("📊 بيانات بروفايل المؤسسة:", profileData);
                completeData = { ...completeData, ...profileData };
              }
              
              localStorage.setItem('institutionData', JSON.stringify(completeData));
              localStorage.setItem('userRole', 'institution');
              localStorage.setItem('currentInstitution', JSON.stringify(completeData));
              localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                role: 'institution'
              }));
              
              localStorage.removeItem('volunteerData');
              localStorage.removeItem('currentVolunteer');
              
              setInstitutionData(completeData);
              
              updateUserData(completeData);
              
            } catch (profileError) {
              console.error("❌ خطأ في جلب البروفايل الإضافي:", profileError);
              const basicData = {
                uid: user.uid,
                email: user.email,
                role: "institution",
                ...baseData
              };
              
              setInstitutionData(basicData);
              updateUserData(basicData);
            }
          } else {
            console.warn("⚠️ لم يتم العثور على بيانات المؤسسة في Firestore");
            const fallbackData = {
              uid: user.uid,
              email: user.email,
              role: "institution",
              orgNameAr: "مؤسسة افتراضية",
              orgNameEn: "Default Institution"
            };
            
            setInstitutionData(fallbackData);
            updateUserData(fallbackData);
          }
        } catch (error) {
          console.error("❌ خطأ في جلب بيانات Firestore:", error);
          const localData = localStorage.getItem('institutionData');
          if (localData) {
            try {
              const parsedData = JSON.parse(localData);
              setInstitutionData(parsedData);
            } catch (e) {
              console.error("❌ خطأ في تحليل البيانات المحلية:", e);
            }
          }
        }
      } else {
        console.log("🚶 لا يوجد مؤسسة مسجلة دخول");
        navigate("/institution-login");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate, userData, updateUserData]);

  const handleLogout = async () => {
    if (window.confirm(language === "en" ? "Are you sure you want to logout?" : "هل أنت متأكد أنك تريد تسجيل الخروج؟")) {
      await signOut(auth);
      clearAllAuthData();
      navigate('/institution-login');
    }
  };

  const institutionTypeOptions = {
    en: [
      { value: "Non-Governmental Organization (NGO)", label: "Non-Governmental Organization (NGO)" },
      { value: "Government Agency", label: "Government Agency" },
      { value: "Educational Institution", label: "Educational Institution" },
      { value: "Health Institution", label: "Health Institution" },
      { value: "Community Initiative", label: "Community Initiative" },
      { value: "Private Company", label: "Private Company" },
      { value: "International Organization", label: "International Organization" },
      { value: "Other", label: "Other" }
    ],
    ar: [
      { value: "Non-Governmental Organization (NGO)", label: "منظمة غير حكومية" },
      { value: "Government Agency", label: "جهة حكومية" },
      { value: "Educational Institution", label: "مؤسسة تعليمية" },
      { value: "Health Institution", label: "مؤسسة صحية" },
      { value: "Community Initiative", label: "مبادرة مجتمعية" },
      { value: "Private Company", label: "شركة خاصة" },
      { value: "International Organization", label: "منظمة دولية" },
      { value: "Other", label: "أخرى" }
    ]
  };

  const fieldsOfWorkOptions = {
    en: [
      "Education", "Health", "Environment", "Humanitarian Aid",
      "Community Development", "Women Empowerment", "Child Protection",
      "Disability Support", "Youth Development", "Emergency Response",
      "Capacity Building", "Research"
    ],
    ar: [
      "التعليم", "الصحة", "البيئة", "المساعدات الإنسانية",
      "تنمية المجتمع", "تمكين المرأة", "حماية الطفل",
      "دعم ذوي الإعاقة", "تنمية الشباب", "الاستجابة للطوارئ",
      "بناء القدرات", "البحث العلمي"
    ]
  };

  const getInstitutionNameDisplay = () => {
    if (!institutionData) return language === "en" ? "Institution" : "مؤسسة";
    if (language === "ar" && institutionData.orgNameAr) {
      return institutionData.orgNameAr;
    }
    return institutionData.orgNameEn || institutionData.orgNameAr || institutionData.displayName || institutionData.email || (language === "en" ? "Institution" : "مؤسسة");
  };

  const handleEditRequest = () => {
    setEditFormData({
      orgNameAr: institutionData?.orgNameAr || "",
      orgNameEn: institutionData?.orgNameEn || "",
      email: institutionData?.email || "",
      phone: institutionData?.phone || "",
      secondaryPhone: institutionData?.secondaryPhone || "",
      website: institutionData?.website || "",
      orgType: institutionData?.orgType || "",
      establishmentYear: institutionData?.establishmentYear || "",
      state: institutionData?.state || "",
      city: institutionData?.city || "",
      address: institutionData?.address || "",
      contactPersonName: institutionData?.contactPersonName || "",
      contactPersonPosition: institutionData?.contactPersonPosition || "",
      contactPersonPhone: institutionData?.contactPersonPhone || "",
      contactPersonEmail: institutionData?.contactPersonEmail || "",
      licenseNumber: institutionData?.licenseNumber || "",
      licenseIssueDate: institutionData?.licenseIssueDate || "",
      licenseExpiryDate: institutionData?.licenseExpiryDate || "",
      mission: institutionData?.mission || "",
      vision: institutionData?.vision || "",
      numberOfEmployees: institutionData?.numberOfEmployees || "",
      numberOfBeneficiaries: institutionData?.numberOfBeneficiaries || "",
      fieldsOfWork: institutionData?.fieldsOfWork || [],
      previousProjects: institutionData?.previousProjects || ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "ProfileEditRequests"), {
        requesterId: user.uid,
        requesterRole: "institution",
        requesterName: institutionData?.orgNameAr || institutionData?.orgNameEn || institutionData?.email || "Organization",
        currentData: institutionData || {},
        requestedData: editFormData,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "AdminNotifications"), {
        title: "New Organization Profile Edit Request",
        message: `Organization ${institutionData?.orgNameEn || institutionData?.orgNameAr || user.email} submitted an edit request.`,
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
      console.error("Error submitting organization edit request:", error);
      alert(language === "en" ? "Failed to submit edit request." : "فشل إرسال طلب التعديل.");
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const updatedFields = [...(editFormData.fieldsOfWork || [])];
      if (e.target.checked) {
        updatedFields.push(value);
      } else {
        const index = updatedFields.indexOf(value);
        if (index > -1) {
          updatedFields.splice(index, 1);
        }
      }
      setEditFormData(prev => ({
        ...prev,
        fieldsOfWork: updatedFields
      }));
    } else if (type === 'select-multiple') {
      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
      setEditFormData(prev => ({
        ...prev,
        [name]: selectedOptions
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading || authLoading) {
    return (
      <div className="loading-screen" style={{textAlign: 'center', padding: '50px'}}>
        <div style={{fontSize: '40px', marginBottom: '20px'}}>⏳</div>
        <p>{language === "en" ? "Loading Institution Profile..." : "جاري تحميل ملف المؤسسة..."}</p>
        <p style={{color: '#6b7280', fontSize: '14px', marginTop: '10px'}}>
          {language === "en" ? "Checking authentication and loading data..." : "جاري التحقق من المصادقة وجلب البيانات..."}
        </p>
      </div>
    );
  }

  if (!currentUser || !institutionData) {
    return (
      <div style={{padding: '50px', textAlign: 'center'}}>
        <h3>{language === "en" ? "Access Denied" : "الوصول مرفوض"}</h3>
        <p style={{marginBottom: '30px'}}>
          {language === "en" 
            ? "You need to log in as an institution to view this page." 
            : "يجب تسجيل الدخول كمؤسسة لعرض هذه الصفحة."
          }
        </p>
        <button 
          onClick={() => navigate("/institution-login")}
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
          {language === "en" ? "Go to Institution Login" : "الذهاب لتسجيل دخول المؤسسة"}
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
            maxWidth: '1000px',
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
            
            <div style={{marginBottom: '20px', backgroundColor: '#f5e9dc', padding: '15px', borderRadius: '8px'}}>
              <p style={{margin: 0, color: '#8b4513'}}>
                {language === "en" 
                  ? "Please fill in the fields you want to update. The changes will be reviewed by administrators."
                  : "يرجى ملء الحقول التي تريد تحديثها. سيتم مراجعة التغييرات من قبل المسؤولين."
                }
              </p>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Organization Name (Arabic)" : "اسم المؤسسة (عربي)"}
                </label>
                <input
                  type="text"
                  name="orgNameAr"
                  value={editFormData.orgNameAr}
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
                  {language === "en" ? "Organization Name (English)" : "اسم المؤسسة (إنجليزي)"}
                </label>
                <input
                  type="text"
                  name="orgNameEn"
                  value={editFormData.orgNameEn}
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
                  {language === "en" ? "Phone" : "الهاتف الرئيسي"}
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
                  {language === "en" ? "Secondary Phone" : "هاتف إضافي"}
                </label>
                <input
                  type="text"
                  name="secondaryPhone"
                  value={editFormData.secondaryPhone}
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
                  {language === "en" ? "Website" : "الموقع الإلكتروني"}
                </label>
                <input
                  type="text"
                  name="website"
                  value={editFormData.website}
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
                  {language === "en" ? "Organization Type" : "نوع المؤسسة"}
                </label>
                <select
                  name="orgType"
                  value={editFormData.orgType}
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
                  {institutionTypeOptions[language].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Established Year" : "سنة التأسيس"}
                </label>
                <input
                  type="text"
                  name="establishmentYear"
                  value={editFormData.establishmentYear}
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
                  {language === "en" ? "State/Region" : "الولاية/المنطقة"}
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
                  {language === "en" ? "City" : "المدينة"}
                </label>
                <input
                  type="text"
                  name="city"
                  value={editFormData.city}
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
                  {language === "en" ? "Address" : "العنوان"}
                </label>
                <textarea
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditChange}
                  rows="3"
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
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Contact Person Name" : "اسم الشخص المسؤول"}
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={editFormData.contactPersonName}
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
                  {language === "en" ? "Contact Person Position" : "منصب الشخص المسؤول"}
                </label>
                <input
                  type="text"
                  name="contactPersonPosition"
                  value={editFormData.contactPersonPosition}
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
                  {language === "en" ? "Contact Person Phone" : "هاتف الشخص المسؤول"}
                </label>
                <input
                  type="text"
                  name="contactPersonPhone"
                  value={editFormData.contactPersonPhone}
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
                  {language === "en" ? "Contact Person Email" : "بريد الشخص المسؤول"}
                </label>
                <input
                  type="email"
                  name="contactPersonEmail"
                  value={editFormData.contactPersonEmail}
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
                  {language === "en" ? "License Number" : "رقم الترخيص"}
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={editFormData.licenseNumber}
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
                  {language === "en" ? "License Issue Date" : "تاريخ الإصدار"}
                </label>
                <input
                  type="text"
                  name="licenseIssueDate"
                  value={editFormData.licenseIssueDate}
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
                  {language === "en" ? "License Expiry Date" : "تاريخ الانتهاء"}
                </label>
                <input
                  type="text"
                  name="licenseExpiryDate"
                  value={editFormData.licenseExpiryDate}
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
                  {language === "en" ? "Mission" : "الرسالة"}
                </label>
                <textarea
                  name="mission"
                  value={editFormData.mission}
                  onChange={handleEditChange}
                  rows="3"
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
              
              <div style={{gridColumn: 'span 2'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Vision" : "الرؤية"}
                </label>
                <textarea
                  name="vision"
                  value={editFormData.vision}
                  onChange={handleEditChange}
                  rows="3"
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
              
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Number of Employees" : "عدد الموظفين"}
                </label>
                <input
                  type="number"
                  name="numberOfEmployees"
                  value={editFormData.numberOfEmployees}
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
                  {language === "en" ? "Number of Beneficiaries" : "عدد المستفيدين"}
                </label>
                <input
                  type="number"
                  name="numberOfBeneficiaries"
                  value={editFormData.numberOfBeneficiaries}
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
                  {language === "en" ? "Fields of Work" : "مجالات العمل"}
                </label>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                  {fieldsOfWorkOptions[language].map((field, index) => (
                    <label key={index} style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <input
                        type="checkbox"
                        name="fieldsOfWork"
                        value={field}
                        checked={editFormData.fieldsOfWork?.includes(field) || false}
                        onChange={handleEditChange}
                      />
                      <span>{field}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div style={{gridColumn: 'span 2'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  {language === "en" ? "Previous Projects / Experience" : "المشاريع السابقة / الخبرات"}
                </label>
                <textarea
                  name="previousProjects"
                  value={editFormData.previousProjects}
                  onChange={handleEditChange}
                  rows="5"
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
            src="https://cdn01-ws.maan.gov.ae/media/dfmdq54t/community-cleanup2-min.jpg?v=1db86fd27e99930" 
            alt="Institution Profile"
          />
          <div className="profile-image-overlay">
            <div className="profile-badge">
              {language === "en" ? "INSTITUTION PROFILE" : "ملف المؤسسة"}
            </div>
            <h1>{getInstitutionNameDisplay()}</h1>
            <p>{language === "en" ? "View organization information and manage volunteering opportunities" : "عرض معلومات المؤسسة وإدارة فرص التطوع"}</p>
          </div>
        </div>
      </div>

      <main className="profile-main">
        <section className="profile-card">
          <div className="avatar-wrap">
            <img 
              // إضافة: عرض شعار المؤسسة المرفوع في التسجيل
              src={institutionData?.logo || "https://via.placeholder.com/150"} 
              alt="institution logo" 
              className="avatar"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
          </div>
          <h2>{getInstitutionNameDisplay()}</h2>
          <p className="email">{institutionData?.email}</p>
          <p className="member-since">
            {language === "en" ? "Established" : "تأسست في"} {institutionData?.establishmentYear || "N/A"}
          </p>

          <div className="stats">
            <div className="stat">
              <span>{language === "en" ? "Institution Type" : "نوع المؤسسة"}</span>
              <span>
                {institutionTypeOptions[language].find(opt => opt.value === institutionData?.orgType)?.label || institutionData?.orgType || "N/A"}
              </span>
            </div>
            <div className="stat">
              <span>{language === "en" ? "Location" : "الموقع"}</span>
              <span>{institutionData?.state || "N/A"}</span>
            </div>
            <div className="stat">
              <span>{language === "en" ? "Status" : "الحالة"}</span>
              <span style={{color: '#d4a574', fontWeight: '600'}}>
                {language === "en" ? "Verified" : "موثق"}
              </span>
            </div>
            <div className="stat">
              <span>{language === "en" ? "Contact Person" : "الشخص المسؤول"}</span>
              <span>{institutionData?.contactPersonName || "N/A"}</span>
            </div>
            <div className="stat">
              <span>{language === "en" ? "Phone" : "الهاتف"}</span>
              <span>{institutionData?.phone || "N/A"}</span>
            </div>
          </div>
        </section>

        <section className="profile-info-display" style={{flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
          <div className="info-group">
            <h3 style={{borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', marginBottom: '20px'}}>{language === "en" ? "Institution Information" : "معلومات المؤسسة"}</h3>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
              <p><strong>{language === "en" ? "Name (AR):" : "الاسم (عربي):"}</strong> {institutionData?.orgNameAr || "-"}</p>
              <p><strong>{language === "en" ? "Name (EN):" : "الاسم (إنجليزي):"}</strong> {institutionData?.orgNameEn || "-"}</p>
              <p><strong>{language === "en" ? "Email:" : "البريد:"}</strong> {institutionData?.email || "-"}</p>
              <p><strong>{language === "en" ? "Phone:" : "الهاتف الرئيسي:"}</strong> {institutionData?.phone || "-"}</p>
              <p><strong>{language === "en" ? "Secondary Phone:" : "هاتف إضافي:"}</strong> {institutionData?.secondaryPhone || "-"}</p>
              <p><strong>{language === "en" ? "Website:" : "الموقع الإلكتروني:"}</strong> {institutionData?.website || "-"}</p>
              <p><strong>{language === "en" ? "Type:" : "النوع:"}</strong> {institutionData?.orgType || "-"}</p>
              <p><strong>{language === "en" ? "Established Year:" : "سنة التأسيس:"}</strong> {institutionData?.establishmentYear || "-"}</p>
            </div>

            <h4 style={{marginBottom: '15px', color: '#d4a574'}}>{language === "en" ? "Location Information" : "معلومات الموقع"}</h4>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
              <p><strong>{language === "en" ? "State/Region:" : "الولاية/المنطقة:"}</strong> {institutionData?.state || "-"}</p>
              <p><strong>{language === "en" ? "City:" : "المدينة:"}</strong> {institutionData?.city || "-"}</p>
              <p style={{gridColumn: 'span 2'}}><strong>{language === "en" ? "Address:" : "العنوان:"}</strong> {institutionData?.address || "-"}</p>
            </div>

            <h4 style={{marginBottom: '15px', color: '#d4a574'}}>{language === "en" ? "Contact Person Information" : "معلومات الشخص المسؤول"}</h4>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
              <p><strong>{language === "en" ? "Name:" : "الاسم:"}</strong> {institutionData?.contactPersonName || "-"}</p>
              <p><strong>{language === "en" ? "Position:" : "المنصب:"}</strong> {institutionData?.contactPersonPosition || "-"}</p>
              <p><strong>{language === "en" ? "Phone:" : "الهاتف:"}</strong> {institutionData?.contactPersonPhone || "-"}</p>
              <p><strong>{language === "en" ? "Email:" : "البريد:"}</strong> {institutionData?.contactPersonEmail || "-"}</p>
            </div>

            <h4 style={{marginBottom: '15px', color: '#d4a574'}}>{language === "en" ? "Registration Details" : "تفاصيل التسجيل"}</h4>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
              <p><strong>{language === "en" ? "License Number:" : "رقم الترخيص:"}</strong> {institutionData?.licenseNumber || "-"}</p>
              <p><strong>{language === "en" ? "License Issue Date:" : "تاريخ الإصدار:"}</strong> {institutionData?.licenseIssueDate || "-"}</p>
              <p><strong>{language === "en" ? "License Expiry Date:" : "تاريخ الانتهاء:"}</strong> {institutionData?.licenseExpiryDate || "-"}</p>
            </div>

            <h4 style={{marginBottom: '15px', color: '#d4a574'}}>{language === "en" ? "Organization Details" : "تفاصيل المؤسسة"}</h4>
            <div style={{marginBottom: '20px'}}>
              <p><strong>{language === "en" ? "Mission:" : "الرسالة:"}</strong></p>
              <p style={{backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginTop: '5px'}}>
                {institutionData?.mission || (language === "en" ? "No mission statement provided" : "لا توجد رسالة محددة")}
              </p>
            </div>

            <div style={{marginBottom: '20px'}}>
              <p><strong>{language === "en" ? "Vision:" : "الرؤية:"}</strong></p>
              <p style={{backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginTop: '5px'}}>
                {institutionData?.vision || (language === "en" ? "No vision statement provided" : "لا توجد رؤية محددة")}
              </p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <p><strong>{language === "en" ? "Number of Employees:" : "عدد الموظفين:"}</strong> {institutionData?.numberOfEmployees || "0"}</p>
              <p><strong>{language === "en" ? "Number of Beneficiaries:" : "عدد المستفيدين:"}</strong> {institutionData?.numberOfBeneficiaries || "0"}</p>
            </div>

            <div style={{marginBottom: '30px'}}>
              <p><strong>{language === "en" ? "Fields of Work:" : "مجالات العمل:"}</strong></p>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px'}}>
                {institutionData?.fieldsOfWork?.map((field, index) => (
                  <span key={index} style={{
                    backgroundColor: '#f0e6d4',
                    color: '#8b4513',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {field}
                  </span>
                )) || <span style={{color: '#6b7280'}}>-</span>}
              </div>
            </div>

            <div style={{marginBottom: '30px'}}>
              <p><strong>{language === "en" ? "Previous Projects / Experience:" : "المشاريع السابقة / الخبرات:"}</strong></p>
              <p style={{backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginTop: '5px'}}>
                {institutionData?.previousProjects || (language === "en" ? "No previous projects listed" : "لا توجد مشاريع سابقة مسجلة")}
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
          <h3>{language === "en" ? "Organization Menu" : "قائمة المؤسسة"}</h3>
          <div className="menu-links">
            <button className="menu-btn active">
              {language === "en" ? "Profile Info" : "معلومات الملف"}
            </button>
            
            <button 
              className="menu-btn" 
              onClick={() => navigate("/opportunities-management")}
            >
              {language === "en" ? "Manage Opportunities" : "إدارة الفرص"}
            </button>
            
            <button className="menu-btn logout-btn" onClick={handleLogout}>
              {language === "en" ? "Logout" : "تسجيل الخروج"}
            </button>
          </div>
          
        </nav>
      </main>
    </div>
  );
}



