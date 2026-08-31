import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const defaultLeaderboardSettings = {
  defaultMetric: "points",
  defaultTimeFilter: "all",
  maxVisibleUsers: 20,
  hideZeroScores: false,
  showMedals: true,
  allowMetricSwitch: true,
  allowTimeFilter: true,
};

const normalizeMetric = (metric) => (metric === "hours" ? "hours" : "points");
const normalizeTimeFilter = (timeFilter) => {
  if (timeFilter === "week" || timeFilter === "month") return timeFilter;
  return "all";
};
const clampMaxUsers = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return defaultLeaderboardSettings.maxVisibleUsers;
  return Math.min(100, Math.max(5, parsed));
};

const normalizeLeaderboardSettings = (settings = {}) => ({
  defaultMetric: normalizeMetric(settings.defaultMetric),
  defaultTimeFilter: normalizeTimeFilter(settings.defaultTimeFilter),
  maxVisibleUsers: clampMaxUsers(settings.maxVisibleUsers),
  hideZeroScores: Boolean(settings.hideZeroScores),
  showMedals: settings.showMedals !== false,
  allowMetricSwitch: settings.allowMetricSwitch !== false,
  allowTimeFilter: settings.allowTimeFilter !== false,
});

const parseResetDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const readLeaderboardSettings = () => {
  try {
    const raw = localStorage.getItem("voluxAdminSettings");
    if (!raw) return { ...defaultLeaderboardSettings };
    const parsed = JSON.parse(raw) || {};
    const source = parsed.leaderboardSettings || parsed;
    return normalizeLeaderboardSettings({ ...defaultLeaderboardSettings, ...source });
  } catch {
    return { ...defaultLeaderboardSettings };
  }
};

export const loadLeaderboardSettings = async () => {
  let settings = readLeaderboardSettings();
  let remoteResetAt = null;

  try {
    const settingsSnap = await getDoc(doc(db, "SystemConfig", "adminSettings"));
    if (settingsSnap.exists()) {
      const config = settingsSnap.data() || {};
      if (config.leaderboardSettings) {
        settings = normalizeLeaderboardSettings({
          ...defaultLeaderboardSettings,
          ...settings,
          ...config.leaderboardSettings,
        });
        localStorage.setItem("voluxAdminSettings", JSON.stringify({ leaderboardSettings: settings }));
      }
      remoteResetAt = parseResetDate(config.leaderboardReset?.resetAt);
    }
  } catch (error) {
    console.error("Error loading remote leaderboard config:", error);
  }

  return { settings, remoteResetAt };
};

const getDisplayStats = (lbData, resetAt) => {
  let points = lbData.points || 0;
  let hours = lbData.hours || 0;

  if (resetAt && lbData.updatedAt?.toDate) {
    const updatedAt = lbData.updatedAt.toDate();
    if (updatedAt < resetAt) {
      points = 0;
      hours = 0;
    }
  }

  return { points, hours };
};

const passesTimeFilter = (lbData, timeFilter) => {
  if (timeFilter === "all") return true;
  if (!lbData.updatedAt?.toDate) return false;

  const updatedAt = lbData.updatedAt.toDate();
  const now = new Date();
  const cutoff = new Date(now);

  if (timeFilter === "week") {
    cutoff.setDate(now.getDate() - 7);
  } else if (timeFilter === "month") {
    cutoff.setMonth(now.getMonth() - 1);
  }

  return updatedAt >= cutoff;
};

export const fetchLeaderboardUsers = async (options = {}) => {
  const { settings, remoteResetAt } = await loadLeaderboardSettings();

  const effectiveSettings = {
    ...settings,
    ...options,
    defaultMetric: normalizeMetric(options.defaultMetric || settings.defaultMetric),
    defaultTimeFilter: normalizeTimeFilter(options.timeFilter || settings.defaultTimeFilter),
    maxVisibleUsers: clampMaxUsers(options.maxVisibleUsers ?? settings.maxVisibleUsers),
    hideZeroScores: options.hideZeroScores ?? settings.hideZeroScores,
  };

  const usersSnapshot = await getDocs(collection(db, "Users"));
  const resetData = JSON.parse(localStorage.getItem("voluxLeaderboardReset") || "{}");
  const resetAt = remoteResetAt || parseResetDate(resetData.resetAt);

  const users = await Promise.all(
    usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      if (userData.role !== "volunteer") {
        return null;
      }

      const lbRef = doc(db, "Rewards", userDoc.id, "Leaderboard", "stats");
      const lbSnap = await getDoc(lbRef);
      if (!lbSnap.exists()) {
        return null;
      }

      const lbData = lbSnap.data();
      if (!passesTimeFilter(lbData, effectiveSettings.defaultTimeFilter)) {
        return null;
      }

      const displayStats = getDisplayStats(lbData, resetAt);
      if (effectiveSettings.hideZeroScores && displayStats.points <= 0 && displayStats.hours <= 0) {
        return null;
      }

      return {
        id: userDoc.id,
        name: lbData.name || userData.displayName || "Volunteer",
        points: displayStats.points,
        hours: displayStats.hours,
        avatar: lbData.avatar || null,
      };
    })
  );

  return users.filter(Boolean);
};
