# React App with Google OAuth and OpenMRS Integration

This project is a React application that integrates Google OAuth authentication with OpenMRS patient data fetching. After a successful Google login, the application automatically authenticates with OpenMRS and displays patient information using a hardcoded test email (`test@gmail.com`) for patient queries.

## Features

- ✅ Google OAuth 2.0 authentication
- ✅ OpenMRS REST API integration
- ✅ Automatic patient data fetching after login
- ✅ Beautiful, responsive UI with Tailwind CSS
- ✅ Patient information display in card format
- ✅ Error handling and loading states
- ✅ Proxy server for CORS handling

## ⚠️ Important: Proxy Server Required

**The proxy server must be running for the application to work.** The React app connects to OpenMRS through a proxy server to avoid CORS issues.

**Quick Start:**
```bash
npm run dev
```
This starts both the proxy server and React app automatically.

**Having issues?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common problems and solutions.

## Documentation

For detailed setup and configuration instructions, see the [Documentation](./docs/) folder:

- **[Documentation Overview](./docs/README.md)** - Complete documentation index
- **[Quick Start Guide](./docs/QUICK_START.md)** - Quick setup guide
- **[Google OAuth Setup](./docs/GOOGLE_OAUTH_SETUP.md)** - Detailed Google OAuth configuration guide
- **[OpenMRS Integration](./docs/OPENMRS_INTEGRATION.md)** - OpenMRS API integration documentation
- **[CORS Proxy Setup](./docs/CORS_PROXY_SETUP.md)** - Proxy server setup to resolve CORS issues
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google OAuth

1. Create a `.env` file in the root directory
2. Add your Google Client ID:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```
3. See [Google OAuth Setup Guide](./docs/GOOGLE_OAUTH_SETUP.md) for detailed instructions

### 3. Configure OpenMRS

OpenMRS configuration is set in `src/services/openmrsService.js`. Default settings:
- Base URL / SPA: `https://clinicalview.arogya.cloud/openmrs/spa`
- REST host: `https://clinicalview.arogya.cloud`
- Username: `admin`
- Password: `Arogya@#123`
- Patient Search Email: `test@gmail.com` (configured in `src/App.js`)

**Note:** The application uses a hardcoded test email (`test@gmail.com`) to search for patients in OpenMRS, regardless of which Google account is used for login.

See [OpenMRS Integration Guide](./docs/OPENMRS_INTEGRATION.md) for configuration options.

### 4. Start Development Server

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

**Note:** See [CORS Proxy Setup Guide](./docs/CORS_PROXY_SETUP.md) for detailed information about the proxy server and troubleshooting CORS issues.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the React app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

**Note:** You also need to run the proxy server (`npm run server`) to avoid CORS errors.

### `npm run server`

Runs the proxy server on port 3001 to handle OpenMRS API requests and resolve CORS issues.

### `npm run dev`

Runs both the proxy server and React app simultaneously (recommended for development).

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
