import { useNavigate, Link } from "react-router-dom";
import "./styles/RegisterPageBoth.css";
import React, { useState } from "react";
import { useLanguage } from "./context/LanguageContext";
import { registerUser } from "./auth/registerUser";
import { SUDAN_STATES } from "./constants/sudanStates";
import { registrationTerms, teamGuidelines } from "./constants/registrationContent";
import RegistrationInfoModal from "./components/RegistrationInfoModal";
import {
  FiActivity,
  FiAlertTriangle,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiDollarSign,
  FiFileText,
  FiHeart,
  FiHome,
  FiImage,
  FiMessageCircle,
  FiTool,
  FiUploadCloud,
  FiUsers,
  FiZap,
} from "react-icons/fi";

const TeamRegister = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const [formData, setFormData] = useState({
    teamNameAr: "",
    teamNameEn: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    teamType: "",
    state: "",
    leaderName: "",
    membersCount: "",
    activities: "",
    fieldsOfWork: [],
    termsAccepted: false,
    guidelinesAccepted: false,
    logo: null
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setRegistrationError("");
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setRegistrationError(language === "en" 
          ? "Please upload a valid image file (JPEG, JPG, PNG, GIF)" 
          : "يرجى رفع ملف صورة صالح (JPEG, JPG, PNG, GIF)"
        );
        return;
      }

      // التحقق من حجم الملف (150KB كحد أقصى)
      if (file.size > 150 * 1024) {
        setRegistrationError(language === "en" 
          ? "Logo size should be less than 150KB" 
          : "يجب أن يكون حجم الشعار أقل من 150 كيلوبايت"
        );
        return;
      }

      // عرض معاينة الصورة + حفظ Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Logo = reader.result;
        setLogoPreview(base64Logo);
        setFormData(prev => ({ ...prev, logo: base64Logo }));
      };
      reader.readAsDataURL(file);
      setRegistrationError("");
    }
  };

  const handleFieldsOfWorkChange = (field) => {
    setFormData(prev => {
      const currentFields = prev.fieldsOfWork || [];
      if (currentFields.includes(field)) {
        return { ...prev, fieldsOfWork: currentFields.filter(f => f !== field) };
      } else {
        return { ...prev, fieldsOfWork: [...currentFields, field] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من الشعار
    if (!formData.logo) {
      setRegistrationError(language === "en" 
        ? "Team logo is required" 
        : "شعار الفريق مطلوب"
      );
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setRegistrationError(language === "en" ? "Passwords do not match" : "كلمات المرور غير متطابقة");
      return;
    }
    
    if (formData.password.length < 8) {
      setRegistrationError(language === "en" ? "Password must be at least 8 characters" : "كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    
    if (!formData.termsAccepted) {
      setRegistrationError(language === "en" ? "Please accept terms" : "يرجى الموافقة على الشروط");
      return;
    }

    if (!formData.guidelinesAccepted) {
      setRegistrationError(language === "en" ? "Please acknowledge the platform guidelines" : "يرجى الإقرار بالاطلاع على إرشادات المنصة");
      return;
    }

    if (!formData.teamNameAr || !formData.teamNameEn) {
      setRegistrationError(language === "en" ? "Team name in both languages is required" : "اسم الفريق باللغتين العربية والإنجليزية مطلوب");
      return;
    }

    setLoading(true);
    setRegistrationError("");
    
    // تجهيز البيانات لتفادي حفظ كائن الملف في Firestore
    const teamData = {
      ...formData,
      stateEn: formData.state,
      stateAr: SUDAN_STATES.find((state) => state.en === formData.state)?.ar || "",
      fieldsOfWork: formData.fieldsOfWork || [],
      logo: formData.logo || null
    };
    
    const result = await registerUser(teamData, "team", { language });
    
    if (result.success) {
      // تنظيف النموذج
      setFormData({
        teamNameAr: "",
        teamNameEn: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        teamType: "",
        state: "",
        leaderName: "",
        membersCount: "",
        activities: "",
        fieldsOfWork: [],
        termsAccepted: false,
        guidelinesAccepted: false,
        logo: null
      });
      
      setSuccessMsg(
        result.message ||
          (language === "en"
            ? "Registration submitted successfully. Please verify your email and wait for admin approval before signing in."
            : "تم تقديم طلب التسجيل بنجاح. يرجى تأكيد بريدك الإلكتروني وانتظار موافقة الأدمن قبل تسجيل الدخول.")
      );
      
      // إخفاء رسالة النجاح بعد 5 ثوان والتوجيه لصفحة انتظار الموافقة
      setTimeout(() => {
        setSuccessMsg("");
        const encodedEmail = encodeURIComponent(teamData.email);
        navigate(`/pending-approval?role=team&email=${encodedEmail}`);
      }, 5000);
      
    } else {
      setRegistrationError(result.error);
    }
    
    setLoading(false);
  };

  const teamTypeOptions = [
    { en: "Youth Band", ar: "شباب باند", Icon: FiUsers },
    { en: "Youth Initiative", ar: "مبادرة شبابية", Icon: FiZap },
    { en: "Community Group", ar: "مجموعة مجتمعية", Icon: FiHome },
    { en: "Social Activity Team", ar: "فريق نشاط اجتماعي", Icon: FiMessageCircle },
    { en: "University Club", ar: "نادي جامعي", Icon: FiBookOpen },
    { en: "Sports Team", ar: "فريق رياضي", Icon: FiActivity },
    { en: "Artistic Group", ar: "مجموعة فنية", Icon: FiImage },
    { en: "Other", ar: "أخرى", Icon: FiBriefcase }
  ];

  const fieldsOfWorkOptions = [
    { en: "Education", ar: "التعليم", Icon: FiBookOpen },
    { en: "Health", ar: "الصحة", Icon: FiHeart },
    { en: "Environment", ar: "البيئة", Icon: FiActivity },
    { en: "Community Service", ar: "خدمة المجتمع", Icon: FiUsers },
    { en: "Youth Activities", ar: "أنشطة الشباب", Icon: FiZap },
    { en: "Sports", ar: "الرياضة", Icon: FiActivity },
    { en: "Art & Culture", ar: "الفن والثقافة", Icon: FiImage },
    { en: "Emergency Response", ar: "الاستجابة للطوارئ", Icon: FiAlertTriangle },
    { en: "Animal Care", ar: "رعاية الحيوانات", Icon: FiHeart },
    { en: "Fundraising", ar: "جمع التبرعات", Icon: FiDollarSign },
    { en: "Event Organization", ar: "تنظيم الفعاليات", Icon: FiCalendar },
    { en: "Social Media Campaigns", ar: "حملات وسائل التواصل", Icon: FiMessageCircle },
    { en: "Clean-up Campaigns", ar: "حملات النظافة", Icon: FiTool },
    { en: "Awareness Programs", ar: "برامج التوعية", Icon: FiFileText },
    { en: "Skill Development", ar: "تنمية المهارات", Icon: FiTool }
  ];
  const termsCopy = registrationTerms.team[language];
  const guidelinesCopy = teamGuidelines[language];

  return (
    <div className={`register-page team-register ${language === "ar" ? "rtl" : ""}`}>
      <div className="institution-header">
        <div className="header-background">
          <div className="header-content-wrapper">
            <h2>{language === "en" ? "Volunteer Team Registration" : "تسجيل فريق تطوعي"}</h2>
            <p>{language === "en" ? "Register your team and start making an impact together" : "سجل فريقك وابدأ بصنع التأثير معاً"}</p>
          </div>
        </div>
      </div>

      <form className="register-form institution-form" onSubmit={handleSubmit}>
        {registrationError && <div className="error-alert" style={{backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ef9a9a'}}>{registrationError}</div>}
        {successMsg && <div className="success-alert" style={{backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #a5d6a7'}}>{successMsg}</div>}
        
        <h3 style={{margin: '20px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Team Logo" : "شعار الفريق"}
        </h3>
        
        <div className="form-group" style={{marginBottom: '30px'}}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexDirection: language === 'ar' ? 'row-reverse' : 'row'
          }}>
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '12px',
              border: '2px dashed #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                    flex: '1 1 170px',
                    minWidth: '170px',
                    maxWidth: '210px',
              overflow: 'hidden',
              backgroundColor: '#fffaf5',
              position: 'relative'
            }}>
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  style={{width: '100%', height: '100%', objectFit: 'contain', padding: '10px'}}
                />
              ) : (
                <div style={{textAlign: 'center', color: '#6b7280', padding: '20px'}}>
                  <FiUsers size={40} style={{marginBottom: '10px', color: '#9b5f2d'}} />
                  <div style={{fontSize: '14px'}}>{language === "en" ? "No Logo" : "لا يوجد شعار"}</div>
                </div>
              )}
            </div>
            
            <div style={{flex: 1}}>
              <label style={{
                display: 'block',
                padding: '12px 20px',
                backgroundColor: '#9b5f2d',
                color: 'white',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s'
              }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoChange}
                  required
                  style={{display: 'none'}}
                />
                <FiUploadCloud style={{marginRight: language === "en" ? '8px' : 0, marginLeft: language === "ar" ? '8px' : 0}} />
                {language === "en" ? "Upload Team Logo" : "رفع شعار الفريق"}
              </label>
              <p style={{marginTop: '10px', color: '#6b7280', fontSize: '13px'}}>
                {language === "en" 
                  ? "Required. Max size: 150KB. Formats: JPG, PNG, GIF"
                  : "مطلوب. الحد الأقصى: 150 كيلوبايت. الصيغ: JPG, PNG, GIF"
                }
              </p>
            </div>
          </div>
        </div>
        
        <h3 style={{margin: '20px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Team Information" : "معلومات الفريق"}
        </h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{language === "en" ? "Team Name (Arabic)" : "اسم الفريق (بالعربية)"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="teamNameAr" 
              value={formData.teamNameAr} 
              onChange={handleChange} 
              required 
              className="form-input" 
              placeholder={language === "en" ? "Enter team name in Arabic" : "أدخل اسم الفريق بالعربية"}
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Team Name (English)" : "اسم الفريق (بالإنجليزية)"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="teamNameEn" 
              value={formData.teamNameEn} 
              onChange={handleChange} 
              required 
              className="form-input" 
              placeholder={language === "en" ? "Enter team name in English" : "أدخل اسم الفريق بالإنجليزية"}
            />
          </div>
          
          <div className="form-group" style={{gridColumn: '1 / -1'}}>
            <label>{language === "en" ? "Team Type" : "نوع الفريق"}</label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '5px',
              alignItems: 'stretch'
            }}>
              {teamTypeOptions.map((type, index) => {
                const Icon = type.Icon;
                return (
                <div 
                  key={index}
                  style={{
                    border: formData.teamType === type.en 
                      ? '2px solid #9b5f2d' 
                      : '1px solid #e3ccb3',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    backgroundColor: formData.teamType === type.en 
                      ? '#fff1e3' 
                      : '#fffaf5',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    minHeight: '88px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flex: '1 1 170px',
                    minWidth: '170px',
                    maxWidth: '210px'
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, teamType: type.en }))}
                >
                  <div style={{
                    fontSize: '20px',
                    marginBottom: '5px',
                    color: formData.teamType === type.en 
                      ? '#9b5f2d' 
                      : '#7a6150'
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: formData.teamType === type.en ? '600' : '500',
                    color: formData.teamType === type.en 
                      ? '#9b5f2d' 
                      : '#4b3a2f'
                  }}>
                    {type[language]}
                  </div>
                </div>
              )})}
            </div>
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "State" : "الولاية"}</label>
            <select
              name="state" 
              value={formData.state} 
              onChange={handleChange} 
              className="form-input" 
            >
              <option value="">{language === "en" ? "Select state" : "اختر الولاية"}</option>
              {SUDAN_STATES.map((state) => (
                <option key={state.en} value={state.en}>
                  {language === "en" ? state.en : state.ar}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Leader Name" : "اسم القائد"}</label>
            <input 
              type="text" 
              name="leaderName" 
              value={formData.leaderName} 
              onChange={handleChange} 
              className="form-input" 
              placeholder={language === "en" ? "Full name of team leader" : "الاسم الكامل لقائد الفريق"}
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Number of Members" : "عدد الأعضاء"}</label>
            <input 
              type="number" 
              name="membersCount" 
              value={formData.membersCount} 
              onChange={handleChange} 
              min="1"
              className="form-input" 
            />
          </div>
        </div>

        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Fields of Work" : "مجالات العمل"}
        </h3>
        
        <div className="form-group">
          <label style={{display: 'block', marginBottom: '15px', fontWeight: '600'}}>
            {language === "en" ? "Select your team's fields of work" : "اختر مجالات عمل فريقك"}
          </label>
          <div style={{
            display: 'flex',
              flexWrap: 'wrap',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {fieldsOfWorkOptions.map((field, index) => {
              const selected = formData.fieldsOfWork?.includes(field.en);
              const Icon = field.Icon;
              return (
              <div 
                key={index}
                style={{
                  border: selected
                    ? '2px solid #9b5f2d' 
                    : '1px solid #e3ccb3',
                  borderRadius: '12px',
                  padding: '15px',
                  cursor: 'pointer',
                  backgroundColor: selected ? '#fff1e3' : '#fffaf5',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => handleFieldsOfWorkChange(field.en)}
              >
                <div style={{
                  fontSize: '24px',
                  marginBottom: '8px',
                  color: selected ? '#9b5f2d' : '#7a6150'
                }}>
                  <Icon size={24} />
                </div>
                <div style={{
                  fontWeight: selected ? '600' : '500',
                  color: selected ? '#6f4427' : '#374151',
                  fontSize: '14px'
                }}>
                  {field[language]}
                </div>
                {selected && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#9b5f2d',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    <FiCheck size={13} />
                  </div>
                )}
              </div>
            )})}
          </div>
          <p style={{color: '#6b7280', fontSize: '13px', marginTop: '5px',
              alignItems: 'stretch'}}>
            {language === "en" 
              ? `Selected: ${formData.fieldsOfWork?.length || 0} fields`
              : `المحدد: ${formData.fieldsOfWork?.length || 0} مجالات`
            }
          </p>
        </div>

        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Contact Information" : "معلومات الاتصال"}
        </h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{language === "en" ? "Email" : "البريد الإلكتروني"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="form-input" 
              placeholder="team@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Phone" : "رقم الهاتف"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              required 
              className="form-input" 
              placeholder="+249 123 456 789"
            />
          </div>
        </div>

        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Team Activities" : "أنشطة الفريق"}
        </h3>
        
        <div className="form-group">
          <label>{language === "en" ? "Describe your team's activities" : "صف أنشطة فريقك"}</label>
          <textarea 
            name="activities" 
            value={formData.activities} 
            onChange={handleChange} 
            className="form-input" 
            rows="4"
            style={{minHeight: '100px', resize: 'vertical'}}
            placeholder={language === "en" ? "Describe your team's activities and focus areas..." : "صف أنشطة فريقك والمجالات التي تركز عليها..."}
          />
        </div>

        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Account Security" : "أمان الحساب"}
        </h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{language === "en" ? "Password" : "كلمة المرور"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="form-input" 
              minLength="8"
            />
            <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px',
              alignItems: 'stretch'}}>
              {language === "en" ? "At least 8 characters" : "8 أحرف على الأقل"}
            </small>
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Confirm Password" : "تأكيد كلمة المرور"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="password" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required 
              className="form-input" 
              minLength="8"
            />
          </div>
        </div>

        <div className="form-group checkbox-group compact-consent-card" style={{marginTop: '20px'}}>
          <label htmlFor="terms" className="consent-label">
            <input 
              type="checkbox" 
              name="termsAccepted" 
              checked={formData.termsAccepted} 
              onChange={handleChange} 
              id="terms" 
              required
            />
            <span>
              {language === "en" 
                ? "I agree to the terms and conditions and confirm that all information provided is accurate" 
                : "أوافق على الشروط والأحكام وأؤكد أن جميع المعلومات المقدمة دقيقة"
              }
            </span>
          </label>
          <button type="button" className="inline-info-btn" onClick={() => setActiveModal("terms")}>
            <FiFileText />
            {language === "en" ? "View terms" : "عرض الشروط"}
          </button>
        </div>

        <div className="form-group checkbox-group compact-consent-card" style={{marginTop: '14px'}}>
          <label htmlFor="guidelines" className="consent-label">
            <input
              type="checkbox"
              name="guidelinesAccepted"
              checked={formData.guidelinesAccepted}
              onChange={handleChange}
              id="guidelines"
              required
            />
            <span>
              {language === "en"
                ? "I confirm that I have reviewed the platform guidelines for volunteer teams"
                : "أقر بأنني اطلعت على إرشادات المنصة الخاصة بالفرق التطوعية"
              }
            </span>
          </label>
          <button type="button" className="inline-info-btn" onClick={() => setActiveModal("guidelines")}>
            <FiFileText />
            {language === "en" ? "View guidelines" : "عرض الإرشادات"}
          </button>
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading} 
          style={{
            marginTop: '25px', 
            width: '100%', 
            padding: '14px', 
            backgroundColor: '#9b5f2d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (
            <span>{language === "en" ? "Submitting..." : "جاري التقديم..."}</span>
          ) : (
            language === "en" ? "Register Team" : "تسجيل الفريق"
          )}
        </button>

        <p className="login-link" style={{textAlign: 'center', marginTop: '20px'}}>
          {language === "en" ? "Already have an account?" : "لديك حساب بالفعل؟"} 
          <Link to="/team-login" style={{color: '#9b5f2d', fontWeight: 'bold', marginRight: '5px'}}>
            {language === "en" ? "Login" : "تسجيل الدخول"}
          </Link>
        </p>
      </form>

      <RegistrationInfoModal
        open={activeModal === "terms"}
        title={termsCopy.title}
        intro={termsCopy.intro}
        items={termsCopy.items}
        closeLabel={language === "en" ? "Close" : "إغلاق"}
        onClose={() => setActiveModal(null)}
      />
      <RegistrationInfoModal
        open={activeModal === "guidelines"}
        title={guidelinesCopy.title}
        intro={guidelinesCopy.intro}
        items={guidelinesCopy.items}
        closeLabel={language === "en" ? "Close" : "إغلاق"}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};

export default TeamRegister;





