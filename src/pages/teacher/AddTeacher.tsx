import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherProgressStepper } from "@/components/teacher/TeacherProgressStepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createTeacher, Teacher } from "@/lib/firestore";
import TeacherStep1 from "./TeacherStep1";
import TeacherStep2 from "./TeacherStep2";
import TeacherStep3 from "./TeacherStep3";
import TeacherStep4 from "./TeacherStep4";
import TeacherStep5 from "./TeacherStep5";
import TeacherStep6 from "./TeacherStep6";

const AddTeacher = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [teacherData, setTeacherData] = useState<Partial<Teacher>>({
    personal: {
      firstName: "",
      lastName: "",
      gender: "Male",
      dateOfBirth: "",
      nationality: "Indian",
      category: "General",
    } as any,
    contact: {
      mobile: "",
      residentialAddress: {
        line1: "",
        city: "",
        state: "",
        pincode: "",
      },
    } as any,
    qualification: {
      highestQualification: "",
      yearsOfExperience: 0,
      subjectExpertise: [],
    } as any,
    employment: {
      dateOfJoining: "",
      department: "",
      designation: "",
      employeeType: "Permanent",
      assignedSubjects: [],
      salary: {
        basic: 0,
        hra: 0,
        allowances: 0,
        deductions: 0,
        netSalary: 0,
      },
    } as any,
    documents: {},
    status: "Active",
  });

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const teacherId = await createTeacher(teacherData);
      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
      navigate(`/teachers/${teacherId}`);
    } catch (error) {
      console.error("Error adding teacher:", error);
      toast({
        title: "Error",
        description: "Failed to add teacher",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateTeacherData = (updates: Partial<Teacher>) => {
    setTeacherData((prev) => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <TeacherStep1
            data={teacherData}
            onUpdate={updateTeacherData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <TeacherStep2
            data={teacherData}
            onUpdate={updateTeacherData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <TeacherStep3
            data={teacherData}
            onUpdate={updateTeacherData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <TeacherStep4
            data={teacherData}
            onUpdate={updateTeacherData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <TeacherStep5
            data={teacherData}
            onUpdate={updateTeacherData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <TeacherStep6
            data={teacherData}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            submitting={submitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/teachers")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teachers
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Add New Teacher
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete all steps to add a new teacher to the system
          </p>
        </div>

        <TeacherProgressStepper currentStep={currentStep} />

        {renderStep()}
      </div>
    </div>
  );
};

export default AddTeacher;
