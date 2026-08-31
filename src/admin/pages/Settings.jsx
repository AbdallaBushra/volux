import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { uploadImageToStorage } from "../../utils/uploadHelper";
import { defaultLeaderboardSettings, readLeaderboardSettings } from "../../utils/leaderboard";
import "../styles/admin.css";

const normalizeLeaderboardSettings = (settings = {}) => {
  const maxRaw = Number.parseInt(settings.maxVisibleUsers, 10);
  const maxVisibleUsers = Number.isNaN(maxRaw) ? defaultLeaderboardSettings.maxVisibleUsers : Math.min(100, Math.max(5, maxRaw));

  const defaultMetric = settings.defaultMetric === "hours" ? "hours" : "points";
  const defaultTimeFilter = settings.defaultTimeFilter === "week" || settings.defaultTimeFilter === "month" ? settings.defaultTimeFilter : "all";

  return {
    defaultMetric,
    defaultTimeFilter,
    maxVisibleUsers,
    hideZeroScores: Boolean(settings.hideZeroScores),
    showMedals: settings.showMedals !== false,
    allowMetricSwitch: settings.allowMetricSwitch !== false,
    allowTimeFilter: settings.allowTimeFilter !== false,
  };
};

const Settings = () => {
  const navigate = useNavigate();

  const [adminProfile, setAdminProfile] = useState({
    fullName: "",
    email: "",
    photoURL: "",
  });

  const [leaderboardSettings, setLeaderboardSettings] = useState(defaultLeaderboardSettings);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLeaderboard, setIsSavingLeaderboard] = useState(false);
  const [isResettingLeaderboard, setIsResettingLeaderboard] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [profileSnapshot, setProfileSnapshot] = useState(null);
  const [leaderboardSnapshot, setLeaderboardSnapshot] = useState(defaultLeaderboardSettings);

  const showNotification = (type, message, timeout = 5000) => {
    setNotification({ type, message });
    window.setTimeout(() => setNotification({ type: "", message: "" }), timeout);
  };

  const syncAdminLocalStorage = (patchData) => {
    const keys = ["adminData", "currentAdmin", "currentUser"];
    keys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        localStorage.setItem(key, JSON.stringify({ ...parsed, ...patchData }));
      } catch {
        // Ignore malformed local payloads
      }
    });
  };

  const saveLeaderboardSettingsToLocal = (normalizedSettings) => {
    let parsed = {};
    try {
      parsed = JSON.parse(localStorage.getItem("voluxAdminSettings") || "{}") || {};
    } catch {
      parsed = {};
    }
    const next = { ...parsed, leaderboardSettings: normalizedSettings };
    localStorage.setItem("voluxAdminSettings", JSON.stringify(next));
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const uid = auth.currentUser?.uid;
        const localAdminRaw = localStorage.getItem("adminData") || localStorage.getItem("currentAdmin");
        const localAdmin = localAdminRaw ? JSON.parse(localAdminRaw) : {};
        const localCurrentUserRaw = localStorage.getItem("currentUser");
        const localCurrentUser = localCurrentUserRaw ? JSON.parse(localCurrentUserRaw) : {};

        let firestoreUser = {};
        let firestoreProfile = {};
        if (uid) {
          const userRef = doc(db, "Users", uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) firestoreUser = userSnap.data();

          const profileRef = doc(db, "Users", uid, "Adminstation", "info");
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) firestoreProfile = profileSnap.data();
        }

        const mergedProfile = { ...localCurrentUser, ...localAdmin, ...firestoreUser, ...firestoreProfile };
        const composedName = [mergedProfile.firstName, mergedProfile.lastName].filter(Boolean).join(" ").trim();
        const fullName =
          mergedProfile.fullName ||
          mergedProfile.displayName ||
          mergedProfile.name ||
          mergedProfile.adminName ||
          composedName ||
          auth.currentUser?.displayName ||
          mergedProfile.email ||
          auth.currentUser?.email ||
          "Administrator";

        const email = mergedProfile.email || auth.currentUser?.email || "";
        const photoURL = mergedProfile.photoURL || mergedProfile.profileImage || mergedProfile.avatar || "";

        const profileState = { fullName, email, photoURL };
        setAdminProfile(profileState);
        setProfileSnapshot(profileState);
      } catch (error) {
        console.error("Error loading admin profile:", error);
      }

      try {
        const settingsRef = doc(db, "SystemConfig", "adminSettings");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data() || {};
          const normalized = normalizeLeaderboardSettings({
            ...defaultLeaderboardSettings,
            ...(data.leaderboardSettings || {}),
          });
          setLeaderboardSettings(normalized);
          setLeaderboardSnapshot(normalized);
          saveLeaderboardSettingsToLocal(normalized);
          return;
        }
      } catch (error) {
        console.error("Error loading Firestore settings:", error);
      }

      const fromLocal = readLeaderboardSettings();
      setLeaderboardSettings(fromLocal);
      setLeaderboardSnapshot(fromLocal);
    };

    loadSettings();
  }, []);

  const hasProfileChanges = useMemo(() => {
    if (!profileSnapshot) return false;
    return (
      profileSnapshot.fullName !== adminProfile.fullName ||
      profileSnapshot.photoURL !== adminProfile.photoURL
    );
  }, [adminProfile, profileSnapshot]);

  const hasLeaderboardChanges = useMemo(
    () => JSON.stringify(leaderboardSnapshot) !== JSON.stringify(normalizeLeaderboardSettings(leaderboardSettings)),
    [leaderboardSettings, leaderboardSnapshot]
  );

  const optimizeImageForUpload = (file) =>
    new Promise((resolve, reject) => {
      try {
        if (!file || !file.type?.startsWith("image/")) {
          resolve(file);
          return;
        }

        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
          const maxSide = 1200;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");

          if (!context) {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
            return;
          }

          context.drawImage(image, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              if (!blob) {
                resolve(file);
                return;
              }
              const optimizedFile = new File(
                [blob],
                `${file.name.replace(/\.[^/.]+$/, "") || "admin-photo"}.jpg`,
                { type: "image/jpeg" }
              );
              resolve(optimizedFile.size < file.size ? optimizedFile : file);
            },
            "image/jpeg",
            0.82
          );
        };

        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
        };

        image.src = objectUrl;
      } catch (error) {
        reject(error);
      }
    });

  const handleAdminPhotoUpload = async (event) => {
    const inputEl = event.target;
    try {
      const file = inputEl.files?.[0];
      if (!file) return;
      if (!file.type?.startsWith("image/")) {
        showNotification("error", "Please choose a valid image file.");
        return;
      }

      const uid = auth.currentUser?.uid;
      if (!uid) {
        showNotification("error", "Admin session not found. Please login again.");
        return;
      }

      setUploadingPhoto(true);
      const optimizedFile = await optimizeImageForUpload(file);
      const result = await uploadImageToStorage(optimizedFile, "profile-images/admins", uid);
      if (!result.success || !result.url) {
        showNotification("error", result.error || "Failed to upload image.");
        return;
      }

      await setDoc(
        doc(db, "Users", uid),
        {
          photoURL: result.url,
          profileImage: result.url,
          avatar: result.url,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "Users", uid, "Adminstation", "info"),
        {
          photoURL: result.url,
          profileImage: result.url,
          avatar: result.url,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setAdminProfile((prev) => ({ ...prev, photoURL: result.url }));
      syncAdminLocalStorage({ photoURL: result.url, profileImage: result.url, avatar: result.url });
      showNotification("success", "Admin photo updated successfully.");
    } catch (error) {
      console.error("Error uploading admin photo:", error);
      showNotification("error", "Failed to upload admin photo.");
    } finally {
      setUploadingPhoto(false);
      if (inputEl) inputEl.value = "";
    }
  };

  const handleSaveProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      showNotification("error", "Admin session not found. Please login again.");
      return;
    }

    const fullName = String(adminProfile.fullName || "").trim();
    if (!fullName) {
      showNotification("error", "Admin name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await setDoc(
        doc(db, "Users", uid),
        {
          fullName,
          displayName: fullName,
          adminName: fullName,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "Users", uid, "Adminstation", "info"),
        {
          fullName,
          displayName: fullName,
          photoURL: adminProfile.photoURL || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: fullName,
            photoURL: adminProfile.photoURL || null,
          });
        }
      } catch (profileError) {
        console.warn("Unable to update auth profile:", profileError);
      }

      setAdminProfile((prev) => ({ ...prev, fullName }));
      setProfileSnapshot((prev) => ({ ...(prev || {}), fullName, photoURL: adminProfile.photoURL }));
      syncAdminLocalStorage({ fullName, displayName: fullName, adminName: fullName, photoURL: adminProfile.photoURL });
      showNotification("success", "Admin profile updated successfully.");
    } catch (error) {
      console.error("Error saving admin profile:", error);
      showNotification("error", "Failed to save admin profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveLeaderboardSettings = async () => {
    const normalized = normalizeLeaderboardSettings(leaderboardSettings);
    setIsSavingLeaderboard(true);
    try {
      await setDoc(
        doc(db, "SystemConfig", "adminSettings"),
        {
          leaderboardSettings: normalized,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid || "admin",
        },
        { merge: true }
      );

      saveLeaderboardSettingsToLocal(normalized);
      setLeaderboardSettings(normalized);
      setLeaderboardSnapshot(normalized);
      showNotification("success", "Leaderboard settings saved successfully.");
    } catch (error) {
      console.error("Error saving leaderboard settings:", error);
      showNotification("error", "Failed to save leaderboard settings.");
    } finally {
      setIsSavingLeaderboard(false);
    }
  };

  const handleResetLeaderboardData = async () => {
    const approved = window.confirm(
      "Are you sure you want to reset leaderboard display values to zero? This will not remove actual volunteer records."
    );
    if (!approved) return;

    setIsResettingLeaderboard(true);
    try {
      const resetPayload = {
        resetAt: serverTimestamp(),
        resetBy: auth.currentUser?.uid || "admin",
      };

      await setDoc(
        doc(db, "SystemConfig", "adminSettings"),
        {
          leaderboardReset: resetPayload,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid || "admin",
        },
        { merge: true }
      );

      localStorage.setItem(
        "voluxLeaderboardReset",
        JSON.stringify({
          resetAt: new Date().toISOString(),
          resetBy: auth.currentUser?.uid || "admin",
        })
      );
      showNotification("success", "Leaderboard display values were reset.");
    } catch (error) {
      console.error("Error resetting leaderboard display values:", error);
      showNotification("error", "Failed to reset leaderboard display values.");
    } finally {
      setIsResettingLeaderboard(false);
    }
  };

  const handleLogout = async () => {
    const approved = window.confirm("Are you sure you want to logout from admin panel?");
    if (!approved) return;

    setIsLoggingOut(true);
    try {
      await auth.signOut();

      const authKeys = [
        "currentUser",
        "userData",
        "userRole",
        "adminData",
        "currentAdmin",
        "institutionData",
        "currentInstitution",
        "volunteerData",
        "currentVolunteer",
        "teamData",
        "currentTeam",
      ];
      authKeys.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
      localStorage.removeItem("adminToken");

      setTimeout(() => {
        navigate("/admin-login");
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Error during logout:", error);
      showNotification("error", "Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="admin-settings-page">
      <div className="settings-page-header">
        <div>
          <h1 className="settings-main-title">Admin Settings</h1>
          <p className="settings-main-subtitle">Manage your admin profile and leaderboard behavior.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              opacity: isLoggingOut ? 0.7 : 1,
            }}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>

      {notification.message && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">{notification.type === "success" ? "✓" : "✕"}</span>
            <span className="notification-text">{notification.message}</span>
          </div>
          <button className="notification-close" onClick={() => setNotification({ type: "", message: "" })}>
            ×
          </button>
        </div>
      )}

      <div className="settings-container">
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">A</div>
            <div className="card-title">
              <h3>Admin Personal Data</h3>
              <p>Only admin identity data is managed here.</p>
            </div>
          </div>
          <div className="card-body">
            <div className="admin-profile-settings-card" style={{ marginBottom: "16px" }}>
              <div className="admin-profile-left">
                <img
                  src={adminProfile.photoURL || "https://via.placeholder.com/200?text=Admin"}
                  alt="Admin"
                  className="admin-profile-avatar"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/200?text=Admin";
                  }}
                />
                <div className="admin-profile-meta">
                  <h3>{adminProfile.fullName || adminProfile.email || "Admin"}</h3>
                  <p>{adminProfile.email}</p>
                </div>
              </div>
              <div className="admin-profile-right">
                <label className="admin-upload-btn">
                  {uploadingPhoto ? "Uploading..." : "Upload New Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAdminPhotoUpload}
                    disabled={uploadingPhoto}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>Admin Name</label>
              <input
                type="text"
                value={adminProfile.fullName}
                onChange={(e) => setAdminProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Admin full name"
              />
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>Email</label>
              <input type="email" value={adminProfile.email} disabled />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={isSavingProfile || !hasProfileChanges}>
                {isSavingProfile ? "Saving..." : "Save Personal Data"}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">L</div>
            <div className="card-title">
              <h3>Leaderboard Settings</h3>
              <p>Flexible controls for leaderboard behavior and display.</p>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>Default Metric</label>
              <select
                value={leaderboardSettings.defaultMetric}
                onChange={(e) => setLeaderboardSettings((prev) => ({ ...prev, defaultMetric: e.target.value }))}
              >
                <option value="points">Points</option>
                <option value="hours">Hours</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>Default Time Filter</label>
              <select
                value={leaderboardSettings.defaultTimeFilter}
                onChange={(e) => setLeaderboardSettings((prev) => ({ ...prev, defaultTimeFilter: e.target.value }))}
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>Max Visible Users</label>
              <input
                type="number"
                min="5"
                max="100"
                value={leaderboardSettings.maxVisibleUsers}
                onChange={(e) => setLeaderboardSettings((prev) => ({ ...prev, maxVisibleUsers: e.target.value }))}
              />
            </div>

            <div className="notification-option" style={{ marginBottom: "10px" }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={leaderboardSettings.showMedals}
                  onChange={(e) => setLeaderboardSettings((prev) => ({ ...prev, showMedals: e.target.checked }))}
                />
                <span className="checkmark"></span>
                <div className="checkbox-content">
                  <span className="checkbox-title">Show Top 3 Medals</span>
                </div>
              </label>
            </div>

            <div className="notification-option" style={{ marginBottom: "10px" }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={leaderboardSettings.hideZeroScores}
                  onChange={(e) => setLeaderboardSettings((prev) => ({ ...prev, hideZeroScores: e.target.checked }))}
                />
                <span className="checkmark"></span>
                <div className="checkbox-content">
                  <span className="checkbox-title">Hide Users with Zero Scores</span>
                </div>
              </label>
            </div>

            <div className="notification-option" style={{ marginBottom: "10px" }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={leaderboardSettings.allowMetricSwitch}
                  onChange={(e) => setLeaderboardSettings((prev) => ({ ...prev, allowMetricSwitch: e.target.checked }))}
                />
                <span className="checkmark"></span>
                <div className="checkbox-content">
                  <span className="checkbox-title">Allow Metric Switch on Leaderboard Page</span>
                </div>
              </label>
            </div>

            <div className="notification-option" style={{ marginBottom: "16px" }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={leaderboardSettings.allowTimeFilter}
                  onChange={(e) => setLeaderboardSettings((prev) => ({ ...prev, allowTimeFilter: e.target.checked }))}
                />
                <span className="checkmark"></span>
                <div className="checkbox-content">
                  <span className="checkbox-title">Allow Time Filter on Leaderboard Page</span>
                </div>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn-secondary"
                onClick={handleResetLeaderboardData}
                disabled={isResettingLeaderboard}
                style={{ borderColor: "#f59e0b", color: "#a16207" }}
              >
                {isResettingLeaderboard ? "Resetting..." : "Reset Leaderboard Display"}
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveLeaderboardSettings}
                disabled={isSavingLeaderboard || !hasLeaderboardChanges}
              >
                {isSavingLeaderboard ? "Saving..." : "Save Leaderboard Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
