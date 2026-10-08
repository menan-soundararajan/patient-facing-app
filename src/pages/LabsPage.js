import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { usePatient } from '../contexts/PatientContext';
import {
  fetchLabReports,
  fetchConditions,
  getPatientAgeYears,
  formatShortDate,
} from '../services/openmrsService';
import { findLabResultMessage } from '../services/messageLibrary';

const LabsPage = () => {
  const { patientData } = usePatient();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [conditions, setConditions] = useState([]);
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
        const [l, c] = await Promise.all([
          fetchLabReports(uuid),
          fetchConditions(uuid),
        ]);
        if (!cancelled) {
          setLabs(l);
          setConditions(c);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load lab results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientData?.uuid]);

  const age = getPatientAgeYears(patientData);
  const conditionNames = useMemo(
    () => conditions.map((c) => c.name),
    [conditions]
  );

  return (
    <div>
      <AppHeader title="Lab Results" onBack={() => navigate('/')} />
      {loading && <div className="mh-loading">Loading lab results…</div>}
      {error && <div className="mh-error-banner">{error}</div>}
      {!loading && !error && labs.length === 0 && (
        <div className="mh-empty">No lab results found.</div>
      )}
      {labs.map((lab) => {
        const info = findLabResultMessage({
          testName: lab.testName,
          value: lab.rawValue,
          gender: patientData?.person?.gender,
          age,
          conditionNames,
        });
        return (
          <button
            key={lab.uuid}
            type="button"
            className="mh-card clickable"
            onClick={() => navigate(`/labs/${lab.uuid}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{lab.testName}</div>
                <div className="mh-small" style={{ marginTop: 4 }}>
                  {formatShortDate(lab.obsDatetime)}
                </div>
              </div>
              <StatusBadge
                label={info.badge.label}
                variant={info.badge.variant}
              />
            </div>
            <div style={{ marginTop: 12, fontSize: '1.5rem', fontWeight: 700 }}>
              {lab.testResult}
              {lab.units ? (
                <span
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: 'var(--mh-text-secondary)',
                    marginLeft: 6,
                  }}
                >
                  {lab.units}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default LabsPage;
