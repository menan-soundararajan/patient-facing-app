import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import {
  fetchAllergies,
  fetchVisits,
  fetchVisitDetails,
  fetchMedications,
  fetchLabReports,
  fetchConditions,
  getNextAppointment,
  getLatestVisit,
  buildVisitClinicalSummaryText,
  getPatientDisplayName,
  getPatientIdentifier,
  getPatientGenderLabel,
  getPatientAgeYears,
  formatLongDate,
  formatTime,
  formatShortDate,
} from '../services/openmrsService';
import { findLabResultMessage } from '../services/messageLibrary';

const HomePage = () => {
  const { patientData } = usePatient();
  const [allergies, setAllergies] = useState([]);
  const [visits, setVisits] = useState([]);
  const [meds, setMeds] = useState([]);
  const [labs, setLabs] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestVisitDetail, setLatestVisitDetail] = useState(null);
  const [careMessageDismissed, setCareMessageDismissed] = useState(false);

  useEffect(() => {
    const uuid = patientData?.uuid;
    if (!uuid) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [a, v, m, l, c] = await Promise.all([
          fetchAllergies(uuid),
          fetchVisits(uuid),
          fetchMedications(uuid),
          fetchLabReports(uuid),
          fetchConditions(uuid),
        ]);
        if (!cancelled) {
          setAllergies(a);
          setVisits(v);
          setMeds(m);
          setLabs(l);
          setConditions(c);
        }

        const latest = getLatestVisit(v);
        if (latest?.uuid) {
          try {
            const detail = await fetchVisitDetails(latest.uuid);
            if (!cancelled) setLatestVisitDetail(detail);
          } catch (err) {
            console.warn('Failed to load latest visit summary', err);
            if (!cancelled) setLatestVisitDetail(null);
          }
        } else if (!cancelled) {
          setLatestVisitDetail(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patientData?.uuid]);

  const name = getPatientDisplayName(patientData) || 'Patient';
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const age = getPatientAgeYears(patientData);
  const gender = getPatientGenderLabel(patientData);
  const identifier = getPatientIdentifier(patientData);
  const next = getNextAppointment(visits);
  const activeMeds = meds.filter((m) => m.active);
  const activeConditions = conditions.filter((c) => c.active);
  const conditionNames = conditions.map((c) => c.name);
  const careSummaryText = buildVisitClinicalSummaryText(latestVisitDetail);

  const labsNeedingAttention = labs.some((lab) => {
    const info = findLabResultMessage({
      testName: lab.testName,
      value: lab.rawValue,
      gender: patientData?.person?.gender,
      age,
      conditionNames,
    });
    return info.badge?.variant === 'danger';
  });

  const latestLab = labs[0];

  return (
    <div>
      <h1 className="mh-page-title">My Health</h1>

      <div className="mh-profile-row">
        <div className="mh-avatar" aria-hidden="true">
          {initial}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{name}</div>
          <div className="mh-muted">
            {[age != null ? `${age} years` : null, gender, identifier]
              .filter(Boolean)
              .join(' • ')}
          </div>
        </div>
      </div>

      {!careMessageDismissed && latestVisitDetail && careSummaryText && (
        <div className="mh-care-message">
          <div className="mh-care-message-icon" aria-hidden="true">
            💬
          </div>
          <div className="mh-care-message-body">
            <div className="mh-care-message-top">
              <div className="mh-care-message-title-row">
                <h3 className="mh-care-message-title">
                  Message from your care team
                </h3>
                <span className="mh-care-latest">Latest</span>
              </div>
              <div className="mh-care-message-meta">
                <span className="mh-care-message-date">
                  {formatShortDate(latestVisitDetail.startDatetime)}
                </span>
                <button
                  type="button"
                  className="mh-care-message-close"
                  aria-label="Dismiss"
                  onClick={() => setCareMessageDismissed(true)}
                >
                  ×
                </button>
              </div>
            </div>
            <p className="mh-care-message-text">{careSummaryText}</p>
            <div className="mh-care-message-actions">
              <Link
                className="mh-care-message-link"
                to={`/visits/${latestVisitDetail.uuid}`}
              >
                View details →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mh-allergy-card">
        <h3>Allergies</h3>
        {allergies.length > 0 ? (
          allergies.map((a) => (
            <div key={a.uuid || a.display} className="mh-allergy-item">
              <span aria-hidden="true">⚠</span>
              <span>{a.display}</span>
            </div>
          ))
        ) : (
          <div className="mh-allergy-item">
            <span aria-hidden="true">⚠</span>
            <span>No known drug allergies</span>
          </div>
        )}
        <div className="mh-small" style={{ marginTop: 6 }}>
          {allergies.some((a) => /food/i.test(a.display))
            ? null
            : 'No known food allergies.'}
        </div>
      </div>

      <h2 className="mh-section-title">Next Appointment</h2>
      {next ? (
        <div className="mh-card">
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{next.visitType}</div>
          {next.location && (
            <div className="mh-link-blue" style={{ marginTop: 4 }}>
              {next.location}
            </div>
          )}
          <div className="mh-meta-row">
            <span aria-hidden="true">📅</span>
            <span>{formatLongDate(next.startDatetime)}</span>
          </div>
          <div className="mh-meta-row">
            <span aria-hidden="true">🕐</span>
            <span>{formatTime(next.startDatetime)}</span>
          </div>
          {next.location && (
            <div className="mh-meta-row">
              <span aria-hidden="true">📍</span>
              <span>{next.location}</span>
            </div>
          )}
          <Link className="mh-btn-soft" to={`/visits/${next.uuid}`}>
            View details
          </Link>
        </div>
      ) : (
        <div className="mh-card mh-muted">No upcoming visits.</div>
      )}

      <h2 className="mh-section-title">Health Snapshot</h2>
      {loading ? (
        <div className="mh-loading">Loading your health summary…</div>
      ) : (
        <div className="mh-snapshot-grid">
          <Link to="/visits" className="mh-snapshot-card">
            <div className="mh-icon-circle purple">📅</div>
            <h4>Visit History</h4>
            <div className="mh-snapshot-stat blue">{visits.length} visits</div>
            <div className="mh-small">
              Last: {visits[0] ? formatShortDate(visits[0].startDatetime)?.replace(/ \d{4}$/, '') : '—'}
            </div>
            <div className="mh-view-all">
              View all <span>›</span>
            </div>
          </Link>

          <Link to="/meds" className="mh-snapshot-card">
            <div className="mh-icon-circle teal">💊</div>
            <h4>Medications</h4>
            <div className="mh-snapshot-stat teal">{activeMeds.length} active</div>
            <div className="mh-small">
              {activeMeds
                .slice(0, 2)
                .map((m) => m.display.split(' ')[0])
                .join(', ') || 'None'}
              {activeMeds.length > 2 ? ',…' : ''}
            </div>
            <div className="mh-view-all">
              View all <span>›</span>
            </div>
          </Link>

          <Link to="/labs" className="mh-snapshot-card">
            <div className="mh-icon-circle purple">🧪</div>
            <h4>Lab Results</h4>
            <div className="mh-small">
              Latest: {latestLab ? formatShortDate(latestLab.obsDatetime)?.replace(/ \d{4}$/, '') : '—'}
            </div>
            {labsNeedingAttention ? (
              <div className="mh-snapshot-stat danger">Needs attention</div>
            ) : (
              <div className="mh-snapshot-stat teal">Up to date</div>
            )}
            <div className="mh-view-all">
              View all <span>›</span>
            </div>
          </Link>

          <Link to="/conditions" className="mh-snapshot-card">
            <div className="mh-icon-circle heart">♥</div>
            <h4>Conditions</h4>
            <div className="mh-snapshot-stat heart">{activeConditions.length} active</div>
            <div className="mh-small">
              {activeConditions
                .slice(0, 2)
                .map((c) => c.name.split(' ')[0])
                .join(', ') || 'None'}
              {activeConditions.length > 2 ? ',…' : ''}
            </div>
            <div className="mh-view-all">
              View all <span>›</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default HomePage;
