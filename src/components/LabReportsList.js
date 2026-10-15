import React, { useState, useEffect } from 'react';
import { openmrsFetch } from '../utils/openmrsFetch';

const LabReportsList = ({ patientUuid }) => {
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientUuid) {
      fetchLabReports(patientUuid);
    }
  }, [patientUuid]);

  const fetchLabReports = async (patientUuid) => {
    setLoading(true);
    setError(null);
    setLabReports([]);

    try {
      // Detect if running on Vercel or in production
      const isVercel = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
      const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false';
      
      // Use Vercel serverless function in production, local proxy in development
      const PROXY_URL = isVercel 
        ? '/api/openmrs' 
        : (process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/openmrs');
      const OPENMRS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://clinicalview.arogya.cloud';
      
      // Lab order type UUID
      const ORDER_TYPE_UUID = '52a447d3-a64a-11e3-9aeb-50e549534c5e';
      
      const url = USE_PROXY
        ? `${OPENMRS_BASE_URL}/ws/rest/v1/obs?orderType=${ORDER_TYPE_UUID}&patient=${patientUuid}&v=full`
        : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/obs?orderType=${ORDER_TYPE_UUID}&patient=${patientUuid}&v=full`;

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
      
      // Filter and process observations
      if (data.results && data.results.length > 0) {
        // Filter observations where order.orderType.display === "Test Order"
        const filteredObservations = data.results.filter(obs => {
          // Check if order.orderType.display equals "Test Order"
          if (obs.order && obs.order.orderType && obs.order.orderType.display) {
            return obs.order.orderType.display === "Test Order";
          }
          return false;
        });

        // Process observations to extract test name and result
        const processedReports = filteredObservations.map(obs => {
          // Get test name from concept.display or display
          let testName = 'Unknown Test';
          if (obs.concept && obs.concept.display) {
            testName = obs.concept.display;
          } else if (obs.display) {
            testName = obs.display;
          } else if (obs.concept && obs.concept.name && obs.concept.name.display) {
            testName = obs.concept.name.display;
          }

          // Get test result from value
          let testResult = 'N/A';
          let units = '';
          
          if (obs.value) {
            // Handle different value types
            if (typeof obs.value === 'object') {
              // If value is an object, try to get display or name
              testResult = obs.value.display || obs.value.name || obs.value || 'N/A';
            } else {
              testResult = String(obs.value);
            }
          }

          // Get units if available
          if (obs.concept && obs.concept.units) {
            units = obs.concept.units;
          } else if (obs.units) {
            units = obs.units;
          }

          // Combine result with units
          const resultWithUnits = units ? `${testResult} ${units}` : testResult;

          return {
            testName,
            testResult: resultWithUnits,
            rawValue: testResult,
            units: units
          };
        });

        setLabReports(processedReports);
      } else {
        setLabReports([]);
      }
    } catch (err) {
      console.error('Error fetching lab reports:', err);
      setError(err.message || 'Failed to fetch lab reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 mb-0 text-muted small">Loading lab reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger py-2 mb-0" role="alert">
        <small>Unable to load lab reports: {error}</small>
      </div>
    );
  }

  if (!patientUuid) {
    return (
      <div className="alert alert-info py-2 mb-0" role="alert">
        <small>No patient selected. Please select a patient to view lab reports.</small>
      </div>
    );
  }

  if (labReports.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-muted mb-0 small">No lab reports found.</p>
      </div>
    );
  }

  return (
    <div className="lab-reports-list">
      <ul className="list-group list-group-flush">
        {labReports.map((report, index) => (
          <li
            key={index}
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
              <span className="text-dark flex-grow-1">{report.testName}</span>
              <span className="text-muted ms-3">{report.testResult}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LabReportsList;
