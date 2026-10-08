import React from 'react';

const SegmentedControl = ({ options, value, onChange }) => (
  <div className="mh-segmented" role="tablist">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        role="tab"
        aria-selected={value === opt.value}
        className={value === opt.value ? 'active' : ''}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default SegmentedControl;
