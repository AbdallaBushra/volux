// src/admin/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiBarChart2,
  FiBriefcase,
  FiFileText,
  FiLayers,
  FiSettings,
  FiShield,
  FiUsers
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { path: '/admin/dashboard', icon: FiBarChart2, label: 'Dashboard' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/organizations', icon: FiBriefcase, label: 'Organizations' },
    { path: '/admin/teams', icon: FiLayers, label: 'Teams' },
    { path: '/admin/opportunities', icon: FiShield, label: 'Opportunities' },
    { path: '/admin/reports', icon: FiFileText, label: 'Reports & Complaints' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-mark">V</div>
          <div>
            <h2>Volux Admin</h2>
            <p>Management Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon"><Icon size={18} /></span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
