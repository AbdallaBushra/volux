import { useNavigate, Link } from "react-router-dom";
import "./styles/RegisterPageBoth.css";
import React, { useState } from "react";
import { useLanguage } from "./context/LanguageContext";
import { registerUser } from "./auth/registerUser";
import { SUDAN_STATES } from "./constants/sudanStates";
import { registrationTerms, volunteerGuidelines } from "./constants/registrationContent";
import RegistrationInfoModal from "./components/RegistrationInfoModal";
import {
  FiActivity,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCpu,
  FiDollarSign,
  FiGlobe,
  FiHeart,
  FiImage,
  FiSearch,
  FiShield,
  FiTool,
  FiUploadCloud,
  FiUser,
  FiUsers,
} from "react-icons/fi";

const VolunteerRegister = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    nationality: "Sudanese",
    state: "",
    city: "",
    address: "",
    disability: false,
    disabilityType: "",
    heardAboutUs: "",
    profileImage: null,
    termsAccepted: false,
    guidelinesAccepted: false,
    bio: "",
    skills: "",
    interests: []
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setRegistrationError("");
  };

  const handleImageChange = (e) => {
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
          ? "Image size should be less than 150KB" 
          : "يجب أن يكون حجم الصورة أقل من 150 كيلوبايت"
        );
        return;
      }

      // عرض معاينة الصورة + حفظ Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setProfileImagePreview(base64Image);
        setFormData(prev => ({ ...prev, profileImage: base64Image }));
      };
      reader.readAsDataURL(file);
      setRegistrationError("");
    }
  };

  const handleInterestsChange = (interest) => {
    setFormData(prev => {
      const currentInterests = prev.interests || [];
      if (currentInterests.includes(interest)) {
        return { ...prev, interests: currentInterests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...currentInterests, interest] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من الصورة الشخصية
    if (!formData.profileImage) {
      setRegistrationError(language === "en" 
        ? "Profile image is required" 
        : "الصورة الشخصية مطلوبة"
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
      setRegistrationError(language === "en" ? "Please acknowledge the volunteer guidelines" : "يرجى الإقرار بالاطلاع على إرشادات المتطوعين");
      return;
    }

    if (!formData.dateOfBirth) {
      setRegistrationError(language === "en" ? "Date of birth is required" : "تاريخ الميلاد مطلوب");
      return;
    }

    setLoading(true);
    
    // تحضير البيانات للإرسال
    const userData = {
      ...formData,
      stateEn: formData.state,
      stateAr: SUDAN_STATES.find((state) => state.en === formData.state)?.ar || "",
      interests: formData.interests || [],
      profileImage: formData.profileImage || null
    };
    
    const result = await registerUser(userData, "volunteer", { language });
    
    if (result.success) {
      setSuccessMsg(
        result.message ||
          (language === "en"
            ? "Registration successful. Please check your email before signing in."
            : "تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول.")
      );
      setTimeout(() => {
        const encodedEmail = encodeURIComponent(formData.email);
        navigate(`/email-verification?role=volunteer&email=${encodedEmail}`);
      }, 2500);
    } else {
      setRegistrationError(result.error);
    }
    
    setLoading(false);
  };

  const interestsOptions = [
    { en: "Education", ar: "التعليم", Icon: FiBookOpen },
    { en: "Health", ar: "الصحة", Icon: FiHeart },
    { en: "Environment", ar: "البيئة", Icon: FiActivity },
    { en: "Technology", ar: "التكنولوجيا", Icon: FiCpu },
    { en: "Art", ar: "الفن", Icon: FiImage },
    { en: "Sports", ar: "الرياضة", Icon: FiActivity },
    { en: "Community Service", ar: "خدمة المجتمع", Icon: FiUsers },
    { en: "Children", ar: "الأطفال", Icon: FiShield },
    { en: "Elderly", ar: "كبار السن", Icon: FiUser },
    { en: "Animal Care", ar: "رعاية الحيوانات", Icon: FiHeart },
    { en: "Disaster Relief", ar: "الإغاثة في الكوارث", Icon: FiTool },
    { en: "Fundraising", ar: "جمع التبرعات", Icon: FiDollarSign },
    { en: "Event Planning", ar: "تخطيط الفعاليات", Icon: FiCalendar },
    { en: "Translation", ar: "الترجمة", Icon: FiGlobe },
    { en: "Research", ar: "البحث", Icon: FiSearch }
  ];
  const termsCopy = registrationTerms.volunteer[language];
  const guidelinesCopy = volunteerGuidelines[language];

  return (
    <div className={`register-page volunteer-register ${language === "ar" ? "rtl" : ""}`}>
      <div className="institution-header">
        <div className="header-background">
          <div className="header-content-wrapper">
            <h2>{language === "en" ? "Volunteer Registration" : "تسجيل متطوع"}</h2>
            <p>{language === "en" ? "Join Volux and start making an impact" : "انضم إلى فولُكس وابدأ صنع التأثير"}</p>
          </div>
        </div>
      </div>

      <form className="register-form institution-form" onSubmit={handleSubmit}>
        {registrationError && <div className="error-alert" style={{backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ef9a9a'}}>{registrationError}</div>}
        {successMsg && <div className="success-alert" style={{backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #a5d6a7'}}>{successMsg}</div>}
        
        <h3 style={{margin: '20px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Profile Image" : "الصورة الشخصية"}
        </h3>
        
        <div className="form-group" style={{marginBottom: '30px'}}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexDirection: language === 'ar' ? 'row-reverse' : 'row'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '2px dashed #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#f9fafb',
              position: 'relative'
            }}>
              {profileImagePreview ? (
                <img 
                  src={profileImagePreview} 
                  alt="Preview" 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              ) : (
                <div style={{textAlign: 'center', color: '#6b7280'}}>
                  <FiUser size={30} style={{marginBottom: '5px', color: '#9b5f2d'}} />
                  <div style={{fontSize: '12px'}}>{language === "en" ? "No Image" : "لا توجد صورة"}</div>
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
                  onChange={handleImageChange}
                  required
                  style={{display: 'none'}}
                />
                <FiUploadCloud style={{marginRight: language === "en" ? '8px' : 0, marginLeft: language === "ar" ? '8px' : 0}} />
                {language === "en" ? "Upload Profile Image" : "رفع صورة شخصية"}
              </label>
              <p style={{marginTop: '10px', color: '#6b7280', fontSize: '13px'}}>
                {language === "en" 
                  ? "Required. Max size: 150KB. Formats: JPG, PNG, GIF"
                  : "مطلوبة. الحد الأقصى: 150 كيلوبايت. الصيغ: JPG, PNG, GIF"
                }
              </p>
            </div>
          </div>
        </div>

        <h3 style={{margin: '20px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Personal Information" : "المعلومات الشخصية"}
        </h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{language === "en" ? "Full Name" : "الاسم الكامل"} <span style={{color: 'red'}}>*</span></label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="form-input" />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Email" : "البريد الإلكتروني"} <span style={{color: 'red'}}>*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Password" : "كلمة المرور"} <span style={{color: 'red'}}>*</span></label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="form-input" />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Confirm Password" : "تأكيد كلمة المرور"} <span style={{color: 'red'}}>*</span></label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="form-input" />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Phone" : "رقم الهاتف"} <span style={{color: 'red'}}>*</span></label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="form-input" placeholder="+249 123 456 789" />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Gender" : "الجنس"} <span style={{color: 'red'}}>*</span></label>
            <select name="gender" value={formData.gender} onChange={handleChange} required className="form-input">
              <option value="">{language === "en" ? "Select" : "اختر"}</option>
              <option value="male">{language === "en" ? "Male" : "ذكر"}</option>
              <option value="female">{language === "en" ? "Female" : "أنثى"}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Date of Birth" : "تاريخ الميلاد"} <span style={{color: 'red'}}>*</span></label>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="form-input" />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "Nationality" : "الجنسية"}</label>
            <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="form-input" />
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "State / Region" : "الولاية / المنطقة"}</label>
            <select name="state" value={formData.state} onChange={handleChange} className="form-input">
              <option value="">{language === "en" ? "Select state" : "اختر الولاية"}</option>
              {SUDAN_STATES.map((state) => (
                <option key={state.en} value={state.en}>
                  {language === "en" ? state.en : state.ar}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>{language === "en" ? "City" : "المدينة"}</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className="form-input" />
          </div>
          
          <div className="form-group" style={{gridColumn: 'span 2'}}>
            <label>{language === "en" ? "Address" : "العنوان"}</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input" />
          </div>
        </div>

        <h3 style={{margin: '25px 0 15px', color: '#333', fontSize: '18px'}}>
          {language === "en" ? "Additional Information" : "معلومات إضافية"}
        </h3>
        
        <div className="form-group">
          <label>{language === "en" ? "Biography (Optional)" : "نبذة شخصية (اختياري)"}</label>
          <textarea 
            name="bio" 
            value={formData.bio} 
            onChange={handleChange} 
            className="form-input" 
            rows="3"
            style={{minHeight: '80px', resize: 'vertical'}}
            placeholder={language === "en" ? "Tell us about yourself..." : "اخبرنا عن نفسك..."}
          />
        </div>
        
        <div className="form-group">
          <label>{language === "en" ? "Skills (Optional)" : "المهارات (اختياري)"}</label>
          <input 
            type="text" 
            name="skills" 
            value={formData.skills} 
            onChange={handleChange} 
            className="form-input"
            placeholder={language === "en" ? "e.g., Teaching, First Aid, Programming" : "مثال: تدريس، إسعافات أولية، برمجة"}
          />
        </div>
        
        <div className="form-group">
          <label style={{display: 'block', marginBottom: '15px', fontWeight: '600'}}>
            {language === "en" ? "Interests (Select at least 3)" : "الاهتمامات (اختر 3 على الأقل)"}
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {interestsOptions.map((interest, index) => {
              const selected = formData.interests?.includes(interest[language]);
              const Icon = interest.Icon;
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
                onClick={() => handleInterestsChange(interest[language])}
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
                  {interest[language]}
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
              ? `Selected: ${formData.interests?.length || 0} interests`
              : `المحدد: ${formData.interests?.length || 0} اهتمامات`
            }
          </p>
        </div>
        
        <div className="form-group">
          <label style={{display: 'block', marginBottom: '10px'}}>
            {language === "en" ? "How did you hear about us?" : "كيف سمعت عنا؟"}
          </label>
          <select name="heardAboutUs" value={formData.heardAboutUs} onChange={handleChange} className="form-input">
            <option value="">{language === "en" ? "Select an option" : "اختر خيارًا"}</option>
            <option value="facebook">{language === "en" ? "Facebook" : "فيسبوك"}</option>
            <option value="friend">{language === "en" ? "Friend" : "صديق"}</option>
            <option value="university">{language === "en" ? "University" : "الجامعة"}</option>
            <option value="social-media">{language === "en" ? "Social Media" : "وسائل التواصل"}</option>
            <option value="other">{language === "en" ? "Other" : "أخرى"}</option>
          </select>
        </div>
        
        <div className="form-group checkbox-group compact-consent-card" style={{marginTop: '15px'}}>
          <label className="consent-label">
            <input
              type="checkbox"
              name="disability"
              checked={formData.disability}
              onChange={handleChange}
            />
            <span>{language === "en" ? "I have a disability" : "لدي إعاقة"}</span>
          </label>
          
          {formData.disability && (
            <div style={{marginTop: '10px', marginLeft: '30px'}}>
              <label>{language === "en" ? "Type of disability" : "نوع الإعاقة"}</label>
              <input
                type="text"
                name="disabilityType"
                value={formData.disabilityType}
                onChange={handleChange}
                className="form-input"
                placeholder={language === "en" ? "Please specify..." : "يرجى التحديد..."}
              />
            </div>
          )}
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
                ? "I agree to the terms and conditions" 
                : "أوافق على الشروط والأحكام"
              }
            </span>
          </label>
          <button type="button" className="inline-info-btn" onClick={() => setActiveModal("terms")}>
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
                ? "I confirm that I have reviewed the volunteer guidelines"
                : "أقر بأنني اطلعت على إرشادات المتطوعين"
              }
            </span>
          </label>
          <button type="button" className="inline-info-btn" onClick={() => setActiveModal("guidelines")}>
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
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {loading ? "..." : (language === "en" ? "Register Now" : "سجل الآن")}
        </button>

        <p className="login-link" style={{textAlign: 'center', marginTop: '20px'}}>
          {language === "en" ? "Already have an account?" : "لديك حساب بالفعل؟"} 
          <Link to="/login" style={{color: '#9b5f2d', fontWeight: 'bold', marginRight: '5px'}}>
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

export default VolunteerRegister;
