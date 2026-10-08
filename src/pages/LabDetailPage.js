import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { usePatient } from '../contexts/PatientContext';
import {
  fetchLabReports,
  fetchConditions,
  getPatientAgeYears,
  formatShortDate,
} from '../services/openmrsService';
import { findLabResultMessage } from '../services/messageLibrary';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const LabDetailPage = () => {
  const { id } = useParams();
  const { patientData } = usePatient();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
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
        const [labs, conds] = await Promise.all([
          fetchLabReports(uuid),
          fetchConditions(uuid),
        ]);
        if (cancelled) return;
        const found = labs.find((l) => l.uuid === id);
        setConditions(conds);
        if (!found) setError('Lab result not found');
        else setLab(found);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load lab result');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientData?.uuid, id]);

  const age = getPatientAgeYears(patientData);
  const conditionNames = useMemo(
    () => conditions.map((c) => c.name),
    [conditions]
  );

  const info = lab
    ? findLabResultMessage({
        testName: lab.testName,
        value: lab.rawValue,
        gender: patientData?.person?.gender,
        age,
        conditionNames,
      })
    : null;

  const rangeVisual = useMemo(() => {
    if (!info?.numericValue && info?.numericValue !== 0) return null;
    const value = info.numericValue;
    const lower = info.normalRange?.lower;
    const upper = info.normalRange?.upper;

    // Build a visual scale that includes value and normal band
    let scaleMin;
    let scaleMax;
    if (lower != null && upper != null) {
      const span = upper - lower || 1;
      scaleMin = Math.min(lower - span * 0.5, value);
      scaleMax = Math.max(upper + span * 0.5, value);
    } else if (upper != null) {
      scaleMin = Math.min(0, value);
      scaleMax = Math.max(upper * 1.5, value * 1.1);
    } else if (lower != null) {
      scaleMin = Math.min(lower * 0.5, value);
      scaleMax = Math.max(lower * 2, value * 1.1);
    } else {
      return null;
    }
    if (scaleMax <= scaleMin) scaleMax = scaleMin + 1;

    const toPct = (v) => clamp(((v - scaleMin) / (scaleMax - scaleMin)) * 100, 0, 100);
    const normalLeft = lower != null ? toPct(lower) : 0;
    const normalRight = upper != null ? toPct(upper) : 100;
    const pin = toPct(value);

    let tag = 'OK';
    if (upper != null && value >= upper) tag = 'HIGH';
    else if (lower != null && value < lower) tag = 'LOW';

    return {
      normalLeft,
      normalWidth: Math.max(normalRight - normalLeft, 2),
      pin,
      tag,
      lowerLabel: lower != null ? `${lower}${info.unit ? ` ${info.unit}` : lab.units ? ` ${lab.units}` : ''}` : '—',
      upperLabel: upper != null ? `${upper}${info.unit ? ` ${info.unit}` : lab.units ? ` ${lab.units}` : ''}` : '—',
    };
  }, [info, lab]);

  return (
    <div>
      <AppHeader title="Lab Result" onBack={() => navigate('/labs')} />
      {loading && <div className="mh-loading">Loading…</div>}
      {error && <div className="mh-error-banner">{error}</div>}
      {lab && info && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>{lab.testName}</div>
            <div className="mh-muted" style={{ marginTop: 4 }}>
              Date: {formatShortDate(lab.obsDatetime)}
            </div>
          </div>

          <div className="mh-card mh-lab-value-card">
            <div className="label">YOUR RESULT</div>
            <div className="value">
              {lab.testResult}
              {lab.units ? <span className="unit"> {lab.units}</span> : null}
            </div>

            {rangeVisual && (
              <>
                <div className="mh-range-bar">
                  <div
                    className="normal"
                    style={{
                      left: `${rangeVisual.normalLeft}%`,
                      width: `${rangeVisual.normalWidth}%`,
                    }}
                  />
                  <div
                    className="mh-range-pin"
                    style={{ left: `${rangeVisual.pin}%` }}
                  >
                    <span className="tag">{rangeVisual.tag}</span>
                    <span className="stem" />
                    <span className="dot" />
                  </div>
                </div>
                <div className="mh-range-labels">
                  <span>LOWER LIMIT<br />{rangeVisual.lowerLabel}</span>
                  <span className="center">NORMAL RANGE</span>
                  <span style={{ textAlign: 'right' }}>
                    UPPER LIMIT<br />
                    {rangeVisual.upperLabel}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mh-card">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>About this result</div>
            <p style={{ margin: 0, lineHeight: 1.45 }}>
              {info.message ||
                `Your ${lab.testName} result is ${lab.testResult}${
                  lab.units ? ` ${lab.units}` : ''
                }. Ask your clinician if you have questions about this result.`}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LabDetailPage;
