import React, { useState, useEffect } from 'react';
import { openmrsFetch } from '../utils/openmrsFetch';

const MedicationsList = ({ patientUuid }) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientUuid) {
      fetchMedications(patientUuid);
    }
  }, [patientUuid]);

  const fetchMedications = async (patientUuid) => {
    setLoading(true);
    setError(null);
    setMedications([]);

    try {
      // Detect if running on Vercel or in production
      const isVercel = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
      const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false';
      
      // Use Vercel serverless function in production, local proxy in development
      const PROXY_URL = isVercel 
        ? '/api/openmrs' 
        : (process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/openmrs');
      const OPENMRS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://clinicalview.arogya.cloud';
      
      // Medication order type UUID
      const ORDER_TYPE_UUID = '131168f4-15f5-102d-96e4-000c29c2a5d7';
      
      const url = USE_PROXY
        ? `${OPENMRS_BASE_URL}/ws/rest/v1/order?patient=${patientUuid}&orderType=${ORDER_TYPE_UUID}&v=full`
        : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/order?patient=${patientUuid}&orderType=${ORDER_TYPE_UUID}&v=full`;

      const headers = {
        'Content-Type': 'application/json',
      };

      // Add auth header if not using proxy
      if (!USE_PROXY) {
        const credentials = btoa('admin:Arogya@#123');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const result = await openmrsFetch(url, {
        method: 'GET',
        headers: headers,
      });

      const data = result.data;
      
      // Extract medication orders with full details
      if (data.results && data.results.length > 0) {
        setMedications(data.results);
      } else {
        setMedications([]);
      }
    } catch (err) {
      console.error('Error fetching medications:', err);
      setError(err.message || 'Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  };

  // Determine if medication is Active or Past
  const getMedicationStatus = (medication) => {
    // Active if dateStopped is null
    if (medication.dateStopped === null) {
      return { status: 'Active', badgeClass: 'bg-success' };
    }
    // Past if dateStopped is not null
    if (medication.dateStopped !== null) {
      return { status: 'Past', badgeClass: 'bg-secondary' };
    }
    // Default to Past if unclear
    return { status: 'Past', badgeClass: 'bg-secondary' };
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 mb-0 text-muted small">Loading medications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger py-2 mb-0" role="alert">
        <small>Unable to load medications: {error}</small>
      </div>
    );
  }

  if (!patientUuid) {
    return (
      <div className="alert alert-info py-2 mb-0" role="alert">
        <small>No patient selected. Please select a patient to view medications.</small>
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-muted mb-0 small">No medications found.</p>
      </div>
    );
  }

  return (
    <div className="medications-list">
      <ul className="list-group list-group-flush">
        {medications.map((medication, index) => {
          const displayName = medication.display || 'Unknown Medication';
          const statusInfo = getMedicationStatus(medication);
          
          return (
            <li
              key={medication.uuid || index}
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
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-dark flex-grow-1">{displayName}</span>
                <span className={`badge ${statusInfo.badgeClass} text-white ms-2`}>
                  {statusInfo.status}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MedicationsList;
