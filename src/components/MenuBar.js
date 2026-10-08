import React, { useState, useRef, useEffect } from 'react';

const MenuBar = ({ userName, onLogout, onProfile }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    if (onProfile) {
      onProfile();
    }
  };

  const customNavbarStyle = {
    backgroundColor: '#1e3a8a',
    minHeight: '56px',
  };

  return (
    <nav 
      className="navbar navbar-expand-lg navbar-dark fixed-top shadow-lg"
      style={customNavbarStyle}
    >
      <div className="container-fluid px-4 d-flex justify-content-between align-items-center">
        {/* Brand/Logo */}
        <span className="navbar-brand fw-bold fs-5">
          Digipaths
        </span>

        {/* User Dropdown on the right */}
        <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-link text-white text-decoration-none d-flex align-items-center"
            type="button"
            id="userDropdown"
            onClick={() => setShowDropdown(!showDropdown)}
            onMouseEnter={() => setShowDropdown(true)}
            style={{ 
              boxShadow: 'none',
              border: 'none',
              padding: '0.5rem 1rem',
              color: '#ffffff',
              fontSize: '0.875rem'
            }}
          >
            <span className="me-2">{userName || 'User'}</span>
            <svg
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
              style={{ 
                transition: 'transform 0.2s',
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <path
                fillRule="evenodd"
                d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>
          
          {showDropdown && (
            <ul
              className="dropdown-menu show"
              aria-labelledby="userDropdown"
              onMouseLeave={() => setShowDropdown(false)}
              style={{
                position: 'absolute',
                right: 0,
                left: 'auto',
                marginTop: '0.25rem',
                minWidth: '160px',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <li>
                <button
                  className="dropdown-item d-flex align-items-center"
                  type="button"
                  onClick={handleProfileClick}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ 
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    padding: '0.5rem 1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                    e.currentTarget.style.color = '#1976d2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="me-2"
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Profile</span>
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button
                  className="dropdown-item d-flex align-items-center"
                  type="button"
                  onClick={handleLogoutClick}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ 
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    padding: '0.5rem 1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="me-2"
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Custom CSS for navbar */}
      <style>{`
        .navbar-brand:hover {
          color: #ffffff !important;
        }

        .dropdown-toggle::after {
          display: none;
        }

        .btn-link:hover {
          color: #ffffff !important;
          opacity: 0.9;
        }

        .dropdown-menu {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.375rem;
        }

        .dropdown-item {
          transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
};

export default MenuBar;
