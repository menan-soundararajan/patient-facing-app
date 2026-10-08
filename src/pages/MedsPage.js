import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import SegmentedControl from '../components/ui/SegmentedControl';
import StatusBadge from '../components/ui/StatusBadge';
import { usePatient } from '../contexts/PatientContext';
import { fetchMedications } from '../services/openmrsService';
import { findMedicationMessages } from '../services/messageLibrary';

const MedsPage = () => {
  const { patientData } = usePatient();
  const navigate = useNavigate();
  const [meds, setMeds] = useState([]);
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
        const data = await fetchMedications(uuid);
        if (!cancelled) setMeds(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load medications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientData?.uuid]);

  const filtered = meds.filter((m) => (tab === 'active' ? m.active : !m.active));

  return (
    <div>
      <AppHeader title="Medications" onBack={() => navigate('/')} />
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'previous', label: 'Previous' },
        ]}
      />
      {loading && <div className="mh-loading">Loading medications…</div>}
      {error && <div className="mh-error-banner">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="mh-empty">No {tab} medications.</div>
      )}
      {filtered.map((med) => {
        const lib = findMedicationMessages(med.display);
        const chips = [med.dose, med.frequency, med.timing].filter(Boolean);
        return (
          <button
            key={med.uuid}
            type="button"
            className="mh-card clickable"
            onClick={() => navigate(`/meds/${med.uuid}`)}
          >
            <div className="mh-list-row">
              <div className="mh-icon-circle teal" aria-hidden="true">
                💊
              </div>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{med.display}</div>
                <div className="mh-muted">
                  {lib.genericName || med.drugName || 'Medication'}
                </div>
                {chips.length > 0 && (
                  <div className="mh-instruction-chips">
                    {chips.map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <StatusBadge
                    label={med.active ? 'Active' : 'Previous'}
                    variant={med.active ? 'success' : 'neutral'}
                    withDot={med.active}
                  />
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MedsPage;
