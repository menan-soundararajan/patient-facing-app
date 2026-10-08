import React from 'react';
import { useNavigate } from 'react-router-dom';

const AppHeader = ({ title, onBack, showBack = true }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="mh-header">
      {showBack ? (
        <button type="button" className="mh-back-btn" onClick={handleBack} aria-label="Back">
          ‹
        </button>
      ) : (
        <span />
      )}
      <h1 className="mh-header-title">{title}</h1>
      <span />
    </header>
  );
};

export default AppHeader;
