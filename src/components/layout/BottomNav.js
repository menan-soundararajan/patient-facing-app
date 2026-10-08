import React from 'react';
import { NavLink } from 'react-router-dom';

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
  </svg>
);

const IconVisits = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3h8v4H8V3zM6 7h12v14H6V7z" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const IconMeds = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)" />
    <path d="M9 10.5h6" />
  </svg>
);

const IconLabs = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" />
  </svg>
);

const IconConditions = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
  </svg>
);

const items = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/visits', label: 'Visits', icon: IconVisits },
  { to: '/meds', label: 'Meds', icon: IconMeds },
  { to: '/labs', label: 'Labs', icon: IconLabs },
  { to: '/conditions', label: 'Conditions', icon: IconConditions },
];

const BottomNav = () => (
  <nav className="mh-bottom-nav" aria-label="Main">
    {items.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) => `mh-nav-item${isActive ? ' active' : ''}`}
      >
        <Icon />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
