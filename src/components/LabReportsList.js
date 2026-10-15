import React, { useState, useEffect } from 'react';
import { fetchLabReports as fetchLabReportsService } from '../services/openmrsService';

const LabReportsList = ({ patientUuid }) => {
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientUuid) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setLabReports([]);
      try {
        const reports = await fetchLabReportsService(patientUuid);
        if (!cancelled) setLabReports(reports);
      } catch (err) {
        console.error('Error fetching lab reports:', err);
        if (!cancelled) setError(err.message || 'Failed to fetch lab reports');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patientUuid]);

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
        {labReports.map((report) => (
          <li
            key={report.uuid || report.id}
            className="list-group-item list-group-item-action"
            style={{
              cursor: 'pointer',
              border: 'none',
              borderBottom: '1px solid #dee2e6',
              padding: '0.75rem 0',
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
              <span className="text-muted ms-3">
                {report.testResult}
                {report.units ? ` ${report.units}` : ''}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LabReportsList;
