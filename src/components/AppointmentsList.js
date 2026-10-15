import React, { useState, useEffect } from 'react';
import { openmrsFetch } from '../utils/openmrsFetch';

const AppointmentsList = ({ patientUuid }) => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientUuid) {
      fetchVisits(patientUuid);
    }
  }, [patientUuid]);

  const fetchVisits = async (uuid) => {
    setLoading(true);
    setError(null);
    setVisits([]);

    try {
      // Detect if running on Vercel or in production
      const isVercel = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
      const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false';
      
      // Use Vercel serverless function in production, local proxy in development
      const PROXY_URL = isVercel 
        ? '/api/openmrs' 
        : (process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/openmrs');
      const OPENMRS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://clinicalview.arogya.cloud';
      
      const url = USE_PROXY
        ? `${OPENMRS_BASE_URL}/ws/rest/v1/visit?patient=${uuid}`
        : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/visit?patient=${uuid}`;

      const headers = {
        'Content-Type': 'application/json',
      };

      if (!USE_PROXY) {
        const credentials = btoa('admin:Arogya@#123');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const result = await openmrsFetch(url, {
        method: 'GET',
        headers: headers,
      });

      const data = result.data;
      
      if (data.results && data.results.length > 0) {
        setVisits(data.results);
      } else {
        setVisits([]);
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
      setError(err.message || 'Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  // Extract display text from visit, with fallback
  const getDisplayText = (visit) => {
    if (visit.display) {
      return visit.display;
    }
    // Fallback: construct from available fields
    const visitType = visit.visitType?.display || visit.visitType?.name || 'Visit';
    const location = visit.location?.display || visit.location?.name || '';
    const date = visit.startDatetime ? new Date(visit.startDatetime).toLocaleDateString() : '';
    return `${visitType}${location ? ` - ${location}` : ''}${date ? ` (${date})` : ''}`;
  };

  // Extract secondary text (date/time) if available
  const getSecondaryText = (visit) => {
    if (visit.startDatetime) {
      const date = new Date(visit.startDatetime);
      const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `${dateStr} at ${timeStr}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 mb-0 text-muted small">Loading appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger py-2 mb-0" role="alert">
        <small>Unable to load appointments: {error}</small>
      </div>
    );
  }

  if (!patientUuid) {
    return (
      <div className="alert alert-info py-2 mb-0" role="alert">
        <small>No patient selected. Please select a patient to view appointments.</small>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-muted mb-0 small">No appointments found.</p>
      </div>
    );
  }

  return (
    <div className="appointments-list">
      <ul className="list-group list-group-flush">
        {visits.map((visit, index) => {
          const displayText = getDisplayText(visit);
          const secondaryText = getSecondaryText(visit);
          
          return (
            <li
              key={visit.uuid || index}
              className="list-group-item list-group-item-action"
              style={{
                cursor: 'pointer',
                border: 'none',
                borderBottom: '1px solid #dee2e6',
                padding: '0.75rem 0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              <div className="d-flex flex-column">
                <span className="text-dark">{displayText}</span>
                {secondaryText && (
                  <small className="text-muted mt-1">{secondaryText}</small>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AppointmentsList;
