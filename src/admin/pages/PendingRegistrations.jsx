// src/admin/pages/PendingRegistrations.jsx
import React, { useEffect, useState } from 'react';
import { 
  getPendingRegistrations, 
  approveRegistration, 
  rejectRegistration 
} from '../../database/adminData';
import '../styles/admin.css';

const PendingRegistrations = () => {
  const isInstitutionRole = (role) => {
    const normalized = String(role || '').toLowerCase();
    return normalized === 'institution' || normalized === 'organization';
  };

  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await getPendingRegistrations();
      setPendingUsers(data);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      setNotification({ 
        type: 'error', 
        message: 'فشل في جلب الطلبات المعلقة' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذا الحساب؟')) return;
    
    try {
      const result = await approveRegistration(userId);
      if (result.success) {
        setNotification({ 
          type: 'success', 
          message: 'تمت الموافقة على الحساب بنجاح' 
        });
        fetchPendingUsers();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'فشل في الموافقة على الحساب'
        });
      }
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: 'فشل في الموافقة على الحساب' 
      });
    }
  };

  const handleReject = async (userId) => {
    if (!rejectReason.trim()) {
      setNotification({ 
        type: 'error', 
        message: 'يرجى إضافة سبب الرفض' 
      });
      return;
    }
    
    if (!window.confirm('هل أنت متأكد من رفض هذا الحساب؟')) return;
    
    try {
      const result = await rejectRegistration(userId, rejectReason);
      if (result.success) {
        setNotification({ 
          type: 'success', 
          message: 'تم رفض الحساب بنجاح' 
        });
        setSelectedUser(null);
        setRejectReason('');
        fetchPendingUsers();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'فشل في رفض الحساب'
        });
      }
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: 'فشل في رفض الحساب' 
      });
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(selectedUser?.id === user.id ? null : user);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري تحميل الطلبات المعلقة...</div>;
  }

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>الطلبات المعلقة</h2>
        <button 
          onClick={fetchPendingUsers}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer'
          }}
        >
          🔄 تحديث
        </button>
      </div>

      {notification.message && (
        <div style={{
          padding: '12px',
          backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
          color: notification.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {notification.message}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ color: '#6c757d' }}>لا توجد طلبات معلقة</h3>
          <p style={{ color: '#6c757d' }}>جميع الطلبات تمت معالجتها</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>النوع</th>
                <th>البريد الإلكتروني</th>
                <th>الاسم</th>
                <th>تاريخ التسجيل</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <tr>
                    <td>{index + 1}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: isInstitutionRole(user.role) ? '#e0f2fe' : '#f0f9ff',
                        color: isInstitutionRole(user.role) ? '#0369a1' : '#0c4a6e',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {isInstitutionRole(user.role) ? 'مؤسسة' : 'فريق تطوعي'}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.displayName}</td>
                    <td>
                      {user.createdAt?.toDate ? 
                        new Date(user.createdAt.toDate()).toLocaleDateString('ar-SA') : 
                        'غير محدد'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleViewDetails(user)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          {selectedUser?.id === user.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                        </button>
                        <button 
                          onClick={() => handleApprove(user.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          ✅ قبول
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            document.getElementById('rejectModal').style.display = 'block';
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ رفض
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {selectedUser?.id === user.id && (
                    <tr>
                      <td colSpan="6" style={{ backgroundColor: '#f8f9fa', padding: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <h4 style={{ marginBottom: '10px', color: '#374151' }}>المعلومات الأساسية</h4>
                            <div style={{ lineHeight: '2' }}>
                              <div><strong>اسم المؤسسة/الفريق:</strong> {user.details.orgNameAr || user.details.teamNameAr || user.displayName}</div>
                              {user.details.orgNameEn && <div><strong>الاسم بالإنجليزية:</strong> {user.details.orgNameEn}</div>}
                              {user.details.phone && <div><strong>الهاتف:</strong> {user.details.phone}</div>}
                              {user.details.state && <div><strong>الولاية:</strong> {user.details.state}</div>}
                              {user.details.city && <div><strong>المدينة:</strong> {user.details.city}</div>}
                            </div>
                          </div>
                          <div>
                            <h4 style={{ marginBottom: '10px', color: '#374151' }}>معلومات إضافية</h4>
                            <div style={{ lineHeight: '2' }}>
                              {user.details.contactPersonName && <div><strong>الشخص المسؤول:</strong> {user.details.contactPersonName}</div>}
                              {user.details.contactPersonPosition && <div><strong>المنصب:</strong> {user.details.contactPersonPosition}</div>}
                              {user.details.contactPersonPhone && <div><strong>هاتف المسؤول:</strong> {user.details.contactPersonPhone}</div>}
                              {user.details.fieldsOfWork && user.details.fieldsOfWork.length > 0 && (
                                <div>
                                  <strong>مجالات العمل:</strong> {user.details.fieldsOfWork.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for rejection reason */}
      <div id="rejectModal" style={{
        display: 'none',
        position: 'fixed',
        zIndex: 1000,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}>
        <div style={{
          backgroundColor: '#fff',
          margin: '10% auto',
          padding: '20px',
          borderRadius: '8px',
          width: '500px',
          maxWidth: '90%'
        }}>
          <h3>رفض الطلب</h3>
          <p style={{ marginBottom: '20px' }}>
            {selectedUser && `أنت على وشك رفض طلب ${isInstitutionRole(selectedUser.role) ? 'المؤسسة' : 'الفريق'}: ${selectedUser.displayName}`}
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              سبب الرفض:
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="4"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                resize: 'vertical'
              }}
              placeholder="أدخل سبب الرفض..."
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => {
                document.getElementById('rejectModal').style.display = 'none';
                setRejectReason('');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                if (selectedUser) {
                  handleReject(selectedUser.id);
                  document.getElementById('rejectModal').style.display = 'none';
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              تأكيد الرفض
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingRegistrations;
