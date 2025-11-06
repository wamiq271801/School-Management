import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TeacherProgressStepper } from "@/components/teacher/TeacherProgressStepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTeacher, updateTeacher, Teacher } from "@/lib/firestore";
import TeacherStep1 from "./TeacherStep1";
import TeacherStep2 from "./TeacherStep2";
import TeacherStep3 from "./TeacherStep3";
import TeacherStep4 from "./TeacherStep4";
import TeacherStep5 from "./TeacherStep5";
import TeacherStep6 from "./TeacherStep6";

const EditTeacher = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [teacherData, setTeacherData] = useState<Partial<Teacher>>({});

  useEffect(() => {
    if (id) {
      loadTeacher();
    }
  }, [id]);

  const loadTeacher = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getTeacher(id);
      if (data) {
        setTeacherData(data);
      } else {
        toast({
          title: "Error",
          description: "Teacher not found",
          variant: "destructive",
        });
        navigate("/teachers");
      }
    } catch (error) {
      console.error("Error loading teacher:", error);
      toast({
        title: "Error",
        description: "Failed to load teacher data",
        variant: "destructive",
      });
      navigate("/teachers");
    } finally {
      setLoading(false);
    }
  };

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
    if (!id) return;

    try {
      setSubmitting(true);
      await updateTeacher(id, teacherData);
      toast({
        title: "Success",
        description: "Teacher updated successfully",
      });
      navigate(`/teachers/${id}`);
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Error",
        description: "Failed to update teacher",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/teachers/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Edit Teacher
          </h1>
          <p className="text-muted-foreground mt-1">
            Update teacher information
          </p>
        </div>

        <TeacherProgressStepper currentStep={currentStep} />

        {renderStep()}
      </div>
    </div>
  );
};

export default EditTeacher;
