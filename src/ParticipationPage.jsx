import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/ParticipationPage.css";
import { useLanguage } from "./context/LanguageContext";
import { auth, db } from "./firebase/firebase";
import { FiClipboard, FiFileText, FiSearch, FiUser, FiX } from "react-icons/fi";
import voluxLogo from "./assets/volux-logo.png";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc 
} from "firebase/firestore";

// Helper: parse Firestore Timestamp / ISO string / Date safely
const safeDateString = (value) => {
  try {
    if (!value) return "N/A";
    // Firestore Timestamp
    if (typeof value === "object" && typeof value.toDate === "function") {
      return value.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    // { seconds: number }
    if (typeof value === "object" && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    // ISO string / date string
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return "N/A";
  }
};

const ParticipationPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipation, setSelectedParticipation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const pickOwnerName = (data) => {
    if (!data) return "";
    const fields = [
      "institutionName", "organizationName", "organization_name", "orgName", "orgNameAr", "orgNameEn", "org",
      "teamName", "teamNameAr", "teamNameEn",
      "displayName", "fullName", "name", "email"
    ];
    for (const field of fields) {
      if (data[field]) return data[field];
    }
    return "";
  };

  useEffect(() => {
    const fetchParticipations = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // جلب البيانات من مجموعة Applications
        const q = query(collection(db, "Applications"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const parts = [];

        // Use for..of so we can safely await missing data hydration
        for (const appDoc of querySnapshot.docs) {
          const data = appDoc.data();

          let opportunityName = data.opportunityTitle || "Volunteer Opportunity";
          let organization = data.organizationName || data.organization || data.org || "N/A";
          let opportunityData = {};
          let createdByName = data.createdByName || data.creatorName || organization || "N/A";

          // If some fields were not stored in Applications, hydrate them from Opportunities
          if (data.opportunityId) {
            try {
              const oppRef = doc(db, "Opportunities", data.opportunityId);
              const oppSnap = await getDoc(oppRef);
              if (oppSnap.exists()) {
                const oppData = oppSnap.data();
                opportunityData = oppData;
                
                // Get organization / team owner name
                organization =
                  oppData.organizationName ||
                  oppData.organization_name ||
                  oppData.orgName ||
                  oppData.org ||
                  oppData.institutionName ||
                  oppData.teamName ||
                  organization;
                
                // Get opportunity name based on language
                opportunityName = language === "ar" 
                  ? oppData.title_ar || oppData.title_en || opportunityName 
                  : oppData.title_en || oppData.title_ar || opportunityName;
                
                // Get creator/owner display name
                createdByName =
                  oppData.createdByName ||
                  oppData.creatorName ||
                  pickOwnerName(oppData) ||
                  createdByName;
                
                // If still unavailable, hydrate from owner account/profile
                if ((createdByName === "N/A" || !createdByName) && oppData.createdBy) {
                  try {
                    const userRef = doc(db, "Users", oppData.createdBy);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                      const userData = userSnap.data();
                      const role = (userData.role || userData.userType || "").toLowerCase();
                      let ownerName = pickOwnerName(userData);

                      if (!ownerName && (role === "institution" || role === "organization")) {
                        const orgProfileRef = doc(db, "Users", oppData.createdBy, "Organization_Profile", "info");
                        const orgProfileSnap = await getDoc(orgProfileRef);
                        if (orgProfileSnap.exists()) ownerName = pickOwnerName(orgProfileSnap.data());
                      } else if (!ownerName && role === "team") {
                        const teamProfileRef = doc(db, "Users", oppData.createdBy, "Volunteer_Team_Profile", "info");
                        const teamProfileSnap = await getDoc(teamProfileRef);
                        if (teamProfileSnap.exists()) ownerName = pickOwnerName(teamProfileSnap.data());
                      }

                      createdByName = ownerName || createdByName || "N/A";
                      organization = organization === "N/A" ? (ownerName || organization) : organization;
                    }
                  } catch (e) {
                    console.error("Error fetching user:", e);
                  }
                }
              }
            } catch (e) {
              console.error("Error hydrating opportunity data:", e);
            }
          }

          parts.push({
            id: appDoc.id,
            ...data,
            opportunityName,
            organization: organization || "N/A",
            createdByName,
            date: safeDateString(data.appliedAt),
            status: data.status?.toLowerCase() || "pending",
            opportunityData: opportunityData || {}
          });
        }
        setParticipations(parts);
      } catch (error) {
        console.error("Error fetching participations:", error);
      }
      setLoading(false);
    };

    fetchParticipations();
  }, [navigate, language]);

  const escapeCertificateText = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const openArabicCertificate = ({ userName, oppTitle, date, ownerName }) => {
    const certificateHtml = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>\u0634\u0647\u0627\u062f\u0629 \u0645\u0634\u0627\u0631\u0643\u0629</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@700&display=swap");
    :root {
      --brown: #7f4720;
      --brown-2: #9b5f2d;
      --brown-3: #5b2f17;
      --gold: #c99b5f;
      --gold-soft: #ead1ac;
      --paper: #fffdf8;
      --ink: #2d2118;
      --muted: #6c5443;
      --line: #ead3b7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 28px;
      background:
        radial-gradient(circle at 18% 12%, rgba(201, 155, 95, 0.18), transparent 30%),
        radial-gradient(circle at 82% 84%, rgba(127, 71, 32, 0.12), transparent 32%),
        linear-gradient(135deg, #f7efe6, #fffaf3);
      color: var(--ink);
      font-family: "Cairo", "Segoe UI", "Tahoma", "Arial", sans-serif;
    }
    .certificate-shell {
      width: min(1120px, 100%);
      background:
        linear-gradient(135deg, var(--brown-3), var(--gold) 34%, #f4dfbc 50%, var(--gold) 66%, var(--brown));
      padding: 12px;
      border-radius: 22px;
      box-shadow: 0 32px 86px rgba(77, 43, 21, 0.24);
    }
    .certificate {
      min-height: 720px;
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      background:
        linear-gradient(rgba(255, 253, 248, 0.97), rgba(255, 253, 248, 0.97)),
        radial-gradient(circle at 50% 42%, rgba(201, 155, 95, 0.1), transparent 31%),
        radial-gradient(circle at 85% 18%, rgba(155, 95, 45, 0.14), transparent 27%),
        var(--paper);
      border: 2px solid rgba(255, 255, 255, 0.82);
      padding: 46px 74px 52px;
      text-align: center;
      direction: rtl;
      unicode-bidi: plaintext;
    }
    .certificate::before,
    .certificate::after {
      content: "";
      position: absolute;
      inset: 24px;
      border: 2px solid var(--gold-soft);
      border-radius: 10px;
      pointer-events: none;
    }
    .certificate::after {
      inset: 36px;
      border: 1px solid rgba(127, 71, 32, 0.22);
      box-shadow:
        inset 0 0 0 8px rgba(234, 211, 183, 0.17),
        inset 0 0 34px rgba(201, 155, 95, 0.1);
    }
    .corner {
      position: absolute;
      width: 86px;
      height: 86px;
      border-color: var(--gold);
      opacity: 0.72;
    }
    .corner.top-right { top: 42px; right: 42px; border-top: 3px solid; border-right: 3px solid; border-radius: 0 10px 0 0; }
    .corner.top-left { top: 42px; left: 42px; border-top: 3px solid; border-left: 3px solid; border-radius: 10px 0 0 0; }
    .corner.bottom-right { bottom: 42px; right: 42px; border-bottom: 3px solid; border-right: 3px solid; border-radius: 0 0 10px 0; }
    .corner.bottom-left { bottom: 42px; left: 42px; border-bottom: 3px solid; border-left: 3px solid; border-radius: 0 0 0 10px; }
    .logo-wrap {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 190px;
      height: 82px;
      margin-bottom: 8px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.58);
      border: 1px solid rgba(234, 211, 183, 0.86);
      box-shadow: 0 14px 34px rgba(127, 71, 32, 0.08);
    }
    .logo {
      width: 154px;
      height: auto;
      display: block;
    }
    .eyebrow {
      position: relative;
      z-index: 1;
      margin: 8px 0 8px;
      color: var(--gold);
      font-size: 15px;
      font-weight: 800;
    }
    h1 {
      position: relative;
      z-index: 1;
      margin: 0;
      color: var(--brown);
      font-family: "Amiri", "Cairo", serif;
      font-size: clamp(46px, 5vw, 72px);
      line-height: 1.2;
      letter-spacing: 0;
      font-weight: 700;
    }
    .divider {
      width: 180px;
      height: 3px;
      margin: 18px auto 28px;
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, var(--brown-2), var(--gold), var(--brown-2), transparent);
    }
    .lead {
      position: relative;
      z-index: 1;
      margin: 0;
      color: var(--muted);
      font-size: 21px;
      font-weight: 600;
      line-height: 2;
    }
    .name {
      position: relative;
      z-index: 1;
      display: inline-block;
      max-width: 100%;
      margin: 8px auto 16px;
      padding: 2px 42px 12px;
      border-bottom: 2px solid var(--gold);
      color: var(--ink);
      font-family: "Amiri", "Cairo", serif;
      font-size: clamp(36px, 4vw, 54px);
      font-weight: 900;
      line-height: 1.5;
      direction: rtl;
      unicode-bidi: plaintext;
    }
    .statement {
      position: relative;
      z-index: 1;
      max-width: 780px;
      margin: 0 auto;
      color: var(--muted);
      font-size: 21px;
      font-weight: 600;
      line-height: 2;
    }
    .activity {
      position: relative;
      z-index: 1;
      max-width: 820px;
      margin: 14px auto 26px;
      padding: 16px 28px;
      border-radius: 10px;
      background: linear-gradient(135deg, #fff7ec, #fffdf8);
      border: 1px solid var(--gold-soft);
      box-shadow: 0 12px 28px rgba(127, 71, 32, 0.08);
      color: #3f2719;
      font-family: "Amiri", "Cairo", serif;
      font-size: clamp(25px, 3vw, 36px);
      font-weight: 900;
      line-height: 1.8;
      direction: rtl;
      unicode-bidi: plaintext;
    }
    .meta {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      max-width: 760px;
      margin: 0 auto 28px;
      text-align: right;
    }
    .meta-item {
      padding: 14px 16px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.78);
      border: 1px solid var(--gold-soft);
    }
    .meta-label {
      display: block;
      margin-bottom: 5px;
      color: var(--brown);
      font-size: 13px;
      font-weight: 900;
    }
    .meta-value {
      display: block;
      color: var(--ink);
      font-size: 17px;
      font-weight: 700;
      line-height: 1.6;
      direction: rtl;
      unicode-bidi: plaintext;
    }
    .footer {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: end;
      gap: 20px;
      margin-top: 18px;
    }
    .signature {
      min-height: 76px;
      display: grid;
      align-content: end;
      gap: 8px;
      color: var(--muted);
      font-size: 14px;
      font-weight: 700;
    }
    .signature::before {
      content: "";
      display: block;
      width: 180px;
      height: 1px;
      margin: 0 auto;
      background: var(--line);
    }
    .seal {
      width: 118px;
      height: 118px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: radial-gradient(circle, #fff7ec 0 42%, #c89b5f 43% 47%, #8c552f 48% 100%);
      color: #fff;
      box-shadow: 0 14px 30px rgba(127, 71, 32, 0.18);
      font-weight: 900;
      line-height: 1.4;
      text-align: center;
    }
    .actions {
      position: fixed;
      top: 18px;
      left: 18px;
      display: flex;
      gap: 10px;
      direction: ltr;
      z-index: 2;
    }
    button {
      border: 0;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--brown-2), var(--brown));
      color: #fff;
      padding: 10px 16px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 10px 20px rgba(127, 71, 32, 0.18);
    }
    @media (max-width: 760px) {
      body { padding: 14px; }
      .certificate { padding: 42px 24px; }
      .logo-wrap { width: 160px; height: 72px; }
      .logo { width: 130px; }
      .corner { display: none; }
      .meta, .footer { grid-template-columns: 1fr; }
      .seal { margin: 0 auto; }
      .actions { position: static; margin-bottom: 12px; justify-content: center; }
    }
    @media print {
      body { background: #fff; padding: 0; }
      .actions { display: none; }
      .certificate-shell { width: 100%; min-height: 100vh; padding: 10px; border-radius: 0; box-shadow: none; }
      .certificate { min-height: calc(100vh - 20px); border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">\u062a\u062d\u0645\u064a\u0644 / \u0637\u0628\u0627\u0639\u0629</button>
    <button onclick="window.close()">\u0625\u063a\u0644\u0627\u0642</button>
  </div>
  <div class="certificate-shell">
    <main class="certificate">
      <span class="corner top-right"></span>
      <span class="corner top-left"></span>
      <span class="corner bottom-right"></span>
      <span class="corner bottom-left"></span>
      <div class="logo-wrap">
        <img class="logo" src="${voluxLogo}" alt="Volux" />
      </div>
      <p class="eyebrow">\u062a\u0642\u062f\u064a\u0631\u0627\u064b \u0644\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0627\u0644\u062a\u0637\u0648\u0639\u064a\u0629</p>
      <h1>\u0634\u0647\u0627\u062f\u0629 \u0645\u0634\u0627\u0631\u0643\u0629</h1>
      <div class="divider"></div>
      <p class="lead">\u062a\u0634\u0647\u062f \u0645\u0646\u0635\u0629 Volux \u0628\u0623\u0646 \u0627\u0644\u0645\u062a\u0637\u0648\u0639/\u0629</p>
      <div class="name">${escapeCertificateText(userName)}</div>
      <p class="statement">\u0642\u062f \u0634\u0627\u0631\u0643/\u062a \u0628\u0646\u062c\u0627\u062d \u0641\u064a \u0627\u0644\u0641\u0631\u0635\u0629 \u0627\u0644\u062a\u0637\u0648\u0639\u064a\u0629</p>
      <div class="activity">${escapeCertificateText(oppTitle)}</div>
      <div class="meta">
        <div class="meta-item">
          <span class="meta-label">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629</span>
          <span class="meta-value">${escapeCertificateText(date)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">\u0627\u0644\u062c\u0647\u0629 \u0627\u0644\u0645\u0646\u0638\u0645\u0629</span>
          <span class="meta-value">${escapeCertificateText(ownerName)}</span>
        </div>
      </div>
      <div class="footer">
        <div class="signature"></div>
        <div class="seal">VOLUX<br />\u0645\u0639\u062a\u0645\u062f\u0629</div>
        <div class="signature"></div>
      </div>
    </main>
  </div>
</body>
</html>`;

    const certificateWindow = window.open("", "_blank");
    if (certificateWindow) {
      certificateWindow.document.open();
      certificateWindow.document.write(certificateHtml);
      certificateWindow.document.close();
    }
  };

  const downloadCertificate = (item) => {
    const userName = auth.currentUser?.displayName || auth.currentUser?.email || "Volunteer";
    const oppTitle = item.opportunityName;
    const date = item.date;
    const ownerName =
      item.createdByName ||
      item.organization ||
      item.opportunityData?.organizationName ||
      item.opportunityData?.teamName ||
      "Opportunity Owner";
    
    // الربط مع السيرفر (Node.js) لتوليد الشهادة
    const hasArabicText = /[\u0600-\u06FF]/.test([userName, oppTitle, ownerName].join(" "));
    if (language === "ar" || hasArabicText) {
      openArabicCertificate({ userName, oppTitle, date, ownerName });
      return;
    }

    const url = `http://localhost:5000/api/certificates/generate?userName=${encodeURIComponent(userName)}&opportunityTitle=${encodeURIComponent(oppTitle)}&date=${encodeURIComponent(date)}&ownerName=${encodeURIComponent(ownerName)}&organizationName=${encodeURIComponent(ownerName)}&language=${encodeURIComponent(language)}&direction=${language === "ar" ? "rtl" : "ltr"}`;
    window.open(url, '_blank');
  };

  const viewDetails = async (participation) => {
    try {
      // جلب المزيد من التفاصيل إذا لزم الأمر
      let detailedData = { ...participation };
      
      // إذا كان هناك بيانات فرصة، نعرضها
      if (participation.opportunityData) {
        detailedData = {
          ...detailedData,
          ...participation.opportunityData
        };
      }
      
      setSelectedParticipation(detailedData);
      setShowModal(true);
    } catch (error) {
      console.error("Error loading details:", error);
      alert(language === "en" ? "Error loading details. Please try again." : "خطأ في تحميل التفاصيل. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleCancelApplication = async (applicationId) => {
    if (window.confirm(language === "en" ? "Are you sure you want to cancel your application?" : "هل أنت متأكد من إلغاء تقديمك؟")) {
      try {
        await deleteDoc(doc(db, "Applications", applicationId));
        setParticipations(participations.filter(app => app.id !== applicationId));
        alert(language === "en" ? "Application cancelled successfully." : "تم إلغاء التقديم بنجاح.");
      } catch (error) {
        console.error("Error cancelling application:", error);
        alert(language === "en" ? "Failed to cancel application." : "فشل إلغاء التقديم.");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedParticipation(null);
  };

  if (loading) return (
    <div className="loading-screen">
      {language === "en" ? "Loading Participations..." : "جاري تحميل المشاركات..."}
    </div>
  );

  return (
    <div className={`participation-page ${language === "ar" ? "rtl" : ""}`}>
      <main className="participation-main">
        <nav className="participation-side-menu">
          <h3>{language === "en" ? "My Account" : "حسابي"}</h3>
          <div className="menu-links">
            <button className="participation-menu-btn" onClick={() => navigate("/profile")}>
              <FiUser aria-hidden="true" />
              {language === "en" ? "Personal Info" : "المعلومات الشخصية"}
            </button>
            <button className="participation-menu-btn active" onClick={() => navigate("/profile/participation")}>
              <FiClipboard aria-hidden="true" />
              {language === "en" ? "My Participations" : "مشاركاتي"}
            </button>
          </div>
        </nav>

        <section className="participation-content">
          <div className="content-header">
            <h2>{language === "en" ? "My Participations" : "مشاركاتي"}</h2>
            <p>{language === "en" ? "Manage and view your volunteering activities" : "إدارة وعرض أنشطة التطوع الخاصة بك"}</p>
          </div>

          <div className="participation-stats">
            <div className="stat-card">
              <h3>{language === "en" ? "Total Participations" : "إجمالي المشاركات"}</h3>
              <span className="stat-number">{participations.length}</span>
            </div>
            <div className="stat-card">
              <h3>{language === "en" ? "Pending Requests" : "طلبات قيد الانتظار"}</h3>
              <span className="stat-number">{participations.filter(p => p.status === "pending").length}</span>
            </div>
            <div className="stat-card">
              <h3>{language === "en" ? "Completed" : "مكتملة"}</h3>
              <span className="stat-number">{participations.filter(p => p.status === "completed" || p.status === "accepted" || p.status === "approved").length}</span>
            </div>
          </div>

          <div className="participation-list">
            <h3>{language === "en" ? "Recent Activities" : "الأنشطة الأخيرة"}</h3>
            {participations.length > 0 ? (
              participations.map((item) => (
                <div key={item.id} className="participation-card">
                  <div className="participation-header">
                    <h4>{item.opportunityName}</h4>
                    <span className={`status-badge ${item.status}`}>
                      {language === "en" ? item.status : 
                        item.status === "pending" ? "قيد الانتظار" :
                        item.status === "approved" ? "مقبول" :
                        item.status === "completed" ? "مكتمل" :
                        item.status === "accepted" ? "مقبول" :
                        item.status}
                    </span>
                  </div>
                  <div className="participation-details">
                    <p>
                      <strong>{language === "en" ? "Organization:" : "الجهة:"}</strong> 
                      {item.organization}
                    </p>
                    <p>
                      <strong>{language === "en" ? "Created by:" : "أنشئت بواسطة:"}</strong> 
                      {item.createdByName}
                    </p>
                    <p>
                      <strong>{language === "en" ? "Join Date:" : "تاريخ الانضمام:"}</strong> 
                      {item.date}
                    </p>
                    {item.opportunityData.location && (
                      <p>
                        <strong>{language === "en" ? "Location:" : "الموقع:"}</strong> 
                        {item.opportunityData.location}
                      </p>
                    )}
                  </div>
                  <div className="participation-actions">
                    <button 
                      className="view-details-btn" 
                      onClick={() => viewDetails(item)}
                    >
                      <FiSearch aria-hidden="true" />
                      {language === "en" ? "View Details" : "عرض التفاصيل"}
                    </button>
                    {item.status === "pending" && (
                      <button 
                        className="cancel-btn" 
                        onClick={() => handleCancelApplication(item.id)}
                      >
                        <FiX aria-hidden="true" />
                        {language === "en" ? "Cancel" : "إلغاء"}
                      </button>
                    )}
                    {(item.status === "completed" || item.status === "accepted" || item.status === "approved") && (
                      <button 
                        className="certificate-btn" 
                        onClick={() => downloadCertificate(item)}
                      >
                        <FiFileText aria-hidden="true" />
                        {language === "en" ? "Download Certificate" : "تحميل الشهادة"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>{language === "en" ? "No participations found." : "لا توجد مشاركات حالياً."}</p>
                <button 
                  className="btn-primary" 
                  onClick={() => navigate("/opportunities")}
                >
                  <FiSearch aria-hidden="true" />
                  {language === "en" ? "Browse Opportunities" : "تصفح الفرص"}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal for detailed view */}
      {showModal && selectedParticipation && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{language === "en" ? "Participation Details" : "تفاصيل المشاركة"}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="details-grid">
              <div className="detail-item">
                <h4>{language === "en" ? "Opportunity" : "الفرصة"}</h4>
                <p>{selectedParticipation.opportunityName}</p>
              </div>
              
              <div className="detail-item">
                <h4>{language === "en" ? "Organization" : "الجهة"}</h4>
                <p>{selectedParticipation.organization}</p>
              </div>
              
              <div className="detail-item">
                <h4>{language === "en" ? "Created by" : "أنشئت بواسطة"}</h4>
                <p>{selectedParticipation.createdByName}</p>
              </div>
              
              <div className="detail-item">
                <h4>{language === "en" ? "Application Date" : "تاريخ التقديم"}</h4>
                <p>{selectedParticipation.date}</p>
              </div>
              
              <div className="detail-item">
                <h4>{language === "en" ? "Status" : "الحالة"}</h4>
                <p>{selectedParticipation.status}</p>
              </div>
              
              {selectedParticipation.location && (
                <div className="detail-item">
                  <h4>{language === "en" ? "Location" : "الموقع"}</h4>
                  <p>{selectedParticipation.location}</p>
                </div>
              )}
              
              {selectedParticipation.category && (
                <div className="detail-item">
                  <h4>{language === "en" ? "Category" : "الفئة"}</h4>
                  <p>{selectedParticipation.category}</p>
                </div>
              )}
              
              {selectedParticipation.description && (
                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                  <h4>{language === "en" ? "Description" : "الوصف"}</h4>
                  <p>{selectedParticipation.description}</p>
                </div>
              )}
              
              {selectedParticipation.requirements && (
                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                  <h4>{language === "en" ? "Requirements" : "المتطلبات"}</h4>
                  <p>{selectedParticipation.requirements}</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="view-details-btn" onClick={closeModal}>
                {language === "en" ? "Close" : "إغلاق"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipationPage;
