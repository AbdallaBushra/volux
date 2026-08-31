import React, { useState, useEffect } from 'react';
import { FiFolder, FiClock, FiCalendar, FiEye, FiEdit2, FiSearch, FiTrash2, FiActivity, FiMail, FiCheck, FiX } from 'react-icons/fi';
import { MdOutlineLeaderboard, MdPeopleOutline } from 'react-icons/md';
import { getAllTeams, deleteUser, updateUserStatus } from '../../database/adminData';
import { db } from '../../firebase/firebase';
import {addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where, getDoc, updateDoc} from 'firebase/firestore';
import { exportTableData } from '../utils/export';
import "../styles/admin.css";
const Teams = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(false);
  const [teamDetails, setTeamDetails] = useState(null);
  const [showEditRequestsModal, setShowEditRequestsModal] = useState(false);
  const [editRequests, setEditRequests] = useState([]);
  const [loadingEditRequests, setLoadingEditRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    fetchTeams();
    fetchTeamEditRequests();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await getAllTeams();
      setTeams(data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamEditRequests = async () => {
    try {
      setLoadingEditRequests(true);
      const requestsQuery = query(
        collection(db, "ProfileEditRequests"),
        where("status", "==", "pending"),
        where("requesterRole", "==", "team")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const rows = requestsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      rows.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setEditRequests(rows);
    } catch (error) {
      console.error("Error fetching team edit requests:", error);
      setEditRequests([]);
    } finally {
      setLoadingEditRequests(false);
    }
  };

  const normalizeRequestedData = (requestedData) => {
    if (!requestedData || typeof requestedData !== 'object') return {};
    return Object.fromEntries(
      Object.entries(requestedData).filter(([, value]) => value !== undefined)
    );
  };

  const formatRequestDate = (value) => {
    if (!value) return 'N/A';
    if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
    return String(value);
  };

  const handleApproveEditRequest = async (requestItem) => {
    try {
      setProcessingRequestId(requestItem.id);
      const requesterId = requestItem.requesterId;
      const requestedData = normalizeRequestedData(requestItem.requestedData);

      if (!requesterId || Object.keys(requestedData).length === 0) {
        alert('Invalid request data');
        return;
      }

      await updateDoc(doc(db, "Users", requesterId), {
        ...requestedData,
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, "Users", requesterId, "Volunteer_Team_Profile", "info"), {
        ...requestedData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await updateDoc(doc(db, "ProfileEditRequests", requestItem.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
        reviewedBy: "admin"
      });

      await setDoc(doc(collection(db, "Notifications", requesterId, "in_App")), {
        title_ar: "تم قبول طلب تعديل الملف",
        title_en: "Profile Edit Approved",
        message_ar: "تمت الموافقة على طلب تعديل بيانات الفريق.",
        message_en: "Your team profile edit request has been approved.",
        type: "profile_edit_approved",
        read: false,
        createdAt: serverTimestamp()
      });

      alert('Team edit request approved and applied');
      await Promise.all([fetchTeams(), fetchTeamEditRequests()]);
    } catch (error) {
      console.error("Error approving team edit request:", error);
      alert('Failed to approve request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectEditRequest = async (requestItem) => {
    try {
      setProcessingRequestId(requestItem.id);

      await updateDoc(doc(db, "ProfileEditRequests", requestItem.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
        reviewedBy: "admin"
      });

      if (requestItem.requesterId) {
        await setDoc(doc(collection(db, "Notifications", requestItem.requesterId, "in_App")), {
          title_ar: "تم رفض طلب تعديل الملف",
          title_en: "Profile Edit Rejected",
          message_ar: "تم رفض طلب تعديل بيانات الفريق.",
          message_en: "Your team profile edit request has been rejected.",
          type: "profile_edit_rejected",
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('Team edit request rejected');
      await fetchTeamEditRequests();
    } catch (error) {
      console.error("Error rejecting team edit request:", error);
      alert('Failed to reject request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  
  const handleExport = () => {
    exportTableData('teams_report', filteredTeams, {
      reportName: 'Teams Report',
      summary: {
        totalTeams: stats.totalTeams,
        approved: stats.approvedCount,
        pending: stats.pendingCount,
      },
    });
  };

  const getTeamDisplayName = (team) => {
    return team?.teamNameAr || team?.teamNameEn || team?.teamName || team?.displayName || team?.fullName || team?.name || '';
  };

const filteredTeams = teams.filter(team => {
    const name = getTeamDisplayName(team);
    const leader = team.leaderName || team.leader || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leader.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'approved' ? (team.status || 'active') === 'active' : (team.status === 'pending'));
    return matchesSearch && matchesTab;
  });

  const handleApprove = async (id) => {
    try {
      await updateUserStatus(id, 'active');
      
      // Notify team
      const notifRef = doc(collection(db, "Notifications", id, "in_App"));
        await setDoc(notifRef, {
        title_ar: "ØªÙ… Ù‚Ø¨ÙˆÙ„ ÙØ±ÙŠÙ‚Ùƒ",
        title_en: "Team Approved",
        message_ar: "Ù„Ù‚Ø¯ ØªÙ… Ù‚Ø¨ÙˆÙ„ ÙØ±ÙŠÙ‚Ùƒ Ø§Ù„ØªØ·ÙˆØ¹ÙŠ Ù…Ù† Ù‚Ø¨Ù„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¢Ù† Ø§Ù„Ø¨Ø¯Ø¡ ÙÙŠ Ù†Ø´Ø± Ø§Ù„ÙØ±Øµ.",
        message_en: "Your volunteer team has been approved by the admin. You can now start posting opportunities.",
        type: "approval",
        read: false,
        createdAt: serverTimestamp()
        });

      alert('Team approved successfully');
      fetchTeams();
    } catch (error) {
      alert('Failed to approve');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteUser(id);
        alert('Deleted successfully');
        fetchTeams();
      } catch (error) {
        alert('Failed to delete');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'active';
      case 'pending': return 'pending';
      default: return 'active';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const normalizeTimestamp = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (value?.seconds) return new Date(value.seconds * 1000);
    if (value?._seconds) return new Date(value._seconds * 1000);
    return null;
  };

  const formatDateTime = (value) => {
    const d = normalizeTimestamp(value);
    if (!d) return 'N/A';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pickActivityValue = (data, keys) => {
    for (const key of keys) {
      if (data?.[key] !== undefined && data?.[key] !== null && data?.[key] !== '') {
        return data[key];
      }
    }
    return null;
  };

  const stats = {
    totalTeams: teams.length,
    approvedCount: teams.filter(t => (t.status || 'active') === 'active').length,
    pendingCount: teams.filter(t => t.status === 'pending').length
  };

  const toDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.join(', ') || 'N/A';
    return String(value);
  };

  const collectImageUrls = (data = {}) => {
    const candidates = [data.logo, data.imageUrl, data.teamLogo, data.coverImage, data.photo];
    return [...new Set(candidates.filter((item) => typeof item === 'string' && item.trim()))];
  };

  const openTeamModal = async (team) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
    setLoadingTeamDetails(true);
    try {
      const profileRef = doc(db, 'Users', team.id, 'Volunteer_Team_Profile', 'info');
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      setTeamDetails({ ...team, ...profileData });
    } catch (e) {
      console.error('Error loading team details:', e);
      setTeamDetails(team);
    } finally {
      setLoadingTeamDetails(false);
    }
  };

  const closeTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTeam(null);
    setTeamDetails(null);
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Teams...</div>;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header admin-sticky-tools">
          <div>
            <h1 className="admin-title">Volunteer Teams</h1>
            <p className="admin-subtitle">Manage all volunteer teams in the system</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="export-btn"
              onClick={() => setShowEditRequestsModal(true)}
              style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Edit Requests ({editRequests.length})
            </button>
            <button className="export-btn" onClick={handleExport} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
              Export Data
            </button>
          </div>
        </div>

        <div className="compact-stats-grid">
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}><MdPeopleOutline /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.totalTeams}</h3>
              <p className="compact-stat-label">Total Teams</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #48bb78, #38a169)' }}><FiCheck /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.approvedCount}</h3>
              <p className="compact-stat-label">Approved</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #f6ad55, #ed8936)' }}><FiActivity /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.pendingCount}</h3>
              <p className="compact-stat-label">Pending</p>
            </div>
          </div>
        </div>

        <div className="org-tabs">
          <button className={`org-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            <span className="tab-text">All Teams</span>
          </button>
          <button className={`org-tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
            <span className="tab-text">Approved Teams</span>
          </button>
          <button className={`org-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <span className="tab-text">Pending Review</span>
          </button>
        </div>

        <div className="compact-search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search teams..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="teams-grid-compact">
          {filteredTeams.map((team) => (
            <div key={team.id} className="team-card-compact">
              <div className="team-card-header">
                <div className="team-avatar" style={{ backgroundColor: '#ed64a6' }}>
                  {(getTeamDisplayName(team) || 'T').charAt(0)}
                </div>
                <div className="team-header-info">
                  <h3 className="team-name">{getTeamDisplayName(team) || 'Unnamed Team'}</h3>
                  <div className="team-meta">
                    {activeTab === 'all' && (
                      <span className={`team-status ${getStatusColor(team.status || 'active')}`}>{team.status || 'Active'}</span>
                    )}
                    <span className="team-join-date">{formatDate(team.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="team-leader-compact">
                <MdOutlineLeaderboard className="leader-icon" />
                <div className="leader-details">
                  <h4 className="leader-name">{team.leaderName || 'N/A'}</h4>
                  <p className="leader-email">{team.email}</p>
                </div>
              </div>
              <div className="team-actions-compact">
                {activeTab === 'pending' ? (
                  <>
                    <button className="action-btn view-btn" onClick={() => openTeamModal(team)}><FiEye /></button>
                    <button className="action-btn approve-btn" onClick={() => handleApprove(team.id)}><FiCheck /> Approve</button>
                    <button className="action-btn reject-btn" onClick={() => handleDelete(team.id)}><FiX /> Reject</button>
                  </>
                ) : (
                  <>
                    <button className="action-btn view-btn" onClick={() => openTeamModal(team)}><FiEye /></button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(team.id)}><FiTrash2 /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showTeamModal && selectedTeam && (
        <div className="admin-modal-overlay" onClick={closeTeamModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Team Details</h3>
                <p className="admin-modal-subtitle">
                  {getTeamDisplayName(selectedTeam) || selectedTeam.email || 'Team'}
                </p>
              </div>
              <button className="admin-modal-close" onClick={closeTeamModal}>&times;</button>
            </div>
            <div className="admin-modal-body">
              {loadingTeamDetails ? (
                'Loading details...'
              ) : (
                <>
                  {collectImageUrls(teamDetails || selectedTeam).length > 0 && (
                    <div className="admin-image-gallery">
                      {collectImageUrls(teamDetails || selectedTeam).map((img, index) => (
                        <div className="admin-image-card" key={`team-image-${index}`}>
                          <img src={img} alt={`Team ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Team Identity</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Team Name (AR)</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.teamNameAr || (teamDetails || selectedTeam)?.teamName || (teamDetails || selectedTeam)?.displayName)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Team Name (EN)</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.teamNameEn || (teamDetails || selectedTeam)?.teamName || (teamDetails || selectedTeam)?.displayName)}</div>
                    </div>
                    {activeTab === 'all' && (
                      <div className="admin-detail-row">
                        <div className="admin-detail-key">Status</div>
                        <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.status || 'active')}</div>
                      </div>
                    )}
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Team Type</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.teamType)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Members Count</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.membersCount)}</div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Leadership & Contact</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Leader Name</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.leaderName || (teamDetails || selectedTeam)?.contactPersonName)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Email</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.email)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Phone</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.phone || (teamDetails || selectedTeam)?.contactPersonPhone)}</div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Location & Focus</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">State</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.state)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Fields Of Work</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.fieldsOfWork)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Activities</div>
                      <div className="admin-detail-value">{toDisplayValue((teamDetails || selectedTeam)?.activities)}</div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Account Activity</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Last Login</div>
                      <div className="admin-detail-value">
                        {formatDateTime(
                          pickActivityValue(teamDetails || selectedTeam, [
                            'lastLoginAt',
                            'lastLogin',
                            'lastLoginTime',
                            'lastSignInTime',
                            'loginTime',
                            'loginAt',
                          ])
                        )}
                      </div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Last Logout</div>
                      <div className="admin-detail-value">
                        {formatDateTime(
                          pickActivityValue(teamDetails || selectedTeam, [
                            'lastLogoutAt',
                            'logoutAt',
                            'lastSignOutTime',
                            'logoutTime',
                            'lastLogout',
                            'signOutTime',
                          ])
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="admin-modal-actions">
              <button className="admin-modal-btn" onClick={closeTeamModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showEditRequestsModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditRequestsModal(false)}>
          <div className="admin-modal edit-requests-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Team Profile Edit Requests</h3>
                <p className="admin-modal-subtitle">Review and approve/reject pending team profile updates</p>
              </div>
              <button className="admin-modal-close" onClick={() => setShowEditRequestsModal(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              {loadingEditRequests ? (
                <div className="edit-request-empty">Loading requests...</div>
              ) : editRequests.length === 0 ? (
                <div className="edit-request-empty">No pending team edit requests.</div>
              ) : (
                <div className="edit-request-list">
                  {editRequests.map((requestItem) => (
                    <div className="edit-request-card" key={requestItem.id}>
                      <div className="edit-request-card-header">
                        <div>
                          <h4>{requestItem.requesterName || requestItem.requesterId || 'Team'}</h4>
                          <p>Submitted: {formatRequestDate(requestItem.createdAt)}</p>
                        </div>
                        <span className="edit-request-status">Pending</span>
                      </div>
                      <div className="edit-request-fields">
                        {Object.entries(requestItem.requestedData || {}).map(([fieldKey, fieldValue]) => (
                          <div className="edit-request-field-row" key={fieldKey}>
                            <span className="edit-request-field-key">{fieldKey}</span>
                            <span className="edit-request-field-value">
                              {typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="edit-request-actions">
                        <button
                          className="edit-request-btn reject"
                          onClick={() => handleRejectEditRequest(requestItem)}
                          disabled={processingRequestId === requestItem.id}
                        >
                          Reject
                        </button>
                        <button
                          className="edit-request-btn approve"
                          onClick={() => handleApproveEditRequest(requestItem)}
                          disabled={processingRequestId === requestItem.id}
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-modal-actions">
              <button className="admin-modal-btn" onClick={() => setShowEditRequestsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;

