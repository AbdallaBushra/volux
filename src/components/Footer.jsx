import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";
import logo from "../assets/volux-logo2.png";
import { useLanguage } from "../context/LanguageContext";


function Footer() {
  const { language } = useLanguage();

  const text = {
    en: {
      about: "Building Sudan's future through community service and transparency.",
      quick: "Quick Links",
      res: "Resources",
      contact: "Contact",
      home: "Home",
      opp: "Opportunities",
      aboutUs: "About",
      Profile: "Profile",
      faq: "FAQ",
      guide: "Volunteer Guidelines",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      email: "Email",
      phone: "Phone",
      khartoum: "Khartoum, Sudan",
      rights: "All rights reserved.",
      partner: "Academic Partner:",
    },
    ar: {
      about: "نبني مستقبل السودان عبر خدمة المجتمع والشفافية.",
      quick: "روابط سريعة",
      res: "الموارد",
      contact: "التواصل",
      home: "الرئيسية",
      opp: "الفرص",
      aboutUs: "من نحن",
      Profile: "الملف الشخصي",
      faq: "الأسئلة الشائعة",
      guide: "إرشادات المتطوعين",
      privacy: "سياسة الخصوصية",
      terms: "شروط الخدمة",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      khartoum: "الخرطوم، السودان",
      rights: "جميع الحقوق محفوظة.",
      partner: "الشريك الأكاديمي:",
    },
  };

  const t = text[language];

  return (
    <footer className={`footer ${language === "ar" ? "rtl" : ""}`}>
      <div className="footer-container">
        <div className="footer-section about">
          <div className="footer-logo">
            <img src={logo} alt="Volux Logo" />
          
          </div>
          <p>{t.about}</p>
        </div>

        <div className="footer-section">
          <h3>{t.quick}</h3>
          <ul>
            <li><Link to="/">{t.home}</Link></li>
            <li><Link to="/opportunities">{t.opp}</Link></li>
            <li><Link to="/about">{t.aboutUs}</Link></li>
            <li><Link to="/profile">{t.Profile}</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t.res}</h3>
          <ul>
            <li><Link to="/faq">{t.faq}</Link></li>
            <li><Link to="/guidelines">{t.guide}</Link></li>
            <li><Link to="/privacy">{t.privacy}</Link></li>
            <li><Link to="/terms">{t.terms}</Link></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h3>{t.contact}</h3>
          <p>{t.email}: info@volux.sd</p>
          <p>{t.phone}: +249 XXX XXX XXX</p>
          <p>{t.khartoum}</p>
        </div>
      </div>

      <hr className="footer-line" />

      <div className="footer-bottom">
        <p>© 2025 Volux. {t.rights}</p>
        <div className="partner">
          <span>{t.partner}</span>
          <button>SUST University</button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;