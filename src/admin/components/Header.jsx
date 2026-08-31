import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FiBell, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { getRecentNotifications, getUnreadNotificationCount, markNotificationAsRead } from '../../database/adminData';
import { useLanguage } from '../../context/LanguageContext';

const Header = () => {
  const { language } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const i18n = {
    en: {
      pageTitles: {
        users: 'Users Management',
        organizations: 'Organizations Management',
        teams: 'Teams Management',
        opportunities: 'Opportunities Management',
        reports: 'Reports & Complaints',
        settings: 'Settings',
        pending: 'Pending Registrations',
        dashboard: 'Dashboard',
        fallback: 'Admin Dashboard'
      },
      noNotifications: 'No notifications',
      notification: 'Notification',
      administrator: 'Administrator',
      myProfile: 'My Profile',
      settings: 'Settings',
      logout: 'Logout'
    },
    ar: {
      pageTitles: {
        users: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646',
        organizations: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0645\u0627\u062a',
        teams: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0631\u0642',
        opportunities: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0631\u0635',
        reports: '\u0627\u0644\u0628\u0644\u0627\u063a\u0627\u062a \u0648\u0627\u0644\u0634\u0643\u0627\u0648\u0649',
        settings: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a',
        pending: '\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0645\u0639\u0644\u0642\u0629',
        dashboard: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
        fallback: '\u0644\u0648\u062d\u0629 \u062a\u062d\u0643\u0645 \u0627\u0644\u0623\u062f\u0645\u0646'
      },
      noNotifications: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u0634\u0639\u0627\u0631\u0627\u062a',
      notification: '\u0625\u0634\u0639\u0627\u0631',
      administrator: '\u0627\u0644\u0645\u0633\u0624\u0648\u0644',
      myProfile: '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a',
      settings: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a',
      logout: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c'
    }
  };

  const t = i18n[language] || i18n.en;

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userRef = doc(db, 'Users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const refreshAdminNotifications = async () => {
    try {
      const [count, recent] = await Promise.all([
        getUnreadNotificationCount(),
        getRecentNotifications(8),
      ]);
      setNotificationCount(count);
      setNotifications(recent);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    }
  };

  useEffect(() => {
    refreshAdminNotifications();
    const interval = setInterval(refreshAdminNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return t.pageTitles.users;
    if (path.includes('/admin/organizations')) return t.pageTitles.organizations;
    if (path.includes('/admin/teams')) return t.pageTitles.teams;
    if (path.includes('/admin/opportunities')) return t.pageTitles.opportunities;
    if (path.includes('/admin/reports')) return t.pageTitles.reports;
    if (path.includes('/admin/settings')) return t.pageTitles.settings;
    if (path.includes('/admin/pending-registrations')) return t.pageTitles.pending;
    if (path.includes('/admin/dashboard')) return t.pageTitles.dashboard;
    return t.pageTitles.fallback;
  };

  const displayName = useMemo(() => {
    return (
      userData?.name ||
      userData?.displayName ||
      userData?.fullName ||
      userData?.orgNameEn ||
      userData?.teamNameEn ||
      auth.currentUser?.email ||
      'Admin User'
    );
  }, [userData]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const openNotification = async (notif) => {
    try {
      if (!notif.read && notif.id) {
        await markNotificationAsRead(notif.id);
        refreshAdminNotifications();
      }
      const type = notif.type || '';
      if (type.includes('registration')) navigate('/admin/pending-registrations');
      else if (type.includes('opportunity')) navigate('/admin/opportunities');
      else if (type.includes('report')) navigate('/admin/reports');
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  return (
    <header className="admin-topbar" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="header-left">
        <div>
          <span className="topbar-kicker">Admin Console</span>
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <div className="notif-container">
            <button
              className="notification-btn"
              onClick={() => setShowNotifications((s) => !s)}
              aria-label="Notifications"
            >
              <FiBell size={20} />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount > 9 ? '9+' : notificationCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notif-dropdown">
                {notifications.length === 0 ? (
                  <p className="notif-empty">{t.noNotifications}</p>
                ) : (
                  notifications.map((n) => (
                    <button key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`} onClick={() => openNotification(n)}>
                      <strong>{n.title || t.notification}</strong>
                      <span>{n.message || ''}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="user-menu-container">
            <button className="user-profile-btn" onClick={() => setShowUserMenu(!showUserMenu)} aria-label="User menu">
              <div className="user-avatar">{displayName.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{displayName}</div>
                <div className="user-role">{t.administrator}</div>
              </div>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <button className="dropdown-item" onClick={() => { navigate('/admin/profile'); setShowUserMenu(false); }}>
                  <FiUser size={16} />
                  <span>{t.myProfile}</span>
                </button>
                <button className="dropdown-item" onClick={() => { navigate('/admin/settings'); setShowUserMenu(false); }}>
                  <FiSettings size={16} />
                  <span>{t.settings}</span>
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <FiLogOut size={16} />
                  <span>{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
