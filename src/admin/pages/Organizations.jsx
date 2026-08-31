import React, { useState, useEffect } from 'react';
import { FiEye, FiEdit2, FiCheck, FiX, FiMoreVertical, FiFilter, FiMail, FiUsers, FiTrendingUp, FiFolder } from 'react-icons/fi';
import { getAllOrganizations, deleteUser, updateUserStatus } from '../../database/adminData';
import { db } from '../../firebase/firebase';
import {addDoc, collection, doc, serverTimestamp, setDoc, getDoc, getDocs, query, where, updateDoc} from 'firebase/firestore';
import { FiTrash2 } from 'react-icons/fi';
import { exportTableData } from '../utils/export';
import "../styles/admin.css";
const Organizations = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [loadingOrgDetails, setLoadingOrgDetails] = useState(false);
  const [orgDetails, setOrgDetails] = useState(null);
  const [showEditRequestsModal, setShowEditRequestsModal] = useState(false);
  const [editRequests, setEditRequests] = useState([]);
  const [loadingEditRequests, setLoadingEditRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    fetchOrgs();
    fetchOrganizationEditRequests();
  }, []);

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const data = await getAllOrganizations();
      setOrgs(data);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationEditRequests = async () => {
    try {
      setLoadingEditRequests(true);
      const requestsQuery = query(
        collection(db, "ProfileEditRequests"),
        where("status", "==", "pending")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const rows = requestsSnapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((item) => item.requesterRole === 'institution' || item.requesterRole === 'organization');
      rows.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setEditRequests(rows);
    } catch (error) {
      console.error("Error fetching organization edit requests:", error);
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

      await setDoc(doc(db, "Users", requesterId, "Organization_Profile", "info"), {
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
        message_ar: "تمت الموافقة على طلب تعديل بيانات المؤسسة.",
        message_en: "Your organization profile edit request has been approved.",
        type: "profile_edit_approved",
        read: false,
        createdAt: serverTimestamp()
      });

      alert('Organization edit request approved and applied');
      await Promise.all([fetchOrgs(), fetchOrganizationEditRequests()]);
    } catch (error) {
      console.error("Error approving organization edit request:", error);
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
          message_ar: "تم رفض طلب تعديل بيانات المؤسسة.",
          message_en: "Your organization profile edit request has been rejected.",
          type: "profile_edit_rejected",
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('Organization edit request rejected');
      await fetchOrganizationEditRequests();
    } catch (error) {
      console.error("Error rejecting organization edit request:", error);
      alert('Failed to reject request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  
  const handleExport = () => {
    exportTableData('organizations_report', filteredOrgs, {
      reportName: 'Organizations Report',
      summary: {
        totalOrganizations: stats.totalOrgs,
        approved: stats.approvedCount,
        pending: stats.pendingCount,
      },
    });
  };
const filteredOrgs = orgs.filter(org => {
    const name = org.orgName || org.orgNameAr || org.orgNameEn || org.institutionName || org.organizationName || org.name || '';
    const email = org.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'approved' ? (org.status || 'active') === 'active' : (org.status === 'pending'));
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleApprove = async (id) => {
    try {
      await updateUserStatus(id, 'active');
      
      // Notify organization
      const notifRef = doc(collection(db, "Notifications", id, "in_App"));
        await setDoc(notifRef, {
        title_ar: "ØªÙ… Ù‚Ø¨ÙˆÙ„ Ù…Ù†Ø¸Ù…ØªÙƒ",
        title_en: "Organization Approved",
        message_ar: "Ù„Ù‚Ø¯ ØªÙ… Ù‚Ø¨ÙˆÙ„ Ù…Ù†Ø¸Ù…ØªÙƒ Ù…Ù† Ù‚Ø¨Ù„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¢Ù† Ø§Ù„Ø¨Ø¯Ø¡ ÙÙŠ Ù†Ø´Ø± Ø§Ù„ÙØ±Øµ Ø§Ù„ØªØ·ÙˆØ¹ÙŠØ©.",
        message_en: "Your organization has been approved by the admin. You can now start posting volunteering opportunities.",
        type: "approval",
        read: false,
        createdAt: serverTimestamp()
        });

      alert('Organization approved successfully');
      fetchOrgs();
    } catch (error) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to reject/delete this organization?')) {
      try {
        await deleteUser(id);
        alert('Deleted successfully');
        fetchOrgs();
      } catch (error) {
        alert('Failed to delete');
      }
    }
  };

  const stats = {
    totalOrgs: orgs.length,
    approvedCount: orgs.filter(o => (o.status || 'active') === 'active').length,
    pendingCount: orgs.filter(o => o.status === 'pending').length
  };

  const toDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.join(', ') || 'N/A';
    return String(value);
  };

  const collectImageUrls = (data = {}) => {
    const candidates = [data.logo, data.imageUrl, data.orgLogo, data.coverImage, data.photo];
    return [...new Set(candidates.filter((item) => typeof item === 'string' && item.trim()))];
  };

  const openOrgModal = async (org) => {
    setSelectedOrg(org);
    setShowOrgModal(true);
    setLoadingOrgDetails(true);
    try {
      const profileRef = doc(db, 'Users', org.id, 'Organization_Profile', 'info');
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      setOrgDetails({ ...org, ...profileData });
    } catch (e) {
      console.error('Error loading organization details:', e);
      setOrgDetails(org);
    } finally {
      setLoadingOrgDetails(false);
    }
  };

  const closeOrgModal = () => {
    setShowOrgModal(false);
    setSelectedOrg(null);
    setOrgDetails(null);
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Organizations...</div>;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header admin-sticky-tools">
          <div>
            <h1 className="admin-title">Organizations</h1>
            <p className="admin-subtitle">Manage and monitor all registered organizations</p>
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
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}><FiFolder /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.totalOrgs}</h3>
              <p className="compact-stat-label">Total Organizations</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FiCheck /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.approvedCount}</h3>
              <p className="compact-stat-label">Approved</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><FiUsers /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.pendingCount}</h3>
              <p className="compact-stat-label">Pending</p>
            </div>
          </div>
        </div>

        <div className="org-tabs">
          <button className={`org-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            <span className="tab-badge all">{stats.totalOrgs}</span><span className="tab-text">All</span>
          </button>
          <button className={`org-tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
            <span className="tab-badge approved">{stats.approvedCount}</span><span className="tab-text">Approved</span>
          </button>
          <button className={`org-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <span className="tab-badge pending">{stats.pendingCount}</span><span className="tab-text">Pending Review</span>
          </button>
        </div>

        <div className="compact-search-filter">
          <div className="search-box">
            <FiFilter className="search-icon" />
            <input type="text" placeholder="Search organizations..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="org-grid-compact">
          {filteredOrgs.map((org) => (
            <div key={org.id} className="org-card-compact">
              <div className="org-card-header">
                <div className="org-avatar" style={{ backgroundColor: '#3b82f6' }}>
                  {(org.orgName || org.orgNameAr || org.orgNameEn || org.institutionName || org.organizationName || org.name || 'O').charAt(0)}
                </div>
                <div className="org-header-info">
                  <h3 className="org-name">{org.orgName || org.orgNameAr || org.orgNameEn || org.institutionName || org.organizationName || org.name || 'Unnamed Org'}</h3>
                  <div className="org-meta">
                    {activeTab === 'all' && (
                      <span className={`org-status ${getStatusColor(org.status || 'active')}`}>{org.status || 'Active'}</span>
                    )}
                    <span className="org-join-date">Joined {formatDate(org.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="org-contact-compact">
                <FiMail className="contact-icon" />
                <div className="contact-details">
                  <h4 className="contact-email">{org.email}</h4>
                  <p className="contact-person">{org.contactPerson || 'N/A'}</p>
                </div>
              </div>
              <div className="org-actions-compact">
                {activeTab === 'pending' ? (
                  <>
                    <button className="action-btn view-btn" onClick={() => openOrgModal(org)}><FiEye /></button>
                    <button className="action-btn approve-btn" onClick={() => handleApprove(org.id)}><FiCheck /> Approve</button>
                    <button className="action-btn reject-btn" onClick={() => handleReject(org.id)}><FiX /> Reject</button>
                  </>
                ) : (
                  <>
                    <button className="action-btn view-btn" onClick={() => openOrgModal(org)}><FiEye /></button>
                    <button className="action-btn delete-btn" onClick={() => handleReject(org.id)}><FiTrash2 /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showOrgModal && selectedOrg && (
        <div className="admin-modal-overlay" onClick={closeOrgModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Organization Details</h3>
                <p className="admin-modal-subtitle">
                  {selectedOrg.orgName || selectedOrg.name || selectedOrg.email || 'Organization'}
                </p>
              </div>
              <button className="admin-modal-close" onClick={closeOrgModal}>&times;</button>
            </div>
            <div className="admin-modal-body">
              {loadingOrgDetails ? (
                'Loading details...'
              ) : (
                <>
                  {collectImageUrls(orgDetails || selectedOrg).length > 0 && (
                    <div className="admin-image-gallery">
                      {collectImageUrls(orgDetails || selectedOrg).map((img, index) => (
                        <div className="admin-image-card" key={`org-image-${index}`}>
                          <img src={img} alt={`Organization ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Organization Identity</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Organization Name (AR)</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.orgNameAr || (orgDetails || selectedOrg)?.organizationName || (orgDetails || selectedOrg)?.name)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Organization Name (EN)</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.orgNameEn || (orgDetails || selectedOrg)?.organizationName || (orgDetails || selectedOrg)?.name)}</div>
                    </div>
                    {activeTab === 'all' && (
                      <div className="admin-detail-row">
                        <div className="admin-detail-key">Status</div>
                        <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.status || 'active')}</div>
                      </div>
                    )}
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Organization Type</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.orgType)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Organization Category</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.orgCategory)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Establishment Year</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.establishmentYear)}</div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Contact Details</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Email</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.email)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Phone</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.phone || (orgDetails || selectedOrg)?.contactPhone)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Secondary Phone</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.secondaryPhone)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Contact Person Name</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.contactPersonName)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Contact Person Position</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.contactPersonPosition)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Contact Person Phone</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.contactPersonPhone)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Contact Person Email</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.contactPersonEmail)}</div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Address & License</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">State</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.state)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">License Number</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.licenseNumber)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">License Issue Date</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.licenseIssueDate)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">License Expiry</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.licenseExpiryDate)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Website</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.website)}</div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Organization Scope</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Fields Of Work</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.fieldsOfWork)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Mission</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.mission)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Vision</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.vision)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Number Of Employees</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.numberOfEmployees)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Number Of Beneficiaries</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.numberOfBeneficiaries)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Previous Projects</div>
                      <div className="admin-detail-value">{toDisplayValue((orgDetails || selectedOrg)?.previousProjects)}</div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Account Activity</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Last Login</div>
                      <div className="admin-detail-value">
                        {formatDateTime(
                          pickActivityValue(orgDetails || selectedOrg, [
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
                          pickActivityValue(orgDetails || selectedOrg, [
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
              <button className="admin-modal-btn" onClick={closeOrgModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showEditRequestsModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditRequestsModal(false)}>
          <div className="admin-modal edit-requests-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Organization Profile Edit Requests</h3>
                <p className="admin-modal-subtitle">Review and approve/reject pending organization profile updates</p>
              </div>
              <button className="admin-modal-close" onClick={() => setShowEditRequestsModal(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              {loadingEditRequests ? (
                <div className="edit-request-empty">Loading requests...</div>
              ) : editRequests.length === 0 ? (
                <div className="edit-request-empty">No pending organization edit requests.</div>
              ) : (
                <div className="edit-request-list">
                  {editRequests.map((requestItem) => (
                    <div className="edit-request-card" key={requestItem.id}>
                      <div className="edit-request-card-header">
                        <div>
                          <h4>{requestItem.requesterName || requestItem.requesterId || 'Organization'}</h4>
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

export default Organizations;

