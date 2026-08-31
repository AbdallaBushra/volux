import React, {useState} from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import logo from "../assets/volux-logo.png";
import { useLanguage } from "../context/LanguageContext";
import { auth } from "../firebase/firebase";
import NotificationCenter from "./NotificationCenter";
import { FiBell } from "react-icons/fi";

function Header() {
  const { language, toggleLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const user = auth.currentUser;
  
  return (
    <header className={`navbar ${language === "ar" ? "rtl" : ""}`}>
      <div className="logo">
        <Link to="/">
          <img src={logo} alt="Volux Logo" className="logo-img" />
        </Link>
      </div>

      <nav>
        <ul className="nav-links">
          {language === "en" ? (
            <>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/opportunities">Opportunities</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/">الرئيسية</Link></li>
              <li><Link to="/opportunities">الفرص</Link></li>
              <li><Link to="/about">من نحن</Link></li>
              <li><Link to="/profile">الملف الشخصي</Link></li>
            </>
          )}
        </ul>
      </nav>

      <div className="header-right">
        {user && (
          <button className="notification-btn" onClick={() => setShowNotifications(true)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', margin: '0 10px' }}>
            <FiBell size={20} />
          </button>
        )}
        <div 
          className="login-dropdown"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <button className="login-btn">
            {language === "en" ? "Login ▾" : "تسجيل الدخول ▾"}
          </button>
          <div className={`dropdown-content ${isDropdownOpen ? "show" : ""}`}>
            {language === "en" ? (
              <>
                <Link to="/login">As Volunteer</Link>
                <Link to="/institution-login">As Institution</Link>
                <Link to="/team-login">As Volunteer Team</Link>
              </>
            ) : (
              <>
                <Link to="/login">كـ متطوع</Link>
                <Link to="/institution-login">كـ مؤسسة</Link>
                <Link to="/team-login">كـ فريق تطوعي</Link>
              </>
            )}
          </div>
        </div>

        <div className="lang-toggle">
          <button
            onClick={() => toggleLanguage("en")}
            className={language === "en" ? "active" : ""}
          >
            English
          </button>
          |
          <button
            onClick={() => toggleLanguage("ar")}
            className={language === "ar" ? "active" : ""}
          >
            عربي
          </button>
        </div>
      </div>
      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
    </header>
  );
}

export default Header;
