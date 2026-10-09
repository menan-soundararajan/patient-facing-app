// Use proxy server in development to avoid CORS issues
// In production (Vercel), use the serverless function at /api/openmrs
// Note: window is not available during SSR, so we check it safely
const isVercel = typeof window !== 'undefined' && (
  window.location.hostname.includes('vercel.app') || 
  process.env.NODE_ENV === 'production'
);
const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false'; // Default to true

// Determine proxy URL based on environment
let PROXY_URL;
if (isVercel) {
  // Use Vercel serverless function in production
  PROXY_URL = '/api/openmrs';
} else {
  // Use local proxy server in development
  PROXY_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/openmrs';
}

// OpenMRS Server Configuration
// Base URL: https://openmrs6.arogya.cloud
// SPA Login URL: https://openmrs6.arogya.cloud/openmrs/spa/login (web interface, not used by API)
// REST API Base: https://openmrs6.arogya.cloud/openmrs/ws/rest/v1/
const OPENMRS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://openmrs6.arogya.cloud';
const OPENMRS_USERNAME = 'admin';
const OPENMRS_PASSWORD = 'Admin123';

// Note: When using proxy, authentication is handled by the proxy server
// So we don't need to send auth headers from the client
const USE_PROXY_AUTH = USE_PROXY;

/**
 * Authenticate with OpenMRS and get session token
 * OpenMRS uses basic authentication, so we'll use credentials for each request
 */
const getAuthHeader = () => {
  const credentials = btoa(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`);
  return `Basic ${credentials}`;
};

/**
 * Login to OpenMRS (establish session)
 * Note: OpenMRS REST API uses basic auth, but we can also establish a session
 */
export const loginOpenMRS = async () => {
  try {
    // When using proxy, request goes to /api/openmrs/ws/rest/v1/session
    // Proxy rewrites it to /openmrs/ws/rest/v1/session
    // When not using proxy, request goes directly to /openmrs/ws/rest/v1/session
    const url = USE_PROXY 
      ? `${OPENMRS_BASE_URL}/ws/rest/v1/session`
      : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/session`;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Only add auth header if not using proxy (proxy handles auth)
    if (!USE_PROXY_AUTH) {
      headers['Authorization'] = getAuthHeader();
    }
    
    // Use openmrsFetch wrapper for global loading state
    const { openmrsFetch } = await import('../utils/openmrsFetch');
    const result = await openmrsFetch(url, {
      method: 'GET',
      headers: headers,
    });

    const data = result.data;
    console.log('OpenMRS login successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error logging into OpenMRS:', error);
    console.error('Error details:', {
      message: error.message,
      useProxy: USE_PROXY,
      url: USE_PROXY 
        ? `${OPENMRS_BASE_URL}/ws/rest/v1/session`
        : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/session`
    });
    
    let errorMessage = error.message;
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      if (USE_PROXY) {
        errorMessage = `Cannot connect to proxy server at ${PROXY_URL}. Please start the proxy server: npm run server (or npm run dev to run both servers)`;
      } else {
        errorMessage = 'Unable to connect to OpenMRS server. Please check your network connection or use the proxy server.';
      }
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      errorMessage = `Connection refused: Cannot connect to ${USE_PROXY ? 'proxy server' : 'OpenMRS server'}. ${USE_PROXY ? 'Please start the proxy server with: npm run server' : 'Please check if OpenMRS server is running'}.`;
    }
    return { success: false, error: errorMessage };
  }
};

/**
 * Search for patient by email
 * @param {string} email - Patient email to search for
 * @returns {Promise} Patient data or error
 */
export const searchPatientByEmail = async (email) => {
  try {
    // First, ensure we're authenticated
    await loginOpenMRS();

    // When using proxy, request goes to /api/openmrs/ws/rest/v1/patient
    // Proxy rewrites it to /openmrs/ws/rest/v1/patient
    // When not using proxy, request goes directly to /openmrs/ws/rest/v1/patient
    const url = USE_PROXY
      ? `${OPENMRS_BASE_URL}/ws/rest/v1/patient?q=${encodeURIComponent(email)}&limit=1&v=default`
      : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/patient?q=${encodeURIComponent(email)}&limit=1&v=default`;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Only add auth header if not using proxy (proxy handles auth)
    if (!USE_PROXY_AUTH) {
      headers['Authorization'] = getAuthHeader();
    }

    // Use openmrsFetch wrapper for global loading state
    const { openmrsFetch } = await import('../utils/openmrsFetch');
    const result = await openmrsFetch(url, {
      method: 'GET',
      headers: headers,
    });

    const data = result.data;
    
    // Check if results array is empty or null
    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        error: 'User not registered',
        patient: null,
      };
    }
    
    // Patient found - fetch full patient details
    const patient = data.results[0];
    const patientDetails = await getPatientDetails(patient.uuid);
    
    return {
      success: true,
      patient: patientDetails || patient,
    };
  } catch (error) {
    console.error('Error searching for patient:', error);
    
    // Handle specific error types
    let errorMessage = error.message;
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      if (USE_PROXY) {
        errorMessage = `Network error: Unable to connect to proxy server at ${PROXY_URL}. Please make sure the proxy server is running (npm run server or npm run dev).`;
      } else {
        errorMessage = 'Network error: Unable to connect to OpenMRS. Please check CORS settings or network connectivity. Consider using the proxy server.';
      }
    } else if (error.message.includes('CORS')) {
      errorMessage = 'CORS error: The OpenMRS server may not allow requests from this origin. Please use the proxy server (npm run server).';
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      errorMessage = `Connection refused: Cannot connect to ${USE_PROXY ? 'proxy server' : 'OpenMRS server'}. Please ensure the ${USE_PROXY ? 'proxy server is running (npm run server)' : 'OpenMRS server is accessible'}.`;
    }
    
    return {
      success: false,
      error: errorMessage,
      patient: null,
    };
  }
};

/**
 * Get detailed patient information
 * @param {string} uuid - Patient UUID
 * @returns {Promise} Patient details
 */
const getPatientDetails = async (uuid) => {
  try {
    // When using proxy, request goes to /api/openmrs/ws/rest/v1/patient/{uuid}
    // Proxy rewrites it to /openmrs/ws/rest/v1/patient/{uuid}
    // When not using proxy, request goes directly to /openmrs/ws/rest/v1/patient/{uuid}
    const url = USE_PROXY
      ? `${OPENMRS_BASE_URL}/ws/rest/v1/patient/${uuid}?v=full`
      : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/patient/${uuid}?v=full`;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Only add auth header if not using proxy (proxy handles auth)
    if (!USE_PROXY_AUTH) {
      headers['Authorization'] = getAuthHeader();
    }
    
    const { openmrsFetch } = await import('../utils/openmrsFetch');
    const result = await openmrsFetch(url, {
      method: 'GET',
      headers: headers,
    });

    return result.data;
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return null;
  }
};

/**
 * Extract email from patient person attributes
 * @param {Object} patient - Patient object
 * @returns {string|null} Email address or null
 */
export const getPatientEmail = (patient) => {
  if (!patient || !patient.person || !patient.person.attributes) {
    return null;
  }

  const emailAttribute = patient.person.attributes.find(
    attr => attr.attributeType && (
      attr.attributeType.display === 'Email' ||
      attr.attributeType.uuid === '58f43b5e-5311-4512-b0d4-24a2a7f3a4e2' ||
      attr.attributeType.display?.toLowerCase().includes('email')
    )
  );

  return emailAttribute ? emailAttribute.value : null;
};

/**
 * Calculate age from birthdate
 * @param {string} birthdate - Birthdate in YYYY-MM-DD format
 * @returns {number|null} Age in years or null
 */
export const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format patient data for display
 * @param {Object} patient - Patient object from OpenMRS
 * @returns {Object} Formatted patient data
 */
export const formatPatientData = (patient) => {
  if (!patient) return null;

  const person = patient.person || patient;
  const names = person.names && person.names[0];
  const givenName = names?.givenName || '';
  const familyName = names?.familyName || '';
  const displayName = names?.display || `${givenName} ${familyName}`.trim() || 'Unknown';
  
  const gender = person.gender || 'Unknown';
  const birthdate = person.birthdate || null;
  const age = birthdate ? calculateAge(birthdate) : null;
  const uuid = patient.uuid || 'N/A';
  const email = getPatientEmail(patient);

  return {
    name: displayName,
    gender: gender.charAt(0).toUpperCase() + gender.slice(1),
    age: age !== null ? `${age} years` : 'Unknown',
    uuid: uuid,
    email: email || 'Not available',
    birthdate: birthdate,
  };
};

const DRUG_ORDER_TYPE = '131168f4-15f5-102d-96e4-000c29c2a5d7';
const LAB_ORDER_TYPE = '52a447d3-a64a-11e3-9aeb-50e549534c5e';

const buildUrl = (pathWithQuery) =>
  USE_PROXY
    ? `${OPENMRS_BASE_URL}${pathWithQuery}`
    : `${OPENMRS_BASE_URL}/openmrs${pathWithQuery}`;

const apiHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (!USE_PROXY_AUTH) {
    headers.Authorization = getAuthHeader();
  }
  return headers;
};

const apiGet = async (pathWithQuery) => {
  const { openmrsFetch } = await import('../utils/openmrsFetch');
  const result = await openmrsFetch(buildUrl(pathWithQuery), {
    method: 'GET',
    headers: apiHeaders(),
  });
  return result.data;
};

/** Quiet GET for optional resources (no global error toast). */
const apiGetOptional = async (pathWithQuery) => {
  const response = await fetch(buildUrl(pathWithQuery), {
    method: 'GET',
    headers: apiHeaders(),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const getPatientDisplayName = (patient) => {
  if (!patient?.person) return null;
  const person = patient.person;
  if (person.display) return person.display;
  if (person.names?.length) {
    const name = person.names[0];
    return name.display || `${name.givenName || ''} ${name.familyName || ''}`.trim();
  }
  return null;
};

export const getPatientIdentifier = (patient) => {
  const ids = patient?.identifiers || [];
  const preferred = ids.find((i) => i.preferred) || ids[0];
  return preferred?.identifier || preferred?.display || null;
};

export const getPatientGenderLabel = (patient) => {
  const g = (patient?.person?.gender || '').toUpperCase();
  if (g === 'M') return 'Male';
  if (g === 'F') return 'Female';
  return g || 'Unknown';
};

export const getPatientAgeYears = (patient) => {
  return calculateAge(patient?.person?.birthdate);
};

/**
 * Fetch patient allergies (OpenMRS REST allergy resource).
 */
const mapAllergy = (a) => ({
  uuid: a.uuid,
  display:
    a.display ||
    a.allergen?.codedAllergen?.display ||
    a.allergen?.nonCodedAllergen ||
    'Allergy',
  severity: a.severity?.display || null,
  reactions: (a.reactions || [])
    .map((r) => r.reaction?.display || r.display)
    .filter(Boolean),
});

export const fetchAllergies = async (patientUuid) => {
  if (!patientUuid) return [];
  const paths = [
    `/ws/rest/v1/patient/${patientUuid}/allergy?v=full`,
    `/ws/rest/v1/allergy?patient=${patientUuid}&v=full`,
  ];
  for (const path of paths) {
    try {
      const data = await apiGetOptional(path);
      const results = data?.results || (Array.isArray(data) ? data : []);
      if (!Array.isArray(results)) continue;
      return results.map(mapAllergy);
    } catch (err) {
      console.warn('Allergy fetch attempt failed:', path, err.message);
    }
  }
  return [];
};

export const fetchVisits = async (patientUuid) => {
  if (!patientUuid) return [];
  const data = await apiGet(`/ws/rest/v1/visit?patient=${patientUuid}&v=full`);
  const results = data?.results || [];
  return results.map((visit) => {
    const start = visit.startDatetime ? new Date(visit.startDatetime) : null;
    const stop = visit.stopDatetime ? new Date(visit.stopDatetime) : null;
    const open = !visit.stopDatetime;
    return {
      uuid: visit.uuid,
      display: visit.display,
      visitType: visit.visitType?.display || 'Visit',
      location: visit.location?.display || null,
      startDatetime: visit.startDatetime,
      stopDatetime: visit.stopDatetime,
      start,
      stop,
      open,
      status: open ? 'Open' : 'Completed',
      encounters: visit.encounters || [],
      raw: visit,
    };
  }).sort((a, b) => {
    const ta = a.start ? a.start.getTime() : 0;
    const tb = b.start ? b.start.getTime() : 0;
    return tb - ta;
  });
};

export const fetchVisitDetails = async (visitUuid) => {
  if (!visitUuid) return null;
  const visit = await apiGet(`/ws/rest/v1/visit/${visitUuid}?v=full`);
  const encounterUuids = (visit.encounters || []).map((e) => e.uuid).filter(Boolean);

  const encounterDetails = [];
  for (const encUuid of encounterUuids.slice(0, 8)) {
    try {
      const enc = await apiGet(`/ws/rest/v1/encounter/${encUuid}?v=full`);
      encounterDetails.push(enc);
    } catch (e) {
      console.warn('Failed to load encounter', encUuid, e);
    }
  }

  const diagnoses = [];
  const medications = [];
  const investigations = [];
  const notes = [];

  for (const enc of encounterDetails) {
    if (enc.encounterType?.display) {
      notes.push(enc.encounterType.display);
    }
    for (const obs of enc.obs || []) {
      const concept = obs.concept?.display || '';
      const value =
        typeof obs.value === 'object'
          ? obs.value?.display || obs.value?.name || ''
          : String(obs.value ?? '');
      if (/diagnosis|condition|complaint|reason/i.test(concept)) {
        diagnoses.push(value || concept);
      } else if (/follow.?up|plan|note|summary/i.test(concept)) {
        notes.push(value || concept);
      }
    }
    for (const order of enc.orders || []) {
      const type = order.orderType?.display || '';
      if (/drug|medication/i.test(type) || order.type === 'drugorder') {
        medications.push(order.display || order.drug?.display);
      } else if (/test/i.test(type)) {
        investigations.push(order.display || order.concept?.display);
      }
    }
  }

  const uniq = (arr) => [...new Set(arr.filter(Boolean))];

  return {
    uuid: visit.uuid,
    visitType: visit.visitType?.display || 'Visit',
    location: visit.location?.display || null,
    startDatetime: visit.startDatetime,
    stopDatetime: visit.stopDatetime,
    open: !visit.stopDatetime,
    status: visit.stopDatetime ? 'Completed' : 'Open',
    provider:
      encounterDetails
        .flatMap((e) => e.encounterProviders || [])
        .map((p) => p.display || p.provider?.display)
        .find(Boolean) || null,
    reason: uniq(diagnoses).slice(0, 1)[0] || visit.visitType?.display || null,
    clinicalSummary: uniq(notes).slice(0, 2).join('. ') || null,
    conditionsDiscussed: uniq(diagnoses),
    medications: uniq(medications),
    investigations: uniq(investigations),
    followUp: null,
    raw: visit,
  };
};

export const getNextAppointment = (visits) => {
  if (!visits?.length) return null;
  const now = Date.now();
  const upcoming = visits
    .filter((v) => v.open || (v.start && v.start.getTime() >= now))
    .sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0));
  return upcoming[0] || visits[0] || null;
};

/** Most recent past/completed visit (not an upcoming appointment). */
export const getLatestVisit = (visits) => {
  if (!visits?.length) return null;
  const now = Date.now();
  const past = visits
    .filter((v) => v.start && v.start.getTime() <= now)
    .sort((a, b) => (b.start?.getTime() || 0) - (a.start?.getTime() || 0));
  return past[0] || null;
};

/** Build a short patient-facing clinical summary from visit detail fields. */
export const buildVisitClinicalSummaryText = (detail) => {
  if (!detail) return null;
  if (detail.clinicalSummary) return detail.clinicalSummary;

  const parts = [];
  if (detail.reason) {
    parts.push(`You attended for ${detail.reason}.`);
  } else if (detail.visitType) {
    parts.push(`You attended a ${detail.visitType} visit.`);
  }
  if (detail.conditionsDiscussed?.length) {
    parts.push(
      `Conditions discussed: ${detail.conditionsDiscussed.slice(0, 3).join(', ')}.`
    );
  }
  if (detail.medications?.length) {
    parts.push(
      `Medicines reviewed: ${detail.medications.slice(0, 3).join(', ')}.`
    );
  }
  if (detail.investigations?.length) {
    parts.push(
      `Investigations: ${detail.investigations.slice(0, 3).join(', ')}.`
    );
  }
  if (detail.followUp) {
    parts.push(detail.followUp);
  }
  if (!parts.length && detail.location) {
    parts.push(`Visit recorded at ${detail.location}.`);
  }
  return parts.length ? parts.join(' ') : null;
};

export const fetchMedications = async (patientUuid) => {
  if (!patientUuid) return [];
  const data = await apiGet(
    `/ws/rest/v1/order?patient=${patientUuid}&orderType=${DRUG_ORDER_TYPE}&v=full`
  );
  const results = data?.results || [];
  return results.map((med) => {
    const active = med.dateStopped == null;
    const dose =
      med.dose != null
        ? `${med.dose}${med.doseUnits?.display ? ` ${med.doseUnits.display}` : ''}`
        : null;
    const frequency = med.frequency?.display || null;
    const timing =
      med.dosingInstructions ||
      med.instructions ||
      (med.asNeeded ? 'As needed' : null);
    const quantity =
      med.quantity != null
        ? `${med.quantity}${med.quantityUnits?.display ? ` ${med.quantityUnits.display}` : ''}`
        : dose
          ? dose.includes('tablet')
            ? dose
            : null
          : null;

    return {
      uuid: med.uuid,
      display: med.display || med.drug?.display || 'Medication',
      drugName: med.drug?.display || med.concept?.display || med.display,
      dateActivated: med.dateActivated,
      dateStopped: med.dateStopped,
      active,
      status: active ? 'Active' : 'Past',
      dose: quantity || dose,
      frequency,
      timing,
      dosingInstructions: med.dosingInstructions || med.instructions || null,
      raw: med,
    };
  });
};

export const fetchLabReports = async (patientUuid) => {
  if (!patientUuid) return [];
  const data = await apiGet(
    `/ws/rest/v1/obs?orderType=${LAB_ORDER_TYPE}&patient=${patientUuid}&v=full`
  );
  const results = (data?.results || []).filter(
    (obs) => obs.order?.orderType?.display === 'Test Order'
  );

  return results.map((obs) => {
    let testName = 'Unknown Test';
    if (obs.concept?.display) testName = obs.concept.display;
    else if (obs.display) testName = obs.display;

    let rawValue = null;
    let testResult = 'N/A';
    if (obs.value != null) {
      if (typeof obs.value === 'object') {
        testResult = obs.value.display || obs.value.name || 'N/A';
        rawValue = null;
      } else {
        testResult = String(obs.value);
        const n = parseFloat(obs.value);
        rawValue = Number.isFinite(n) ? n : null;
      }
    }

    const units = obs.concept?.units || obs.units || '';

    return {
      id: obs.uuid,
      uuid: obs.uuid,
      testName,
      testResult,
      rawValue,
      units,
      obsDatetime: obs.obsDatetime,
      dated: obs.obsDatetime ? new Date(obs.obsDatetime) : null,
      raw: obs,
    };
  }).sort((a, b) => (b.dated?.getTime() || 0) - (a.dated?.getTime() || 0));
};

export const fetchConditions = async (patientUuid) => {
  if (!patientUuid) return [];
  const data = await apiGet(`/ws/fhir2/R4/Condition?patient=${patientUuid}`);
  const entries = data?.entry || [];
  return entries.map((entry) => {
    const resource = entry.resource || {};
    const name =
      resource.code?.text ||
      resource.code?.coding?.[0]?.display ||
      'Unknown condition';
    const statusCode =
      resource.clinicalStatus?.coding?.[0]?.code || 'unknown';
    const active = statusCode === 'active';
    return {
      id: resource.id,
      name,
      clinicalStatus: statusCode,
      active,
      status: active ? 'Active' : 'Previous',
      onsetDateTime: resource.onsetDateTime || null,
      recordedDate: resource.recordedDate || null,
      raw: resource,
    };
  });
};

export const formatShortDate = (dateInput) => {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatLongDate = (dateInput) => {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatTime = (dateInput) => {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatMonthYear = (dateInput) => {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

