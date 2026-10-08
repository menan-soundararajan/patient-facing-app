import medications from '../data/messages/medications.json';
import conditions from '../data/messages/conditions.json';
import labResults from '../data/messages/labResults.json';

const CLINICIAN_FALLBACK =
  'Please contact your clinician for personalised advice about this.';

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const stripDose = (value) =>
  normalize(value)
    .replace(/\b\d+(\.\d+)?\s*(mg|g|mcg|ml|%|iu|units?)\b/gi, '')
    .replace(/\b(co|tab|tablet|capsule|inj|injection|sirop|syrup|creme|cream)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Score how well an EMR name matches a library source name.
 * Higher is better; 0 = no match.
 */
const scoreMatch = (emrName, sourceName) => {
  const a = normalize(emrName);
  const b = normalize(sourceName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;

  const aCore = stripDose(emrName);
  const bCore = stripDose(sourceName);
  if (aCore && bCore && (aCore === bCore || aCore.includes(bCore) || bCore.includes(aCore))) {
    return 60;
  }

  const aTokens = new Set(aCore.split(' ').filter((t) => t.length > 2));
  const bTokens = bCore.split(' ').filter((t) => t.length > 2);
  if (!aTokens.size || !bTokens.length) return 0;
  const overlap = bTokens.filter((t) => aTokens.has(t)).length;
  if (overlap === bTokens.length) return 40;
  if (overlap > 0) return 20;
  return 0;
};

const findBestEntry = (emrName, entries, getSources) => {
  let best = null;
  let bestScore = 0;
  for (const entry of entries) {
    for (const source of getSources(entry)) {
      const score = scoreMatch(emrName, source);
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
  }
  return bestScore >= 20 ? best : null;
};

export const findMedicationMessages = (medicationDisplay) => {
  const entry = findBestEntry(medicationDisplay, medications, (e) => [
    e.genericName,
    ...(e.sourceNames || []),
  ]);
  if (!entry) {
    return {
      matched: false,
      genericName: null,
      messages: {
        'Why you take it': CLINICIAN_FALLBACK,
        'How to take it': null,
        'What to watch for': CLINICIAN_FALLBACK,
      },
    };
  }
  return {
    matched: true,
    genericName: entry.genericName,
    drugClass: entry.drugClass,
    messages: {
      'Why you take it':
        entry.messages['Why you take it'] || CLINICIAN_FALLBACK,
      'How to take it': entry.messages['How to take it'] || null,
      'What to watch for':
        entry.messages['What to watch for'] || CLINICIAN_FALLBACK,
    },
  };
};

export const findConditionMessages = (conditionName) => {
  const entry = findBestEntry(conditionName, conditions, (e) => [
    e.patientFacingName,
    ...(e.sourceNames || []),
  ]);
  if (!entry) {
    return {
      matched: false,
      patientFacingName: conditionName,
      clinicianContactOnly: true,
      messages: {
        'What it is': CLINICIAN_FALLBACK,
        'What you can do': CLINICIAN_FALLBACK,
        'When to get help': CLINICIAN_FALLBACK,
      },
    };
  }

  const mapMsg = (key) => {
    if (entry.clinicianContactOnly || !entry.messages[key]) {
      return CLINICIAN_FALLBACK;
    }
    return entry.messages[key];
  };

  return {
    matched: true,
    patientFacingName: entry.patientFacingName,
    clinicianContactOnly: entry.clinicianContactOnly,
    group: entry.group,
    messages: {
      'What it is': mapMsg('What it is'),
      'What you can do': mapMsg('What you can do'),
      'When to get help': mapMsg('When to get help'),
    },
  };
};

const hasDiabetes = (conditionNames = []) =>
  conditionNames.some((n) => /diabetes|diabetic|hba1c/i.test(n || ''));

const contextMatches = (context, { gender, age, conditionNames }) => {
  const ctx = (context || 'All').trim();
  if (!ctx || ctx === 'All') return true;
  if (/REVIEW before sending/i.test(ctx)) return false;

  const lower = ctx.toLowerCase();
  const diabetic = hasDiabetes(conditionNames);
  const g = (gender || '').toLowerCase();

  if (lower === 'male') return g === 'm' || g === 'male';
  if (lower === 'female') return g === 'f' || g === 'female';
  if (lower === 'known diabetes') return diabetic;
  if (lower === 'no diabetes diagnosis') return !diabetic;
  if (lower.includes('known diabetes') && lower.includes('under 40')) {
    return diabetic && age != null && age < 40;
  }
  if (lower.includes('known diabetes')) return diabetic;
  if (lower.includes('result coded')) return false;
  return true;
};

const valueInBand = (value, band) => {
  if (value == null || Number.isNaN(value)) return false;
  const { lower, upper } = band;
  const geLower = lower == null || value >= lower;
  const ltUpper = upper == null || value < upper;
  return geLower && ltUpper;
};

const isNormalBand = (bandName) =>
  /normal|reasonable control|below target|target/i.test(bandName || '');

const badgeVariantForBand = (bandName) => {
  const n = (bandName || '').toLowerCase();
  if (!n) return { label: 'Result', variant: 'neutral' };
  if (/normal|reasonable|below target|excellent/.test(n)) {
    return { label: bandName, variant: 'success' };
  }
  if (/critical|very high|kidney failure/.test(n)) {
    return { label: 'Needs attention', variant: 'danger' };
  }
  if (/high|raised|above|borderline|prediabetes|diabetes range|reduced|low|anaemia|micro|macro/.test(n)) {
    if (/above|high|raised/.test(n)) {
      return { label: /above|target/.test(n) ? 'Above target' : bandName, variant: 'danger' };
    }
    return { label: bandName, variant: 'danger' };
  }
  return { label: bandName, variant: 'neutral' };
};

/**
 * Match a lab observation to the message library.
 * @param {object} opts
 * @param {string} opts.testName - EMR concept display
 * @param {number|string} opts.value - numeric result when possible
 * @param {string} [opts.gender]
 * @param {number|null} [opts.age]
 * @param {string[]} [opts.conditionNames]
 */
export const findLabResultMessage = ({
  testName,
  value,
  gender,
  age,
  conditionNames = [],
}) => {
  const entry = findBestEntry(testName, labResults, (e) => [
    e.test,
    ...(e.sourceNames || []),
  ]);

  const numeric =
    typeof value === 'number'
      ? value
      : parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));

  if (!entry) {
    return {
      matched: false,
      test: testName,
      unit: null,
      band: null,
      message: null,
      badge: { label: 'Result', variant: 'neutral' },
      normalRange: null,
      numericValue: Number.isFinite(numeric) ? numeric : null,
    };
  }

  const patientCtx = { gender, age, conditionNames };
  const applicable = entry.bands.filter((b) =>
    contextMatches(b.context, patientCtx)
  );

  let matchedBand = null;
  if (Number.isFinite(numeric)) {
    matchedBand =
      applicable.find((b) => valueInBand(numeric, b)) ||
      entry.bands.find(
        (b) => contextMatches(b.context, patientCtx) && valueInBand(numeric, b)
      );
  }

  const normalBand =
    applicable.find((b) => isNormalBand(b.band)) ||
    entry.bands.find((b) => isNormalBand(b.band));

  const badge = badgeVariantForBand(matchedBand?.band);

  return {
    matched: true,
    test: entry.test,
    unit: entry.unit,
    band: matchedBand?.band || null,
    message: matchedBand?.message || null,
    badge,
    normalRange: normalBand
      ? { lower: normalBand.lower, upper: normalBand.upper }
      : null,
    numericValue: Number.isFinite(numeric) ? numeric : null,
    matchedBand,
  };
};

export const CLINICIAN_CONTACT_MESSAGE = CLINICIAN_FALLBACK;
