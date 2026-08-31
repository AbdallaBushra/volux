import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiEye, FiCheck, FiX, FiFlag, FiUser, FiCalendar, FiSearch, FiClock, FiTrash2 } from 'react-icons/fi';
import { db } from "../../firebase/firebase";
import { collection, getDocs, getDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { exportTableData } from '../utils/export';
import "../styles/admin.css";
const Reports = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const getReporterDisplayName = (userData, profileData) => {
    if (!userData) return 'Anonymous';
    return (
      profileData?.orgNameAr ||
      profileData?.orgNameEn ||
      profileData?.organizationName ||
      profileData?.teamNameAr ||
      profileData?.teamNameEn ||
      profileData?.teamName ||
      profileData?.fullName ||
      profileData?.name ||
      userData.fullName ||
      userData.name ||
      userData.institutionName ||
      userData.teamName ||
      userData.orgNameAr ||
      userData.orgNameEn ||
      userData.organizationName ||
      userData.displayName ||
      userData.email ||
      'Anonymous'
    );
  };

  const normalizeReporterName = (rawName, fallbackName) => {
    const name = (rawName || '').trim();
    const cleaned = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!name || cleaned === 'na') {
      return fallbackName || 'Anonymous';
    }
    return name;
  };

  const getSafeReporterName = (report) => {
    return normalizeReporterName(
      report?.reporterName,
      report?.reporterDisplayName || report?.reporterEmail
    );
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Fetch from all users' Complaints subcollections
      const usersSnap = await getDocs(collection(db, "Users"));
      let allComplaints = [];
      
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data() || {};
        const role = userData.role;
        let profileData = null;

        if (role) {
          const profileCollection =
            role === 'team'
              ? 'Volunteer_Team_Profile'
              : (role === 'institution' || role === 'organization')
              ? 'Organization_Profile'
              : 'Volunteer_Profile';
          try {
            const profileRef = doc(db, 'Users', userDoc.id, profileCollection, 'info');
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) profileData = profileSnap.data();
          } catch (e) {
            // Ignore profile fetch errors and fallback to base user data
          }
        }

        const reporterDisplayName = getReporterDisplayName(userData, profileData);
        const complaintsSnap = await getDocs(collection(db, "Reports", userDoc.id, "Complaints"));
        complaintsSnap.forEach(doc => {
          const complaintData = doc.data();
          const normalizedReporterName = normalizeReporterName(
            complaintData?.reporterName,
            reporterDisplayName
          );

          allComplaints.push({
            id: doc.id,
            reporterId: userDoc.id,
            reporterName: normalizedReporterName,
            reporterDisplayName,
            reporterRole: complaintData?.reporterRole || userData.role,
            reporterEmail: complaintData?.reporterEmail || userData.email,
            ...complaintData
          });
        });
      }
      
      setReports(allComplaints);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (report) => {
    try {
      await updateDoc(doc(db, "Reports", report.reporterId, "Complaints", report.id), { status: 'resolved' });
      alert('Report marked as resolved');
      fetchReports();
    } catch (error) {
      alert('Failed to update report');
    }
  };

  const handleDelete = async (report) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteDoc(doc(db, "Reports", report.reporterId, "Complaints", report.id));
        alert('Report deleted');
        fetchReports();
      } catch (error) {
        alert('Failed to delete report');
      }
    }
  };

  const openReportModal = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  
  const handleExport = () => {
    exportTableData('reports_report', filteredReports, {
      reportName: 'Reports Report',
      summary: {
        totalReports: stats.totalReports,
        pending: stats.pendingCount,
        resolved: stats.resolvedCount,
      },
    });
  };
const filteredReports = reports.filter(report => {
    const reason = report.reasonLabel || report.reason || report.violationType || report.details || '';
    const reporter = report.reporterName || '';
    const volunteer = report.volunteerName || '';
    const matchesSearch = reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         volunteer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeFilter === 'all' || (report.status || 'pending') === activeFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalReports: reports.length,
    pendingCount: reports.filter(r => (r.status || 'pending') === 'pending').length,
    resolvedCount: reports.filter(r => r.status === 'resolved').length
  };

  const collectImageUrls = (data = {}) => {
    const candidates = [data.imageUrl, data.image, data.photo, data.evidenceImage, data.screenshot];
    return [...new Set(candidates.filter((item) => typeof item === 'string' && item.trim()))];
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Reports...</div>;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header admin-sticky-tools">
          <div>
            <h1 className="admin-title">Reports & Complaints</h1>
            <p className="admin-subtitle">Manage and monitor all user reports and complaints</p>
          </div>
          <button className="export-btn" onClick={handleExport} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
            Export Data
          </button>
        </div>

        <div className="compact-stats-grid">
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}><FiAlertCircle /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.totalReports}</h3>
              <p className="compact-stat-label">Total Reports</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><FiClock /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.pendingCount}</h3>
              <p className="compact-stat-label">Pending Review</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FiCheck /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.resolvedCount}</h3>
              <p className="compact-stat-label">Resolved</p>
            </div>
          </div>
        </div>

        <div className="reports-tabs">
          <button className={`reports-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
            <span className="tab-badge all">{stats.totalReports}</span><span className="tab-text">All Reports</span>
          </button>
          <button className={`reports-tab ${activeFilter === 'pending' ? 'active' : ''}`} onClick={() => setActiveFilter('pending')}>
            <span className="tab-badge pending">{stats.pendingCount}</span><span className="tab-text">Pending</span>
          </button>
        </div>

        <div className="compact-search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search reports..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="reports-grid-compact">
          {filteredReports.map((report) => (
            <div key={report.id} className="report-card-compact">
              <div className="report-card-header">
                <div className="report-avatar" style={{ backgroundColor: '#ef4444' }}>{ (report.reporterName || 'R').charAt(0) }</div>
                <div className="report-header-info">
                  <h3 className="report-title">{report.reasonLabel || report.reason || (report.volunteerName ? `Complaint against ${report.volunteerName}` : "General Report")}</h3>
                  <div className="report-meta">
                    {activeFilter === 'all' && (
                      <span className={`report-status ${getStatusColor(report.status || 'pending')}`}>{report.status || 'Pending'}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="report-parties">
                <div className="party-section">
                  <div className="party-header"><FiUser className="party-icon" /><span>Reported By</span></div>
                  <div className="party-details">
                    <h4 className="party-name">{getSafeReporterName(report)}</h4>
                    {report.reporterRole && (
                      <p style={{ fontSize: '12px', color: '#666' }}>{report.reporterRole}</p>
                    )}
                  </div>
                </div>
                {report.volunteerName && (
                  <div className="party-section">
                    <div className="party-header"><FiUser className="party-icon" style={{ color: '#ef4444' }} /><span>Volunteer Reported</span></div>
                    <div className="party-details">
                      <h4 className="party-name">{report.volunteerName}</h4>
                      <p style={{ fontSize: '12px', color: '#666' }}>{report.volunteerEmail || "No email provided"}</p>
                    </div>
                  </div>
                )}
              </div>
              {report.details && (
                <div className="report-details-box" style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', marginTop: '10px', fontSize: '14px' }}>
                  <strong>Description:</strong>
                  <p>{report.details}</p>
                </div>
              )}
              <div className="report-actions-compact">
                {report.status !== 'resolved' && (
                  <button className="action-btn approve-btn" onClick={() => handleResolve(report)}><FiCheck /> Resolve</button>
                )}
                <button className="action-btn view-btn" onClick={() => openReportModal(report)}><FiEye /></button>
                <button className="action-btn delete-btn" onClick={() => handleDelete(report)}><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showReportModal && selectedReport && (
        <div className="admin-modal-overlay" onClick={closeReportModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Report Details</h3>
                <p className="admin-modal-subtitle">
                  {selectedReport.reasonLabel || selectedReport.reason || 'Complaint'}
                </p>
              </div>
              <button className="admin-modal-close" onClick={closeReportModal}>&times;</button>
            </div>
            <div className="admin-modal-body">
              {collectImageUrls(selectedReport).length > 0 && (
                <div className="admin-image-gallery">
                  {collectImageUrls(selectedReport).map((img, index) => (
                    <div className="admin-image-card" key={`report-image-${index}`}>
                      <img src={img} alt={`Report Evidence ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-detail-section">
                <h4 className="admin-section-title">Reporter Information</h4>
                <div className="admin-detail-row">
                  <div className="admin-detail-key">Reported By</div>
                  <div className="admin-detail-value">{getSafeReporterName(selectedReport)}</div>
                </div>
                {selectedReport.reporterRole && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Reporter Role</div>
                    <div className="admin-detail-value">{selectedReport.reporterRole}</div>
                  </div>
                )}
                {selectedReport.reporterEmail && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Reporter Email</div>
                    <div className="admin-detail-value">{selectedReport.reporterEmail}</div>
                  </div>
                )}
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-section-title">Reported Entity</h4>
                {selectedReport.volunteerName && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Volunteer Reported</div>
                    <div className="admin-detail-value">{selectedReport.volunteerName}</div>
                  </div>
                )}
                {selectedReport.volunteerEmail && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Volunteer Email</div>
                    <div className="admin-detail-value">{selectedReport.volunteerEmail}</div>
                  </div>
                )}
                {selectedReport.opportunityTitle && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Opportunity</div>
                    <div className="admin-detail-value">{selectedReport.opportunityTitle}</div>
                  </div>
                )}
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-section-title">Report Content</h4>
                {selectedReport.details && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Description</div>
                    <div className="admin-detail-value">{selectedReport.details}</div>
                  </div>
                )}
                {selectedReport.consequence && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Consequence</div>
                    <div className="admin-detail-value">{selectedReport.consequence}</div>
                  </div>
                )}
                {activeFilter === 'all' && selectedReport.status && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-key">Status</div>
                    <div className="admin-detail-value">{selectedReport.status}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-modal-btn" onClick={closeReportModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

