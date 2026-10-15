// Vercel Serverless Function to proxy OpenMRS API requests
// Using a single file that handles all routes via query parameters

export default async function handler(req, res) {
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Only allow GET requests for now
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // OpenMRS server configuration
  // SPA UI: https://clinicalview.arogya.cloud/openmrs/spa
  // REST API base host (paths are under /openmrs/...)
  const OPENMRS_BASE_URL = 'https://clinicalview.arogya.cloud';
  const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
  const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Arogya@#123';

  // Get the path from query parameter (set by vercel.json rewrite)
  // The rewrite converts /api/openmrs/ws/rest/v1/session to /api/openmrs?path=ws/rest/v1/session
  let apiPath = '';
  let queryString = '';
  
  // Get path from query parameter (set by Vercel rewrite rule)
  if (req.query.path) {
    // path can be a string or array depending on how Vercel parses it
    if (Array.isArray(req.query.path)) {
      apiPath = req.query.path.join('/');
    } else {
      apiPath = req.query.path;
    }
    
    // Get all other query parameters (patient, orderType, etc.)
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      if (key !== 'path') {
        const value = req.query[key];
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    });
    queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  } else if (req.url) {
    // Fallback: extract from URL directly if rewrite didn't work
    const urlPath = req.url.replace(/^\/api\/openmrs\/?/, '').split('?')[0];
    apiPath = urlPath || '';
    
    // Extract query string from original URL
    const urlMatch = req.url.match(/\?(.+)$/);
    if (urlMatch) {
      queryString = `?${urlMatch[1]}`;
    }
  }

  // If no path, return error
  if (!apiPath) {
    return res.status(400).json({ 
      error: 'Invalid request',
      message: 'No API path provided. Use /api/openmrs?path=ws/rest/v1/session or /api/openmrs/ws/rest/v1/session',
      url: req.url,
      query: req.query 
    });
  }

  // Construct the full OpenMRS URL
  const openmrsUrl = `${OPENMRS_BASE_URL}/openmrs/${apiPath}${queryString}`;

  // Create Basic Auth header
  const credentials = Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64');
  const authHeader = `Basic ${credentials}`;

  try {
    console.log(`[Proxy] ${req.method} ${req.url}`);
    console.log(`[Proxy] Extracted path: ${apiPath}`);
    console.log(`[Proxy] Target URL: ${openmrsUrl}`);

    // Forward the request to OpenMRS
    const response = await fetch(openmrsUrl, {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    console.log(`[Proxy] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(data);
      } catch (e) {
        errorData = { error: data };
      }
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return res.status(response.status).json({
        error: 'OpenMRS API error',
        status: response.status,
        statusText: response.statusText,
        details: errorData,
        requestedUrl: openmrsUrl
      });
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status).send(data);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return res.status(response.status).json(jsonData);
  } catch (error) {
    console.error('Proxy error:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      url: openmrsUrl,
      path: apiPath
    });
  }
}

