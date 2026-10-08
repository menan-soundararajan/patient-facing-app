import React from 'react';
import { NavLink } from 'react-router-dom';

const IconHome = ({ color }) => (
  <svg viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 3.2 3.5 10.2c-.3.25-.4.6-.3.95.1.35.4.6.75.65H5.5v7.4c0 .9.7 1.6 1.6 1.6H9.8c.55 0 1-.45 1-1v-4.1h2.4v4.1c0 .55.45 1 1 1h2.7c.9 0 1.6-.7 1.6-1.6v-7.4h1.55c.35-.05.65-.3.75-.65.1-.35 0-.7-.3-.95L12 3.2z" />
  </svg>
);

const IconVisits = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill={color} opacity="0.2" stroke={color} strokeWidth="1.8" />
    <path d="M3.5 10h17" stroke={color} strokeWidth="1.8" />
    <path d="M8 3.5v3.5M16 3.5v3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="8.5" cy="14" r="1.2" fill={color} />
    <circle cx="12" cy="14" r="1.2" fill={color} />
    <circle cx="15.5" cy="14" r="1.2" fill={color} />
    <circle cx="8.5" cy="17.5" r="1.2" fill={color} />
    <circle cx="12" cy="17.5" r="1.2" fill={color} />
  </svg>
);

const IconMeds = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="4"
      y="9"
      width="16"
      height="7"
      rx="3.5"
      transform="rotate(-35 12 12.5)"
      fill={color}
      opacity="0.25"
      stroke={color}
      strokeWidth="1.8"
    />
    <path
      d="M9.2 10.4h5.6"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      transform="rotate(-35 12 12.5)"
    />
  </svg>
);

const IconLabs = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9.2 3.5h5.6M10.2 3.5v5.2L5.4 17.2a2.2 2.2 0 0 0 1.9 3.3h9.4a2.2 2.2 0 0 0 1.9-3.3l-4.8-8.5V3.5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.2"
    />
    <path d="M8.2 16.5h7.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconConditions = ({ color }) => (
  <svg viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 20.8c-.35 0-.7-.1-1-.35-1.7-1.35-6.5-5.4-6.5-9.7A4.35 4.35 0 0 1 12 6.6a4.35 4.35 0 0 1 7.5 4.15c0 4.3-4.8 8.35-6.5 9.7-.3.25-.65.35-1 .35z" />
  </svg>
);

/* Colors match Health Snapshot icon circles on Home */
const items = [
  { to: '/', label: 'Home', icon: IconHome, color: '#2b6ef2', end: true },
  { to: '/visits', label: 'Visits', icon: IconVisits, color: '#6b5ce7' },
  { to: '/meds', label: 'Meds', icon: IconMeds, color: '#0f8a7a' },
  { to: '/labs', label: 'Labs', icon: IconLabs, color: '#6b5ce7' },
  { to: '/conditions', label: 'Conditions', icon: IconConditions, color: '#e11d48' },
];

const BottomNav = () => (
  <nav className="mh-bottom-nav" aria-label="Main">
    {items.map(({ to, label, icon: Icon, color, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) => `mh-nav-item${isActive ? ' active' : ''}`}
        style={{ '--mh-nav-accent': color }}
      >
        <span className="mh-nav-icon" style={{ color }}>
          <Icon color={color} />
        </span>
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
