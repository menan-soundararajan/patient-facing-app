import React, { useState, useEffect } from 'react';
import { openmrsFetch } from '../utils/openmrsFetch';

const DiagnosisList = ({ patientUuid }) => {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientUuid) {
      fetchConditions(patientUuid);
    }
  }, [patientUuid]);

  const fetchConditions = async (patientUuid) => {
    setLoading(true);
    setError(null);
    setConditions([]);

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
        ? `${OPENMRS_BASE_URL}/ws/fhir2/R4/Condition?patient=${patientUuid}`
        : `${OPENMRS_BASE_URL}/openmrs/ws/fhir2/R4/Condition?patient=${patientUuid}`;

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
      
      // Parse FHIR Condition resources
      if (data.entry && data.entry.length > 0) {
        const conditionList = data.entry.map(entry => entry.resource);
        setConditions(conditionList);
      } else {
        setConditions([]);
      }
    } catch (err) {
      console.error('Error fetching conditions:', err);
      setError(err.message || 'Failed to fetch conditions');
    } finally {
      setLoading(false);
    }
  };

  // Extract diagnostic name from FHIR Condition
  const getDiagnosticName = (condition) => {
    // Try code.text first
    if (condition.code && condition.code.text) {
      return condition.code.text;
    }
    // Try code.coding[0].display
    if (condition.code && condition.code.coding && condition.code.coding.length > 0) {
      return condition.code.coding[0].display || condition.code.coding[0].code || 'Unknown Diagnosis';
    }
    // Fallback to display field if available
    if (condition.display) {
      return condition.display;
    }
    return 'No diagnostic name available';
  };

  // Get clinical status code value (checking both code field and clinicalStatus field)
  const getStatusCode = (condition) => {
    // First check clinicalStatus (standard FHIR field)
    if (condition.clinicalStatus && condition.clinicalStatus.coding && condition.clinicalStatus.coding.length > 0) {
      const statusCode = condition.clinicalStatus.coding[0].code || '';
      return statusCode.toLowerCase();
    }
    if (condition.clinicalStatus && condition.clinicalStatus.text) {
      return condition.clinicalStatus.text.toLowerCase();
    }
    // Also check if code field has status information (less common)
    if (condition.code && condition.code.coding && condition.code.coding.length > 0) {
      const codeValue = condition.code.coding[0].code || '';
      const codeLower = codeValue.toLowerCase();
      if (codeLower === 'active' || codeLower === 'resolved' || codeLower === 'inactive') {
        return codeLower;
      }
    }
    return null;
  };

  // Determine status badge based on status code
  const getStatusBadge = (statusCode) => {
    if (!statusCode) {
      return { status: 'Unknown', badgeClass: 'bg-secondary' };
    }
    
    if (statusCode === 'active') {
      return { status: 'Active', badgeClass: 'bg-success' };
    }
    
    if (statusCode === 'resolved' || statusCode === 'inactive') {
      return { status: 'Past', badgeClass: 'bg-secondary' };
    }
    
    // Default to Past for any other status
    return { status: 'Past', badgeClass: 'bg-secondary' };
  };

  // Format onsetDateTime to DD/MM/YYYY format
  const formatOnsetDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not specified';
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format as: DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 mb-0 text-muted small">Loading diagnosis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger py-2 mb-0" role="alert">
        <small>Unable to load diagnosis: {error}</small>
      </div>
    );
  }

  if (!patientUuid) {
    return (
      <div className="alert alert-info py-2 mb-0" role="alert">
        <small>No patient selected. Please select a patient to view diagnosis.</small>
      </div>
    );
  }

  if (conditions.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-muted mb-0 small">No diagnosis found.</p>
      </div>
    );
  }

  return (
    <div className="diagnosis-list">
      <ul className="list-group list-group-flush">
        {conditions.map((condition, index) => {
          const diagnosticName = getDiagnosticName(condition);
          const statusCode = getStatusCode(condition);
          const statusBadge = getStatusBadge(statusCode);
          const onsetDateTime = formatOnsetDateTime(condition.onsetDateTime);
          
          return (
            <li
              key={condition.id || index}
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
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <span className="text-dark flex-grow-1">{diagnosticName}</span>
                <div className="d-flex align-items-center gap-3">
                  <small className="text-muted">{onsetDateTime}</small>
                  <span className={`badge ${statusBadge.badgeClass} text-white`}>
                    {statusBadge.status}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DiagnosisList;
