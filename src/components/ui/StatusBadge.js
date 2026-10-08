import React from 'react';

const StatusBadge = ({ label, variant = 'neutral', withDot = false }) => (
  <span className={`mh-badge ${variant}`}>
    {withDot && <span className="dot" aria-hidden="true" />}
    {label}
  </span>
);

export default StatusBadge;
