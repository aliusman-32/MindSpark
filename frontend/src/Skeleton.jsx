import React from 'react';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} aria-hidden="true" />;
}

export default Skeleton;
