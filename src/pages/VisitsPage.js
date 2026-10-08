import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { usePatient } from '../contexts/PatientContext';
import { fetchVisits, formatShortDate } from '../services/openmrsService';

const VisitsPage = () => {
  const { patientData } = usePatient();
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const uuid = patientData?.uuid;
    if (!uuid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVisits(uuid);
        if (!cancelled) setVisits(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load visits');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientData?.uuid]);

  return (
    <div>
      <AppHeader title="Visits" onBack={() => navigate('/')} />
      {loading && <div className="mh-loading">Loading visits…</div>}
      {error && <div className="mh-error-banner">{error}</div>}
      {!loading && !error && visits.length === 0 && (
        <div className="mh-empty">No visits found.</div>
      )}
      {visits.map((visit) => (
        <button
          key={visit.uuid}
          type="button"
          className="mh-card clickable"
          onClick={() => navigate(`/visits/${visit.uuid}`)}
        >
          <div className="mh-visit-top">
            <span className="mh-small">{formatShortDate(visit.startDatetime)}</span>
            <StatusBadge
              label={visit.status === 'Open' ? 'Open' : 'Completed'}
              variant="neutral"
            />
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{visit.visitType}</div>
          {visit.location && (
            <div className="mh-muted" style={{ marginTop: 4 }}>
              {visit.location}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <span className="mh-small">{visit.open ? 'Ongoing visit' : 'Past visit'}</span>
            <span className="mh-chevron">›</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default VisitsPage;
