# Quick Start Guide

This guide provides a quick overview of the setup process. For detailed information, see the full documentation files.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Console account
- OpenMRS server access
- Modern web browser

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google Identity Services API**
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth client ID**
6. Choose **Web application**
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (for production)
8. Copy your **Client ID**

### 3. Create Environment File

Create a `.env` file in the root directory:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 4. Configure OpenMRS (Optional)

By default, the app uses:
- Base URL / SPA: `https://clinicalview.arogya.cloud/openmrs/spa`
- REST host: `https://clinicalview.arogya.cloud`
- Username: `admin`
- Password: `Arogya@#123`
- Patient Search Email: `test@gmail.com` (hardcoded in `src/App.js`)

**Note:** The application uses a hardcoded test email (`test@gmail.com`) to search for patients in OpenMRS, regardless of which Google account is used for login.

To change these, edit `src/services/openmrsService.js` for server settings or `src/App.js` for the test email.

### 5. Start Development Server

**Important:** Due to CORS restrictions, you need to run a proxy server to access the OpenMRS API.

#### Option A: Run Both Servers Together (Recommended)

```bash
npm run dev
```

This will start:
- Proxy server on `http://localhost:3001`
- React app on `http://localhost:3000`

#### Option B: Run Servers Separately

Terminal 1 - Proxy Server:
```bash
npm run server
```

Terminal 2 - React App:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

**Note:** See [CORS Proxy Setup Guide](./CORS_PROXY_SETUP.md) for detailed information.

## Testing the Application

### 1. Login with Google

1. Click "Sign in with Google" button
2. Select your Google account
3. Grant permissions
4. Wait for authentication to complete

### 2. Verify OpenMRS Integration

1. Check browser console for "OpenMRS login successful"
2. Verify patient search is executed (searches for `test@gmail.com`)
3. Check if patient data is displayed
4. Note: Patient search uses `test@gmail.com`, not your Google login email

### 3. Verify Patient Data

1. Patient card should display:
   - Name
   - Gender
   - Age
   - Email
   - UUID

## Troubleshooting

### CORS Errors

If you encounter CORS errors:
1. **Make sure the proxy server is running:**
   ```bash
   npm run server
   ```
2. Verify proxy server is accessible:
   ```bash
   curl http://localhost:3001/health
   ```
3. Check that React app is using the proxy (default behavior)
4. See [CORS Proxy Setup Guide](./CORS_PROXY_SETUP.md) for detailed troubleshooting

### Authentication Failures

If authentication fails:
1. Verify Google Client ID is correct
2. Check authorized JavaScript origins
3. Verify OpenMRS credentials are correct

### Patient Not Found

If patient is not found:
1. Verify patient with email `test@gmail.com` exists in OpenMRS
2. Check if email attribute is set
3. Verify email matches exactly (`test@gmail.com`)
4. Note: The app always searches for `test@gmail.com`, not your Google login email

## Next Steps

- Read [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md) for detailed configuration
- Read [OpenMRS Integration Guide](./OPENMRS_INTEGRATION.md) for API details
- Check [Documentation Overview](./README.md) for complete documentation index

## Support

For issues or questions:
1. Check the documentation files
2. Review browser console for errors
3. Verify configuration settings
4. Test API endpoints directly

---

**Last Updated:** 2024

