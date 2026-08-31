import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import { auth, db } from "./firebase/firebase";
import { getUserData, updateUserData } from "./database/userData";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { FiAward, FiClock, FiStar } from "react-icons/fi";
import "./styles/ProfilePage.css";

export default function ProfilePage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [badges, setBadges] = useState([]);

  const badgeImageMap = {
    "first opportunity": "first opportunity.jpg",
    "active volunteer": "Active volunter.jpg",
    "level silver": "level silver.jpg",
    "level gold": "level gold.jpg",
    "opportunity finisher": "oppoutunity Finisher.jpg",
    "impact maker": "Impact maker.jpg",
    "elite member": "elite.jpg",
    "community helper": "community Helper.jpg",
    "consistency star": "consistency star.jpg",
  };

  const resolveBadgeImage = (badge) => {
    const rawName =
      badge?.name_en ||
      badge?.badgeName ||
      badge?.name ||
      badge?.name_ar ||
      "";
    const key = String(rawName).trim().toLowerCase();
    const file = badgeImageMap[key];
    if (!file) return "";
    return `/badges/badge/${encodeURIComponent(file)}`;
  };

  const resolveBadgeLabel = (badge) => {
    if (language === "en") {
      return badge?.name_en || badge?.badgeName || badge?.name || "";
    }
    return badge?.name_ar || badge?.badgeName || badge?.name || "";
  };

  const resolveLevelImage = (levelName) => {
    const key = String(levelName || "").trim().toLowerCase();
    const map = {
      bronze: "Bronze.jpg",
      silver: "silver.jpg",
      gold: "gold.jpg",
      platinum: "platinum.jpg",
    };
    const file = map[key];
    if (!file) return "";
    return `/levels/levels/${encodeURIComponent(file)}`;
  };

  const [user, setUser] = useState({
    fullName: "",
    email: "",
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
    profileImage: "",
    bio: "",
    skills: [],
    interests: [],
    
    memberSince: "",
    lastLogin: "",
    volunteeringHours: 0,
    trainingHours: 0,
    opportunitiesJoined: 0,
    trainingCourses: 0,
    level: "Beginner",
    points: 0,
    
    currentStatus: "",
    languages: [],
    experience: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      const result = await getUserData(currentUser.uid);
      if (result.success) {
        const data = result.data;
        
        const badgesRef = collection(db, "Rewards", currentUser.uid, "Badges");
        const badgesSnap = await getDocs(badgesRef);
        const badgesList = [];
        badgesSnap.forEach(doc => badgesList.push({ id: doc.id, ...doc.data() }));
        setBadges(badgesList);

        const userData = {
          ...user,
          fullName: data.basicInfo?.fullName || data.fullName || "",
          email: currentUser.email,
          phone: data.basicInfo?.phone || data.phone || "",
          gender: data.basicInfo?.gender || data.gender || "",
          dateOfBirth: data.basicInfo?.dateOfBirth || data.dateOfBirth || "",
          nationality: data.location?.nationality || data.nationality || "Sudanese",
          state: data.location?.state || data.state || "",
          city: data.location?.city || data.city || "",
          address: data.location?.address || data.address || "",
          disability: data.preferences?.disability || data.disability || false,
          disabilityType: data.preferences?.disabilityType || data.disabilityType || "",
          heardAboutUs: data.preferences?.heardAboutUs || data.heardAboutUs || "",
          
          // إضافة: عرض الصورة الشخصية إذا كانت موجودة في البيانات
          profileImage: data.basicInfo?.profileImage || data.profileImage || 
                       data.profileImageUrl || data.avatar || "https://via.placeholder.com/150",
          
          bio: data.basicInfo?.bio || data.bio || "",
          skills: data.skills || [],
          interests: data.interests || [],
          
          memberSince: data.createdAt
            ? (data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString() : new Date((data.createdAt.seconds || 0) * 1000).toLocaleDateString())
            : new Date().toLocaleDateString(),
          lastLogin: data.lastLogin
            ? (data.lastLogin.toDate ? data.lastLogin.toDate().toLocaleString() : new Date((data.lastLogin.seconds || 0) * 1000).toLocaleString())
            : "Now",
          volunteeringHours: data.stats?.volunteeringHours || data.volunteeringHours || data.hours || 0,
          trainingHours: data.stats?.trainingHours || data.trainingHours || 0,
          opportunitiesJoined: data.stats?.opportunitiesJoined || data.opportunitiesJoined || 0,
          trainingCourses: data.stats?.trainingCourses || data.trainingCourses || 0,
          level: data.stats?.level || data.level || "Beginner",
          points: data.stats?.points || data.points || 0,
          
          currentStatus: data.currentStatus || "",
          languages: data.languages || [],
          experience: data.experience || "",
        };
        setUser(userData);
        
        await checkAndAwardBadges(currentUser.uid, userData, badgesList);
      } else {
        setUser(prev => ({
          ...prev,
          email: currentUser.email,
          memberSince: new Date().toLocaleDateString(),
          lastLogin: "Now"
        }));
      }
      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  const checkAndAwardBadges = async (uid, data, currentBadges) => {
    const points = data.points || 0;
    const hours = data.volunteeringHours || 0;
    const newBadges = [];

    const badgeDefinitions = [
      { id: 'newcomer', name_en: 'Newcomer', name_ar: 'مبتدئ', condition: points >= 50, icon: '🌱' },
      { id: 'active_vol', name_en: 'Active Volunteer', name_ar: 'متطوع نشط', condition: hours >= 10, icon: '🔥' },
      { id: 'expert', name_en: 'Expert', name_ar: 'خبير', condition: points >= 500, icon: '🏆' }
    ];

    for (const badge of badgeDefinitions) {
      if (badge.condition && !currentBadges.find(b => b.id === badge.id)) {
        const badgeData = {
          id: badge.id,
          name_en: badge.name_en,
          name_ar: badge.name_ar,
          icon: badge.icon,
          awardedAt: serverTimestamp()
        };
        await setDoc(doc(db, "Rewards", uid, "Badges", badge.id), badgeData);
        newBadges.push(badgeData);
        
        const notifRef = doc(collection(db, "Notifications", uid, "in_App"));
        await setDoc(notifRef, {
          userId: uid,
          title_ar: "وسام جديد!",
          title_en: "New Badge Earned!",
          message_ar: `لقد حصلت على وسام جديد: ${badge.name_ar}`,
          message_en: `You earned a new badge: ${badge.name_en}`,
          type: "badge",
          read: false,
          createdAt: serverTimestamp()
        });
        
        alert(language === "en" ? `Congratulations! You earned the ${badge.name_en} badge!` : `تهانينا! لقد حصلت على وسام ${badge.name_ar}!`);
      }
    }
    
    if (newBadges.length > 0) {
      setBadges([...currentBadges, ...newBadges]);
    }
  };

  const getLevelInfo = (points) => {
    if (points >= 1200) return { name: "Platinum", color: "#e5e7eb", next: null };
    if (points >= 600) return { name: "Gold", color: "#fbbf24", next: 1200 };
    if (points >= 200) return { name: "Silver", color: "#94a3b8", next: 600 };
    return { name: "Bronze", color: "#b45309", next: 200 };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSkillsChange = (e) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setUser(prev => ({ ...prev, skills: skillsArray }));
  };

  const handleInterestsChange = (interest) => {
    setUser(prev => {
      const currentInterests = prev.interests || [];
      if (currentInterests.includes(interest)) {
        return { ...prev, interests: currentInterests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...currentInterests, interest] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const currentUser = auth.currentUser;
    if (currentUser) {
      const updatedData = {
        basicInfo: {
          fullName: user.fullName,
          phone: user.phone,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          profileImage: user.profileImage,
          bio: user.bio
        },
        location: {
          nationality: user.nationality,
          state: user.state,
          city: user.city,
          address: user.address
        },
        preferences: {
          disability: user.disability,
          disabilityType: user.disabilityType,
          heardAboutUs: user.heardAboutUs
        },
        skills: user.skills,
        interests: user.interests,
        stats: {
          volunteeringHours: user.volunteeringHours,
          trainingHours: user.trainingHours,
          opportunitiesJoined: user.opportunitiesJoined,
          trainingCourses: user.trainingCourses,
          level: user.level,
          points: user.points
        },
        currentStatus: user.currentStatus,
        languages: user.languages,
        experience: user.experience,
        updatedAt: new Date().toISOString()
      };
      
      const result = await updateUserData(currentUser.uid, updatedData);
      if (result.success) {
        alert(language === "en" ? "Changes saved successfully!" : "تم حفظ التغييرات بنجاح!");
      } else {
        alert(result.error);
      }
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    if (window.confirm(language === "en" ? "Are you sure you want to logout?" : "هل أنت متأكد أنك تريد تسجيل الخروج؟")) {
      await signOut(auth);
      navigate('/login');
    }
  };

  const interestsOptions = [
    { en: "Education", ar: "التعليم" },
    { en: "Health", ar: "الصحة" },
    { en: "Environment", ar: "البيئة" },
    { en: "Technology", ar: "التكنولوجيا" },
    { en: "Art", ar: "الفن" },
    { en: "Sports", ar: "الرياضة" },
    { en: "Community Service", ar: "خدمة المجتمع" },
    { en: "Children", ar: "الأطفال" },
    { en: "Elderly", ar: "كبار السن" }
  ];

  if (loading) return <div className="loading-screen">{language === "en" ? "Loading Profile..." : "جاري تحميل الملف الشخصي..."}</div>;

  const nameParts = user.fullName.split(' ');
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(' ') || "";
  return (
    <div className="profile-page" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
      <main className="profile-container">
        <section className="profile-overview">
          <div className="overview-row">
            <div className="overview-stat">
              <div className="stat-icon"><FiStar aria-hidden="true" /></div>
              <div className="stat-content">
                <div className="stat-value">{user.points}</div>
                <div className="stat-label">{language === "en" ? "Total Points" : "إجمالي النقاط"}</div>
              </div>
            </div>
            
            <div className="overview-stat">
              <div className="stat-icon stat-icon-level">
                {resolveLevelImage(getLevelInfo(user.points).name) ? (
                  <img
                    src={resolveLevelImage(getLevelInfo(user.points).name)}
                    alt={getLevelInfo(user.points).name}
                    loading="lazy"
                  />
                ) : (
                  <FiAward aria-hidden="true" />
                )}
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: getLevelInfo(user.points).color }}>
                  {getLevelInfo(user.points).name}
                </div>
                <div className="stat-label">{language === "en" ? "Current Level" : "المستوى الحالي"}</div>
                {getLevelInfo(user.points).next && (
                  <div className="stat-progress">
                    {language === "en"
                      ? `${getLevelInfo(user.points).next - user.points} to next`
                      : `${getLevelInfo(user.points).next - user.points} للنقطة التالية`}
                  </div>
                )}
              </div>
            </div>
            
            <div className="overview-stat">
              <div className="stat-icon"><FiClock aria-hidden="true" /></div>
              <div className="stat-content">
                <div className="stat-value">{user.volunteeringHours}</div>
                <div className="stat-label">{language === "en" ? "Volunteer Hours" : "ساعات التطوع"}</div>
              </div>
            </div>
            
            <div className="overview-stat">
              <div className="stat-icon"><FiAward aria-hidden="true" /></div>
              <div className="stat-content">
                <div className="stat-value">{badges.length}</div>
                <div className="stat-label">{language === "en" ? "Badges" : "الأوسمة"}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-grid">
          <nav className="side-menu">
            <div className="side-menu-head">
              <h3>{language === "en" ? "My Account" : "حسابي"}</h3>
              <p className="side-menu-sub">
                {language === "en" ? "Manage your profile and activity" : "إدارة ملفك ونشاطك"}
              </p>
            </div>

            <div className="menu-links">
              <button className="menu-btn active">
                {language === "en" ? "Personal Info" : "المعلومات الشخصية"}
              </button>

              <button className="menu-btn" onClick={() => navigate("/profile/participation")}>
                {language === "en" ? "Participation" : "المشاركات"}
              </button>

              

              

              <button className="menu-btn logout-btn" onClick={handleLogout}>
                {language === "en" ? "Logout" : "تسجيل الخروج"}
              </button>
            </div>

            <p className="deactivate-note">
              {language === "en" ? "Deactivate your account anytime" : "يمكنك تعطيل حسابك في أي وقت"}
            </p>
          </nav>

          <section className="profile-form-section">
            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-header">
                <h3>{language === "en" ? "Personal Information" : "المعلومات الشخصية"}</h3>
                <p>{language === "en" ? "Keep your data up to date." : "حدّث بياناتك لتبقى دقيقة."}</p>
              </div>

            <div className="form-row">
              <label>
                {language === "en" ? "Full Name" : "الاسم الكامل"}
                <input 
                  name="fullName" 
                  value={user.fullName} 
                  onChange={handleChange} 
                  placeholder={language === "en" ? "Enter your full name" : "أدخل اسمك الكامل"}
                />
              </label>

              <label>
                {language === "en" ? "Email" : "البريد الإلكتروني"}
                <input 
                  name="email" 
                  value={user.email} 
                  readOnly 
                  className="read-only"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                {language === "en" ? "Phone" : "رقم الهاتف"}
                <input 
                  name="phone" 
                  value={user.phone} 
                  onChange={handleChange} 
                  placeholder="+249 123 456 789"
                />
              </label>

              <label>
                {language === "en" ? "Gender" : "الجنس"}
                <select name="gender" value={user.gender} onChange={handleChange}>
                  <option value="">{language === "en" ? "Select" : "اختر"}</option>
                  <option value="male">{language === "en" ? "Male" : "ذكر"}</option>
                  <option value="female">{language === "en" ? "Female" : "أنثى"}</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                {language === "en" ? "Date of Birth" : "تاريخ الميلاد"}
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  value={user.dateOfBirth} 
                  onChange={handleChange} 
                />
              </label>

              <label>
                {language === "en" ? "Nationality" : "الجنسية"}
                <input 
                  name="nationality" 
                  value={user.nationality} 
                  onChange={handleChange} 
                  placeholder={language === "en" ? "e.g., Sudanese" : "مثل: سوداني"}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                {language === "en" ? "State / Region" : "الولاية / المنطقة"}
                <input 
                  name="state" 
                  value={user.state} 
                  onChange={handleChange} 
                  placeholder={language === "en" ? "e.g., Khartoum" : "مثل: الخرطوم"}
                />
              </label>

              <label>
                {language === "en" ? "City" : "المدينة"}
                <input 
                  name="city" 
                  value={user.city} 
                  onChange={handleChange} 
                  placeholder={language === "en" ? "e.g., Khartoum" : "مثل: الخرطوم"}
                />
              </label>
            </div>

            <label>
              {language === "en" ? "Address" : "العنوان"}
              <input 
                name="address" 
                value={user.address} 
                onChange={handleChange} 
                placeholder={language === "en" ? "Your full address" : "عنوانك الكامل"}
              />
            </label>

            <label>
              {language === "en" ? "Biography" : "نبذة شخصية"}
              <textarea 
                name="bio" 
                value={user.bio} 
                onChange={handleChange} 
                rows="3"
                placeholder={language === "en" ? "Tell us about yourself..." : "اخبرنا عن نفسك..."}
              />
            </label>

            <div className="form-row">
              <label>
                {language === "en" ? "Skills" : "المهارات"}
                <input 
                  name="skills" 
                  value={Array.isArray(user.skills) ? user.skills.join(', ') : user.skills} 
                  onChange={handleSkillsChange}
                  placeholder={language === "en" ? "e.g., Teaching, First Aid, Programming" : "مثال: تدريس، إسعافات أولية، برمجة"}
                />
              </label>

              <label>
                {language === "en" ? "How did you hear about us?" : "كيف سمعت عنا؟"}
                <select name="heardAboutUs" value={user.heardAboutUs} onChange={handleChange}>
                  <option value="">{language === "en" ? "Select an option" : "اختر خيارًا"}</option>
                  <option value="facebook">{language === "en" ? "Facebook" : "فيسبوك"}</option>
                  <option value="friend">{language === "en" ? "Friend" : "صديق"}</option>
                  <option value="university">{language === "en" ? "University" : "الجامعة"}</option>
                  <option value="social-media">{language === "en" ? "Social Media" : "وسائل التواصل"}</option>
                  <option value="other">{language === "en" ? "Other" : "أخرى"}</option>
                </select>
              </label>
            </div>

            <div className="form-group">
              <label>{language === "en" ? "Interests" : "الاهتمامات"}</label>
              <div className="interests-grid">
                {interestsOptions.map((interest, index) => (
                  <label key={index} className="interest-item">
                    <input
                      type="checkbox"
                      checked={user.interests?.includes(interest[language]) || false}
                      onChange={() => handleInterestsChange(interest[language])}
                    />
                    <span>{interest[language]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="disability-card">
              <label className="checkbox-row disability-toggle">
                <input 
                  type="checkbox" 
                  name="disability" 
                  checked={user.disability} 
                  onChange={handleChange} 
                />
                <span>
                  <strong>{language === "en" ? "Person with Disabilities" : "شخص ذو إعاقة"}</strong>
                  <small>
                    {language === "en"
                      ? "Enable this to add any accessibility needs."
                      : "فعّل هذا الخيار لإضافة احتياجات الوصول الخاصة بك."}
                  </small>
                </span>
              </label>

              {user.disability && (
                <label className="disability-type-field">
                  {language === "en" ? "Type of disability" : "نوع الإعاقة"}
                  <input 
                    name="disabilityType" 
                    value={user.disabilityType} 
                    onChange={handleChange} 
                    placeholder={language === "en" ? "Please specify..." : "يرجى التحديد..."}
                  />
                </label>
              )}
            </div>

            <div className="form-row">
              <label>
                {language === "en" ? "Current Status" : "الحالة الحالية"}
                <input 
                  name="currentStatus" 
                  value={user.currentStatus} 
                  onChange={handleChange} 
                  placeholder={language === "en" ? "e.g., Student, Employee" : "مثال: طالب، موظف"}
                />
              </label>

              <label>
                {language === "en" ? "Languages" : "اللغات"}
                <input
                  name="languages"
                  value={Array.isArray(user.languages) ? user.languages.join(", ") : ""}
                  onChange={(e) => setUser((prev) => ({ ...prev, languages: e.target.value.split(",").map(s => s.trim()) }))}
                  placeholder={language === "en" ? "e.g., Arabic, English" : "مثال: العربية، الإنجليزية"}
                />
              </label>
            </div>

            <div className="form-row single-field">
              <label>
                {language === "en" ? "Experience" : "الخبرة"}
                <textarea 
                  name="experience" 
                  value={user.experience} 
                  onChange={handleChange} 
                  rows="2"
                  placeholder={language === "en" ? "Your previous experience..." : "خبراتك السابقة..."}
                />
              </label>
            </div>

            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? (language === "en" ? "Saving..." : "جاري الحفظ...") : (language === "en" ? "Save Changes" : "حفظ التغييرات")}
            </button>
          </form>
        </section>

          <aside className="profile-card">
            <div className="avatar-wrap">
              <img
                // إضافة: عرض الصورة الشخصية المرفوعة في التسجيل
                src={user.profileImage || "https://via.placeholder.com/150"}
                alt="avatar"
                className="avatar"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150";
                }}
              />
              <div className="level-badge">{language === "en" ? "Level" : "المستوى"} {getLevelInfo(user.points).name}</div>
            </div>

            <h2>{user.fullName || user.email}</h2>
            <p className="email">{user.email}</p>

            <div className="profile-badges">
              <span className="badge volunteer-badge">{language === "en" ? "Volunteer" : "متطوع"}</span>
              <span className="badge points-badge">
                {user.points} {language === "en" ? "points" : "نقطة"}
              </span>
            </div>

            <p className="member-since">
              {language === "en" ? "Member since" : "عضو منذ"} {user.memberSince}
            </p>

            <div className="stats">
              <div className="stat">
                <span>{language === "en" ? "Last Login" : "آخر تسجيل دخول"}</span>
                <span>{user.lastLogin}</span>
              </div>
              <div className="stat">
                <span>{language === "en" ? "Volunteering Hours" : "ساعات التطوع"}</span>
                <span>{user.volunteeringHours} {language === "en" ? "hrs" : "ساعة"}</span>
              </div>
              <div className="stat">
                <span>{language === "en" ? "Training Hours" : "ساعات التدريب"}</span>
                <span>{user.trainingHours} {language === "en" ? "hrs" : "ساعة"}</span>
              </div>
              <div className="stat">
                <span>{language === "en" ? "Opportunities" : "الفرص"}</span>
                <span>{user.opportunitiesJoined}</span>
              </div>
              <div className="stat">
                <span>{language === "en" ? "Courses" : "الدورات"}</span>
                <span>{user.trainingCourses}</span>
              </div>
              <div className="stat">
                <span>{language === "en" ? "Phone" : "الهاتف"}</span>
                <span>{user.phone || "-"}</span>
              </div>
            </div>

            <div className="profile-badges-panel">
              <div className="panel-title">{language === "en" ? "My Badges" : "أوسمتي"}</div>
              <div className="badges-grid">
                {badges.length > 0 ? (
                  badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="badge-item"
                      title={resolveBadgeLabel(badge)}
                    >
                      <div className="badge-icon">
                        {resolveBadgeImage(badge) ? (
                          <img
                            src={resolveBadgeImage(badge)}
                            alt={resolveBadgeLabel(badge)}
                            loading="lazy"
                          />
                        ) : (
                          <span>{badge.icon || "🏅"}</span>
                        )}
                      </div>
                      <div className="badge-name">{resolveBadgeLabel(badge)}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-note">{language === "en" ? "No badges yet." : "لا توجد أوسمة بعد."}</div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
