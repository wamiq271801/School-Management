import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdmissionContextType {
  admissionId: string | null;
  currentStep: number;
  includeTC: boolean;
  setAdmissionId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  setIncludeTC: (include: boolean) => void;
  resetAdmission: () => void;
}

const AdmissionContext = createContext<AdmissionContextType | undefined>(undefined);

export const useAdmission = () => {
  const context = useContext(AdmissionContext);
  if (!context) {
    throw new Error('useAdmission must be used within AdmissionProvider');
  }
  return context;
};

interface AdmissionProviderProps {
  children: ReactNode;
}

export const AdmissionProvider = ({ children }: AdmissionProviderProps) => {
  const [admissionId, setAdmissionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [includeTC, setIncludeTC] = useState(true);

  const resetAdmission = () => {
    setAdmissionId(null);
    setCurrentStep(1);
    setIncludeTC(true);
  };

  return (
    <AdmissionContext.Provider
      value={{
        admissionId,
        currentStep,
        includeTC,
        setAdmissionId,
        setCurrentStep,
        setIncludeTC,
        resetAdmission,
      }}
    >
      {children}
    </AdmissionContext.Provider>
  );
};
