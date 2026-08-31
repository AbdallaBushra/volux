import { useNavigate, Link } from "react-router-dom";
import "./styles/RegisterPageBoth.css";
import React, { useState } from "react";
import { useLanguage } from "./context/LanguageContext";
import { registerUser } from "./auth/registerUser";
import { SUDAN_STATES } from "./constants/sudanStates";
import { organizationGuidelines, registrationTerms } from "./constants/registrationContent";
import RegistrationInfoModal from "./components/RegistrationInfoModal";
import {
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiCheck,
  FiFileText,
  FiGlobe,
  FiHeart,
  FiHome,
  FiSearch,
  FiShield,
  FiTool,
  FiTrendingUp,
  FiUploadCloud,
  FiUsers,
} from "react-icons/fi";

const getLocalDateInputValue = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split("T")[0];
};

const InstitutionRegister = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const [formData, setFormData] = useState({
    // اسم المؤسسة
    orgNameAr: "",
    orgNameEn: "",
    // معلومات الاتصال
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    secondaryPhone: "",
    // معلومات المؤسسة
    orgType: "",
    orgCategory: "",
    establishmentYear: "",
    licenseNumber: "",
    licenseIssueDate: "",
    licenseExpiryDate: "",
    // الموقع
    state: "",
    address: "",
    website: "",
    // معلومات التواصل
    contactPersonName: "",
    contactPersonPosition: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
    // المجالات
    fieldsOfWork: [],
    // معلومات إضافية
    mission: "",
    vision: "",
    numberOfEmployees: "",
    numberOfBeneficiaries: "",
    previousProjects: "",
    // الشروط
    termsAccepted: false,
    guidelinesAccepted: false,
    // ملفات
    logo: null
  });

  const getExpiredLicenseMessage = () =>
    language === "en"
      ? "Your organization license is expired. Please renew it before applying to the platform."
      : "\u062a\u0631\u062e\u064a\u0635 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0645\u0646\u062a\u0647\u064a. \u064a\u0631\u062c\u0649 \u062a\u062c\u062f\u064a\u062f \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0642\u0628\u0644 \u0627\u0644\u062a\u0642\u062f\u064a\u0645 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629.";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    const nextLicenseExpiryDate = name === "licenseExpiryDate" ? fieldValue : formData.licenseExpiryDate;
    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    if (isExpiredLicenseDate(nextLicenseExpiryDate)) {
      setRegistrationError(getExpiredLicenseMessage());
      return;
    }

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
      setRegistrationError(isExpiredLicenseDate(formData.licenseExpiryDate) ? getExpiredLicenseMessage() : "");
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

  function isExpiredLicenseDate(value) {
    if (!value) return false;
    const selectedDate = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Number.isNaN(selectedDate.getTime()) || selectedDate < today;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isExpiredLicenseDate(formData.licenseExpiryDate)) {
      setRegistrationError(getExpiredLicenseMessage());
      return;
    }
    
    // التحقق من الشعار
    if (!formData.logo) {
      setRegistrationError(language === "en" 
        ? "Organization logo is required" 
        : "شعار المؤسسة مطلوب"
      );
      return;
    }
    
    // التحقق من صحة البيانات
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
    
    if (!formData.orgNameAr || !formData.orgNameEn) {
      setRegistrationError(language === "en" ? "Organization name in both languages is required" : "اسم المؤسسة باللغتين العربية والإنجليزية مطلوب");
      return;
    }

    setLoading(true);
    setRegistrationError("");
    
    // تحضير البيانات للإرسال
    const institutionData = {
      ...formData,
      stateEn: formData.state,
      stateAr: SUDAN_STATES.find((state) => state.en === formData.state)?.ar || "",
      fieldsOfWork: formData.fieldsOfWork || [],
      logo: formData.logo || null
    };
    
    const result = await registerUser(institutionData, "institution", { language });
    
    if (result.success) {
      // تنظيف النموذج
      setFormData({
        orgNameAr: "",
        orgNameEn: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        secondaryPhone: "",
        orgType: "",
        orgCategory: "",
        establishmentYear: "",
        licenseNumber: "",
        licenseIssueDate: "",
        licenseExpiryDate: "",
        state: "",
        address: "",
        website: "",
        contactPersonName: "",
        contactPersonPosition: "",
        contactPersonPhone: "",
        contactPersonEmail: "",
        fieldsOfWork: [],
        mission: "",
        vision: "",
        numberOfEmployees: "",
        numberOfBeneficiaries: "",
        previousProjects: "",
        termsAccepted: false,
        guidelinesAccepted: false,
        logo: null
      });
      
      // عرض رسالة النجاح المناسبة
      setSuccessMsg(
        result.message ||
          (language === "en"
            ? "Registration submitted successfully. Please verify your email and wait for admin approval before signing in."
            : "تم تقديم طلب التسجيل بنجاح. يرجى تأكيد بريدك الإلكتروني وانتظار موافقة الأدمن قبل تسجيل الدخول.")
      );
      
      // إخفاء رسالة النجاح بعد 5 ثوان والتوجيه لصفحة انتظار الموافقة
      setTimeout(() => {
        setSuccessMsg("");
        const encodedEmail = encodeURIComponent(institutionData.email);
        navigate(`/pending-approval?role=institution&email=${encodedEmail}`);
      }, 5000);
      
    } else {
      setRegistrationError(result.error);
    }
    
    setLoading(false);
  };

  const orgTypeOptions = [
    { en: "Non-Governmental Organization (NGO)", ar: "منظمة غير حكومية" },
    { en: "Government Agency", ar: "جهة حكومية" },
    { en: "Educational Institution", ar: "مؤسسة تعليمية" },
    { en: "Health Institution", ar: "مؤسسة صحية" },
    { en: "Community Initiative", ar: "مبادرة مجتمعية" },
    { en: "Private Company", ar: "شركة خاصة" },
    { en: "International Organization", ar: "منظمة دولية" },
    { en: "Other", ar: "أخرى" }
  ];

  const fieldsOfWorkOptions = [
    { en: "Education", ar: "التعليم", Icon: FiBookOpen },
    { en: "Health", ar: "الصحة", Icon: FiHeart },
    { en: "Environment", ar: "البيئة", Icon: FiActivity },
    { en: "Humanitarian Aid", ar: "المساعدات الإنسانية", Icon: FiShield },
    { en: "Community Development", ar: "تنمية المجتمع", Icon: FiHome },
    { en: "Women Empowerment", ar: "تمكين المرأة", Icon: FiUsers },
    { en: "Child Protection", ar: "حماية الطفل", Icon: FiShield },
    { en: "Disability Support", ar: "دعم ذوي الإعاقة", Icon: FiHeart },
    { en: "Youth Development", ar: "تنمية الشباب", Icon: FiUsers },
    { en: "Emergency Response", ar: "الاستجابة للطوارئ", Icon: FiAlertTriangle },
    { en: "Capacity Building", ar: "بناء القدرات", Icon: FiTrendingUp },
    { en: "Research", ar: "البحث العلمي", Icon: FiSearch },
    { en: "Human Rights", ar: "حقوق الإنسان", Icon: FiAward },
    { en: "Cultural Activities", ar: "الأنشطة الثقافية", Icon: FiGlobe },
    { en: "Sports & Recreation", ar: "الرياضة والترفيه", Icon: FiActivity }
  ];
  const termsCopy = registrationTerms.organization[language];
  const guidelinesCopy = organizationGuidelines[language];
  const minLicenseExpiryDate = getLocalDateInputValue();

  return (
    <div className={`register-page institution-register ${language === "ar" ? "rtl" : ""}`}>
      <div className="institution-header">
        <div className="header-background">
          <div className="header-content-wrapper">
            <h2>{language === "en" ? "Institution Registration" : "تسجيل مؤسسة"}</h2>
            <p>{language === "en" ? "Register your organization and start connecting with volunteers" : "سجل مؤسستك وابدأ بالتواصل مع المتطوعين"}</p>
          </div>
        </div>
      </div>

      <form className="register-form institution-form" onSubmit={handleSubmit}>
        {registrationError && <div className="error-alert" style={{backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ef9a9a'}}>{registrationError}</div>}
        {successMsg && <div className="success-alert" style={{backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #a5d6a7'}}>{successMsg}</div>}
        
        <h3 style={{margin: '20px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Organization Logo" : "شعار المؤسسة"}
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
              overflow: 'hidden',
              backgroundColor: '#f9fafb',
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
                  <FiBriefcase size={40} style={{marginBottom: '10px', color: '#9b5f2d'}} />
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
                borderRadius: '8px',
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
                {language === "en" ? "Upload Organization Logo" : "رفع شعار المؤسسة"}
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
          {language === "en" ? "Organization Information" : "معلومات المؤسسة"}
        </h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{language === "en" ? "Organization Name (Arabic)" : "اسم المؤسسة (بالعربية)"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="orgNameAr" 
              value={formData.orgNameAr} 
              onChange={handleChange} 
              required 
              className="form-input" 
              placeholder={language === "en" ? "Enter organization name in Arabic" : "أدخل اسم المؤسسة بالعربية"}
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Organization Name (English)" : "اسم المؤسسة (بالإنجليزية)"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="orgNameEn" 
              value={formData.orgNameEn} 
              onChange={handleChange} 
              required 
              className="form-input" 
              placeholder={language === "en" ? "Enter organization name in English" : "أدخل اسم المؤسسة بالإنجليزية"}
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Organization Type" : "نوع المؤسسة"} <span style={{color: 'red'}}>*</span></label>
            <select name="orgType" value={formData.orgType} onChange={handleChange} required className="form-input">
              <option value="">{language === "en" ? "Select Type" : "اختر النوع"}</option>
              {orgTypeOptions.map((type, index) => (
                <option key={index} value={type.en}>{type[language]}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Establishment Year" : "سنة التأسيس"}</label>
            <input 
              type="number" 
              name="establishmentYear" 
              value={formData.establishmentYear} 
              onChange={handleChange} 
              className="form-input" 
              min="1900" 
              max={new Date().getFullYear()}
              placeholder="YYYY"
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "License Number" : "رقم الترخيص"}</label>
            <input 
              type="text" 
              name="licenseNumber" 
              value={formData.licenseNumber} 
              onChange={handleChange} 
              className="form-input" 
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "License Issue Date" : "تاريخ إصدار الترخيص"}</label>
            <input 
              type="date" 
              name="licenseIssueDate" 
              value={formData.licenseIssueDate} 
              onChange={handleChange} 
              className="form-input" 
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "License Expiry Date" : "تاريخ انتهاء الترخيص"}</label>
            <input 
              type="date" 
              name="licenseExpiryDate" 
              value={formData.licenseExpiryDate} 
              onChange={handleChange} 
              min={minLicenseExpiryDate}
              className="form-input" 
            />
          </div>
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
              placeholder="institution@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Phone" : "رقم الهاتف الرئيسي"} <span style={{color: 'red'}}>*</span></label>
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
          
          <div className="form-group">
            <label>{language === "en" ? "Secondary Phone" : "رقم هاتف إضافي"}</label>
            <input 
              type="tel" 
              name="secondaryPhone" 
              value={formData.secondaryPhone} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="+249 987 654 321"
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Website" : "الموقع الإلكتروني"}</label>
            <input 
              type="url" 
              name="website" 
              value={formData.website} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="https://www.example.org"
            />
          </div>
        </div>

        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Location Information" : "معلومات الموقع"}
        </h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{language === "en" ? "State / Region" : "الولاية / المنطقة"} <span style={{color: 'red'}}>*</span></label>
            <select
              name="state" 
              value={formData.state} 
              onChange={handleChange} 
              required 
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
          
          <div className="form-group" style={{gridColumn: 'span 2'}}>
            <label>{language === "en" ? "Address" : "العنوان التفصيلي"}</label>
            <input 
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              className="form-input" 
              placeholder={language === "en" ? "Full organization address" : "عنوان المؤسسة الكامل"}
            />
          </div>
        </div>

        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Contact Person Information" : "معلومات الشخص المسؤول"}
        </h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{language === "en" ? "Contact Person Name" : "اسم الشخص المسؤول"} <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="contactPersonName" 
              value={formData.contactPersonName} 
              onChange={handleChange} 
              required 
              className="form-input" 
              placeholder={language === "en" ? "Full name of contact person" : "الاسم الكامل للشخص المسؤول"}
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Contact Person Position" : "منصب الشخص المسؤول"}</label>
            <input 
              type="text" 
              name="contactPersonPosition" 
              value={formData.contactPersonPosition} 
              onChange={handleChange} 
              className="form-input" 
              placeholder={language === "en" ? "e.g., Director, Coordinator" : "مثل: مدير، منسق"}
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Contact Person Phone" : "هاتف الشخص المسؤول"}</label>
            <input 
              type="tel" 
              name="contactPersonPhone" 
              value={formData.contactPersonPhone} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="+249 111 222 333"
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Contact Person Email" : "بريد الشخص المسؤول"}</label>
            <input 
              type="email" 
              name="contactPersonEmail" 
              value={formData.contactPersonEmail} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="contact@example.org"
            />
          </div>
        </div>

        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Fields of Work" : "مجالات العمل"}
        </h3>
        
        <div className="form-group">
          <label style={{display: 'block', marginBottom: '15px', fontWeight: '600'}}>
            {language === "en" ? "Select your organization's fields of work" : "اختر مجالات عمل مؤسستك"}
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
                    : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '15px',
                  cursor: 'pointer',
                  backgroundColor: selected ? '#fff3e4' : '#fffaf5',
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
          <p style={{color: '#6b7280', fontSize: '13px', marginTop: '5px'}}>
            {language === "en" 
              ? `Selected: ${formData.fieldsOfWork?.length || 0} fields`
              : `المحدد: ${formData.fieldsOfWork?.length || 0} مجالات`
            }
          </p>
        </div>
        
        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Organization Details" : "تفاصيل المؤسسة"}
        </h3>
        
        <div className="form-row" style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
          <div className="form-group" style={{flex: 1}}>
            <label>{language === "en" ? "Mission" : "الرسالة"}</label>
            <textarea 
              name="mission" 
              value={formData.mission} 
              onChange={handleChange} 
              className="form-input" 
              rows="3"
              style={{minHeight: '80px', resize: 'vertical'}}
              placeholder={language === "en" ? "Organization's mission..." : "رسالة المؤسسة..."}
            />
          </div>
          
          <div className="form-group" style={{flex: 1}}>
            <label>{language === "en" ? "Vision" : "الرؤية"}</label>
            <textarea 
              name="vision" 
              value={formData.vision} 
              onChange={handleChange} 
              className="form-input" 
              rows="3"
              style={{minHeight: '80px', resize: 'vertical'}}
              placeholder={language === "en" ? "Organization's vision..." : "رؤية المؤسسة..."}
            />
          </div>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{language === "en" ? "Number of Employees" : "عدد الموظفين"}</label>
            <input 
              type="number" 
              name="numberOfEmployees" 
              value={formData.numberOfEmployees} 
              onChange={handleChange} 
              className="form-input" 
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Number of Beneficiaries" : "عدد المستفيدين"}</label>
            <input 
              type="number" 
              name="numberOfBeneficiaries" 
              value={formData.numberOfBeneficiaries} 
              onChange={handleChange} 
              className="form-input" 
              min="0"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>{language === "en" ? "Previous Projects / Experience" : "المشاريع السابقة / الخبرات"}</label>
          <textarea 
            name="previousProjects" 
            value={formData.previousProjects} 
            onChange={handleChange} 
            className="form-input" 
            rows="4"
            style={{minHeight: '100px', resize: 'vertical'}}
            placeholder={language === "en" ? "Describe previous projects and experience..." : "صف المشاريع السابقة والخبرات..."}
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
            <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px'}}>
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
                ? "I confirm that I have reviewed the platform guidelines for organizations"
                : "أقر بأنني اطلعت على إرشادات المنصة الخاصة بالمنظمات"
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
            borderRadius: '8px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (
            <span>{language === "en" ? "Submitting..." : "جاري التقديم..."}</span>
          ) : (
            language === "en" ? "Register Institution" : "تسجيل المؤسسة"
          )}
        </button>

        <p className="login-link" style={{textAlign: 'center', marginTop: '20px'}}>
          {language === "en" ? "Already have an account?" : "لديك حساب بالفعل؟"} 
          <Link to="/institution-login" style={{color: '#9b5f2d', fontWeight: 'bold', marginRight: '5px'}}>
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

export default InstitutionRegister;
