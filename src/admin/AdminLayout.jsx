// src/admin/AdminLayout.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

// استيراد المكونات
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// استيراد الصفحات
import Dashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import Organizations from './pages/Organizations';
import Teams from './pages/Teams';
import Opportunities from './pages/Opportunities';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// استيراد الأنماط
import './styles/admin.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="admin-main">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="admin-container">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="teams" element={<Teams />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;