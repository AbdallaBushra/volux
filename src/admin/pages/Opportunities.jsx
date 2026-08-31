import React, { useState, useEffect } from 'react';
import { 
  FiEye, FiEdit2, FiCalendar, FiMapPin, FiUsers,
  FiClock, FiSearch, FiTrendingUp, FiCheckCircle, 
  FiAlertCircle, FiTrash2, FiXCircle, FiAward
} from 'react-icons/fi';
import { MdCategory } from 'react-icons/md';
import { 
  getAllOpportunities, 
  deleteOpportunity, 
  updateOpportunityStatus 
} from '../../database/adminData';
import { 
  sendOpportunityApprovalNotification,
  sendOpportunityRejectionNotification,
  getOpportunityOwnerInfo
} from '../../database/adminData';
import { db } from '../../firebase/firebase';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { exportTableData } from '../utils/export';
import { calculateLevel, calculatePointsForCompletion } from '../../gamification/engine';

const getApplicantName = (app) =>
  app?.volunteer?.fullName ||
  app?.volunteer?.displayName ||
  app?.volunteer?.name ||
  app?.volunteer?.email ||
  'N/A';

const formatApplicantValue = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const Opportunities = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsOpp, setDetailsOpp] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOpp, setEditOpp] = useState(null);
  const [showCreateWorkshopModal, setShowCreateWorkshopModal] = useState(false);
  const [creatingWorkshop, setCreatingWorkshop] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshopApplicants, setWorkshopApplicants] = useState([]);
  const [loadingWorkshopApplicants, setLoadingWorkshopApplicants] = useState(false);
  const [completingWorkshop, setCompletingWorkshop] = useState(false);
  const [selectedWorkshopApplicant, setSelectedWorkshopApplicant] = useState(null);
  const [showWorkshopBonusModal, setShowWorkshopBonusModal] = useState(false);
  const [bonusWorkshopApplicantId, setBonusWorkshopApplicantId] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    title_ar: '',
    title_en: '',
    description: '',
    description_ar: '',
    description_en: '',
    category: '',
    location: '',
    location_ar: '',
    location_en: '',
    state: '',
    state_ar: '',
    state_en: '',
    hours: '',
    volunteersNeeded: '',
    startDate: ''
  });
  const [newWorkshop, setNewWorkshop] = useState({
    title_ar: '',
    title_en: '',
    category: '',
    location_ar: '',
    location_en: '',
    state_ar: '',
    state_en: '',
    volunteersNeeded: '',
    hours: '',
    startDate: '',
    endDate: '',
    description_ar: '',
    description_en: '',
    imageUrl: '',
    urgency: 'medium',
    opportunityMode: 'field',
  });

  useEffect(() => {
    fetchOpps();
  }, []);

  const fetchOpps = async () => {
    try {
      setLoading(true);
      const data = await getAllOpportunities();
      setOpps(data);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportTableData('opportunity_report', filteredOpps, {
      reportName: 'Opportunity Report',
      summary: {
        totalOpportunities: stats.totalOpportunities,
        active: stats.activeCount,
        completed: stats.completedCount,
        pending: stats.pendingCount,
        rejected: stats.rejectedCount,
      },
    });
  };

  const openDetailsModal = (opp) => {
    setDetailsOpp(opp);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setDetailsOpp(null);
  };

  const resetWorkshopForm = () => {
    setNewWorkshop({
      title_ar: '',
      title_en: '',
      category: '',
      location_ar: '',
      location_en: '',
      state_ar: '',
      state_en: '',
      volunteersNeeded: '',
      hours: '',
      startDate: '',
      endDate: '',
      description_ar: '',
      description_en: '',
      imageUrl: '',
      urgency: 'medium',
      opportunityMode: 'field',
    });
  };

  const handleWorkshopInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files && files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewWorkshop((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
      return;
    }

    setNewWorkshop((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateWorkshopOpportunity = async (e) => {
    e.preventDefault();
    setCreatingWorkshop(true);
    try {
      const hours = Number(newWorkshop.hours) || 0;
      const volunteersNeeded = Number(newWorkshop.volunteersNeeded) || 0;
      const payload = {
        title_ar: newWorkshop.title_ar,
        title_en: newWorkshop.title_en,
        title: newWorkshop.title_en || newWorkshop.title_ar || 'Volunteer Workshop',
        category: newWorkshop.category || 'General',
        location_ar: newWorkshop.location_ar || newWorkshop.location_en || 'N/A',
        location_en: newWorkshop.location_en || newWorkshop.location_ar || 'N/A',
        location: newWorkshop.location_en || newWorkshop.location_ar || 'N/A',
        state_ar: newWorkshop.state_ar || newWorkshop.state_en || 'N/A',
        state_en: newWorkshop.state_en || newWorkshop.state_ar || 'N/A',
        state: newWorkshop.state_en || newWorkshop.state_ar || 'N/A',
        volunteers: volunteersNeeded,
        volunteersNeeded: volunteersNeeded,
        hours: hours,
        duration: `${hours} hours`,
        startDate: newWorkshop.startDate,
        date: newWorkshop.startDate,
        endDate: newWorkshop.endDate || '',
        description_ar: newWorkshop.description_ar || 'لا يوجد وصف',
        description_en: newWorkshop.description_en || 'No description available',
        description: newWorkshop.description_en || newWorkshop.description_ar || 'No description available',
        imageUrl: newWorkshop.imageUrl || '',
        urgency: newWorkshop.urgency || 'medium',
        opportunityMode: newWorkshop.opportunityMode || 'field',
        type: newWorkshop.opportunityMode || 'field',
        organizationName: 'Volux',
        org: 'Volux',
        createdByName: 'Volux',
        createdBy: 'volux-admin',
        creatorType: 'admin',
        status: 'active',
        approvedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'Opportunities'), payload);
      alert('Workshop opportunity created and published successfully.');
      setShowCreateWorkshopModal(false);
      resetWorkshopForm();
      await fetchOpps();
    } catch (error) {
      console.error('Error creating workshop opportunity:', error);
      alert('Failed to create workshop opportunity.');
    } finally {
      setCreatingWorkshop(false);
    }
  };

  const openEditModal = (opp) => {
    setEditOpp(opp);
    setEditForm({
      title: opp.title || '',
      title_ar: opp.title_ar || '',
      title_en: opp.title_en || '',
      description: opp.description || '',
      description_ar: opp.description_ar || '',
      description_en: opp.description_en || '',
      category: opp.category || '',
      location: opp.location || '',
      location_ar: opp.location_ar || '',
      location_en: opp.location_en || '',
      state: opp.state || '',
      state_ar: opp.state_ar || '',
      state_en: opp.state_en || '',
      hours: opp.hours ?? '',
      volunteersNeeded: opp.volunteersNeeded ?? opp.volunteers ?? '',
      startDate: opp.startDate || opp.date || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditOpp(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildEditPayload = () => {
    const payload = {
      updatedAt: serverTimestamp()
    };

    const setIfNotEmpty = (key, val) => {
      if (val !== undefined && val !== null && val !== '') payload[key] = val;
    };

    setIfNotEmpty('title', editForm.title);
    setIfNotEmpty('title_ar', editForm.title_ar);
    setIfNotEmpty('title_en', editForm.title_en);
    setIfNotEmpty('description', editForm.description);
    setIfNotEmpty('description_ar', editForm.description_ar);
    setIfNotEmpty('description_en', editForm.description_en);
    setIfNotEmpty('category', editForm.category);
    setIfNotEmpty('location', editForm.location);
    setIfNotEmpty('location_ar', editForm.location_ar);
    setIfNotEmpty('location_en', editForm.location_en);
    setIfNotEmpty('state', editForm.state);
    setIfNotEmpty('state_ar', editForm.state_ar);
    setIfNotEmpty('state_en', editForm.state_en);
    setIfNotEmpty('startDate', editForm.startDate);
    setIfNotEmpty('date', editForm.startDate);

    const hours = editForm.hours === '' ? null : Number(editForm.hours);
    const volunteersNeeded = editForm.volunteersNeeded === '' ? null : Number(editForm.volunteersNeeded);
    if (hours !== null && !Number.isNaN(hours)) {
      payload.hours = hours;
      payload.duration = hours;
    }
    if (volunteersNeeded !== null && !Number.isNaN(volunteersNeeded)) {
      payload.volunteersNeeded = volunteersNeeded;
      payload.volunteers = volunteersNeeded;
    }

    return payload;
  };

  const handleEditSave = async () => {
    if (!editOpp?.id) return;
    try {
      const payload = buildEditPayload();
      await updateDoc(doc(db, 'Opportunities', editOpp.id), payload);
      alert('Opportunity updated successfully');
      setShowEditModal(false);
      setEditOpp(null);
      fetchOpps();
    } catch (error) {
      console.error('Error updating opportunity:', error);
      alert('Failed to update opportunity');
    }
  };

  const getOrgName = (opp) => {
    return (
      opp.organizationName ||
      opp.organization_name ||
      opp.orgName ||
      opp.org ||
      opp.institutionName ||
      opp.teamName ||
      opp.createdByName ||
      'N/A'
    );
  };

  const filteredOpps = opps.filter(opp => {
    const title = opp.title || opp.title_en || opp.title_ar || '';
    const org = getOrgName(opp);
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeFilter === 'all' || (opp.status || 'active') === activeFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateOpportunityStatus(id, 'active');
      
      const opp = opps.find(o => o.id === id);
      if (opp) {
        const ownerInfo = await getOpportunityOwnerInfo(opp.createdBy || opp.ownerId);
        if (ownerInfo) {
          await sendOpportunityApprovalNotification(id, ownerInfo.id, opp);
        }
      }

      alert('Opportunity approved successfully');
      fetchOpps();
    } catch (error) {
      console.error("Error approving opportunity:", error);
      alert('Failed to approve opportunity');
    }
  };

  const openRejectModal = (opp) => {
    setSelectedOpp(opp);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedOpp) return;

    try {
      await updateOpportunityStatus(selectedOpp.id, 'rejected');
      
      const ownerInfo = await getOpportunityOwnerInfo(selectedOpp.createdBy || selectedOpp.ownerId);
      if (ownerInfo) {
        await sendOpportunityRejectionNotification(
          selectedOpp.id, 
          ownerInfo.id, 
          selectedOpp, 
          rejectReason
        );
      }

      alert('Opportunity rejected successfully');
      setShowRejectModal(false);
      setSelectedOpp(null);
      setRejectReason('');
      fetchOpps();
    } catch (error) {
      console.error("Error rejecting opportunity:", error);
      alert('Failed to reject opportunity');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      try {
        await deleteOpportunity(id);
        alert('Deleted successfully');
        fetchOpps();
      } catch (error) {
        alert('Failed to delete');
      }
    }
  };

  const stats = {
    totalOpportunities: opps.length,
    activeCount: opps.filter(o => (o.status || 'active') === 'active').length,
    completedCount: opps.filter(o => o.status === 'completed').length,
    pendingCount: opps.filter(o => o.status === 'pending').length,
    rejectedCount: opps.filter(o => o.status === 'rejected').length
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const collectImageUrls = (data = {}) => {
    const candidates = [data.imageUrl, data.image, data.logo, data.coverImage];
    return [...new Set(candidates.filter((item) => typeof item === 'string' && item.trim()))];
  };

  const isAdminWorkshop = (opp = {}) =>
    opp.creatorType === 'admin' ||
    opp.createdBy === 'volux-admin' ||
    opp.createdByName === 'Volux' ||
    opp.organizationName === 'Volux';

  const refreshWorkshopApplicants = async (opp) => {
    setSelectedWorkshop(opp);
    setLoadingWorkshopApplicants(true);
    try {
      const appsQuery = query(collection(db, 'Applications'), where('opportunityId', '==', opp.id));
      const appsSnapshot = await getDocs(appsQuery);
      const apps = [];

      for (const appDoc of appsSnapshot.docs) {
        const appData = appDoc.data();
        let volunteerInfo = {};

        if (appData.userId) {
          const userRef = doc(db, 'Users', appData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const role = userData.role || 'volunteer';
            const profileName =
              role === 'team'
                ? 'Volunteer_Team_Profile'
                : role === 'organization' || role === 'institution'
                ? 'Organization_Profile'
                : 'Volunteer_Profile';
            const profileSnap = await getDoc(doc(db, 'Users', appData.userId, profileName, 'info'));
            volunteerInfo = profileSnap.exists() ? { ...userData, ...profileSnap.data() } : userData;
          }
        }

        apps.push({ id: appDoc.id, ...appData, volunteer: volunteerInfo });
      }

      setWorkshopApplicants(apps);
    } catch (error) {
      console.error('Error loading workshop applicants:', error);
      alert('Failed to load workshop applicants.');
    } finally {
      setLoadingWorkshopApplicants(false);
    }
  };

  const closeWorkshopManager = () => {
    setSelectedWorkshop(null);
    setWorkshopApplicants([]);
    setSelectedWorkshopApplicant(null);
    setShowWorkshopBonusModal(false);
    setBonusWorkshopApplicantId('');
  };

  const updateWorkshopApplicationStatus = async (app, status) => {
    try {
      await updateDoc(doc(db, 'Applications', app.id), {
        status,
        updatedAt: serverTimestamp(),
        ...(status === 'accepted' ? { acceptedAt: serverTimestamp() } : {}),
        ...(status === 'rejected' ? { rejectedAt: serverTimestamp() } : {}),
      });

      if (app.userId && selectedWorkshop?.id) {
        const notifRef = doc(collection(db, 'Notifications', app.userId, 'in_App'));
        await setDoc(notifRef, {
          userId: app.userId,
          title_en: status === 'accepted' ? 'Workshop Application Accepted' : 'Workshop Application Rejected',
          title_ar: status === 'accepted' ? 'تم قبول طلب الورشة' : 'تم رفض طلب الورشة',
          message_en:
            status === 'accepted'
              ? 'You have been accepted for this workshop. Rewards are granted after completion.'
              : 'Your workshop application was rejected.',
          message_ar:
            status === 'accepted'
              ? 'تم قبولك في هذه الورشة. يتم منح المكافآت بعد اكتمالها.'
              : 'تم رفض طلبك لهذه الورشة.',
          type: status === 'accepted' ? 'workshop_accepted' : 'workshop_rejected',
          read: false,
          opportunityId: selectedWorkshop.id,
          createdAt: serverTimestamp(),
        });
      }

      setWorkshopApplicants((prev) => prev.map((item) => (item.id === app.id ? { ...item, status } : item)));
    } catch (error) {
      console.error(`Failed to ${status} workshop applicant:`, error);
      alert(`Failed to ${status} applicant.`);
    }
  };

  const handleSelectWorkshopBonus = async () => {
    const app = workshopApplicants.find((item) => item.id === bonusWorkshopApplicantId);
    if (!app) return;

    try {
      await updateDoc(doc(db, 'Applications', app.id), {
        bonusVolunteer: true,
        bonusPoints: 5,
        updatedAt: serverTimestamp(),
      });

      setWorkshopApplicants((prev) =>
        prev.map((item) => (item.id === app.id ? { ...item, bonusVolunteer: true, bonusPoints: 5 } : item))
      );
      setBonusWorkshopApplicantId('');
      setShowWorkshopBonusModal(false);
    } catch (error) {
      console.error('Failed to save workshop bonus:', error);
      alert('Failed to save bonus points.');
    }
  };

  const handleCompleteWorkshop = async (opp) => {
    if (!window.confirm('Mark this workshop as completed and distribute rewards to accepted volunteers?')) return;

    setCompletingWorkshop(true);
    try {
      await updateDoc(doc(db, 'Opportunities', opp.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const appsQuery = query(collection(db, 'Applications'), where('opportunityId', '==', opp.id));
      const appsSnapshot = await getDocs(appsQuery);
      const apps = appsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      const eligibleApps = apps.filter((app) => {
        const status = String(app.status || '').toLowerCase();
        if (['rejected', 'declined', 'refused', 'completed'].includes(status)) return false;
        return ['accepted', 'approved'].includes(status);
      });

      const hoursToAward = Number(opp.hours || 0);
      const pointsToAward = calculatePointsForCompletion({ hours: hoursToAward });

      for (const app of eligibleApps) {
        const bonusPoints = app.bonusVolunteer ? Number(app.bonusPoints || 5) : 0;
        const totalPointsAward = pointsToAward + bonusPoints;

        await updateDoc(doc(db, 'Applications', app.id), {
          status: 'completed',
          completedAt: serverTimestamp(),
          hoursAwarded: hoursToAward,
          pointsAwarded: totalPointsAward,
          bonusPointsAwarded: bonusPoints,
        });

        if (!app.userId) continue;
        const userRef = doc(db, 'Users', app.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const role = userData.role || 'volunteer';
        const profileName =
          role === 'team'
            ? 'Volunteer_Team_Profile'
            : role === 'organization' || role === 'institution'
            ? 'Organization_Profile'
            : 'Volunteer_Profile';
        const profileRef = doc(db, 'Users', app.userId, profileName, 'info');
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        const currentPoints = Number(profileData.points ?? userData.points ?? 0);
        const currentHours = Number(profileData.volunteeringHours ?? profileData.hours ?? userData.volunteeringHours ?? userData.hours ?? 0);
        const currentCompleted = Number(profileData.completedOpportunities ?? userData.completedOpportunities ?? 0);
        const nextPoints = currentPoints + totalPointsAward;
        const profilePayload = {
          points: nextPoints,
          hours: currentHours + hoursToAward,
          volunteeringHours: currentHours + hoursToAward,
          completedOpportunities: currentCompleted + 1,
          level: calculateLevel(nextPoints),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userRef, profilePayload, { merge: true });
        await setDoc(profileRef, profilePayload, { merge: true });
      }

      alert('Workshop marked as completed and rewards distributed.');
      await fetchOpps();
      await refreshWorkshopApplicants({ ...opp, status: 'completed' });
    } catch (error) {
      console.error('Error completing workshop:', error);
      alert('Failed to complete workshop.');
    } finally {
      setCompletingWorkshop(false);
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Opportunities...</div>;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header admin-sticky-tools">
          <div>
            <h1 className="admin-title">Opportunities</h1>
            <p className="admin-subtitle">Manage and monitor all volunteer opportunities</p>
          </div>
          <div className="header-actions">
            <button
              className="export-btn"
              onClick={() => setShowCreateWorkshopModal(true)}
              style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              + Add Workshop Opportunity
            </button>
            <button className="export-btn" onClick={handleExport} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
              Export Data
            </button>
          </div>
        </div>

        <div className="compact-stats-grid">
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}><FiTrendingUp /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.totalOpportunities}</h3>
              <p className="compact-stat-label">Total Opportunities</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FiCheckCircle /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.activeCount}</h3>
              <p className="compact-stat-label">Active Now</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}><FiAlertCircle /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.completedCount}</h3>
              <p className="compact-stat-label">Completed</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><FiAlertCircle /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.pendingCount}</h3>
              <p className="compact-stat-label">Pending</p>
            </div>
          </div>
        </div>

        <div className="opp-tabs">
          <button className={`opp-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
            <span className="tab-badge all">{stats.totalOpportunities}</span><span className="tab-text">All</span>
          </button>
          <button className={`opp-tab ${activeFilter === 'active' ? 'active' : ''}`} onClick={() => setActiveFilter('active')}>
            <span className="tab-badge active">{stats.activeCount}</span><span className="tab-text">Active</span>
          </button>
          <button className={`opp-tab ${activeFilter === 'pending' ? 'active' : ''}`} onClick={() => setActiveFilter('pending')}>
            <span className="tab-badge pending">{stats.pendingCount}</span><span className="tab-text">Pending</span>
          </button>
          <button className={`opp-tab ${activeFilter === 'rejected' ? 'active' : ''}`} onClick={() => setActiveFilter('rejected')}>
            <span className="tab-badge rejected">{stats.rejectedCount}</span><span className="tab-text">Rejected</span>
          </button>
        </div>

        <div className="compact-search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search opportunities..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="opp-grid-compact">
          {filteredOpps.map((opp) => (
            <div key={opp.id} className="opp-card-compact">
              <div className="opp-card-header">
                <div className="opp-avatar" style={{ backgroundColor: '#3b82f6' }}>
                  {(opp.title || opp.title_en || opp.title_ar || 'O').charAt(0).toUpperCase()}
                </div>
                <div className="opp-header-info">
                  <h3 className="opp-title">{opp.title || opp.title_en || opp.title_ar || 'Untitled Opportunity'}</h3>
                  <div className="opp-meta">
                    {activeFilter === 'all' && (
                      <span className={`opp-status ${getStatusColor(opp.status || 'active')}`}>
                        {opp.status || 'Active'}
                      </span>
                    )}
                    <span className="opp-organization">{getOrgName(opp)}</span>
                  </div>
                </div>
              </div>
              
              <div className="opp-details-compact">
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <span>Start Date: {formatDate(opp.date || opp.startDate)}</span>
                </div>
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <span>End Date: {formatDate(opp.endDate)}</span>
                </div>
                <div className="detail-item">
                  <FiMapPin className="detail-icon" />
                  <span>
                    {(opp.location || opp.location_ar || opp.location_en || 'N/A')}
                    {(opp.state || opp.state_ar || opp.state_en) ? ` - ${opp.state || opp.state_ar || opp.state_en}` : ''}
                  </span>
                </div>
                <div className="detail-item">
                  <MdCategory className="detail-icon" />
                  <span>{opp.category || 'General'}</span>
                </div>
                <div className="detail-item">
                  <FiUsers className="detail-icon" />
                  <span>{opp.volunteers || opp.volunteersNeeded || 0} volunteers needed</span>
                </div>
                <div className="detail-item">
                  <FiClock className="detail-icon" />
                  <span>{opp.hours || 0} hours</span>
                </div>
              </div>

              <div className="opp-actions-compact">
                <button 
                  className="action-btn view-btn" 
                  onClick={() => openDetailsModal(opp)}
                  title="View Details"
                >
                  <FiEye />
                </button>

                {isAdminWorkshop(opp) && (
                  <button
                    className="action-btn manage-workshop-btn"
                    onClick={() => refreshWorkshopApplicants(opp)}
                    title="Manage Workshop"
                  >
                    <FiUsers />
                  </button>
                )}
                
                {opp.status === 'pending' && (
                  <>
                    <button 
                      className="action-btn approve-btn" 
                      onClick={() => handleApprove(opp.id)} 
                      title="Approve Opportunity"
                    >
                      <FiCheckCircle />
                    </button>
                    <button 
                      className="action-btn reject-btn" 
                      onClick={() => openRejectModal(opp)} 
                      title="Reject Opportunity"
                    >
                      <FiXCircle />
                    </button>
                  </>
                )}
                
                {(opp.status === 'active' || opp.status === 'completed') && (
                  <button 
                    className="action-btn edit-btn" 
                    onClick={() => openEditModal(opp)}
                    title="Edit Opportunity"
                  >
                    <FiEdit2 />
                  </button>
                )}
                
                <button className="action-btn delete-btn" onClick={() => handleDelete(opp.id)}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedOpp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reject Opportunity</h3>
            <p>Are you sure you want to reject the opportunity: <strong>{selectedOpp.title || selectedOpp.title_en || selectedOpp.title_ar}</strong>?</p>
            <div className="form-group">
              <label htmlFor="rejectReason">Reason for rejection (optional):</label>
              <textarea 
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className="btn-reject" onClick={handleReject}>
                Reject Opportunity
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && detailsOpp && (
        <div className="admin-modal-overlay" onClick={closeDetailsModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Opportunity Details</h3>
                <p className="admin-modal-subtitle">
                  {detailsOpp.title || detailsOpp.title_en || detailsOpp.title_ar || 'Opportunity'}
                </p>
              </div>
              <button className="admin-modal-close" onClick={closeDetailsModal}>&times;</button>
            </div>
            <div className="admin-modal-body">
              {collectImageUrls(detailsOpp).length > 0 && (
                <div className="admin-image-gallery">
                  {collectImageUrls(detailsOpp).map((img, index) => (
                    <div className="admin-image-card" key={`opp-img-${index}`}>
                      <img src={img} alt={`Opportunity ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-detail-section">
                <h4 className="admin-section-title">Core Information</h4>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Organization</div>
                  <div className="admin-detail-value">{getOrgName(detailsOpp)}</div>
                </div>
                {activeFilter === 'all' && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Status</div>
                    <div className="admin-detail-value">{detailsOpp.status || 'N/A'}</div>
                  </div>
                )}
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Category</div>
                  <div className="admin-detail-value">{detailsOpp.category || 'N/A'}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Mode</div>
                  <div className="admin-detail-value">{detailsOpp.opportunityMode || detailsOpp.type || 'field'}</div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-section-title">Location & Schedule</h4>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Location (AR)</div>
                  <div className="admin-detail-value">{detailsOpp.location_ar || detailsOpp.location || 'N/A'}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Location (EN)</div>
                  <div className="admin-detail-value">{detailsOpp.location_en || detailsOpp.location || 'N/A'}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">State (AR)</div>
                  <div className="admin-detail-value">{detailsOpp.state_ar || detailsOpp.state || 'N/A'}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">State (EN)</div>
                  <div className="admin-detail-value">{detailsOpp.state_en || detailsOpp.state || 'N/A'}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Start Date</div>
                  <div className="admin-detail-value">{formatDate(detailsOpp.startDate || detailsOpp.date)}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">End Date</div>
                  <div className="admin-detail-value">{formatDate(detailsOpp.endDate)}</div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-section-title">Capacity</h4>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Volunteers Needed</div>
                  <div className="admin-detail-value">{detailsOpp.volunteers || detailsOpp.volunteersNeeded || 0}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Hours</div>
                  <div className="admin-detail-value">{detailsOpp.hours || 0}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Applicants</div>
                  <div className="admin-detail-value">{detailsOpp.applicantCount || 0}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Importance</div>
                  <div className="admin-detail-value">{detailsOpp.urgency || 'medium'}</div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-section-title">Description</h4>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Arabic</div>
                  <div className="admin-detail-value">{detailsOpp.description_ar || detailsOpp.description || 'N/A'}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">English</div>
                  <div className="admin-detail-value">{detailsOpp.description_en || detailsOpp.description || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-modal-btn" onClick={closeDetailsModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {selectedWorkshop && (
        <div className="admin-modal-overlay" onClick={closeWorkshopManager}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Manage Workshop</h3>
                <p className="admin-modal-subtitle">
                  {selectedWorkshop.title || selectedWorkshop.title_en || selectedWorkshop.title_ar || 'Workshop'}
                </p>
              </div>
              <button className="admin-modal-close" onClick={closeWorkshopManager}>&times;</button>
            </div>
            <div className="admin-modal-body">
              {selectedWorkshop.status === 'active' && (
                <div className="admin-workshop-toolbar">
                  <button className="admin-modal-btn neutral" type="button" onClick={() => setShowWorkshopBonusModal(true)}>
                    <FiAward /> Bonus Points
                  </button>
                  <button
                    className="admin-modal-btn"
                    type="button"
                    onClick={() => handleCompleteWorkshop(selectedWorkshop)}
                    disabled={completingWorkshop}
                  >
                    {completingWorkshop ? 'Completing...' : 'Mark as Completed'}
                  </button>
                </div>
              )}

              {loadingWorkshopApplicants ? (
                <p className="admin-empty-state">Loading applicants...</p>
              ) : workshopApplicants.length > 0 ? (
                <div className="admin-applicants-list">
                  {workshopApplicants.map((app) => (
                    <div
                      className="admin-applicant-card"
                      key={app.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedWorkshopApplicant(app)}
                    >
                      <div className="admin-applicant-info">
                        <strong>{getApplicantName(app)}</strong>
                        <span>{app.volunteer?.email || 'N/A'}</span>
                        <span>Status: {app.status || 'registered'} {app.bonusVolunteer ? '+ Bonus' : ''}</span>
                        <span>Applied: {app.appliedAt?.seconds ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="admin-applicant-actions">
                        <button
                          className="admin-small-btn accept"
                          type="button"
                          disabled={['accepted', 'approved', 'completed'].includes(String(app.status || '').toLowerCase())}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateWorkshopApplicationStatus(app, 'accepted');
                          }}
                        >
                          Accept
                        </button>
                        <button
                          className="admin-small-btn reject"
                          type="button"
                          disabled={String(app.status || '').toLowerCase() === 'rejected'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateWorkshopApplicationStatus(app, 'rejected');
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-empty-state">No applicants yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedWorkshopApplicant && (
        <div className="admin-modal-overlay" onClick={() => setSelectedWorkshopApplicant(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Applicant Details</h3>
                <p className="admin-modal-subtitle">{getApplicantName(selectedWorkshopApplicant)}</p>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedWorkshopApplicant(null)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-applicant-detail-grid">
                {Object.entries({
                  ...selectedWorkshopApplicant.volunteer,
                  applicationStatus: selectedWorkshopApplicant.status,
                  appliedAt: selectedWorkshopApplicant.appliedAt,
                }).map(([key, value]) => (
                  <div className="admin-applicant-detail-row" key={key}>
                    <strong>{key}</strong>
                    <span>{formatApplicantValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showWorkshopBonusModal && selectedWorkshop && (
        <div className="admin-modal-overlay" onClick={() => setShowWorkshopBonusModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Bonus Points</h3>
                <p className="admin-modal-subtitle">Select a standout workshop applicant</p>
              </div>
              <button className="admin-modal-close" onClick={() => setShowWorkshopBonusModal(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-group">
                <label>Volunteer</label>
                <select value={bonusWorkshopApplicantId} onChange={(e) => setBonusWorkshopApplicantId(e.target.value)}>
                  <option value="">Select volunteer</option>
                  {workshopApplicants
                    .filter((app) => !['rejected', 'declined', 'refused'].includes(String(app.status || '').toLowerCase()))
                    .map((app) => (
                      <option key={app.id} value={app.id}>
                        {getApplicantName(app)} {app.bonusVolunteer ? '(already selected)' : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-modal-actions">
                <button className="admin-modal-btn neutral" type="button" onClick={() => setShowWorkshopBonusModal(false)}>
                  Cancel
                </button>
                <button className="admin-modal-btn" type="button" disabled={!bonusWorkshopApplicantId} onClick={handleSelectWorkshopBonus}>
                  Save Bonus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateWorkshopModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateWorkshopModal(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Create Workshop Opportunity</h3>
                <p className="admin-modal-subtitle">Published directly by Volux without approval queue</p>
              </div>
              <button className="admin-modal-close" onClick={() => setShowCreateWorkshopModal(false)}>&times;</button>
            </div>
            <form className="admin-modal-body" onSubmit={handleCreateWorkshopOpportunity}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Title (Arabic)</label>
                  <input name="title_ar" value={newWorkshop.title_ar} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>Title (English)</label>
                  <input name="title_en" value={newWorkshop.title_en} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input name="category" value={newWorkshop.category} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>Importance</label>
                  <select name="urgency" value={newWorkshop.urgency} onChange={handleWorkshopInputChange} required>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mode</label>
                  <select name="opportunityMode" value={newWorkshop.opportunityMode} onChange={handleWorkshopInputChange} required>
                    <option value="field">Field</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Volunteers Needed</label>
                  <input name="volunteersNeeded" type="number" value={newWorkshop.volunteersNeeded} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>Volunteering Hours</label>
                  <input name="hours" type="number" value={newWorkshop.hours} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>Location (Arabic)</label>
                  <input name="location_ar" value={newWorkshop.location_ar} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>Location (English)</label>
                  <input name="location_en" value={newWorkshop.location_en} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>State (Arabic)</label>
                  <input name="state_ar" value={newWorkshop.state_ar} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>State (English)</label>
                  <input name="state_en" value={newWorkshop.state_en} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input name="startDate" type="date" value={newWorkshop.startDate} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input name="endDate" type="date" value={newWorkshop.endDate} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Opportunity Image</label>
                  <input name="imageUrl" type="file" accept="image/*" onChange={handleWorkshopInputChange} />
                  {newWorkshop.imageUrl && (
                    <img src={newWorkshop.imageUrl} alt="Workshop" className="admin-form-preview-image" />
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Description (Arabic)</label>
                  <textarea name="description_ar" rows={3} value={newWorkshop.description_ar} onChange={handleWorkshopInputChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Description (English)</label>
                  <textarea name="description_en" rows={3} value={newWorkshop.description_en} onChange={handleWorkshopInputChange} required />
                </div>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-btn neutral" onClick={() => setShowCreateWorkshopModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-modal-btn" disabled={creatingWorkshop}>
                  {creatingWorkshop ? 'Publishing...' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editOpp && (
        <div className="admin-modal-overlay" onClick={closeEditModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Edit Opportunity</h3>
                <p className="admin-modal-subtitle">
                  {editOpp.title || editOpp.title_en || editOpp.title_ar || 'Opportunity'}
                </p>
              </div>
              <button className="admin-modal-close" onClick={closeEditModal}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-group">
                <label>Title</label>
                <input name="title" value={editForm.title} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Title (Arabic)</label>
                <input name="title_ar" value={editForm.title_ar} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Title (English)</label>
                <input name="title_en" value={editForm.title_en} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input name="category" value={editForm.category} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input name="location" value={editForm.location} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Location (Arabic)</label>
                <input name="location_ar" value={editForm.location_ar} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Location (English)</label>
                <input name="location_en" value={editForm.location_en} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>State</label>
                <input name="state" value={editForm.state} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>State (Arabic)</label>
                <input name="state_ar" value={editForm.state_ar} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>State (English)</label>
                <input name="state_en" value={editForm.state_en} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Volunteers Needed</label>
                <input name="volunteersNeeded" type="number" value={editForm.volunteersNeeded} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Hours</label>
                <input name="hours" type="number" value={editForm.hours} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input name="startDate" type="date" value={editForm.startDate} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows={3} value={editForm.description} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Description (Arabic)</label>
                <textarea name="description_ar" rows={3} value={editForm.description_ar} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Description (English)</label>
                <textarea name="description_en" rows={3} value={editForm.description_en} onChange={handleEditChange} />
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-modal-btn" onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .header-actions {
          display: flex;
          gap: 10px;
        }
        .admin-modal-wide {
          max-width: 980px;
          width: 96%;
        }
        .admin-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .admin-form-grid .full-width {
          grid-column: 1 / -1;
        }
        .admin-form-preview-image {
          margin-top: 10px;
          max-width: 240px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .admin-modal-btn.neutral {
          background: #e2e8f0;
          color: #0f172a;
          margin-right: 10px;
        }
        .admin-modal-btn.neutral:hover {
          background: #cbd5e1;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 10px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .modal-content h3 {
          margin-top: 0;
          color: #333;
        }
        .form-group {
          margin: 20px 0;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-family: inherit;
          resize: vertical;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn-cancel {
          padding: 10px 20px;
          background: #f0f0f0;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          color: #333;
        }
        .btn-reject {
          padding: 10px 20px;
          background: #ef4444;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          color: white;
          font-weight: 500;
        }
        .btn-cancel:hover {
          background: #e0e0e0;
        }
        .btn-reject:hover {
          background: #dc2626;
        }
        .opp-status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .tab-badge.pending {
          background-color: #f59e0b;
          color: white;
        }
        .tab-badge.rejected {
          background-color: #ef4444;
          color: white;
        }
        .opp-expanded-details {
          margin-top: 15px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #eaeaea;
        }
        .description-section h4 {
          margin-top: 0;
          margin-bottom: 8px;
          color: #555;
          font-size: 14px;
          font-weight: 600;
        }
        .description-section p {
          margin: 0;
          color: #666;
          font-size: 13px;
          line-height: 1.5;
        }
        .additional-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 12px;
          color: #888;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 13px;
          color: #333;
          font-weight: 500;
        }
        .opp-actions-compact {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 15px;
          gap: 8px;
        }
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: #f0f0f0;
        }
        .view-btn {
          color: #3b82f6;
        }
        .approve-btn {
          color: #10b981;
        }
        .reject-btn {
          color: #ef4444;
        }
        .edit-btn {
          color: #f59e0b;
        }
        .delete-btn {
          color: #ef4444;
        }
        .manage-workshop-btn {
          color: #7f4720;
        }
        .detail-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .detail-icon {
          margin-right: 8px;
          color: #6b7280;
          font-size: 14px;
        }
        .admin-workshop-toolbar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .admin-workshop-toolbar .admin-modal-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .admin-applicants-list {
          display: grid;
          gap: 12px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .admin-applicant-card {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fffaf5;
          cursor: pointer;
        }
        .admin-applicant-info {
          display: grid;
          gap: 5px;
          color: #4b5563;
          font-size: 13px;
        }
        .admin-applicant-info strong {
          color: #111827;
          font-size: 15px;
        }
        .admin-applicant-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 96px;
        }
        .admin-small-btn {
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
        }
        .admin-small-btn.accept {
          background: #10b981;
        }
        .admin-small-btn.reject {
          background: #ef4444;
        }
        .admin-small-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .admin-empty-state {
          padding: 28px;
          margin: 0;
          text-align: center;
          color: #6b7280;
          background: #f9fafb;
          border-radius: 8px;
        }
        .admin-applicant-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .admin-applicant-detail-row {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          background: #fffaf5;
        }
        .admin-applicant-detail-row strong {
          display: block;
          margin-bottom: 5px;
          color: #7f4720;
          font-size: 13px;
        }
        .admin-applicant-detail-row span {
          color: #111827;
          word-break: break-word;
          font-size: 14px;
        }
        @media (max-width: 860px) {
          .admin-form-grid {
            grid-template-columns: 1fr;
          }
          .header-actions {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          .admin-applicant-card,
          .admin-workshop-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .admin-applicant-actions {
            flex-direction: row;
            min-width: 0;
          }
          .admin-small-btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Opportunities;

