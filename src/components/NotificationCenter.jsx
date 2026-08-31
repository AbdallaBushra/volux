import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import './NotificationCenter.css';
import { FiCheckCircle, FiXCircle, FiAward, FiStar, FiAlertCircle, FiClock, FiBriefcase } from 'react-icons/fi';

const NotificationCenter = ({ onClose }) => {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'opportunities'

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, "Notifications", user.uid, "in_App"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const notifs = [];
        querySnapshot.forEach((doc) => {
          notifs.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(notifs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, "Notifications", user.uid, "in_App", id), { read: true });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(n => 
        updateDoc(doc(db, "Notifications", user.uid, "in_App", n.id), { 
          read: true,
          readAt: new Date().toISOString()
        })
      );
      
      await Promise.all(updatePromises);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;
    
    if (window.confirm(language === 'en' ? "Delete this notification?" : "حذف هذا الإشعار؟")) {
      try {
        await deleteDoc(doc(db, "Notifications", user.uid, "in_App", id));
        setNotifications(notifications.filter(n => n.id !== id));
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'opportunity_approved':
        return <FiCheckCircle style={{ color: '#10b981', fontSize: '20px' }} />;
      case 'opportunity_rejected':
        return <FiXCircle style={{ color: '#ef4444', fontSize: '20px' }} />;
      case 'badge':
        return <FiAward style={{ color: '#f59e0b', fontSize: '20px' }} />;
      case 'level':
        return <FiStar style={{ color: '#9b5f2d', fontSize: '20px' }} />;
      case 'reward':
        return <FiAward style={{ color: '#9b5f2d', fontSize: '20px' }} />;
      case 'application_rejected':
        return <FiAlertCircle style={{ color: '#ef4444', fontSize: '20px' }} />;
      case 'account_approved':
        return <FiCheckCircle style={{ color: '#10b981', fontSize: '20px' }} />;
      case 'account_rejected':
        return <FiXCircle style={{ color: '#ef4444', fontSize: '20px' }} />;
      case 'registration':
        return <FiBriefcase style={{ color: '#9b5f2d', fontSize: '20px' }} />;
      default:
        return <FiAlertCircle style={{ color: '#7f4720', fontSize: '20px' }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'opportunity_approved':
        return { bg: '#d1fae5', border: '#10b981' };
      case 'opportunity_rejected':
        return { bg: '#fee2e2', border: '#ef4444' };
      case 'badge':
        return { bg: '#fff3e4', border: '#c78b58' };
      case 'level':
        return { bg: '#fff7ed', border: '#9b5f2d' };
      default:
        return { bg: '#fff7ed', border: '#9b5f2d' };
    }
  };

  const handleNotificationClick = (notif) => {
    // وضع علامة مقروءة عند النقر
    markAsRead(notif.id);
    
    // إذا كان الإشعار متعلقاً بفرصة، يمكن فتح صفحة الفرصة
    if (notif.opportunityId && notif.metadata?.action === 'view_opportunity') {
      window.open(`/opportunity/${notif.opportunityId}`, '_blank');
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'opportunities') {
      return notif.type === 'opportunity_approved' || notif.type === 'opportunity_rejected';
    }
    return true;
  });

  const translations = {
    en: { 
      title: "Notifications", 
      empty: "No notifications yet.", 
      close: "Close", 
      markAllRead: "Mark all as read",
      all: "All",
      unread: "Unread",
      opportunities: "Opportunities",
      delete: "Delete",
      justNow: "Just now",
      minutesAgo: "minutes ago",
      hoursAgo: "hours ago",
      daysAgo: "days ago"
    },
    ar: { 
      title: "الإشعارات", 
      empty: "لا توجد إشعارات بعد.", 
      close: "إغلاق", 
      markAllRead: "تحديد الكل كمقروء",
      all: "الكل",
      unread: "غير مقروء",
      opportunities: "الفرص",
      delete: "حذف",
      justNow: "الآن",
      minutesAgo: "دقائق مضت",
      hoursAgo: "ساعات مضت",
      daysAgo: "أيام مضت"
    }
  };

  const t = translations[language];

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return t.justNow;
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return t.justNow;
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    return `${diffDays} ${t.daysAgo}`;
  };

  return (
    <div className={`notification-center-overlay ${language === 'ar' ? 'rtl' : ''}`} onClick={onClose}>
      <div className="notification-center" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <div>
            <h3>{t.title}</h3>
            <div className="notification-filters">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {t.all}
              </button>
              <button 
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                {t.unread}
              </button>
              <button 
                className={`filter-btn ${filter === 'opportunities' ? 'active' : ''}`}
                onClick={() => setFilter('opportunities')}
              >
                {t.opportunities}
              </button>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="mark-all-read-btn" 
              onClick={markAllAsRead}
              disabled={!notifications.some(n => !n.read)}
            >
              {t.markAllRead}
            </button>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>
        
        <div className="notification-list">
          {loading ? (
            <p className="loading-text">{language === 'en' ? "Loading..." : "جاري التحميل..."}</p>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(notif => {
              const colors = getNotificationColor(notif.type);
              return (
                <div 
                  key={notif.id} 
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    backgroundColor: colors.bg,
                    borderLeft: `4px solid ${colors.border}`,
                    cursor: 'pointer'
                  }}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{language === 'en' ? notif.title_en : notif.title_ar}</h4>
                    <p>{language === 'en' ? notif.message_en : notif.message_ar}</p>
                    {notif.opportunityTitle && (
                      <div className="opportunity-info">
                        <small>
                          {language === 'en' ? 'Opportunity:' : 'الفرصة:'} {notif.opportunityTitle}
                        </small>
                      </div>
                    )}
                    {notif.rejectionReason && (
                      <div className="rejection-reason">
                        <small>
                          {language === 'en' ? 'Reason:' : 'السبب:'} {notif.rejectionReason}
                        </small>
                      </div>
                    )}
                    <span className="notification-time">
                      {getTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.read && <div className="unread-dot"></div>}
                  <button 
                    className="delete-notification-btn" 
                    onClick={(e) => deleteNotification(notif.id, e)}
                    title={t.delete}
                  >
                    ×
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p className="empty-text">{t.empty}</p>
            </div>
          )}
        </div>
        
        <div className="notification-footer">
          <div className="notification-stats">
            <span>
              {filteredNotifications.length} {language === 'en' ? 'notifications' : 'إشعار'}
              {filter === 'unread' && ` (${notifications.filter(n => !n.read).length} ${language === 'en' ? 'unread' : 'غير مقروء'})`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
