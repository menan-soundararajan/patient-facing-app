import React, { useState, useEffect, useRef } from 'react';
import { openmrsFetch } from '../utils/openmrsFetch';

const HealthAdvisoryCard = ({ patientUuid }) => {
  const [advisoryMessage, setAdvisoryMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shouldShow, setShouldShow] = useState(false);
  const hasFetchedRef = useRef(false);
  const currentPatientUuidRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate calls - only fetch if patientUuid changed or hasn't been fetched yet
    if (!patientUuid) {
      setShouldShow(false);
      setAdvisoryMessage(null);
      hasFetchedRef.current = false;
      currentPatientUuidRef.current = null;
      return;
    }

    // If same patientUuid and already fetched, don't fetch again
    if (hasFetchedRef.current && currentPatientUuidRef.current === patientUuid) {
      return;
    }

    // Mark as fetching for this patientUuid
    hasFetchedRef.current = true;
    currentPatientUuidRef.current = patientUuid;

    const checkConditionsAndGenerateAdvisory = async () => {
      setLoading(true);
      setError(null);
      setShouldShow(false);
      setAdvisoryMessage(null);

      try {
        console.log('[HealthAdvisory] Fetching data for patient:', patientUuid);
        
        // Fetch diagnosis, medications, patient query response, and observations
        const [diagnosisData, medicationData, patientQueryResponse, observationsData] = await Promise.all([
          fetchDiagnosis(patientUuid),
          fetchMedications(patientUuid),
          fetchPatientQueryResponse(patientUuid),
          fetchObservations(patientUuid)
        ]);

        // Check conditions: Diabetes/Hypertension (Active) AND Aspirin (Active)
        const hasDiabetesOrHypertension = checkDiabetesOrHypertensionCondition(diagnosisData);
        const hasAspirin = checkAspirinCondition(medicationData);

        console.log('[HealthAdvisory] Conditions check:', {
          hasDiabetesOrHypertension,
          hasAspirin,
          patientUuid
        });

        // Only show card if BOTH conditions are true
        if (hasDiabetesOrHypertension && hasAspirin) {
          setShouldShow(true);
          console.log('[HealthAdvisory] Conditions met, calling LLM...');
          
          const { generateHealthAdvisory } = await import('../services/llmService');
          // Pass minimal data to LLM: patient query, medications, and filtered observations
          const message = await generateHealthAdvisory(
            patientQueryResponse,
            medicationData,
            observationsData
          );
          
          console.log('[HealthAdvisory] LLM response received:', message ? 'Yes' : 'No', message?.substring(0, 50));
          setAdvisoryMessage(message);
        } else {
          setShouldShow(false);
          console.log('[HealthAdvisory] Conditions not met, hiding card');
        }
      } catch (err) {
        console.error('[HealthAdvisory] Error checking conditions:', {
          message: err.message,
          stack: err.stack,
          patientUuid: patientUuid
        });
        setError(err.message || 'Failed to check health conditions');
        setShouldShow(false);
      } finally {
        setLoading(false);
      }
    };

    checkConditionsAndGenerateAdvisory();
  }, [patientUuid]);

  const fetchDiagnosis = async (patientUuid) => {
    const isVercel = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
    const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false';
    const PROXY_URL = isVercel
      ? '/api/openmrs'
      : (process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/openmrs');
    const OPENMRS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://clinicalview.arogya.cloud';

    const url = USE_PROXY
      ? `${OPENMRS_BASE_URL}/ws/fhir2/R4/Condition?patient=${patientUuid}`
      : `${OPENMRS_BASE_URL}/openmrs/ws/fhir2/R4/Condition?patient=${patientUuid}`;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (!USE_PROXY) {
      const credentials = btoa('admin:Arogya@#123');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const result = await openmrsFetch(url, {
      method: 'GET',
      headers: headers,
    });

    return result.data;
  };

  const fetchMedications = async (patientUuid) => {
    const isVercel = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
    const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false';
    const PROXY_URL = isVercel
      ? '/api/openmrs'
      : (process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/openmrs');
    const OPENMRS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://clinicalview.arogya.cloud';

    const ORDER_TYPE_UUID = '131168f4-15f5-102d-96e4-000c29c2a5d7';
    const url = USE_PROXY
      ? `${OPENMRS_BASE_URL}/ws/rest/v1/order?patient=${patientUuid}&orderType=${ORDER_TYPE_UUID}&v=full`
      : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/order?patient=${patientUuid}&orderType=${ORDER_TYPE_UUID}&v=full`;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (!USE_PROXY) {
      const credentials = btoa('admin:Arogya@#123');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const result = await openmrsFetch(url, {
      method: 'GET',
      headers: headers,
    });

    return result.data;
  };

  const fetchPatientQueryResponse = async (patientUuid) => {
    const isVercel = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
    const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false';
    const PROXY_URL = isVercel
      ? '/api/openmrs'
      : (process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/openmrs');
    const OPENMRS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://clinicalview.arogya.cloud';

    const url = USE_PROXY
      ? `${OPENMRS_BASE_URL}/ws/rest/v1/patient/${patientUuid}?v=full`
      : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/patient/${patientUuid}?v=full`;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (!USE_PROXY) {
      const credentials = btoa('admin:Arogya@#123');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const result = await openmrsFetch(url, {
      method: 'GET',
      headers: headers,
    });

    return result.data;
  };

  const fetchObservations = async (patientUuid) => {
    const isVercel = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
    const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false';
    const PROXY_URL = isVercel
      ? '/api/openmrs'
      : (process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/openmrs');
    const OPENMRS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://clinicalview.arogya.cloud';

    const url = USE_PROXY
      ? `${OPENMRS_BASE_URL}/ws/rest/v1/obs?patient=${patientUuid}&v=full`
      : `${OPENMRS_BASE_URL}/openmrs/ws/rest/v1/obs?patient=${patientUuid}&v=full`;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (!USE_PROXY) {
      const credentials = btoa('admin:Arogya@#123');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const result = await openmrsFetch(url, {
      method: 'GET',
      headers: headers,
    });

    return result.data;
  };

  // Check if diagnosis includes Diabetes or Hypertension with Active status
  const checkDiabetesOrHypertensionCondition = (diagnosisData) => {
    if (!diagnosisData || !diagnosisData.entry || diagnosisData.entry.length === 0) {
      return false;
    }

    for (const entry of diagnosisData.entry) {
      const condition = entry.resource;

      // Extract diagnostic name
      let diagnosticName = '';
      if (condition.code && condition.code.text) {
        diagnosticName = condition.code.text;
      } else if (condition.code && condition.code.coding && condition.code.coding.length > 0) {
        diagnosticName = condition.code.coding[0].display || condition.code.coding[0].code || '';
      } else if (condition.display) {
        diagnosticName = condition.display;
      }

      // Extract status code
      let statusCode = null;
      if (condition.clinicalStatus && condition.clinicalStatus.coding && condition.clinicalStatus.coding.length > 0) {
        statusCode = condition.clinicalStatus.coding[0].code || '';
      } else if (condition.clinicalStatus && condition.clinicalStatus.text) {
        statusCode = condition.clinicalStatus.text;
      }

      // Check if status is Active (statusBadge === "Active")
      let isActive = false;
      if (statusCode) {
        const statusLower = statusCode.toLowerCase();
        isActive = statusLower === 'active';
      }

      // Check if diagnostic name includes "Diabetes" or "Hypertension"
      const diagnosticNameLower = diagnosticName ? diagnosticName.toLowerCase() : '';
      const isDiabetesOrHypertension = 
        diagnosticNameLower.includes('diabetes') || 
        diagnosticNameLower.includes('hypertension');

      if (isDiabetesOrHypertension && isActive) {
        return true;
      }
    }

    return false;
  };

  // Check if medication includes Aspirin with Active status
  const checkAspirinCondition = (medicationData) => {
    if (!medicationData || !medicationData.results || medicationData.results.length === 0) {
      return false;
    }

    for (const medication of medicationData.results) {
      const displayName = medication.display || '';
      const isAspirin = displayName.toLowerCase().includes('aspirin');
      
      // Check if statusInfo === "Active" (dateStopped === null means Active)
      const statusInfo = medication.dateStopped === null ? 'Active' : 'Past';
      const isActive = statusInfo === 'Active';

      if (isAspirin && isActive) {
        return true;
      }
    }

    return false;
  };

  const formatMessage = (message) => {
    if (!message) return '';

    let formatted = message;

    // Process headings and formatting first
    formatted = formatted
      .replace(/^### (.*$)/gim, '<div class="fw-bold mt-2 mb-1" style="font-size: 0.9rem;">$1</div>')
      .replace(/^## (.*$)/gim, '<div class="fw-bold mt-2 mb-1" style="font-size: 0.95rem;">$1</div>')
      .replace(/^# (.*$)/gim, '<div class="fw-bold mt-2 mb-1" style="font-size: 0.95rem;">$1</div>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Process Lifestyle section with special formatting
    formatted = formatted.replace(
      /(## 🌱 Life style[^<]*<\/div>)([\s\S]*?)(?=##|$)/gi,
      (match, heading, content) => {
        // Clean up the content - remove extra blank lines first
        let processedContent = content
          .replace(/\n{3,}/g, '\n') // Replace 3+ newlines with single newline
          .replace(/^\s+|\s+$/gm, '') // Trim each line
          .trim();

        // Process numbered list items (1., 2., 3., etc.)
        // Pattern: number. **Bold Title:** description text
        // Handle multi-line descriptions that continue until next number
        processedContent = processedContent.replace(/(\d+\.\s+)(\*\*([^*]+)\*\*:?\s*)([^\d]*?)(?=\d+\.|$)/gs, (itemMatch, number, boldPart, titleText, description) => {
          const title = titleText.trim();
          // Clean description - remove extra newlines, keep single spaces
          const desc = description
            .replace(/\n+/g, ' ') // Replace newlines with space
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
          
          // Format: Bold title on one line, description on next line (single line break)
          return `<div class="mb-2" style="line-height: 1.5;"><strong>${title}</strong><br>${desc}</div>`;
        });

        // If numbered items weren't processed, try alternative patterns
        if (!processedContent.includes('<div class="mb-2">')) {
          // Try pattern: **Title:** description (without numbers)
          processedContent = processedContent.replace(/(\*\*([^*]+)\*\*:?\s*)([^\*]*?)(?=\*\*|$)/gs, (itemMatch, boldPart, titleText, description) => {
            const title = titleText.trim();
            const desc = description
              .replace(/\n+/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (desc) {
              return `<div class="mb-2" style="line-height: 1.5;"><strong>${title}</strong><br>${desc}</div>`;
            } else {
              return `<div class="mb-2"><strong>${title}</strong></div>`;
            }
          });
        }

        // Final cleanup: remove any remaining excessive spacing
        processedContent = processedContent
          .replace(/\n{2,}/g, '') // Remove remaining double newlines
          .replace(/(<\/div>)\s*(<div)/g, '$1$2'); // Remove spaces between divs
        
        return heading + processedContent;
      }
    );

    // Process numbered lists for other sections (not lifestyle)
    formatted = formatted.replace(/((?:^|\n)\d+\.\s+[^\n]+(?:\n\d+\.\s+[^\n]+)*)/gm, (match) => {
      // Only process if not already processed by lifestyle section
      if (!match.includes('## 🌱')) {
        const items = [];
        const lines = match.trim().split('\n');
        
        for (const line of lines) {
          const itemMatch = line.match(/^\d+\.\s+(.+)$/);
          if (itemMatch) {
            let content = itemMatch[1].trim();
            content = content.replace(/^\d+\.\s*/, '');
            items.push(content);
          }
        }
        
        if (items.length > 0) {
          return '<ul class="ps-3 mb-2">'  +
          items.map(item => `<li class="mb-1">${item}</li>`).join('') + 
            '</ul>';
        }
      }
      return match;
    });

    // Remove all <br> tags immediately after headings (now divs)
    formatted = formatted.replace(/(<\/div>)\s*<br>\s*/gi, '$1');
    // Remove multiple consecutive <br> tags
    formatted = formatted.replace(/(<br>\s*){2,}/gi, '<br>');
    // Remove blank lines between sections
    formatted = formatted.replace(/(<\/div>)\s*\n\s*(<div)/gi, '$1$2');
    
    // Convert remaining newlines to <br>, but preserve list structure
    formatted = formatted.replace(/\n/g, (match, offset, string) => {
      const before = string.substring(0, offset);
      const ulOpenCount = (before.match(/<ul[^>]*>/gi) || []).length;
      const ulCloseCount = (before.match(/<\/ul>/gi) || []).length;
      const olOpenCount = (before.match(/<ol[^>]*>/gi) || []).length;
      const olCloseCount = (before.match(/<\/ol>/gi) || []).length;
      const divOpenCount = (before.match(/<div[^>]*>/gi) || []).length;
      const divCloseCount = (before.match(/<\/div>/gi) || []).length;
      
      if ((ulOpenCount > ulCloseCount) || (olOpenCount > olCloseCount) || (divOpenCount > divCloseCount)) {
        return '';
      }
      return '<br>';
    });

    // Final cleanup: remove any remaining excessive spacing
    formatted = formatted.replace(/(<br>\s*){3,}/gi, '<br><br>');

    return formatted;
  };

  // Only render if conditions are met
  if (!shouldShow && !loading) {
    return null;
  }

  return (
    <div className="col-12">
      <div className="card shadow-sm border-primary">
        <div className="card-body p-0">
          <div className="bg-primary bg-opacity-10 px-3 py-2">
            <div className="d-flex align-items-center">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="text-primary me-2"
              >
                <path d="M8 15.5c-1.5 0-3-1.69-3-3.5 0-1.41 1.72-2.83 3-4.5 1.28 1.67 3 3.09 3 4.5 0 1.81-1.5 3.5-3 3.5zm0-13C6.5 2.5 5 4.19 5 6c0 1.41 1.72 2.83 3 4.5 1.28-1.67 3-3.09 3-4.5 0-1.81-1.5-3.5-3-3.5z" />
              </svg>
              <h6 className="card-title mb-0 fw-bold text-primary">Health Advisory</h6>
            </div>
          </div>
          <hr className="my-0" />
          <div className="p-2">
            {loading && (
              <div className="text-center py-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <small className="d-block mt-2 text-muted">Generating health advisory...</small>
              </div>
            )}
            {error && (
              <div className="alert alert-warning py-2 mb-0" role="alert">
                <small className="mb-0">Unable to generate health advisory: {error}</small>
              </div>
            )}
            {advisoryMessage && !loading && (
              <div
                className="health-advisory-content"
                dangerouslySetInnerHTML={{ __html: formatMessage(advisoryMessage) }}
                style={{
                  lineHeight: '1.5',
                  color: '#333',
                  fontSize: '0.85rem'
                }}
              />
            )}
            {!advisoryMessage && !loading && !error && shouldShow && (
              <div className="text-muted small">
                No advisory message available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthAdvisoryCard;

