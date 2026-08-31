// src/admin/components/ChartComponent.jsx
import React from 'react';

const ChartComponent = ({ type, data, height = 200 }) => {
  const renderBarChart = () => {
    const points = data?.datasets?.[0]?.data || [];
    const labels = data?.labels || [];
    const maxValue = Math.max(...points, 1);
    const colors = ['#3b82f6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const yTicks = [1, 0.75, 0.5, 0.25].map((p) => Math.round(maxValue * p));

    return (
      <div
        style={{
          height: `${height}px`,
          padding: '12px 14px 14px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {yTicks.map((tick, idx) => (
            <div
              key={`${tick}-${idx}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${(tick / maxValue) * 76 + 12}%`,
                borderTop: '1px dashed #e2e8f0'
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            height: 'calc(100% - 8px)',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            gap: '10px'
          }}
        >
          {points.map((value, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                flex: 1
              }}
            >
              <div
                style={{
                  height: `${Math.max((value / maxValue) * 78, 8)}%`,
                  background: `linear-gradient(180deg, ${colors[index] || '#3b82f6'} 0%, ${colors[index + 1] || '#60a5fa'} 100%)`,
                  width: '92%',
                  borderRadius: '10px 10px 6px 6px',
                  minHeight: '6px',
                  transition: 'height 0.3s ease',
                  position: 'relative',
                  boxShadow: `0 8px 18px ${(colors[index] || '#3b82f6')}33`
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '999px',
                    padding: '2px 8px'
                  }}
                >
                  {value.toLocaleString()}
                </div>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: '#475569',
                  marginTop: '8px',
                  textAlign: 'center',
                  fontWeight: '600'
                }}
              >
                {labels[index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDoughnutChart = () => {
    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: `conic-gradient(
            ${data.datasets[0].backgroundColor[0]} 0% ${(data.datasets[0].data[0] / total) * 100}%,
            ${data.datasets[0].backgroundColor[1]} 0% ${((data.datasets[0].data[0] + data.datasets[0].data[1]) / total) * 100}%,
            ${data.datasets[0].backgroundColor[2]} 0% ${((data.datasets[0].data[0] + data.datasets[0].data[1] + data.datasets[0].data[2]) / total) * 100}%,
            ${data.datasets[0].backgroundColor[3]} 0% 100%
          )`,
            position: 'relative',
            marginBottom: '15px'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            width: '100%',
            padding: '0 10px'
          }}
        >
          {data.labels.map((label, index) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: data.datasets[0].backgroundColor[index]
                }}
              />
              <span
                style={{
                  color: '#64748b',
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  fontFeatureSettings: '"tnum"'
                }}
              >
                {data.datasets[0].data[index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (type === 'bar') {
    return renderBarChart();
  }

  if (type === 'doughnut') {
    return renderDoughnutChart();
  }

  return (
    <div
      style={{
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      Chart Visualization
    </div>
  );
};

export default ChartComponent;

