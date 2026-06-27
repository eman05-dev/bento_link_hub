import React from 'react';

const BentoCard = ({ item, onClick }) => {
  return (
    <div
      onClick={() => onClick(item)}
      style={{
        gridColumn: `span ${item.gridSpanX || 1}`,
        gridRow: `span ${item.gridSpanY || 1}`
      }}
      className="bento-card"
    >
      <h3>{item.title}</h3>
      <div className="card-footer">
        <span className="click-stat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          {item.clickCount} clicks
        </span>
        <div className="arrow-icon">→</div>
      </div>
    </div>
  );
};

export default BentoCard;
