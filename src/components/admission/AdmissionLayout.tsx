import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { StepIndicator } from "./StepIndicator";
import { useAdmission } from "@/contexts/AdmissionContext";

interface AdmissionLayoutProps {
  children: ReactNode;
}

const stepMap: { [key: string]: number } = {
  '/admission/student-info': 1,
  '/admission/parent-guardian-info': 2,
  '/admission/addresses': 3,
  '/admission/transfer-certificate': 4,
  '/admission/additional-documents': 5, // Will be adjusted based on includeTC
  '/admission/finish': 6, // Will be adjusted based on includeTC
};

export const AdmissionLayout = ({ children }: AdmissionLayoutProps) => {
  const location = useLocation();
  const { includeTC, setCurrentStep } = useAdmission();
  
  // Determine current step based on route
  useEffect(() => {
    const baseStep = stepMap[location.pathname];
    if (baseStep) {
      setCurrentStep(baseStep);
    }
  }, [location.pathname, setCurrentStep]);

  // Get current step for display - use the base step number, StepIndicator will handle display
  const getCurrentStep = () => {
    const baseStep = stepMap[location.pathname];
    return baseStep || 1;
  };

  const currentStep = getCurrentStep();

  return (
    <>
      <StepIndicator currentStep={currentStep} includeTC={includeTC} />
      {children}
    </>
  );
};
