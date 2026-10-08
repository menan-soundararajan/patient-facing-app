import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { usePatient } from '../contexts/PatientContext';
import { fetchConditions } from '../services/openmrsService';
import { findConditionMessages } from '../services/messageLibrary';

const toBullets = (text) => {
  if (!text) return [];
  const parts = text
    .split(/[.;]\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [];
  return parts.map((p) => (p.endsWith('.') ? p : `${p}.`));
};

const ConditionDetailPage = () => {
  const { id } = useParams();
  const { patientData } = usePatient();
  const navigate = useNavigate();
  const [condition, setCondition] = useState(null);
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
        const list = await fetchConditions(uuid);
        const found = list.find((c) => c.id === id);
        if (!cancelled) {
          if (!found) setError('Condition not found');
          else setCondition(found);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load condition');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientData?.uuid, id]);

  const lib = condition ? findConditionMessages(condition.name) : null;
  const doBullets = lib ? toBullets(lib.messages['What you can do']) : [];

  return (
    <div>
      <AppHeader title="Health Condition" onBack={() => navigate('/conditions')} />
      {loading && <div className="mh-loading">Loading…</div>}
      {error && <div className="mh-error-banner">{error}</div>}
      {condition && lib && (
        <>
          <div className="mh-detail-hero">
            <div className="mh-icon-circle heart lg" aria-hidden="true">
              ♥
            </div>
            <h2>{lib.patientFacingName || condition.name}</h2>
            <StatusBadge
              label={condition.active ? 'Active' : 'Previous'}
              variant={condition.active ? 'success' : 'neutral'}
              withDot={condition.active}
            />
          </div>

          <div className="mh-step-card">
            <div className="mh-step-header">
              <span className="mh-step-num">1</span>
              <h3>What is it?</h3>
            </div>
            <p>{lib.messages['What it is']}</p>
          </div>

          <div className="mh-step-card">
            <div className="mh-step-header">
              <span className="mh-step-num">2</span>
              <h3>What you can do</h3>
            </div>
            {doBullets.length > 0 ? (
              <ul>
                {doBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : (
              <p>{lib.messages['What you can do']}</p>
            )}
          </div>

          <div className="mh-step-card">
            <div className="mh-step-header">
              <span className="mh-step-num warn">3</span>
              <h3>When to get help</h3>
            </div>
            <p>{lib.messages['When to get help']}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default ConditionDetailPage;
