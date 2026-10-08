import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Login from './Login';
import MenuBar from './components/MenuBar';
import ProfilePage from './components/ProfilePage';
import LoadingOverlay from './components/LoadingOverlay';
import AppShell from './components/layout/AppShell';
import { useOpenMRSLoading } from './contexts/OpenMRSLoadingContext';
import { PatientProvider } from './contexts/PatientContext';
import {
  searchPatientByEmail,
  getPatientDisplayName as resolvePatientName,
} from './services/openmrsService';
import HomePage from './pages/HomePage';
import VisitsPage from './pages/VisitsPage';
import VisitDetailPage from './pages/VisitDetailPage';
import MedsPage from './pages/MedsPage';
import MedDetailPage from './pages/MedDetailPage';
import LabsPage from './pages/LabsPage';
import LabDetailPage from './pages/LabDetailPage';
import ConditionsPage from './pages/ConditionsPage';
import ConditionDetailPage from './pages/ConditionDetailPage';
import './App.css';
import './styles/mobileHealth.css';

function ProfileRoute({ patientData, loading, error }) {
  const navigate = useNavigate();
  return (
    <ProfilePage
      patientData={patientData}
      loading={loading}
      error={error}
      onBack={() => navigate('/')}
    />
  );
}

function AuthenticatedApp({
  user,
  patientData,
  loading,
  error,
  onLogout,
  openMRSLoading,
  openMRSError,
  clearError,
}) {
  const navigate = useNavigate();

  const getPatientDisplayName = () => {
    const fromOpenMrs = resolvePatientName(patientData);
    return fromOpenMrs || user?.name || 'User';
  };

  const patientContextValue = {
    patientData,
    user,
    loading,
    error,
  };

  return (
    <PatientProvider value={patientContextValue}>
      <LoadingOverlay
        isLoading={openMRSLoading}
        error={openMRSError}
        onDismissError={clearError}
      />
      <Routes>
        <Route
          element={
            <AppShell
              topBar={
                <MenuBar
                  userName={getPatientDisplayName()}
                  onLogout={onLogout}
                  onProfile={() => navigate('/profile')}
                />
              }
            />
          }
        >
          <Route
            path="/"
            element={
              !patientData && error ? (
                <div className="mh-error-banner">
                  {error === 'User not registered' && (
                    <>
                      <h5>User not registered</h5>
                      <p className="mh-muted mb-0">
                        No patient record found with the provided email address.
                      </p>
                    </>
                  )}
                  {error === 'Failed to fetch OpenMRS patient data' && (
                    <>
                      <h5>Failed to fetch OpenMRS patient data</h5>
                      <p className="mh-muted mb-0">
                        Unable to retrieve patient information. Please try again later.
                      </p>
                    </>
                  )}
                  {(error.includes('Please sign in') ||
                    error.includes('Email not available')) && (
                    <>
                      <h5>Please sign in to view patient details</h5>
                      <p className="mh-muted mb-0">
                        Please sign in with your Google account to access your patient
                        information.
                      </p>
                    </>
                  )}
                  {!['User not registered', 'Failed to fetch OpenMRS patient data'].includes(
                    error
                  ) &&
                    !error.includes('Please sign in') &&
                    !error.includes('Email not available') && (
                      <p className="mb-0">{error}</p>
                    )}
                </div>
              ) : patientData ? (
                <HomePage />
              ) : loading ? (
                <div className="mh-loading">Loading patient data…</div>
              ) : (
                <div className="mh-empty">No patient data available.</div>
              )
            }
          />
          <Route path="/visits" element={<VisitsPage />} />
          <Route path="/visits/:uuid" element={<VisitDetailPage />} />
          <Route path="/meds" element={<MedsPage />} />
          <Route path="/meds/:uuid" element={<MedDetailPage />} />
          <Route path="/labs" element={<LabsPage />} />
          <Route path="/labs/:id" element={<LabDetailPage />} />
          <Route path="/conditions" element={<ConditionsPage />} />
          <Route path="/conditions/:id" element={<ConditionDetailPage />} />
          <Route
            path="/profile"
            element={
              <ProfileRoute
                patientData={patientData}
                loading={loading}
                error={error}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </PatientProvider>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    isLoading: openMRSLoading,
    error: openMRSError,
    clearError,
  } = useOpenMRSLoading();

  const fetchPatientData = async (email) => {
    if (!email || typeof email !== 'string' || !email.trim()) {
      setError('Invalid email address');
      setLoading(false);
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPatientData(null);

    try {
      const result = await searchPatientByEmail(sanitizedEmail);

      if (result.success && result.patient) {
        setPatientData(result.patient);
      } else if (result.error === 'User not registered') {
        setError('User not registered');
      } else {
        setError(result.error || 'Patient not found');
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to fetch OpenMRS patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      setUser(decoded);
      console.log('Login successful');

      const userEmail = decoded.email;
      if (!userEmail) {
        console.error('No email found in user token');
        setError('Please sign in to view patient details. Email not available.');
        return;
      }

      await fetchPatientData(userEmail);
    } catch (err) {
      console.error('Error decoding token:', err);
      setError('Failed to process login');
    }
  };

  const handleLoginError = () => {
    console.error('Login failed');
    setError('Google login failed');
  };

  const handleLogout = () => {
    setUser(null);
    setPatientData(null);
    setError(null);
    setLoading(false);
  };

  if (!user) {
    return <Login onSuccess={handleLoginSuccess} onError={handleLoginError} />;
  }

  return (
    <BrowserRouter>
      <AuthenticatedApp
        user={user}
        patientData={patientData}
        loading={loading}
        error={error}
        onLogout={handleLogout}
        openMRSLoading={openMRSLoading}
        openMRSError={openMRSError}
        clearError={clearError}
      />
    </BrowserRouter>
  );
}

export default App;
