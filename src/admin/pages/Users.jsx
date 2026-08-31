import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiShield, FiClock, FiCalendar, FiSearch, FiEye, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { getAllUsers, deleteUser, updateUserStatus } from '../../database/adminData';
import { exportTableData } from '../utils/export';
import "../styles/admin.css";
import { db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const handleExport = () => {
    exportTableData('users_report', filteredUsers, {
      reportName: 'Users Report',
      summary: {
        totalUsers: stats.totalUsers,
        totalVolunteers: stats.totalVolunteers,
        totalOrganizations: stats.totalOrganizations,
        totalTeams: stats.totalTeams,
        totalActive: stats.totalActive,
      },
    });
  };
const filteredUsers = users.filter(user => {
    const name = user.fullName || user.displayName || user.name || user.orgNameAr || user.orgNameEn || user.teamNameAr || user.teamNameEn || '';
    const email = user.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all'
      || (roleFilter === 'organization' && (user.role === 'institution' || user.role === 'organization'))
      || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'volunteer': return '#667eea';
      case 'institution': case 'organization': return '#48bb78';
      case 'team': return '#ed64a6';
      case 'admin': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        alert('User deleted successfully');
        fetchUsers();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateUserStatus(id, newStatus);
      alert(`Status updated to ${newStatus}`);
      fetchUsers();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const stats = {
    totalUsers: users.length,
    totalVolunteers: users.filter(u => u.role === 'volunteer').length,
    totalOrganizations: users.filter(u => u.role === 'institution' || u.role === 'organization').length,
    totalTeams: users.filter(u => u.role === 'team').length,
    totalActive: users.filter(u => (u.status || 'active') === 'active').length
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
      return isNaN(d.getTime()) ? null : d;
    }
    if (value?.seconds) {
      return new Date(value.seconds * 1000);
    }
    if (value?._seconds) {
      return new Date(value._seconds * 1000);
    }
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
      minute: '2-digit'
    });
  };

  const formatDuration = (ms) => {
    if (!ms || ms <= 0) return 'N/A';
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const buildComputedFields = (data) => {
    const lastLogin =
      data?.lastLoginAt ||
      data?.lastLogin ||
      data?.lastLoginTime ||
      data?.lastSignInTime ||
      data?.loginTime ||
      data?.loginAt;
    const lastLogout =
      data?.lastLogoutAt ||
      data?.logoutAt ||
      data?.lastSignOutTime ||
      data?.logoutTime ||
      data?.lastLogout ||
      data?.signOutTime;
    const sessionStart = data?.sessionStart || data?.sessionStartAt || data?.loginTime || data?.lastLogin;
    const sessionEnd = data?.sessionEnd || data?.sessionEndAt || data?.logoutTime || data?.lastLogout;
    const startDate = normalizeTimestamp(sessionStart) || normalizeTimestamp(lastLogin);
    const endDate = normalizeTimestamp(sessionEnd) || normalizeTimestamp(lastLogout);
    const durationMs = startDate && endDate ? endDate.getTime() - startDate.getTime() : null;

    return {
      lastLoginFormatted: formatDateTime(lastLogin),
      lastLogoutFormatted: formatDateTime(lastLogout),
      sessionStartFormatted: formatDateTime(sessionStart),
      sessionEndFormatted: formatDateTime(sessionEnd),
      sessionDuration: formatDuration(durationMs)
    };
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setLoadingUserDetails(true);
    try {
      let profileData = {};
      const role = user?.role;
      if (role) {
        const sub = role === 'team'
          ? 'Volunteer_Team_Profile'
          : (role === 'institution' || role === 'organization')
          ? 'Organization_Profile'
          : 'Volunteer_Profile';
        const profileRef = doc(db, 'Users', user.id, sub, 'info');
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) profileData = profileSnap.data();
      }

      const mergedData = {
        ...user,
        ...profileData,
      };
      const computed = buildComputedFields(mergedData);
      setUserDetails({
        ...mergedData,
        computed
      });
    } catch (e) {
      console.error('Error loading user details:', e);
      setUserDetails(user);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setUserDetails(null);
  };

  const toDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.join(', ') || 'N/A';
    return String(value);
  };

  const collectImageUrls = (data = {}) => {
    const candidates = [
      data.profileImage,
      data.avatar,
      data.photo,
      data.logo,
      data.imageUrl,
      data.coverImage,
    ];
    return [...new Set(candidates.filter((item) => typeof item === 'string' && item.trim()))];
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Users...</div>;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header admin-sticky-tools">
          <div>
            <h1 className="admin-title">Users</h1>
            <p className="admin-subtitle">Manage and monitor all platform users</p>
          </div>
          <button className="export-btn" onClick={handleExport} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
            Export Data
          </button>
        </div>

        <div className="compact-stats-grid">
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}><FiUser /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.totalUsers}</h3>
              <p className="compact-stat-label">Total Users</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}><FiShield /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.totalVolunteers}</h3>
              <p className="compact-stat-label">Volunteers</p>
            </div>
          </div>
          <div className="compact-stat-card">
            <div className="compact-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FiCheckCircle /></div>
            <div className="compact-stat-content">
              <h3 className="compact-stat-value">{stats.totalOrganizations}</h3>
              <p className="compact-stat-label">Organizations</p>
            </div>
          </div>
        </div>

        <div className="users-tabs">
          <button className={`users-tab ${roleFilter === 'all' ? 'active' : ''}`} onClick={() => setRoleFilter('all')}>
            <span className="tab-badge all">{stats.totalUsers}</span><span className="tab-text">All Users</span>
          </button>
          <button className={`users-tab ${roleFilter === 'volunteer' ? 'active' : ''}`} onClick={() => setRoleFilter('volunteer')}>
            <span className="tab-badge volunteer">{stats.totalVolunteers}</span><span className="tab-text">Volunteers</span>
          </button>
          <button className={`users-tab ${roleFilter === 'organization' ? 'active' : ''}`} onClick={() => setRoleFilter('organization')}>
            <span className="tab-badge organization">{stats.totalOrganizations}</span><span className="tab-text">Organizations</span>
          </button>
          <button className={`users-tab ${roleFilter === 'team' ? 'active' : ''}`} onClick={() => setRoleFilter('team')}>
            <span className="tab-badge team">{stats.totalTeams}</span><span className="tab-text">Teams</span>
          </button>
        </div>

        <div className="compact-search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search users..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="filter-actions">
            <select className="filter-dropdown" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="users-grid-compact">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card-compact">
              <div className="user-card-header">
                <div className="user-avatar" style={{ backgroundColor: '#667eea' }}>{ (user.fullName || user.name || 'U').charAt(0) }</div>
                <div className="user-header-info">
                  <h3 className="user-name">{user.fullName || user.name || 'Unnamed User'}</h3>
                  <div className="user-meta">
                    {statusFilter === 'all' && (
                      <span className={`user-status ${getStatusColor(user.status || 'active')}`}>{user.status || 'Active'}</span>
                    )}
                    <span className="user-role">
                      <span className="role-tag" style={{ backgroundColor: `${getRoleColor(user.role)}15`, color: getRoleColor(user.role) }}>{user.role}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="user-contact-compact">
                <FiMail className="contact-icon" />
                <div className="contact-details">
                  <h4 className="contact-email">{user.email}</h4>
                  <p className="contact-joined">Joined {formatDate(user.createdAt)}</p>
                </div>
              </div>
              {statusFilter === 'all' && (
                <div className="user-status-control">
                  <select className="status-select" value={user.status || 'active'} onChange={(e) => handleStatusChange(user.id, e.target.value)}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              )}
              <div className="user-actions-compact">
                <button className="action-btn view-btn" onClick={() => openUserModal(user)}><FiEye /></button>
                <button className="action-btn delete-btn" onClick={() => handleDeleteUser(user.id)}><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showUserModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={closeUserModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">User Details</h3>
                <p className="admin-modal-subtitle">
                  {selectedUser.fullName || selectedUser.name || selectedUser.email || 'User'}
                </p>
              </div>
              <button className="admin-modal-close" onClick={closeUserModal}>&times;</button>
            </div>
            <div className="admin-modal-body">
              {loadingUserDetails ? (
                'Loading details...'
              ) : (
                <>
                  {collectImageUrls(userDetails || selectedUser).length > 0 && (
                    <div className="admin-image-gallery">
                      {collectImageUrls(userDetails || selectedUser).map((img, index) => (
                        <div className="admin-image-card" key={`user-image-${index}`}>
                          <img src={img} alt={`User ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Basic Information</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Full Name</div>
                      <div className="admin-detail-value">{toDisplayValue((userDetails || selectedUser)?.fullName || (userDetails || selectedUser)?.name || (userDetails || selectedUser)?.displayName)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Email</div>
                      <div className="admin-detail-value">{toDisplayValue((userDetails || selectedUser)?.email)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Phone</div>
                      <div className="admin-detail-value">{toDisplayValue((userDetails || selectedUser)?.phone || (userDetails || selectedUser)?.mobile || (userDetails || selectedUser)?.contactPhone)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Role</div>
                      <div className="admin-detail-value">{toDisplayValue((userDetails || selectedUser)?.role)}</div>
                    </div>
                    {statusFilter === 'all' && (
                      <div className="admin-detail-row">
                        <div className="admin-detail-key">Status</div>
                        <div className="admin-detail-value">{toDisplayValue((userDetails || selectedUser)?.status || 'active')}</div>
                      </div>
                    )}
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Location</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">State</div>
                      <div className="admin-detail-value">{toDisplayValue((userDetails || selectedUser)?.state)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">City</div>
                      <div className="admin-detail-value">{toDisplayValue((userDetails || selectedUser)?.city)}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Address</div>
                      <div className="admin-detail-value">{toDisplayValue((userDetails || selectedUser)?.address)}</div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4 className="admin-section-title">Account Activity</h4>
                    <div className="admin-detail-row">
                      <div className="admin-detail-key">Created At</div>
                      <div className="admin-detail-value">{formatDateTime((userDetails || selectedUser)?.createdAt)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="admin-modal-actions">
              <button className="admin-modal-btn" onClick={closeUserModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

