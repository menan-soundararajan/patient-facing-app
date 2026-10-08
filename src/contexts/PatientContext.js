import React, { createContext, useContext } from 'react';

const PatientContext = createContext({
  patientData: null,
  user: null,
  loading: false,
  error: null,
});

export const PatientProvider = ({ value, children }) => (
  <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
);

export const usePatient = () => useContext(PatientContext);

export default PatientContext;
