import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import { fetchLeaderboardUsers, loadLeaderboardSettings, readLeaderboardSettings } from "./utils/leaderboard";
import { FaMedal } from "react-icons/fa";
import "./styles/LeaderboardPage.css";

const LeaderboardPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardConfig, setLeaderboardConfig] = useState(readLeaderboardSettings());
  const [filter, setFilter] = useState("points");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      const { settings } = await loadLeaderboardSettings();
      if (!mounted) return;
      setLeaderboardConfig(settings);
      setFilter(settings.defaultMetric);
      setTimeFilter(settings.defaultTimeFilter);
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const users = await fetchLeaderboardUsers({
          timeFilter,
          hideZeroScores: leaderboardConfig.hideZeroScores,
          maxVisibleUsers: leaderboardConfig.maxVisibleUsers,
        });
        const metric = filter === "hours" ? "hours" : "points";
        users.sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
        setLeaderboardData(users.slice(0, leaderboardConfig.maxVisibleUsers));
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filter, timeFilter, leaderboardConfig]);

  const translations = {
    en: {
      title: "Leaderboard",
      subtitle: "Top volunteers making an impact in Sudan",
      points: "Points",
      hours: "Hours",
      rank: "Rank",
      volunteer: "Volunteer",
      allTime: "All Time",
      thisMonth: "This Month",
      thisWeek: "This Week",
      back: "Back to Home",
      loading: "Loading leaderboard...",
      empty: "No data available for the selected settings.",
      currentLeader: "Current leader",
      rankLabel: "Rank",
    },
    ar: {
      title: "قائمة المتصدرين",
      subtitle: "أفضل المتطوعين المؤثرين في السودان",
      points: "النقاط",
      hours: "الساعات",
      rank: "الترتيب",
      volunteer: "المتطوع",
      allTime: "كل الوقت",
      thisMonth: "هذا الشهر",
      thisWeek: "هذا الأسبوع",
      back: "العودة للرئيسية",
      loading: "جاري تحميل الليدربورد...",
      empty: "لا توجد بيانات مطابقة للإعدادات الحالية.",
      currentLeader: "المتصدر الحالي",
      rankLabel: "الترتيب",
    },
  };

  const t = translations[language];
  const metricLabel = filter === "points" ? t.points : t.hours;
  const podiumUsers = leaderboardData.slice(0, 3);

  return (
    <div className={`leaderboard-page ${language === "ar" ? "rtl" : ""}`}>
      <div className="leaderboard-container">
        <header className="leaderboard-header">
          <button className="back-btn" onClick={() => navigate("/")} aria-label={t.back} title={t.back}>
            <span className="back-arrow" aria-hidden="true">
              ←
            </span>
          </button>
          <div className="leaderboard-title-card">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </header>

        <div className="leaderboard-controls">
          {leaderboardConfig.allowMetricSwitch && (
            <div className="filter-group">
              <button className={filter === "points" ? "active" : ""} onClick={() => setFilter("points")}>
                {t.points}
              </button>
              <button className={filter === "hours" ? "active" : ""} onClick={() => setFilter("hours")}>
                {t.hours}
              </button>
            </div>
          )}

          {leaderboardConfig.allowTimeFilter && (
            <div className="time-group">
              <button className={timeFilter === "all" ? "active" : ""} onClick={() => setTimeFilter("all")}>
                {t.allTime}
              </button>
              <button className={timeFilter === "month" ? "active" : ""} onClick={() => setTimeFilter("month")}>
                {t.thisMonth}
              </button>
              <button className={timeFilter === "week" ? "active" : ""} onClick={() => setTimeFilter("week")}>
                {t.thisWeek}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading">{t.loading}</div>
        ) : leaderboardData.length === 0 ? (
          <div className="loading">{t.empty}</div>
        ) : (
          <>
            <div className="leaderboard-podium" aria-label={t.currentLeader}>
              {podiumUsers.map((user, index) => (
                <article className={`podium-card podium-${index + 1}`} key={user.id || `${user.name}-${index}`}>
                  <span className="podium-rank">{t.rankLabel} {index + 1}</span>
                  <div className="podium-avatar">{(user.name || "V").charAt(0)}</div>
                  <h3>{user.name}</h3>
                  <p>
                    {metricLabel}: <strong>{user[filter] || 0}</strong>
                  </p>
                </article>
              ))}
            </div>

            <div className="leaderboard-card leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>{t.rank}</th>
                    <th>{t.volunteer}</th>
                    <th>{metricLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((user, index) => (
                    <tr key={user.id} className={index < 3 ? `top-rank rank-${index + 1}` : ""}>
                      <td>
                        <span className="lb-rank-number">{index + 1}</span>
                        {leaderboardConfig.showMedals && index === 0 && <FaMedal className="lb-medal medal-gold" aria-hidden="true" />}
                        {leaderboardConfig.showMedals && index === 1 && <FaMedal className="lb-medal medal-silver" aria-hidden="true" />}
                        {leaderboardConfig.showMedals && index === 2 && <FaMedal className="lb-medal medal-bronze" aria-hidden="true" />}
                      </td>
                      <td>
                        <div className="lb-volunteer-info">
                          <div className="lb-avatar">{(user.name || "V").charAt(0)}</div>
                          <span className="lb-name">{user.name}</span>
                        </div>
                      </td>
                      <td className="lb-value">{user[filter] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
