import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
    number: number;
    name: string;
    shortName: string;
}

interface StepIndicatorProps {
    currentStep: number;
    includeTC: boolean;
}

export const StepIndicator = ({ currentStep, includeTC }: StepIndicatorProps) => {
    const allSteps: Step[] = [
        { number: 1, name: "Student Info", shortName: "Student" },
        { number: 2, name: "Parent/Guardian", shortName: "Parents" },
        { number: 3, name: "Addresses", shortName: "Address" },
        { number: 4, name: "TC", shortName: "TC" },
        { number: 5, name: "Documents", shortName: "Documents" },
        { number: 6, name: "Finish", shortName: "Finish" },
    ];

    // Filter steps based on whether TC is included
    const steps = includeTC ? allSteps : allSteps.filter(step => step.number !== 4);

    // Adjust step numbers if TC is not included
    const adjustedSteps = steps.map((step, index) => ({
        ...step,
        displayNumber: index + 1,
    }));

    // Find current display step - map the actual step number to display number
    let currentDisplayStep = currentStep;

    // If TC is not included and we're past step 3, adjust the display step
    if (!includeTC && currentStep > 3) {
        currentDisplayStep = currentStep - 1;
    }

    // Make sure we have a valid step
    const matchedStep = adjustedSteps.find(s => s.displayNumber === currentDisplayStep);
    if (!matchedStep) {
        currentDisplayStep = 1; // Fallback to first step
    }

    return (
        <div className="bg-card/95 backdrop-blur-sm border-b border-border shadow-sm mb-6">
            <div className="max-w-7xl mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                    {adjustedSteps.map((step, index) => (
                        <div key={step.number} className="flex items-center flex-1">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300",
                                        currentDisplayStep > step.displayNumber
                                            ? "bg-green-500 text-white scale-100"
                                            : currentDisplayStep === step.displayNumber
                                                ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                                                : "bg-muted text-muted-foreground scale-90"
                                    )}
                                >
                                    {currentDisplayStep > step.displayNumber ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        step.displayNumber
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-[10px] mt-1 font-medium whitespace-nowrap hidden sm:block",
                                        currentDisplayStep >= step.displayNumber ? "text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    {step.shortName}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < adjustedSteps.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-0.5 mx-1 sm:mx-2 transition-all duration-300",
                                        currentDisplayStep > step.displayNumber ? "bg-green-500" : "bg-muted"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
