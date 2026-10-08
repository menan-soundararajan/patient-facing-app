import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { usePatient } from '../contexts/PatientContext';
import { fetchMedications } from '../services/openmrsService';
import { findMedicationMessages } from '../services/messageLibrary';

const MedDetailPage = () => {
  const { uuid } = useParams();
  const { patientData } = usePatient();
  const navigate = useNavigate();
  const [med, setMed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const patientUuid = patientData?.uuid;
    if (!patientUuid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchMedications(patientUuid);
        const found = list.find((m) => m.uuid === uuid);
        if (!cancelled) {
          if (!found) setError('Medication not found');
          else setMed(found);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load medication');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientData?.uuid, uuid]);

  const lib = med ? findMedicationMessages(med.display) : null;

  return (
    <div>
      <AppHeader title="Medication Details" onBack={() => navigate('/meds')} />
      {loading && <div className="mh-loading">Loading…</div>}
      {error && <div className="mh-error-banner">{error}</div>}
      {med && lib && (
        <>
          <div className="mh-detail-hero">
            <div className="mh-icon-circle teal lg" aria-hidden="true">
              💊
            </div>
            <h2>{med.display}</h2>
            <div className="mh-muted" style={{ marginBottom: 10 }}>
              Generic name: {lib.genericName || med.drugName || '—'}
            </div>
            <StatusBadge
              label={med.active ? 'Active' : 'Previous'}
              variant={med.active ? 'success' : 'neutral'}
              withDot={med.active}
            />
          </div>

          <div className="mh-step-card">
            <div className="mh-step-header">
              <span className="mh-step-num">1</span>
              <h3>Why you take it</h3>
            </div>
            <p>{lib.messages['Why you take it']}</p>
          </div>

          <div className="mh-step-card">
            <div className="mh-step-header">
              <span className="mh-step-num">2</span>
              <h3>How to take it</h3>
            </div>
            <div className="mh-dose-grid">
              <div className="mh-dose-cell">
                <span className="label">Dose</span>
                <span className="value">{med.dose || '—'}</span>
              </div>
              <div className="mh-dose-cell">
                <span className="label">Frequency</span>
                <span className="value">{med.frequency || '—'}</span>
              </div>
              <div className="mh-dose-cell">
                <span className="label">Timing</span>
                <span className="value">{med.timing || '—'}</span>
              </div>
            </div>
            {lib.messages['How to take it'] && (
              <p style={{ marginTop: 12 }}>{lib.messages['How to take it']}</p>
            )}
          </div>

          <div className="mh-step-card">
            <div className="mh-step-header">
              <span className="mh-step-num">3</span>
              <h3>What to watch for</h3>
            </div>
            <p>{lib.messages['What to watch for']}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default MedDetailPage;
