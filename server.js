const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for React app
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// OpenMRS server configuration
// SPA UI: https://clinicalview.arogya.cloud/openmrs/spa
// REST API: https://clinicalview.arogya.cloud/openmrs/ws/rest/v1/
const OPENMRS_BASE_URL = 'https://clinicalview.arogya.cloud';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Arogya@#123';

// Create basic auth header
const getAuthHeader = () => {
  const credentials = Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
};

// Proxy middleware for OpenMRS API
const openmrsProxy = createProxyMiddleware({
  target: OPENMRS_BASE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/openmrs': '/openmrs', // Replace /api/openmrs with /openmrs
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add Basic Authentication header
    proxyReq.setHeader('Authorization', getAuthHeader());
    
    // Set Content-Type if not already set
    if (!proxyReq.getHeader('Content-Type')) {
      proxyReq.setHeader('Content-Type', 'application/json');
    }
    
    // Log the proxied request
    console.log(`[Proxy] ${req.method} ${req.url} -> ${OPENMRS_BASE_URL}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    
    console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Proxy error',
        message: err.message
      });
    }
  },
  logLevel: 'info'
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Proxy server is running',
    openmrs_url: OPENMRS_BASE_URL,
    proxy_path: '/api/openmrs'
  });
});

// Handle OPTIONS requests for CORS preflight
app.options('/api/openmrs/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Proxy all /api/openmrs requests to OpenMRS
app.use('/api/openmrs', openmrsProxy);

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Proxying OpenMRS requests to ${OPENMRS_BASE_URL}`);
  console.log(`React app should connect to http://localhost:${PORT}/api/openmrs`);
});

