import React, { useState, useEffect } from "react";
import "./styles/OpportunitiesPage.css";
import { useLanguage } from "./context/LanguageContext";
import { getOpportunities, joinOpportunity } from "./database/opportunityData";
import { auth, db } from "./firebase/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { SUDAN_STATES, getStateByAnyName, normalizeStateText } from "./constants/sudanStates";

const fallbackOpportunities = [
  {
    id: "fallback-1",
    title_ar: "فرصة دعم تعليمي",
    title_en: "Educational Support Opportunity",
    org: "Volux",
    location_ar: "الخرطوم",
    location_en: "Khartoum",
    duration: "3 months",
    type: "field",
    category: "education",
    urgency: "high",
    volunteers: 5,
    skills: ["Teaching", "Communication"],
    points: 120,
    description_ar: "نبحث عن متطوعين لدعم الأنشطة التعليمية.",
    description_en: "We are looking for volunteers to support educational activities.",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
  },
];

const categoryAliases = {
  education: ["education", "educational", "تعليم", "التعليم"],
  health: ["health", "medical", "صحة", "الصحة", "طبي"],
  rebuilding: ["rebuilding", "rebuild", "construction", "إعادة إعمار", "اعادة اعمار", "إعمار", "اعمار"],
  community: ["community", "social", "مجتمع", "مجتمعي"],
  environmental: ["environment", "environmental", "بيئة", "بيئي"],
  emergency: ["emergency", "relief", "طوارئ", "إغاثة", "اغاثة"],
  general: ["general", "عام", "other", "أخرى", "اخرى"],
};

const urgencyOrder = { high: 3, medium: 2, low: 1 };

const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s-]/gu, "");

const toArrayText = (...values) => values.filter(Boolean).map((v) => String(v));

const detectCategoryKey = (rawValue) => {
  const value = normalizeText(rawValue);
  for (const [key, aliases] of Object.entries(categoryAliases)) {
    if (aliases.some((a) => normalizeText(a) === value)) return key;
  }
  return "general";
};

const OpportunitiesPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: "all",
    type: "all",
    category: "all",
    urgency: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [applying, setApplying] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [applicationError, setApplicationError] = useState("");

  const t = {
    en: {
      header: "Volunteering Opportunities in Sudan",
      sub: "Browse active volunteering opportunities across Sudan. Filter to find the best match for your interests.",
      searchPlaceholder: "Search opportunities or organizations...",
      filters: "Apply Filters",
      reset: "Reset",
      available: "Available Opportunities",
      applicants: "Applicants:",
      sort: "Sort by:",
      newest: "Newest",
      mostPoints: "Most Points",
      urgency: "Urgency",
      location: "Location:",
      state: "State:",
      duration: "Duration:",
      category: "Category:",
      volunteers: "Volunteers Needed:",
      skills: "Required Skills:",
      applyNow: "Apply Now",
      noResults: "No results found",
      tryAdjust: "Try adjusting filters or search terms",
      showAll: "Show All",
      opportunityDetails: "Opportunity Details",
      description: "Description:",
      requirements: "Requirements:",
      benefits: "Benefits:",
      startDate: "Start Date:",
      endDate: "End Date:",
      contactEmail: "Contact Email:",
      contactPhone: "Contact Phone:",
      contactInfo: "Contact Information",
      close: "Close",
      applyForOpportunity: "Apply for this Opportunity",
      loading: "Loading opportunities...",
      loginRequired: "Please login to apply",
      applySuccess: "Application submitted successfully!",
      teamOrgApplyDenied: "Applications are not allowed for teams and organizations.",
      alreadyApplied: "You have already applied for this opportunity.",
      points: "Points",
      allLocations: "All States",
      allTypes: "All Types",
      field: "Field",
      virtualType: "Virtual",
      allCategories: "All Categories",
      education: "Education",
      health: "Health",
      rebuilding: "Rebuilding",
      community: "Community",
      environmental: "Environmental",
      emergency: "Emergency",
      general: "General",
      allUrgency: "All Urgency",
      high: "High",
      medium: "Medium",
      low: "Low",
      notSpecified: "Not specified",
    },
    ar: {
      header: "فرص التطوع في السودان",
      sub: "تصفح فرص التطوع المتاحة في السودان، واستخدم الفلاتر لاختيار الفرصة الأنسب لك.",
      searchPlaceholder: "ابحث عن فرصة أو منظمة...",
      filters: "تطبيق الفلاتر",
      reset: "إعادة التعيين",
      available: "الفرص المتاحة",
      applicants: "المتقدمون:",
      sort: "الترتيب حسب:",
      newest: "الأحدث",
      mostPoints: "الأعلى نقاطًا",
      urgency: "درجة الحاجة",
      location: "الموقع:",
      state: "الولاية:",
      duration: "المدة:",
      category: "الفئة:",
      volunteers: "عدد المتطوعين المطلوب:",
      skills: "المهارات المطلوبة:",
      applyNow: "تقديم",
      noResults: "لا توجد نتائج",
      tryAdjust: "جرّب تغيير الفلاتر أو البحث",
      showAll: "عرض الكل",
      opportunityDetails: "تفاصيل الفرصة",
      description: "الوصف:",
      requirements: "المتطلبات:",
      benefits: "المزايا:",
      startDate: "تاريخ البدء:",
      endDate: "تاريخ الانتهاء:",
      contactEmail: "البريد الإلكتروني:",
      contactPhone: "رقم الهاتف:",
      contactInfo: "معلومات التواصل",
      close: "إغلاق",
      applyForOpportunity: "التقديم على هذه الفرصة",
      loading: "جاري تحميل الفرص...",
      loginRequired: "\u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0644\u062a\u0642\u062f\u064a\u0645",
      applySuccess: "\u062a\u0645 \u062a\u0642\u062f\u064a\u0645 \u0637\u0644\u0628\u0643 \u0628\u0646\u062c\u0627\u062d!",
      teamOrgApplyDenied: "\u0627\u0644\u062a\u0642\u062f\u064a\u0645 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d \u0644\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0646\u0638\u0645\u0627\u062a.",
      alreadyApplied: "\u0644\u0642\u062f \u0642\u0645\u062a \u0628\u0627\u0644\u062a\u0642\u062f\u064a\u0645 \u0639\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0641\u0631\u0635\u0629 \u0645\u0633\u0628\u0642\u064b\u0627.",
      points: "\u0627\u0644\u0646\u0642\u0627\u0637",
      allLocations: "كل الولايات",
      allTypes: "كل الأنواع",
      field: "ميداني",
      virtualType: "افتراضي",
      allCategories: "كل الفئات",
      education: "تعليم",
      health: "صحة",
      rebuilding: "إعادة إعمار",
      community: "مجتمعي",
      environmental: "بيئي",
      emergency: "طوارئ",
      general: "عام",
      allUrgency: "كل الدرجات",
      high: "عاجل",
      medium: "متوسط",
      low: "منخفض",
      notSpecified: "غير محدد",
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getOpportunities();
        const data = result.success && result.data.length > 0 ? result.data : fallbackOpportunities;
        setAllOpportunities(data);
        setFilteredOpportunities(data);
      } catch (error) {
        console.error("Error fetching opportunities:", error);
        setAllOpportunities(fallbackOpportunities);
        setFilteredOpportunities(fallbackOpportunities);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters, allOpportunities, sortBy, language]);

  const getOrgName = (op) =>
    op?.organizationName ||
    op?.organization_name ||
    op?.orgName ||
    op?.org ||
    op?.institutionName ||
    op?.teamName ||
    op?.createdByName ||
    "Unknown Organization";

  const getOpportunityTitle = (op) =>
    language === "ar"
      ? op?.title_ar || op?.title || op?.title_en || "بدون عنوان"
      : op?.title_en || op?.title || op?.title_ar || "No Title";

  const getDescription = (op) =>
    language === "ar"
      ? op?.description_ar || op?.description || op?.description_en || t[language].notSpecified
      : op?.description_en || op?.description || op?.description_ar || t[language].notSpecified;

  const getLocationLabel = (op) =>
    language === "ar"
      ? op?.location_ar || op?.location || op?.location_en || t[language].notSpecified
      : op?.location_en || op?.location || op?.location_ar || t[language].notSpecified;

  const getStateLabel = (op) =>
    language === "ar"
      ? op?.state_ar || op?.state || op?.state_en || t[language].notSpecified
      : op?.state_en || op?.state || op?.state_ar || t[language].notSpecified;

  const getCategoryKey = (op) => detectCategoryKey(op?.category || op?.category_ar || op?.category_en);

  const getCategoryLabel = (op) => {
    const rawCategory = op?.category || op?.category_ar || op?.category_en || "";
    const categoryKey = getCategoryKey(op);

    if (categoryKey === "general" && rawCategory) {
      const isKnownGeneral = categoryAliases.general.some(
        (alias) => normalizeText(alias) === normalizeText(rawCategory)
      );
      if (!isKnownGeneral) return rawCategory;
    }

    return t[language][categoryKey] || rawCategory || t[language].general;
  };

  const getTypeKey = (op) => {
    const raw = normalizeText(op?.opportunityMode || op?.type || "field");
    return raw.includes("virtual") || raw.includes("افتراضي") || raw.includes("عن بعد") ? "virtual" : "field";
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const matchesLocationFilter = (op, target) => {
    if (target === "all") return true;
    const selectedState = getStateByAnyName(target);
    if (!selectedState) return true;

    const values = toArrayText(
      op?.state,
      op?.state_ar,
      op?.state_en,
      op?.location,
      op?.location_ar,
      op?.location_en
    );

    return values.some((value) => {
      const matchedState = getStateByAnyName(value);
      if (matchedState) return matchedState.en === selectedState.en;
      return normalizeStateText(value) === normalizeStateText(selectedState.en);
    });
  };

  const applyFilters = () => {
    let filtered = [...allOpportunities];

    const q = normalizeText(searchTerm);
    if (q) {
      filtered = filtered.filter((op) => {
        const haystack = toArrayText(
          op?.title,
          op?.title_ar,
          op?.title_en,
          op?.description,
          op?.description_ar,
          op?.description_en,
          getOrgName(op),
          getCategoryLabel(op),
          op?.category
        )
          .map(normalizeText)
          .join(" ");
        return haystack.includes(q);
      });
    }

    if (filters.location !== "all") {
      filtered = filtered.filter((op) => matchesLocationFilter(op, filters.location));
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((op) => getTypeKey(op) === filters.type);
    }

    if (filters.category !== "all") {
      filtered = filtered.filter((op) => getCategoryKey(op) === filters.category);
    }

    if (filters.urgency !== "all") {
      filtered = filtered.filter((op) => normalizeText(op?.urgency) === normalizeText(filters.urgency));
    }

    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
        break;
      case "points":
        filtered.sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
        break;
      case "urgency":
        filtered.sort((a, b) => (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0));
        break;
      default:
        break;
    }

    setFilteredOpportunities(filtered);
  };

  const resetFilters = () => {
    setFilters({ location: "all", type: "all", category: "all", urgency: "all" });
    setSearchTerm("");
    setSortBy("newest");
  };

  const handleCardClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedOpportunity(null);
  };

  const handleApply = async (opportunityId) => {
    const user = auth.currentUser;
    if (!user) {
      alert(t[language].loginRequired);
      return;
    }

    setApplying(true);
    setApplicationError("");
    try {
      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      const userRole = (userData.role || userData.userType || localStorage.getItem("userRole") || "").toLowerCase();
      const normalizedRole = userRole === "organization" ? "institution" : userRole;

      if (normalizedRole === "team" || normalizedRole === "institution") {
        setApplicationError(t[language].teamOrgApplyDenied);
        return;
      }

      const existingQuery = query(
        collection(db, "Applications"),
        where("userId", "==", user.uid),
        where("opportunityId", "==", opportunityId)
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        setApplicationError(t[language].alreadyApplied);
        return;
      }

      const opp = selectedOpportunity?.id === opportunityId
        ? selectedOpportunity
        : (allOpportunities || []).find((o) => o.id === opportunityId);

      const result = await joinOpportunity(user.uid, opportunityId, {
        userName: userData.fullName || userData.email || user.displayName || "User",
        userEmail: user.email,
        opportunityTitle: opp?.title || opp?.title_en || opp?.title_ar || "Volunteer Opportunity",
        organizationName: getOrgName(opp) || "",
        opportunityHours: Number(opp?.hours || opp?.duration || 0) || 0,
      });

      if (result.success) {
        setApplicationError("");
        alert(t[language].applySuccess);
        setShowPopup(false);
      } else {
        alert(result.error || "An error occurred");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={`opportunities-page ${language === "ar" ? "rtl" : ""}`}>
      <div className="opportunities-hero">
        <div className="opportunities-overlay">
          <h1>{t[language].header}</h1>
          <p>{t[language].sub}</p>
        </div>
      </div>

      {applicationError && (
        <div style={{
          maxWidth: "1200px",
          margin: "16px auto 0",
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
          borderRadius: "10px",
          padding: "12px 16px",
          fontWeight: 600
        }}>
          {applicationError}
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder={t[language].searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-grid">
          <select name="location" value={filters.location} onChange={handleFilterChange}>
            <option value="all">{t[language].allLocations}</option>
            {SUDAN_STATES.map((state) => (
              <option key={state.en} value={state.en}>
                {language === "en" ? state.en : state.ar}
              </option>
            ))}
          </select>
          <select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="all">{t[language].allTypes}</option>
            <option value="field">{t[language].field}</option>
            <option value="virtual">{t[language].virtualType}</option>
          </select>
          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="all">{t[language].allCategories}</option>
            <option value="education">{t[language].education}</option>
            <option value="health">{t[language].health}</option>
            <option value="rebuilding">{t[language].rebuilding}</option>
            <option value="community">{t[language].community}</option>
            <option value="environmental">{t[language].environmental}</option>
            <option value="emergency">{t[language].emergency}</option>
            <option value="general">{t[language].general}</option>
          </select>
          <select name="urgency" value={filters.urgency} onChange={handleFilterChange}>
            <option value="all">{t[language].allUrgency}</option>
            <option value="high">{t[language].high}</option>
            <option value="medium">{t[language].medium}</option>
            <option value="low">{t[language].low}</option>
          </select>
        </div>

        <div className="filter-actions">
          <button className="apply-btn" onClick={applyFilters}>{t[language].filters}</button>
          <button className="reset-btn" onClick={resetFilters}>{t[language].reset}</button>
        </div>
      </div>

      <div className="content-section">
        <div className="results-header">
          <h2>{t[language].available} ({filteredOpportunities.length})</h2>
          <div className="sort-options">
            <label>{t[language].sort}</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">{t[language].newest}</option>
              <option value="points">{t[language].mostPoints}</option>
              <option value="urgency">{t[language].urgency}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><p>{t[language].loading}</p></div>
        ) : (
          <>
            <div className="opportunities-grid">
              {filteredOpportunities.map((op) => (
                <div key={op.id} className="opportunity-card" onClick={() => handleCardClick(op)}>
                  {op.imageUrl && <img className="opportunity-cover" src={op.imageUrl} alt={getOpportunityTitle(op)} />}
                  <div className="card-header">
                    <div className="org-logo"><span>{getOrgName(op).charAt(0)}</span></div>
                    <div className="card-meta">
                      <span className={`type-badge ${getTypeKey(op)}`}>{getTypeKey(op) === "field" ? t[language].field : t[language].virtualType}</span>
                      <span className={`urgency-badge ${op.urgency || "medium"}`}>{t[language][op.urgency] || t[language].medium}</span>
                    </div>
                  </div>

                  <h3>{getOpportunityTitle(op)}</h3>
                  <p className="organization">{getOrgName(op)}</p>
                  <div className="card-details">
                    <div className="detail-item"><span className="label">{t[language].location}</span><span>{getLocationLabel(op)}</span></div>
                    <div className="detail-item"><span className="label">{t[language].state}</span><span>{getStateLabel(op)}</span></div>
                    <div className="detail-item"><span className="label">{t[language].duration}</span><span>{op.duration || t[language].notSpecified}</span></div>
                    <div className="detail-item"><span className="label">{t[language].category}</span><span>{getCategoryLabel(op)}</span></div>
                    <div className="detail-item"><span className="label">{t[language].volunteers}</span><span>{op.volunteers || 0}</span></div>
                    <div className="detail-item"><span className="label">{t[language].endDate}</span><span>{op.endDate || t[language].notSpecified}</span></div>
                  </div>
                  <div className="card-footer">
                    <button className="apply-now-btn" onClick={(e) => { e.stopPropagation(); handleApply(op.id); }} disabled={applying}>
                      {applying ? "..." : t[language].applyNow}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredOpportunities.length === 0 && (
              <div className="no-results">
                <h3>{t[language].noResults}</h3>
                <p>{t[language].tryAdjust}</p>
                <button onClick={resetFilters}>{t[language].showAll}</button>
              </div>
            )}
          </>
        )}
      </div>

      {showPopup && selectedOpportunity && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>{t[language].opportunityDetails}</h2>
              <button className="close-btn" onClick={handleClosePopup}>×</button>
            </div>
            <div className="popup-body">
              {selectedOpportunity.imageUrl && <img className="opportunity-cover popup-cover" src={selectedOpportunity.imageUrl} alt={getOpportunityTitle(selectedOpportunity)} />}
              <div className="popup-main-info">
                <h3>{getOpportunityTitle(selectedOpportunity)}</h3>
                <p className="organization">{getOrgName(selectedOpportunity)}</p>
              </div>
              <div className="popup-details-grid">
                <div className="detail-column">
                  <div className="detail-item"><span className="label">{t[language].location}</span><span>{getLocationLabel(selectedOpportunity)}</span></div>
                  <div className="detail-item"><span className="label">{t[language].state}</span><span>{getStateLabel(selectedOpportunity)}</span></div>
                  <div className="detail-item"><span className="label">{t[language].duration}</span><span>{selectedOpportunity.duration || t[language].notSpecified}</span></div>
                  <div className="detail-item"><span className="label">{t[language].startDate}</span><span>{selectedOpportunity.startDate || t[language].notSpecified}</span></div>
                  <div className="detail-item"><span className="label">{t[language].endDate}</span><span>{selectedOpportunity.endDate || t[language].notSpecified}</span></div>
                </div>
                <div className="detail-column">
                  <div className="detail-item"><span className="label">{t[language].category}</span><span>{getCategoryLabel(selectedOpportunity)}</span></div>
                  <div className="detail-item"><span className="label">{t[language].volunteers}</span><span>{selectedOpportunity.volunteers || 0}</span></div>
                  <div className="detail-item"><span className="label">{t[language].applicants}</span><span>{selectedOpportunity.applicantCount || 0}</span></div>
                </div>
              </div>
              <div className="popup-section">
                <h4>{t[language].description}</h4>
                <p>{getDescription(selectedOpportunity)}</p>
              </div>
              {(selectedOpportunity.contact || selectedOpportunity.phone) && (
                <div className="popup-contact">
                  <h4>{t[language].contactInfo}</h4>
                  <div className="contact-details">
                    {selectedOpportunity.contact && <div className="contact-item"><span className="label">{t[language].contactEmail}</span><span>{selectedOpportunity.contact}</span></div>}
                    {selectedOpportunity.phone && <div className="contact-item"><span className="label">{t[language].contactPhone}</span><span>{selectedOpportunity.phone}</span></div>}
                  </div>
                </div>
              )}
            </div>
            <div className="popup-footer">
              <button className="close-popup-btn" onClick={handleClosePopup}>{t[language].close}</button>
              <button className="apply-popup-btn" onClick={() => handleApply(selectedOpportunity.id)} disabled={applying}>
                {applying ? (language === "en" ? "Applying..." : "جاري التقديم...") : t[language].applyForOpportunity}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;
