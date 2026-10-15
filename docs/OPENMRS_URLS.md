# OpenMRS Server URLs and Endpoints

This document lists all relevant OpenMRS server URLs and endpoints for reference.

## Base URLs

### Production Server
- **Base URL:** `https://clinicalview.arogya.cloud`
- **SPA UI:** `https://clinicalview.arogya.cloud/openmrs/spa`
- **Protocol:** HTTPS
- **Domain:** `clinicalview.arogya.cloud`

## Web Interface URLs

### Single Page Application (SPA) Login
- **URL:** `https://clinicalview.arogya.cloud/openmrs/spa/login`
- **Purpose:** Web interface login page
- **Usage:** For manual login via web browser
- **Note:** This is not used by the REST API integration. Our application uses Basic Authentication with the REST API.

### SPA Application
- **Base URL:** `https://clinicalview.arogya.cloud/openmrs/spa/`
- **Purpose:** OpenMRS Single Page Application interface
- **Usage:** Web-based user interface for OpenMRS

## REST API Endpoints

### API Base URL
- **Base URL:** `https://clinicalview.arogya.cloud/openmrs/ws/rest/v1/`
- **Protocol:** HTTPS
- **Authentication:** Basic Authentication (username:password)

### Session Endpoints

#### Get Session
- **Endpoint:** `GET /openmrs/ws/rest/v1/session`
- **Purpose:** Authenticate and get session information
- **Authentication:** Basic Auth required
- **Response:** Session information including authenticated user

#### End Session
- **Endpoint:** `DELETE /openmrs/ws/rest/v1/session`
- **Purpose:** End current session
- **Authentication:** Basic Auth required

### Patient Endpoints

#### Search Patients
- **Endpoint:** `GET /openmrs/ws/rest/v1/patient?q={query}&limit={limit}&v=default`
- **Purpose:** Search for patients by query string
- **Parameters:**
  - `q`: Search query (email, name, identifier, etc.)
  - `limit`: Maximum number of results
  - `v`: Representation format (`default` for default representation)
- **Example:** `GET /openmrs/ws/rest/v1/patient?q=test@gmail.com&limit=1&v=default`

#### Get Patient by UUID
- **Endpoint:** `GET /openmrs/ws/rest/v1/patient/{uuid}?v=full`
- **Purpose:** Get complete patient information
- **Parameters:**
  - `uuid`: Patient UUID
  - `v`: Representation format (`full` for complete data)
- **Example:** `GET /openmrs/ws/rest/v1/patient/abc-123-def?v=full`

#### Create Patient
- **Endpoint:** `POST /openmrs/ws/rest/v1/patient`
- **Purpose:** Create a new patient
- **Authentication:** Basic Auth required
- **Body:** Patient data in JSON format

#### Update Patient
- **Endpoint:** `POST /openmrs/ws/rest/v1/patient/{uuid}`
- **Purpose:** Update patient information
- **Authentication:** Basic Auth required
- **Body:** Updated patient data in JSON format

## Authentication

### Basic Authentication
- **Method:** HTTP Basic Authentication
- **Format:** `Authorization: Basic <base64(username:password)>`
- **Username:** `admin`
- **Password:** `Arogya@#123`
- **Usage:** Required for all REST API endpoints

### Session Authentication
- **Method:** Session-based (via REST API session endpoint)
- **Usage:** Alternative to Basic Auth for web applications
- **Note:** Our integration uses Basic Auth for simplicity

## Proxy Server URLs (Development)

### Proxy Server
- **URL:** `http://localhost:3001`
- **Purpose:** Proxy server to handle CORS and authentication
- **Proxy Path:** `/api/openmrs`

### Health Check
- **Endpoint:** `GET http://localhost:3001/health`
- **Purpose:** Check if proxy server is running
- **Response:** Server status and configuration

### Proxied Endpoints
All OpenMRS REST API endpoints are accessible through the proxy:
- **Pattern:** `http://localhost:3001/api/openmrs/{rest_of_path}`
- **Example:** `http://localhost:3001/api/openmrs/ws/rest/v1/session`
- **Rewrites to:** `https://clinicalview.arogya.cloud/openmrs/ws/rest/v1/session`

## Request Examples

### Direct API Call (with Basic Auth)
```bash
curl -u admin:Arogya@#123 \
  https://clinicalview.arogya.cloud/openmrs/ws/rest/v1/session
```

### Through Proxy Server
```bash
curl http://localhost:3001/api/openmrs/ws/rest/v1/session
```

### Search Patient
```bash
curl -u admin:Arogya@#123 \
  "https://clinicalview.arogya.cloud/openmrs/ws/rest/v1/patient?q=test@gmail.com&limit=1&v=default"
```

### Get Patient Details
```bash
curl -u admin:Arogya@#123 \
  "https://clinicalview.arogya.cloud/openmrs/ws/rest/v1/patient/{uuid}?v=full"
```

## Important Notes

### SPA Login vs REST API

1. **SPA Login URL** (`/openmrs/spa/login`)
   - Used for web interface login
   - Requires browser-based authentication
   - Not used by REST API integration
   - May show application errors if accessed directly

2. **REST API Authentication**
   - Uses Basic Authentication
   - Programmatic access
   - No browser login required
   - Standard method for API integrations

### CORS Issues

- Direct browser requests to OpenMRS REST API may be blocked by CORS
- Use the proxy server for development
- For production, configure CORS on OpenMRS server or use backend proxy

### Security

- Never expose credentials in client-side code
- Use environment variables for credentials
- Use HTTPS in production
- Implement proper authentication and authorization

## References

- [OpenMRS REST API Documentation](https://rest.openmrs.org/)
- [OpenMRS REST Web Services Module](https://wiki.openmrs.org/display/docs/REST+Web+Services+Module)
- [OpenMRS Authentication](https://wiki.openmrs.org/display/docs/Authentication)

---

**Last Updated:** 2024
**Server:** clinicalview.arogya.cloud
**Version:** 1.0.0

