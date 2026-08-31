// src/admin/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import StatsCard from '../components/StatsCard';
import ChartComponent from '../components/ChartComponent';
import { getAdminStats, getPlatformReportContext } from '../../database/adminData';
import { exportTableData } from '../utils/export';
import '../styles/admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    totalOrganizations: 0,
    totalTeams: 0,
    totalOpportunities: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [reportContext, setReportContext] = useState({ users: [], opportunities: [], applications: [], owners: [], reports: [] });
  const [reportType, setReportType] = useState('owner_impact');
  const [selectedOwnerId, setSelectedOwnerId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [data, context] = await Promise.all([getAdminStats(), getPlatformReportContext()]);
        setStats(data);
        setReportContext(context);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsData = [
    { title: 'Total Volunteers', value: stats.totalVolunteers.toLocaleString(), change: '+0%', type: 'primary' },
    { title: 'Organizations', value: stats.totalOrganizations.toLocaleString(), change: '+0%', type: 'success' },
    { title: 'Teams', value: (stats.totalTeams || 0).toLocaleString(), change: '+0%', type: 'info' },
    { title: 'Active Opportunities', value: stats.totalOpportunities.toLocaleString(), change: '+0%', type: 'warning' },
    { title: 'Pending Approvals', value: stats.pendingApprovals.toLocaleString(), change: '0', type: 'danger' }
  ];

  if (loading) return <div className="admin-loading">Loading Dashboard Data...</div>;

  const overviewChartData = {
    labels: ['Volunteers', 'Organizations', 'Teams', 'Opportunities', 'Pending'],
    datasets: [
      {
        data: [
          stats.totalVolunteers,
          stats.totalOrganizations,
          stats.totalTeams || 0,
          stats.totalOpportunities,
          stats.pendingApprovals
        ]
      }
    ]
  };

  const generateStatsReport = () => {
    const totalManagedEntities =
      Number(stats.totalVolunteers || 0) +
      Number(stats.totalOrganizations || 0) +
      Number(stats.totalTeams || 0);
    const pendingRate =
      totalManagedEntities > 0
        ? ((Number(stats.pendingApprovals || 0) / totalManagedEntities) * 100).toFixed(2)
        : '0.00';
    const volunteersPerOpportunity =
      Number(stats.totalOpportunities || 0) > 0
        ? (Number(stats.totalVolunteers || 0) / Number(stats.totalOpportunities || 0)).toFixed(2)
        : '0.00';

    exportTableData(
      'stats_report',
      [
        {
          section: 'Core Platform Totals',
          totalVolunteers: stats.totalVolunteers,
          totalOrganizations: stats.totalOrganizations,
          totalTeams: stats.totalTeams || 0,
          totalOpportunities: stats.totalOpportunities,
          pendingApprovals: stats.pendingApprovals,
        },
        {
          section: 'Operational Indicators',
          totalManagedEntities,
          pendingApprovalsRatePercent: pendingRate,
          volunteersPerOpportunity,
          dashboardStatus: 'Operational',
        },
      ],
      {
        reportName: 'Stats Report',
        summary: {
          totalVolunteers: stats.totalVolunteers,
          totalOrganizations: stats.totalOrganizations,
          totalTeams: stats.totalTeams || 0,
          totalOpportunities: stats.totalOpportunities,
          pendingApprovals: stats.pendingApprovals,
          totalManagedEntities,
          pendingApprovalsRatePercent: pendingRate,
          volunteersPerOpportunity,
        },
      }
    );
  };

  const getOwnerName = (owner) =>
    owner?.orgNameAr ||
    owner?.orgNameEn ||
    owner?.organizationName ||
    owner?.institutionName ||
    owner?.teamNameAr ||
    owner?.teamNameEn ||
    owner?.teamName ||
    owner?.displayName ||
    owner?.name ||
    owner?.email ||
    owner?.id ||
    'Unknown';

  const ownerOptions = reportContext.owners;
  const filteredOpportunities = reportContext.opportunities.filter((opp) => {
    const matchesOwner = selectedOwnerId === 'all' || opp.createdBy === selectedOwnerId;
    const matchesStatus = selectedStatus === 'all' || (opp.status || 'pending') === selectedStatus;
    return matchesOwner && matchesStatus;
  });

  const reportRows = (() => {
    if (reportType === 'owner_impact') {
      const owners = selectedOwnerId === 'all'
        ? ownerOptions
        : ownerOptions.filter((owner) => owner.id === selectedOwnerId);
      return owners.map((owner) => {
        const ownerOpps = reportContext.opportunities.filter((opp) => opp.createdBy === owner.id);
        const ownerOppIds = new Set(ownerOpps.map((opp) => opp.id));
        const ownerApps = reportContext.applications.filter((app) => ownerOppIds.has(app.opportunityId));
        return {
          owner: getOwnerName(owner),
          role: owner.role,
          publishedOpportunities: ownerOpps.filter((opp) => ['active', 'completed'].includes(String(opp.status || '').toLowerCase())).length,
          pendingOpportunities: ownerOpps.filter((opp) => (opp.status || 'pending') === 'pending').length,
          completedOpportunities: ownerOpps.filter((opp) => opp.status === 'completed').length,
          totalApplicants: ownerApps.length,
          acceptedVolunteers: ownerApps.filter((app) => ['accepted', 'approved', 'completed'].includes(String(app.status || '').toLowerCase())).length,
        };
      });
    }

    if (reportType === 'opportunity_health') {
      return filteredOpportunities.map((opp) => {
        const apps = reportContext.applications.filter((app) => app.opportunityId === opp.id);
        return {
          opportunity: opp.title_en || opp.title || opp.title_ar || 'Untitled',
          owner: opp.organizationName || opp.ownerName || opp.createdByName || 'N/A',
          status: opp.status || 'pending',
          applicants: apps.length,
          accepted: apps.filter((app) => ['accepted', 'approved', 'completed'].includes(String(app.status || '').toLowerCase())).length,
          rejected: apps.filter((app) => app.status === 'rejected').length,
          bonusVolunteers: apps.filter((app) => app.bonusVolunteer).length,
        };
      });
    }

    if (reportType === 'reward_pipeline') {
      return filteredOpportunities.map((opp) => {
        const completedApps = reportContext.applications.filter((app) => app.opportunityId === opp.id && app.status === 'completed');
        return {
          opportunity: opp.title_en || opp.title || opp.title_ar || 'Untitled',
          owner: opp.organizationName || opp.ownerName || opp.createdByName || 'N/A',
          completedVolunteers: completedApps.length,
          hoursAwarded: completedApps.reduce((sum, app) => sum + Number(app.hoursAwarded || opp.hours || 0), 0),
          pointsAwarded: completedApps.reduce((sum, app) => sum + Number(app.pointsAwarded || 0), 0),
          bonusPoints: completedApps.reduce((sum, app) => sum + Number(app.bonusPointsAwarded || 0), 0),
        };
      });
    }

    return reportContext.reports
      .filter((report) => selectedStatus === 'all' || (report.status || 'pending') === selectedStatus)
      .map((report) => ({
        reason: report.reasonLabel || report.reason || report.violationType || 'Complaint',
        reporter: report.reporterName || report.reporterEmail || 'Anonymous',
        volunteer: report.volunteerName || report.volunteerEmail || 'N/A',
        opportunity: report.opportunityTitle || 'N/A',
        status: report.status || 'pending',
        consequence: report.consequence || 'N/A',
      }));
  })();

  const exportGeneratedReport = () => {
    exportTableData(`platform_${reportType}_report`, reportRows, {
      reportName: 'Platform Generated Report',
      summary: {
        reportType,
        owner: selectedOwnerId,
        status: selectedStatus,
        rows: reportRows.length,
      },
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header admin-sticky-tools">
        <div>
          <h2 className="dashboard-title">Admin Dashboard</h2>
          <p className="dashboard-subtitle">Monitor platform growth, approvals, and operating health.</p>
        </div>
        <div className="dashboard-actions">
          <button
            onClick={() => {
              window.location.href = '/admin/pending-registrations';
            }}
            className="export-btn warning"
          >
            Pending Approvals ({stats.pendingApprovals})
          </button>
          <button
            onClick={generateStatsReport}
            className="export-btn"
          >
            Generate Stats Report
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <StatsCard key={index} title={stat.title} value={stat.value} change={stat.change} type={stat.type} />
        ))}
      </div>

      <div className="dashboard-main-content">
        <div className="dashboard-left-panel">
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Volunteer Growth</h3>
            </div>
            <div className="card-body chart-wrapper">
              <ChartComponent type="bar" data={overviewChartData} height={240} />
            </div>
          </div>
        </div>

        <div className="dashboard-right-panel">
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Quick Stats</h3>
            </div>
            <div className="card-body quick-stats">
              <div className="quick-stat-item">
                <div className="quick-stat-icon">OP</div>
                <div className="quick-stat-content">
                  <div className="quick-stat-value">{stats.totalOpportunities}</div>
                  <div className="quick-stat-label">Active Opportunities</div>
                </div>
              </div>
              <div className="quick-stat-item">
                <div className="quick-stat-icon">VL</div>
                <div className="quick-stat-content">
                  <div className="quick-stat-value">{stats.totalVolunteers}</div>
                  <div className="quick-stat-label">Total Volunteers</div>
                </div>
              </div>
              <div className="quick-stat-item">
                <div className="quick-stat-icon">TM</div>
                <div className="quick-stat-content">
                  <div className="quick-stat-value">{stats.totalTeams || 0}</div>
                  <div className="quick-stat-label">Registered Teams</div>
                </div>
              </div>
              <div className="quick-stat-item">
                <div className="quick-stat-icon">PD</div>
                <div className="quick-stat-content">
                  <div className="quick-stat-value">{stats.pendingApprovals}</div>
                  <div className="quick-stat-label">Pending Approvals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card report-builder-card">
        <div className="card-header report-builder-header">
          <div>
            <h3 className="card-title">Platform Report Builder</h3>
            <p className="dashboard-subtitle">Generate focused reports by owner, opportunity status, rewards, and complaints.</p>
          </div>
          <button className="export-btn" onClick={exportGeneratedReport}>Export Report</button>
        </div>
        <div className="report-builder-controls">
          <label>
            Report Type
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="owner_impact">Organization / Team Impact</option>
              <option value="opportunity_health">Opportunity Health</option>
              <option value="reward_pipeline">Reward Pipeline</option>
              <option value="complaints">Complaints & Violations</option>
            </select>
          </label>
          <label>
            Owner
            <select value={selectedOwnerId} onChange={(e) => setSelectedOwnerId(e.target.value)} disabled={reportType === 'complaints'}>
              <option value="all">All organizations and teams</option>
              {ownerOptions.map((owner) => (
                <option key={owner.id} value={owner.id}>{getOwnerName(owner)} ({owner.role})</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
        </div>
        <div className="report-builder-summary">
          <div><strong>{reportRows.length}</strong><span>rows</span></div>
          <div><strong>{filteredOpportunities.length}</strong><span>matching opportunities</span></div>
          <div><strong>{reportContext.applications.length}</strong><span>applications tracked</span></div>
        </div>
        <div className="report-preview-table">
          {reportRows.length > 0 ? (
            <table>
              <thead>
                <tr>
                  {Object.keys(reportRows[0]).map((key) => <th key={key}>{key}</th>)}
                </tr>
              </thead>
              <tbody>
                {reportRows.slice(0, 8).map((row, index) => (
                  <tr key={`report-row-${index}`}>
                    {Object.values(row).map((value, valueIndex) => <td key={valueIndex}>{String(value)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="report-empty-state">No report data matches the selected filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

