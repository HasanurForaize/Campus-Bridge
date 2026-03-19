import React from 'react';

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 0' }}>
      <svg
        width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="#FFD100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: 'spin 0.85s linear infinite' }}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <span style={{ color: '#7a6000', fontWeight: 600, fontSize: '0.9rem' }}>
        Claude is thinking…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AISummary({ loading, result, error, title = 'AI Summary', onClear }) {
  if (!loading && !result && !error) return null;

  return (
    <div
      className="ai-panel"
      style={{
        marginBottom: '1.25rem',
        borderLeft: '4px solid #FFD100',
        background: '#fffde7',
        borderRadius: 8,
        padding: '1rem 1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h4 style={{ margin: 0, color: '#5a4500', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '1rem' }}>✦</span>
          {title}
        </h4>
        {onClear && !loading && (
          <button
            onClick={onClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              fontSize: '1.1rem',
              lineHeight: 1,
              padding: '0 4px',
            }}
            title="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      {/* States */}
      {loading && <Spinner />}

      {error && (
        <p style={{ color: '#dc3545', fontSize: '0.9rem', margin: 0 }}>
          {error}
        </p>
      )}

      {!loading && result && (
        <div
          style={{
            whiteSpace:  'pre-wrap',
            fontSize:    '0.91rem',
            lineHeight:  1.75,
            color:       '#333',
            maxHeight:   420,
            overflowY:   'auto',
            paddingRight: 4,
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
