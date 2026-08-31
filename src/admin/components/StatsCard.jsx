import React from 'react';

const StatsCard = ({ title, value, change, type = 'primary' }) => {
  const isPositive = change && change.startsWith('+');
  
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
          {change} from last month
        </div>
      )}
    </div>
  );
};

export default StatsCard;