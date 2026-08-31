import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import { auth, db } from "./firebase/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { addOpportunity, deleteOpportunity, addComplaint } from "./database/opportunityData";
import { addCertificate, addBadge, updateLevel, updateLeaderboard, logPointsTransaction } from "./database/userData";
import "./styles/OpportunitiesManagement.css";
import { calculatePointsForCompletion, calculateLevel, computeBadges } from './gamification/engine';
import { SUDAN_STATES, getStateFromArabic, getStateFromEnglish } from "./constants/sudanStates";
import { volunteerViolationOptions } from "./constants/registrationContent";
import { FiTrash2, FiUsers } from "react-icons/fi";

const DEFAULT_CATEGORY_OPTIONS = [
  { value: "environmental", en: "Environmental", ar: "بيئي" },
  { value: "education", en: "Education", ar: "تعليم" },
  { value: "health", en: "Health", ar: "صحي" },
];

const getApplicantName = (app) =>
  app?.volunteer?.fullName ||
  app?.volunteer?.displayName ||
  app?.volunteer?.name ||
  app?.volunteer?.email ||
  "N/A";

const formatApplicantValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "N/A";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function OpportunitiesManagement() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [userType, setUserType] = useState('volunteer');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingVolunteer, setReportingVolunteer] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusApplicantId, setBonusApplicantId] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);

  const [newOpportunity, setNewOpportunity] = useState({
    titleAr: "",
    titleEn: "",
    category: "",
    locationAr: "",
    locationEn: "",
    stateAr: "",
    stateEn: "",
    volunteersNeeded: "",
    hours: "",
    date: "",
    endDate: "",
    descriptionAr: "",
    descriptionEn: "",
    imageUrl: "",
    importance: "medium",
    opportunityMode: "field"
  });

  // Form handler for "Add New Opportunity"
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let v = value;

    if (type === "number") {
      v = value === "" ? "" : Number(value);
    } else if (type === "checkbox") {
      v = checked;
    } else if (type === "file") {
      const file = files && files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewOpportunity((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
      return;
    }

    if (name === "stateAr") {
      const match = getStateFromArabic(v);
      setNewOpportunity((prev) => ({
        ...prev,
        stateAr: v,
        stateEn: match ? match.en : prev.stateEn,
      }));
      return;
    }

    if (name === "stateEn") {
      const match = getStateFromEnglish(v);
      setNewOpportunity((prev) => ({
        ...prev,
        stateEn: v,
        stateAr: match ? match.ar : prev.stateAr,
      }));
      return;
    }

    setNewOpportunity((prev) => ({ ...prev, [name]: v }));
  };

  // Delete opportunity safely (avoid runtime errors)
  const handleDelete = async (oppId) => {
    const msg =
      language === "en"
        ? "Delete this opportunity permanently?"
        : "هل تريد حذف هذه الفرصة نهائياً؟";

    if (!window.confirm(msg)) return;

    try {
      await deleteOpportunity(oppId);
      setOpportunities((prev) => prev.filter((o) => o.id !== oppId));
      if (selectedOpp?.id === oppId) setSelectedOpp(null);
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      alert(language === "en" ? "Failed to delete." : "فشل حذف الفرصة.");
    }
  };

  const fetchMyOpportunities = async (uid) => {
    try {
      const q = query(collection(db, "Opportunities"), where("createdBy", "==", uid));
      const querySnapshot = await getDocs(q);
      const opps = [];
      for (const docSnapshot of querySnapshot.docs) {
        const oppData = docSnapshot.data();
        // Fetch applicant count
        const appQ = query(collection(db, "Applications"), where("opportunityId", "==", docSnapshot.id));
        const appSnap = await getDocs(appQ);
        opps.push({ 
          id: docSnapshot.id, 
          ...oppData, 
          applicantCount: appSnap.size 
        });
      }
      setOpportunities(opps);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const userRef = doc(db, "Users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const baseUserData = userSnap.data();
          const normalizedRole = baseUserData.role === "organization" ? "institution" : (baseUserData.role || "volunteer");
          setUserType(normalizedRole);

          let mergedUserData = { ...baseUserData };
          if (normalizedRole === "institution" || normalizedRole === "team") {
            const subCollection = normalizedRole === "team" ? "Volunteer_Team_Profile" : "Organization_Profile";
            const profileRef = doc(db, "Users", user.uid, subCollection, "info");
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              mergedUserData = { ...mergedUserData, ...profileSnap.data() };
            }
          }

          setCurrentUserData(mergedUserData);

          const fieldsOfWork = Array.isArray(mergedUserData.fieldsOfWork)
            ? mergedUserData.fieldsOfWork.filter(Boolean)
            : [];
          setAllowedCategories(fieldsOfWork);

          await fetchMyOpportunities(user.uid);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [navigate]);

  useEffect(() => {
    const isRestrictedRole = userType === "institution" || userType === "team";
    if (!isRestrictedRole || allowedCategories.length === 0) return;

    setNewOpportunity((prev) => {
      if (allowedCategories.includes(prev.category)) return prev;
      return { ...prev, category: allowedCategories[0] };
    });
  }, [userType, allowedCategories]);

  const restrictedCategories = (userType === "institution" || userType === "team")
    ? allowedCategories
    : [];
  const hasRestrictedCategories = restrictedCategories.length > 0;
  const categoryOptions = hasRestrictedCategories
    ? restrictedCategories.map((category) => ({ value: category, label: category }))
    : DEFAULT_CATEGORY_OPTIONS.map((category) => ({ value: category.value, label: category[language] }));

  const handleViewApplicants = async (opp) => {
    setSelectedOpp(opp);
    setLoadingApplicants(true);
    try {
      const q = query(collection(db, "Applications"), where("opportunityId", "==", opp.id));
      const querySnapshot = await getDocs(q);
      const apps = [];
      for (const docSnapshot of querySnapshot.docs) {
        const appData = docSnapshot.data();
        // Fetch volunteer details
        const userRef = doc(db, "Users", appData.userId);
        const userSnap = await getDoc(userRef);
        let volunteerInfo = {};
        if (userSnap.exists()) {
          const role = userSnap.data().role;
          const profileRef = doc(db, "Users", appData.userId, role === "volunteer" ? "Volunteer_Profile" : (role === "team" ? "Volunteer_Team_Profile" : "Organization_Profile"), "info");
          const profileSnap = await getDoc(profileRef);
          volunteerInfo = profileSnap.exists() ? profileSnap.data() : userSnap.data();
        }
        apps.push({ id: docSnapshot.id, ...appData, volunteer: volunteerInfo });
      }
      setApplicants(apps);
    } catch (error) {
      console.error("Error fetching applicants:", error);
    }
    setLoadingApplicants(false);
  };

  const handleReportVolunteer = async () => {
    const selectedViolation = volunteerViolationOptions.find((item) => item.value === reportReason);
    if (!selectedViolation) {
      alert(language === "en" ? "Please select a violation type." : "يرجى اختيار نوع المخالفة.");
      return;
    }
    if (!reportDetails.trim()) {
      alert(language === "en" ? "Please provide report details." : "يرجى تقديم تفاصيل الشكوى.");
      return;
    }
    try {
      await addComplaint(auth.currentUser.uid, {
        reporterName: currentUserData?.name || currentUserData?.institutionName || currentUserData?.teamName || "N/A",
        reporterRole: userType,
        reporterEmail: currentUserData?.email || auth.currentUser?.email || "N/A",
        volunteerId: reportingVolunteer.userId,
        volunteerName: getApplicantName(reportingVolunteer),
        volunteerEmail: reportingVolunteer.volunteer?.email || "N/A",
        opportunityId: selectedOpp.id,
        opportunityTitle: language === "en" ? selectedOpp.title_en : selectedOpp.title_ar,
        details: reportDetails,
        reasonLabel: selectedViolation.labels[language],
        violationType: selectedViolation.value,
        consequence: selectedViolation.consequence[language],
        pointsPenalty: selectedViolation.pointsPenalty,
        reason: language === "en" ? "Volunteer Violation" : "مخالفة متطوع",
        status: "pending"
      });

      if (reportingVolunteer.userId) {
        const userRef = doc(db, "Users", reportingVolunteer.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const nextViolationCount = Number(userData.violationCount || 0) + 1;
        const nextPoints = Math.max(0, Number(userData.points || 0) - Number(selectedViolation.pointsPenalty || 0));
        const accountabilityPayload = {
          violationCount: nextViolationCount,
          lastViolationType: selectedViolation.value,
          lastViolationAt: serverTimestamp(),
          points: nextPoints,
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, accountabilityPayload, { merge: true });
        await setDoc(doc(db, "Users", reportingVolunteer.userId, "Volunteer_Profile", "info"), accountabilityPayload, { merge: true });

        const historyRef = doc(collection(db, "Users", reportingVolunteer.userId, "Violation_History"));
        await setDoc(historyRef, {
          reporterId: auth.currentUser.uid,
          reporterName: currentUserData?.name || currentUserData?.institutionName || currentUserData?.teamName || "N/A",
          opportunityId: selectedOpp.id,
          opportunityTitle: language === "en" ? selectedOpp.title_en : selectedOpp.title_ar,
          details: reportDetails,
          violationType: selectedViolation.value,
          reason: selectedViolation.labels[language],
          consequence: selectedViolation.consequence[language],
          pointsPenalty: selectedViolation.pointsPenalty,
          status: "pending",
          createdAt: serverTimestamp(),
        });

        const notifRef = doc(collection(db, "Notifications", reportingVolunteer.userId, "in_App"));
        await setDoc(notifRef, {
          userId: reportingVolunteer.userId,
          title_ar: "تم تسجيل مخالفة",
          title_en: "Violation Recorded",
          message_ar: `تم تسجيل مخالفة: ${selectedViolation.labels.ar}. الإجراء: ${selectedViolation.consequence.ar}`,
          message_en: `A violation was recorded: ${selectedViolation.labels.en}. Consequence: ${selectedViolation.consequence.en}`,
          type: "violation",
          read: false,
          opportunityId: selectedOpp.id,
          createdAt: serverTimestamp(),
        });
      }
      alert(language === "en" ? "Report submitted successfully." : "تم تقديم الشكوى بنجاح.");
      setShowReportModal(false);
      setReportReason("");
      setReportDetails("");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert(language === "en" ? "Failed to submit report." : "فشل تقديم الشكوى.");
    }
  };

  const handleCompleteOpportunity = async (opp) => {
    const confirmMsg =
      language === "en"
        ? "Are you sure you want to mark this opportunity as completed? This will award hours/points to all registered volunteers (except rejected)."
        : "هل أنت متأكد من إكمال هذه الفرصة؟ سيتم منح الساعات والنقاط لجميع المتطوعين المسجلين (ما عدا المرفوضين).";

    if (!window.confirm(confirmMsg)) return;

    setCompleting(true);

    try {
      // 1) Mark opportunity as completed
      await updateDoc(doc(db, "Opportunities", opp.id), {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      // 2) Load applications for this opportunity
      const appsQ = query(collection(db, "Applications"), where("opportunityId", "==", opp.id));
      const appsSnap = await getDocs(appsQ);
      const apps = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Eligible volunteers: registered/accepted/approved, excluding rejected/declined.
      // Also skip ones already completed to avoid double-awarding.
      const eligibleApps = apps.filter((a) => {
        const s = String(a.status || "").toLowerCase();
        if (["rejected", "declined", "refused"].includes(s)) return false;
        if (s === "completed") return false;
        return ["accepted", "approved"].includes(s);
      });

      if (eligibleApps.length === 0) {
        alert(
          language === "en"
            ? "Opportunity marked as completed (no eligible volunteers found)."
            : "تم تحديد الفرصة كمكتملة (لا يوجد متطوعين مؤهلين)."
        );
        await fetchMyOpportunities(auth.currentUser.uid);
        setSelectedOpp(null);
        return;
      }

      const hoursToAward = Number(opp.hours ?? 0) > 0 ? Number(opp.hours) : 0;
      const pointsToAward = calculatePointsForCompletion({ hours: hoursToAward });

      const trainingHoursToAward = Number(opp.trainingHours ?? 0) > 0 ? Number(opp.trainingHours) : 0;
      const isTrainingOpportunity =
        Boolean(opp.isTrainingWorkshop || opp.isWorkshop || opp.isTraining) ||
        String(opp.opportunityType || opp.type || "").toLowerCase() === "training" ||
        trainingHoursToAward > 0;

      for (const app of eligibleApps) {
        const userId = app.userId;
        if (!userId) continue;
        const bonusPoints = app.bonusVolunteer ? Number(app.bonusPoints || 5) : 0;
        const totalPointsAward = pointsToAward + bonusPoints;

        // Always mark application completed + store award metadata
        try {
          await updateDoc(doc(db, "Applications", app.id), {
            status: "completed",
            completedAt: serverTimestamp(),
            hoursAwarded: hoursToAward,
            pointsAwarded: totalPointsAward,
            bonusPointsAwarded: bonusPoints,
          });
        } catch (e) {
          console.error("Failed updating application:", app.id, e);
        }

        try {
          const userRef = doc(db, "Users", userId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};
          const role = userData?.role || "volunteer";

          const profileSub =
            role === "team"
              ? "Volunteer_Team_Profile"
              : role === "organization"
              ? "Organization_Profile"
              : "Volunteer_Profile";

          const profileRef = doc(db, "Users", userId, profileSub, "info");
          const profileSnap = await getDoc(profileRef);
          const profileData = profileSnap.exists() ? profileSnap.data() : {};

          const currentPoints = Number(profileData.points ?? userData.points ?? 0);
          const currentVolHours = Number(
            profileData.volunteeringHours ?? profileData.hours ?? userData.volunteeringHours ?? userData.hours ?? 0
          );
          const currentTrainingHours = Number(profileData.trainingHours ?? userData.trainingHours ?? 0);
          const currentTrainingCourses = Number(profileData.trainingCourses ?? userData.trainingCourses ?? 0);
          const currentCompletedOpps = Number(
            profileData.completedOpportunities ?? userData.completedOpportunities ?? 0
          );
          const currentOppsJoined = Number(
            profileData.opportunitiesJoined ?? userData.opportunitiesJoined ?? currentCompletedOpps ?? 0
          );

          const newPoints = currentPoints + totalPointsAward;
          const newVolHours = currentVolHours + hoursToAward;
          const completedOpps = currentCompletedOpps + 1;
          const opportunitiesJoined = currentOppsJoined + 1;

          const nextTrainingHours = isTrainingOpportunity
            ? currentTrainingHours + trainingHoursToAward
            : currentTrainingHours;
          const nextTrainingCourses = isTrainingOpportunity
            ? currentTrainingCourses + 1
            : currentTrainingCourses;

          const previousLevel =
            profileData.level || userData.level || calculateLevel(currentPoints);
          const level = calculateLevel(newPoints);

          const { badges: computedBadges, newlyEarned } = computeBadges({
            totalPoints: newPoints,
            completedOpportunities: completedOpps,
            currentBadges: profileData.badges || userData.badges || [],
          });

          const updates = {
            points: newPoints,
            volunteeringHours: newVolHours,
            hours: newVolHours,
            opportunitiesJoined,
            completedOpportunities: completedOpps,
            level,
            badges: computedBadges,
            trainingHours: nextTrainingHours,
            trainingCourses: nextTrainingCourses,
            updatedAt: serverTimestamp(),
          };

          // Merge-safe writes even if docs didn't exist
          await setDoc(profileRef, updates, { merge: true });
          await setDoc(userRef, updates, { merge: true });

          // Rewards updates (non-blocking)
          try {
            await updateLevel(userId, {
              level,
              points: newPoints,
              hours: newVolHours,
              completedOpportunities: completedOpps,
            });
          } catch (e) {
            console.error("updateLevel failed:", userId, e);
          }

          try {
            await updateLeaderboard(userId, {
              points: newPoints,
              hours: newVolHours,
              name:
                profileData.fullName ||
                userData.displayName ||
                userData.name ||
                "Volunteer",
            });
          } catch (e) {
            console.error("updateLeaderboard failed:", userId, e);
          }

          try {
            await logPointsTransaction(userId, {
              reason: "opportunity_completed",
              opportunityId: opp.id,
              opportunityTitle: language === "en" ? opp.title_en : opp.title_ar,
              points: totalPointsAward,
              hours: hoursToAward,
              bonusPoints,
            });
          } catch (e) {
            console.error("logPointsTransaction failed:", userId, e);
          }

          // Certificate snapshot (non-blocking)
          try {
            const certId = `CERT-${Date.now()}-${userId.substring(0, 5)}`;
            await addCertificate(userId, {
              certificateId: certId,
              opportunityId: opp.id,
              opportunityTitle: language === "en" ? opp.title_en : opp.title_ar,
              organizationName: opp.ownerName || opp.createdByName || opp.organizationName || app.organizationName || "N/A",
              ownerName: opp.ownerName || opp.createdByName || opp.organizationName || app.organizationName || "N/A",
              date: new Date().toISOString(),
              points: totalPointsAward,
              hours: hoursToAward,
              bonusPoints,
            });
          } catch (e) {
            console.error("addCertificate failed:", userId, e);
          }

          // Badge + level + reward notifications (non-blocking)
          try {
            if (newlyEarned?.length) {
              for (const badgeName of newlyEarned) {
                const notifRef = doc(collection(db, "Notifications", userId, "in_App"));
                await setDoc(notifRef, {
                  userId,
                  title_ar: "وسام جديد!",
                  title_en: "New Badge Earned!",
                  message_ar: `تهانينا! لقد حصلت على وسام: ${badgeName}`,
                  message_en: `Congratulations! You earned the badge: ${badgeName}`,
                  type: "badge",
                  read: false,
                  createdAt: serverTimestamp(),
                });
                await addBadge(userId, { badgeName });
              }
            }

            if (level !== previousLevel) {
              const lvlNotifRef = doc(collection(db, "Notifications", userId, "in_App"));
              await setDoc(lvlNotifRef, {
                userId,
                title_ar: "تقدّم في المستوى!",
                title_en: "Level Up!",
                message_ar: `تهانينا! انتقلت إلى مستوى: ${level}`,
                message_en: `Congratulations! You reached level: ${level}`,
                type: "level",
                read: false,
                createdAt: serverTimestamp(),
              });
            }

            const rewardNotifRef = doc(collection(db, "Notifications", userId, "in_App"));
            await setDoc(rewardNotifRef, {
              userId,
              title_ar: "فرصة مكتملة",
              title_en: "Opportunity Completed",
              message_ar: `لقد حصلت على ${totalPointsAward} نقطة و ${hoursToAward} ساعة تطوعية.${bonusPoints ? " تشمل +5 نقاط تميز." : ""}`,
              message_en: `You earned ${totalPointsAward} points and ${hoursToAward} volunteering hours.${bonusPoints ? " Includes +5 bonus points." : ""}`,
              type: "reward",
              read: false,
              createdAt: serverTimestamp(),
            });
          } catch (e) {
            console.error("Notifications failed:", userId, e);
          }
        } catch (e) {
          console.error("Failed updating volunteer totals:", userId, e);
        }
      }

      alert(
        language === "en"
          ? "Opportunity marked as completed and rewards distributed!"
          : "تم إكمال الفرصة وتوزيع الساعات والنقاط!"
      );
      await fetchMyOpportunities(auth.currentUser.uid);
      setSelectedOpp(null);
    } catch (error) {
      console.error("Error completing opportunity:", error);
      alert(language === "en" ? "Failed to complete opportunity." : "فشل إكمال الفرصة.");
    } finally {
      setCompleting(false);
    }
  };

  const handleRejectApplicant = async (app) => {
    if (!app?.id) return;
    const confirmMsg = language === "en" ? "Reject this applicant?" : "رفض هذا المتقدم؟";
    if (!window.confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, "Applications", app.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      // Notify volunteer (best-effort)
      if (app.userId) {
        const notifRef = doc(collection(db, "Notifications", app.userId, "in_App"));
        await setDoc(
          notifRef,
          {
            userId: app.userId,
            title_ar: "تم رفض طلبك",
            title_en: "Application Rejected",
            message_ar: "للأسف تم رفض طلبك لهذه الفرصة التطوعية.",
            message_en: "Unfortunately, your application for this opportunity was rejected.",
            type: "application_rejected",
            read: false,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Update UI state
      setApplicants((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" } : a)));
    } catch (e) {
      console.error("Failed to reject applicant", e);
      alert(language === "en" ? "Failed to reject applicant." : "فشل رفض المتقدم.");
    }
  };

  const handleAcceptApplicant = async (app) => {
    if (!app?.id) return;
    try {
      await updateDoc(doc(db, "Applications", app.id), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      if (app.userId) {
        const notifRef = doc(collection(db, "Notifications", app.userId, "in_App"));
        await setDoc(notifRef, {
          userId: app.userId,
          title_ar: "تم قبول طلبك",
          title_en: "Application Accepted",
          message_ar: "تم قبولك في هذه الفرصة. سيتم منح المكافآت بعد تحديد اكتمال الفرصة.",
          message_en: "You have been accepted for this opportunity. Rewards are granted after the opportunity is marked completed.",
          type: "application_accepted",
          read: false,
          opportunityId: selectedOpp?.id,
          createdAt: serverTimestamp(),
        });
      }

      setApplicants((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "accepted" } : a)));
    } catch (e) {
      console.error("Failed to accept applicant", e);
      alert(language === "en" ? "Failed to accept applicant." : "فشل قبول المتقدم.");
    }
  };

  const handleSelectBonusApplicant = async () => {
    const app = applicants.find((item) => item.id === bonusApplicantId);
    if (!app?.id) return;

    try {
      await updateDoc(doc(db, "Applications", app.id), {
        bonusVolunteer: true,
        bonusPoints: 5,
        bonusSelectedAt: serverTimestamp(),
      });

      if (app.userId) {
        const notifRef = doc(collection(db, "Notifications", app.userId, "in_App"));
        await setDoc(notifRef, {
          userId: app.userId,
          title_ar: "تم اختيارك كمتطوع مميز",
          title_en: "Bonus Volunteer Selected",
          message_ar: "تم اختيارك كمتطوع مميز لهذه الفرصة. ستحصل على 5 نقاط إضافية عند اكتمال الفرصة.",
          message_en: "You were selected as a bonus volunteer for this opportunity. You will receive 5 extra points after completion.",
          type: "bonus_volunteer",
          read: false,
          opportunityId: selectedOpp?.id,
          createdAt: serverTimestamp(),
        });
      }

      setApplicants((prev) => prev.map((item) => (item.id === app.id ? { ...item, bonusVolunteer: true, bonusPoints: 5 } : item)));
      setShowBonusModal(false);
      setBonusApplicantId("");
    } catch (e) {
      console.error("Failed to set bonus volunteer", e);
      alert(language === "en" ? "Failed to set bonus volunteer." : "فشل تحديد المتطوع المميز.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const user = auth.currentUser;

    if (newOpportunity.date && newOpportunity.endDate && newOpportunity.endDate < newOpportunity.date) {
      alert(language === "en" ? "End date cannot be before start date." : "تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية.");
      setSubmitting(false);
      return;
    }

    if (hasRestrictedCategories && !restrictedCategories.includes(newOpportunity.category)) {
      alert(language === "en" ? "Category must match your registered fields of work." : "يجب أن تكون فئة الفرصة ضمن مجالات العمل المسجلة.");
      setSubmitting(false);
      return;
    }

    const ownerDisplayName =
      currentUserData?.orgNameAr ||
      currentUserData?.orgNameEn ||
      currentUserData?.institutionName ||
      currentUserData?.organizationName ||
      currentUserData?.teamNameAr ||
      currentUserData?.teamNameEn ||
      currentUserData?.teamName ||
      currentUserData?.displayName ||
      currentUserData?.name ||
      currentUserData?.email ||
      "N/A";
    
    const oppData = {
      title_ar: newOpportunity.titleAr,
      title_en: newOpportunity.titleEn,
      category: newOpportunity.category,
      location: newOpportunity.locationAr,
      location_en: newOpportunity.locationEn,
      state_ar: newOpportunity.stateAr,
      state_en: newOpportunity.stateEn,
      state: newOpportunity.stateEn || newOpportunity.stateAr,
      volunteers: parseInt(newOpportunity.volunteersNeeded),
      hours: parseInt(newOpportunity.hours) || 0,
      startDate: newOpportunity.date,
      endDate: newOpportunity.endDate,
      description_ar: newOpportunity.descriptionAr,
      description_en: newOpportunity.descriptionEn,
      imageUrl: newOpportunity.imageUrl || "",
      urgency: newOpportunity.importance || "medium",
      opportunityMode: newOpportunity.opportunityMode || "field",
      type: newOpportunity.opportunityMode || "field",
      createdBy: user.uid,
      creatorType: userType,
      organizationName: ownerDisplayName,
      ownerName: ownerDisplayName,
      createdByName: ownerDisplayName
    };
    
    const result = await addOpportunity(oppData);
    if (result.success) {
      await fetchMyOpportunities(user.uid);
      setNewOpportunity({
        titleAr: "", titleEn: "", category: "", locationAr: "",
        locationEn: "", stateAr: "", stateEn: "", volunteersNeeded: "", hours: "", date: "", endDate: "",
        descriptionAr: "", descriptionEn: "",
        imageUrl: "", importance: "medium", opportunityMode: "field"
      });
      setShowAddForm(false);
      alert(language === "en" ? "Opportunity added successfully!" : "تم إضافة الفرصة بنجاح!");
    } else {
      alert(result.error);
    }
    setSubmitting(false);
  };

  const translations = {
    en: {
      header: "Opportunities Management",
      subtitle: "Manage and organize your volunteering opportunities",
      addNewBtn: "+ Add New Opportunity",
      searchPlaceholder: "Search opportunities...",
      tableHeaders: { 
        title: "Title", 
        category: "Category", 
        location: "Location", 
        state: "State",
        volunteers: "Volunteers Needed", 
        applicants: "Applicants", 
        hours: "Hours", 
        date: "Date", 
        status: "Status", 
        actions: "Actions" 
      },
      applicantsPopup: { 
        title: "Applicants for", 
        name: "Name", 
        email: "Email", 
        phone: "Phone", 
        status: "Status", 
        date: "Applied At", 
        close: "Close", 
        noApplicants: "No applicants yet.", 
        completeBtn: "Mark as Completed", 
        report: "Report" 
      },
      reportPopup: { 
        title: "Report Volunteer", 
        details: "Details of violation", 
        submit: "Submit Report", 
        cancel: "Cancel" 
      },
      addForm: { 
        title: "Add New Opportunity", 
        titleAr: "Title (Arabic)", 
        titleEn: "Title (English)", 
        category: "Category", 
        selectCategory: "Select category", 
        environmental: "Environmental", 
        education: "Education", 
        health: "Health", 
        image: "Opportunity Image",
        importance: "Opportunity Importance",
        mode: "Opportunity Mode",
        high: "High",
        medium: "Medium",
        low: "Low",
        fieldMode: "Field",
        virtualMode: "Virtual",
        locationAr: "Location (Arabic)", 
        locationEn: "Location (English)", 
        stateAr: "State (Arabic)",
        stateEn: "State (English)",
        selectStateAr: "Select state in Arabic",
        selectStateEn: "Select state in English",
        volunteersNeeded: "Volunteers Needed", 
        hours: "Volunteering Hours", 
        date: "Start Date",
        endDate: "End Date",
        descriptionAr: "Description (Arabic)", 
        descriptionEn: "Description (English)", 
        cancel: "Cancel", 
        submit: "Add Opportunity" 
      },
      noOpportunities: "No opportunities found. Add your first one!"
    },
    ar: {
      header: "إدارة الفرص التطوعية",
      subtitle: "إدارة وتنظيم فرص التطوع الخاصة بك",
      addNewBtn: "+ إضافة فرصة جديدة",
      searchPlaceholder: "ابحث عن الفرص...",
      tableHeaders: { 
        title: "العنوان", 
        category: "الفئة", 
        location: "الموقع", 
        state: "الولاية",
        volunteers: "المتطوعين المطلوبين", 
        applicants: "المتقدمين", 
        hours: "الساعات", 
        date: "التاريخ", 
        status: "الحالة", 
        actions: "الإجراءات" 
      },
      applicantsPopup: { 
        title: "المتقدمين لفرصة", 
        name: "الاسم", 
        email: "البريد", 
        phone: "الهاتف", 
        status: "الحالة", 
        date: "تاريخ التقديم", 
        close: "إغلاق", 
        noApplicants: "لا يوجد متقدمين بعد.", 
        completeBtn: "تحديد كمكتملة", 
        report: "إبلاغ" 
      },
      reportPopup: { 
        title: "إبلاغ عن متطوع", 
        details: "تفاصيل المخالفة", 
        submit: "تقديم البلاغ", 
        cancel: "إلغاء" 
      },
      addForm: { 
        title: "إضافة فرصة جديدة", 
        titleAr: "العنوان (العربية)", 
        titleEn: "العنوان (الإنجليزية)", 
        category: "الفئة", 
        selectCategory: "اختر الفئة", 
        environmental: "بيئي", 
        education: "تعليم", 
        health: "صحي", 
        image: "صورة الفرصة",
        importance: "أهمية الفرصة",
        mode: "نوع الفرصة",
        high: "عالية",
        medium: "متوسطة",
        low: "منخفضة",
        fieldMode: "ميدانية",
        virtualMode: "افتراضية",
        locationAr: "الموقع (العربية)", 
        locationEn: "الموقع (الإنجليزية)", 
        stateAr: "الولاية (العربية)",
        stateEn: "الولاية (الإنجليزية)",
        selectStateAr: "اختر الولاية بالعربية",
        selectStateEn: "اختر الولاية بالإنجليزية",
        volunteersNeeded: "عدد المتطوعين المطلوب", 
        hours: "عدد الساعات التطوعية", 
        date: "تاريخ البدء",
        endDate: "تاريخ الانتهاء",
        descriptionAr: "الوصف (العربية)", 
        descriptionEn: "الوصف (الإنجليزية)", 
        cancel: "إلغاء", 
        submit: "إضافة الفرصة" 
      },
      noOpportunities: "لا توجد فرص حالياً. أضف فرصتك الأولى!"
    }
  };

  const t = translations[language];

  if (loading) return <div className="loading-screen">{language === "en" ? "Loading..." : "جاري التحميل..."}</div>;

  return (
    <div className={`opportunities-page ${language === "ar" ? "rtl" : ""}`}>
      <div className="opportunities-header-section">
        <div className="opportunities-header-image">
          <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&q=80" alt="Volunteering" />
          <div className="opportunities-image-overlay">
            <h1>{t.header}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
      </div>

      <main className="opportunities-main">
        <div className="control-bar">
          {(userType === "institution" || userType === "team") && (
            <div className="publish-counter">
              <strong>{currentUserData?.publishedOpportunitiesCount || opportunities.filter((opp) => ["active", "completed"].includes(String(opp.status || "").toLowerCase())).length}</strong>
              <span>{language === "en" ? "published opportunities. Auto-publish starts after 10." : "فرص منشورة. النشر التلقائي يبدأ بعد 10."}</span>
            </div>
          )}
          <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>{t.addNewBtn}</button>
        </div>

        {showAddForm && (
          <div className="add-form-container">
            <form className="add-form-card" onSubmit={handleSubmit}>
              <h3>{t.addForm.title}</h3>
              <div className="form-grid">
                <div className="form-group">
                  <input name="titleAr" placeholder={t.addForm.titleAr} value={newOpportunity.titleAr} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <input name="titleEn" placeholder={t.addForm.titleEn} value={newOpportunity.titleEn} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <select name="category" value={newOpportunity.category} onChange={handleInputChange} required>
                    <option value="">{t.addForm.selectCategory}</option>
                    {categoryOptions.map((categoryOption) => (
                      <option key={categoryOption.value} value={categoryOption.value}>
                        {categoryOption.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <select name="importance" value={newOpportunity.importance} onChange={handleInputChange} required>
                    <option value="high">{t.addForm.high}</option>
                    <option value="medium">{t.addForm.medium}</option>
                    <option value="low">{t.addForm.low}</option>
                  </select>
                </div>
                <div className="form-group">
                  <select name="opportunityMode" value={newOpportunity.opportunityMode} onChange={handleInputChange} required>
                    <option value="field">{t.addForm.fieldMode}</option>
                    <option value="virtual">{t.addForm.virtualMode}</option>
                  </select>
                </div>
                <div className="form-group">
                  <input name="volunteersNeeded" type="number" placeholder={t.addForm.volunteersNeeded} value={newOpportunity.volunteersNeeded} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <input name="hours" type="number" placeholder={t.addForm.hours} value={newOpportunity.hours} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <input name="locationAr" placeholder={t.addForm.locationAr} value={newOpportunity.locationAr} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <input name="locationEn" placeholder={t.addForm.locationEn} value={newOpportunity.locationEn} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <select name="stateAr" value={newOpportunity.stateAr} onChange={handleInputChange} required>
                    <option value="">{t.addForm.selectStateAr}</option>
                    {SUDAN_STATES.map((state) => (
                      <option key={`ar-${state.en}`} value={state.ar}>{state.ar}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <select name="stateEn" value={newOpportunity.stateEn} onChange={handleInputChange} required>
                    <option value="">{t.addForm.selectStateEn}</option>
                    {SUDAN_STATES.map((state) => (
                      <option key={`en-${state.en}`} value={state.en}>{state.en}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t.addForm.date}</label>
                  <input name="date" type="date" value={newOpportunity.date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>{t.addForm.endDate}</label>
                  <input name="endDate" type="date" min={newOpportunity.date || undefined} value={newOpportunity.endDate} onChange={handleInputChange} required />
                </div>
                <div className="form-group full-width">
                  <label>{t.addForm.image}</label>
                  <input name="imageUrl" type="file" accept="image/*" onChange={handleInputChange} />
                  {newOpportunity.imageUrl && (
                    <img src={newOpportunity.imageUrl} alt="Opportunity" style={{ marginTop: 10, maxWidth: "220px", borderRadius: 8 }} />
                  )}
                </div>
                <div className="form-group full-width">
                  <textarea 
                    name="descriptionAr" 
                    placeholder={t.addForm.descriptionAr} 
                    value={newOpportunity.descriptionAr} 
                    onChange={handleInputChange} 
                    required 
                    className="description-textarea"
                  />
                </div>
                <div className="form-group full-width">
                  <textarea 
                    name="descriptionEn" 
                    placeholder={t.addForm.descriptionEn} 
                    value={newOpportunity.descriptionEn} 
                    onChange={handleInputChange} 
                    required 
                    className="description-textarea"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>{t.addForm.cancel}</button>
                <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? "..." : t.addForm.submit}</button>
              </div>
            </form>
          </div>
        )}

        <div className="opportunities-table-container">
          {opportunities.length > 0 ? (
            <div className="opportunities-list">
              {opportunities.map((opp, index) => (
                <div key={opp.id} className="opportunity-card">
                  {opp.imageUrl && (
                    <img
                      src={opp.imageUrl}
                      alt={language === "en" ? opp.title_en : opp.title_ar}
                      style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 12 }}
                    />
                  )}
                  <div className="opportunity-header">
                    <h3 className="opportunity-title">{language === "en" ? opp.title_en : opp.title_ar}</h3>
                    <div className="opportunity-status">
                      <span className={`status-badge ${opp.status}`}>
                        {opp.status === 'active' ? (language === 'en' ? 'Active' : 'نشطة') : 
                         opp.status === 'completed' ? (language === 'en' ? 'Completed' : 'مكتملة') : 
                         opp.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="opportunity-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">{t.tableHeaders.category}:</span>
                        <span className="detail-value">{opp.category}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">{t.tableHeaders.location}:</span>
                        <span className="detail-value">
                          {language === "en"
                            ? `${opp.location_en || opp.location || "N/A"}${opp.state_en || opp.state || opp.state_ar ? ` - ${opp.state_en || opp.state || opp.state_ar}` : ""}`
                            : `${opp.location || opp.location_en || "N/A"}${opp.state_ar || opp.state || opp.state_en ? ` - ${opp.state_ar || opp.state || opp.state_en}` : ""}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">{t.tableHeaders.volunteers}:</span>
                        <span className="detail-value">{opp.volunteers}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">{t.tableHeaders.applicants}:</span>
                        <span className="detail-value applicants-count">
                          <button className="view-applicants-btn" onClick={() => handleViewApplicants(opp)}>
                            {opp.applicantCount || 0}
                          </button>
                        </span>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">{t.tableHeaders.hours}:</span>
                        <span className="detail-value">{opp.hours || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">{t.tableHeaders.date}:</span>
                        <span className="detail-value">
                          {opp.startDate ? new Date(opp.startDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">{t.addForm.importance}:</span>
                        <span className="detail-value">{opp.urgency || "medium"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">{t.addForm.mode}:</span>
                        <span className="detail-value">{(opp.opportunityMode || opp.type || "field")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="opportunity-footer">
                    <div className="opportunity-actions">
                      <button className="action-btn view-btn" onClick={() => handleViewApplicants(opp)}>
                        <FiUsers className="btn-icon" aria-hidden="true" />
                        <span className="btn-text">{language === "en" ? "View Applicants" : "عرض المتقدمين"}</span>
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(opp.id)}>
                        <FiTrash2 className="btn-icon" aria-hidden="true" />
                        <span className="btn-text">{language === "en" ? "Delete" : "حذف"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-opportunities">
              <p>{t.noOpportunities}</p>
            </div>
          )}
        </div>

        {selectedOpp && (
          <div className="details-modal-overlay" onClick={() => setSelectedOpp(null)}>
            <div className="details-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{t.applicantsPopup.title}: {language === "en" ? selectedOpp.title_en : selectedOpp.title_ar}</h3>
                <button className="close-btn" onClick={() => setSelectedOpp(null)}>&times;</button>
              </div>
              <div className="modal-content">
                {selectedOpp.status === "active" && (
                  <div className="complete-opportunity-section">
                    <button
                      className="bonus-opp-btn"
                      type="button"
                      onClick={() => setShowBonusModal(true)}
                    >
                      {language === "en" ? "Bonus Points" : "نقاط تميز"}
                    </button>
                    <button 
                      className="complete-opp-btn" 
                      onClick={() => handleCompleteOpportunity(selectedOpp)}
                      disabled={completing}
                    >
                      {completing ? "..." : t.applicantsPopup.completeBtn}
                    </button>
                  </div>
                )}
                {loadingApplicants ? (
                  <p className="loading-text">{language === "en" ? "Loading..." : "جاري التحميل..."}</p>
                ) : applicants.length > 0 ? (
                  <div className="applicants-list">
                    {applicants.map(app => (
                      <div key={app.id} className="applicant-card" onClick={() => setSelectedApplicant(app)} role="button" tabIndex={0}>
                        <div className="applicant-info">
                          <p><strong>{t.applicantsPopup.name}:</strong> {app.volunteer?.fullName || app.volunteer?.displayName || "N/A"}</p>
                          <p><strong>{t.applicantsPopup.email}:</strong> {app.volunteer?.email || "N/A"}</p>
                          <p><strong>{t.applicantsPopup.phone}:</strong> {app.volunteer?.phone || app.volunteer?.basicInfo?.phone || "N/A"}</p>
                          <p><strong>{t.applicantsPopup.status}:</strong> {app.status || "registered"} {app.bonusVolunteer ? (language === "en" ? "+ Bonus" : "+ مميز") : ""}</p>
                          <p><strong>{t.applicantsPopup.date}:</strong> {app.appliedAt ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div className="applicant-actions">
                          <button
                            className="accept-btn"
                            onClick={(e) => { e.stopPropagation(); handleAcceptApplicant(app); }}
                            disabled={["accepted", "approved", "completed"].includes(String(app.status || "").toLowerCase())}
                          >
                            {language === "en" ? "Accept" : "قبول"}
                          </button>
                          <button 
                            className="report-btn" 
                            onClick={(e) => { e.stopPropagation(); setReportingVolunteer(app); setShowReportModal(true); }}
                          >
                            {t.applicantsPopup.report}
                          </button>
                          <button
                            className="reject-btn"
                            onClick={(e) => { e.stopPropagation(); handleRejectApplicant(app); }}
                          >
                            {language === "en" ? "Reject" : "رفض"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-applicants">{t.applicantsPopup.noApplicants}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedApplicant && (
          <div className="details-modal-overlay" onClick={() => setSelectedApplicant(null)}>
            <div className="details-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{language === "en" ? "Applicant Details" : "تفاصيل المتقدم"}: {getApplicantName(selectedApplicant)}</h3>
                <button className="close-btn" onClick={() => setSelectedApplicant(null)}>&times;</button>
              </div>
              <div className="modal-content">
                <div className="applicant-detail-grid">
                  {Object.entries({ ...selectedApplicant.volunteer, applicationStatus: selectedApplicant.status, appliedAt: selectedApplicant.appliedAt }).map(([key, value]) => (
                    <div className="applicant-detail-row" key={key}>
                      <strong>{key}</strong>
                      <span>{formatApplicantValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showBonusModal && selectedOpp && (
          <div className="details-modal-overlay" onClick={() => setShowBonusModal(false)}>
            <div className="details-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{language === "en" ? "Bonus Points" : "نقاط تميز"}</h3>
                <button className="close-btn" onClick={() => setShowBonusModal(false)}>&times;</button>
              </div>
              <div className="modal-content">
                <div className="form-group">
                  <label>{language === "en" ? "Select a standout volunteer" : "اختر متطوعًا مميزًا"}</label>
                  <select value={bonusApplicantId} onChange={(e) => setBonusApplicantId(e.target.value)}>
                    <option value="">{language === "en" ? "Select volunteer" : "اختر المتطوع"}</option>
                    {applicants
                      .filter((app) => !["rejected", "declined", "refused"].includes(String(app.status || "").toLowerCase()))
                      .map((app) => (
                        <option key={app.id} value={app.id}>
                          {getApplicantName(app)} {app.bonusVolunteer ? (language === "en" ? "(already selected)" : "(محدد مسبقًا)") : ""}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" type="button" onClick={() => setShowBonusModal(false)}>{t.reportPopup.cancel}</button>
                  <button className="submit-btn" type="button" disabled={!bonusApplicantId} onClick={handleSelectBonusApplicant}>
                    {language === "en" ? "Save Bonus" : "حفظ التميز"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showReportModal && (
          <div className="details-modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="details-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{t.reportPopup.title}: {reportingVolunteer?.volunteer?.fullName}</h3>
                <button className="close-btn" onClick={() => setShowReportModal(false)}>&times;</button>
              </div>
              <div className="modal-content">
                <div className="form-group">
                  <label>{language === "en" ? "Violation type" : "نوع المخالفة"}</label>
                  <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} required>
                    <option value="">{language === "en" ? "Select violation" : "اختر المخالفة"}</option>
                    {volunteerViolationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.labels[language]} - {option.consequence[language]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t.reportPopup.details}</label>
                  <textarea 
                    value={reportDetails} 
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder={language === "en" ? "Describe the violation..." : "صف المخالفة..."}
                    className="report-textarea"
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={() => setShowReportModal(false)}>{t.reportPopup.cancel}</button>
                  <button className="submit-btn" onClick={handleReportVolunteer}>{t.reportPopup.submit}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
