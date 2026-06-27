import React from 'react';

const SkeletonGrid = () => {
  const skeletons = [
    { x: 2, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 1, y: 1 }
  ];

  return (
    <div className="bento-grid">
      {skeletons.map((sk, index) => (
        <div
          key={index}
          className="bento-card skeleton-card"
          style={{
            gridColumn: `span ${sk.x}`,
            gridRow: `span ${sk.y}`
          }}
        >
          <div className="skeleton-title"></div>
          <div className="skeleton-footer"></div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonGrid;
