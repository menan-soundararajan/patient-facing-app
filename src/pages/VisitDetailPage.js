import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { fetchVisitDetails, formatShortDate } from '../services/openmrsService';

const Section = ({ label, accent, children }) => {
  if (!children) return null;
  return (
    <div className="mh-card">
      <div className={`mh-label-caps${accent ? ' accent' : ''}`}>{label}</div>
      {children}
    </div>
  );
};

const VisitDetailPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVisitDetails(uuid);
        if (!cancelled) setVisit(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load visit');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  return (
    <div>
      <AppHeader title="Visit Details" onBack={() => navigate('/visits')} />
      {loading && <div className="mh-loading">Loading visit…</div>}
      {error && <div className="mh-error-banner">{error}</div>}
      {visit && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '1.35rem' }}>
              {formatShortDate(visit.startDatetime)}
            </div>
            <div className="mh-link-blue" style={{ marginTop: 4, fontSize: '1.05rem' }}>
              {visit.visitType}
            </div>
            {visit.provider && (
              <div className="mh-muted" style={{ marginTop: 4 }}>
                {visit.provider}
              </div>
            )}
            {!visit.provider && visit.location && (
              <div className="mh-muted" style={{ marginTop: 4 }}>
                {visit.location}
              </div>
            )}
          </div>

          <Section label="Reason for visit">
            <div>{visit.reason}</div>
          </Section>

          <Section label="Clinical summary">
            {visit.clinicalSummary ? <div>{visit.clinicalSummary}</div> : null}
          </Section>

          <Section label="Conditions discussed">
            {visit.conditionsDiscussed?.length ? (
              <ul className="mh-bullet-list">
                {visit.conditionsDiscussed.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section label="Medications">
            {visit.medications?.length ? (
              <ul className="mh-bullet-list">
                {visit.medications.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section label="Investigations">
            {visit.investigations?.length ? (
              <ul className="mh-bullet-list">
                {visit.investigations.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section label="Follow-up" accent>
            {visit.followUp ? (
              <div style={{ color: 'var(--mh-primary)' }}>{visit.followUp}</div>
            ) : visit.location ? (
              <div style={{ color: 'var(--mh-primary)' }}>
                Follow up as advised at {visit.location}
              </div>
            ) : null}
          </Section>
        </>
      )}
    </div>
  );
};

export default VisitDetailPage;
