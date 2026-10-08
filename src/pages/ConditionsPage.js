import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import SegmentedControl from '../components/ui/SegmentedControl';
import StatusBadge from '../components/ui/StatusBadge';
import { usePatient } from '../contexts/PatientContext';
import { fetchConditions, formatMonthYear } from '../services/openmrsService';
import { findConditionMessages } from '../services/messageLibrary';

const ConditionsPage = () => {
  const { patientData } = usePatient();
  const navigate = useNavigate();
  const [conditions, setConditions] = useState([]);
  const [tab, setTab] = useState('active');
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
        const data = await fetchConditions(uuid);
        if (!cancelled) setConditions(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load conditions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientData?.uuid]);

  const filtered = conditions.filter((c) =>
    tab === 'active' ? c.active : !c.active
  );

  return (
    <div>
      <AppHeader title="Health Conditions" onBack={() => navigate('/')} />
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'previous', label: 'Previous' },
        ]}
      />
      {loading && <div className="mh-loading">Loading conditions…</div>}
      {error && <div className="mh-error-banner">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="mh-empty">No {tab} conditions.</div>
      )}
      {filtered.map((cond) => {
        const lib = findConditionMessages(cond.name);
        const diagnosed = formatMonthYear(cond.onsetDateTime || cond.recordedDate);
        return (
          <button
            key={cond.id}
            type="button"
            className="mh-card clickable"
            onClick={() => navigate(`/conditions/${cond.id}`)}
          >
            <div className="mh-list-row">
              <div className="mh-icon-circle heart" aria-hidden="true">
                ♥
              </div>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>
                  {lib.patientFacingName || cond.name}
                </div>
                {diagnosed && (
                  <div className="mh-muted" style={{ marginTop: 4 }}>
                    Diagnosed {diagnosed}
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <StatusBadge
                    label={cond.active ? 'Active' : 'Previous'}
                    variant={cond.active ? 'success' : 'neutral'}
                    withDot={cond.active}
                  />
                </div>
              </div>
              <span className="mh-chevron">›</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConditionsPage;
