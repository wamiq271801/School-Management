import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Teacher } from "@/lib/firestore";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeacherStep3Props {
  data: Partial<Teacher>;
  onUpdate: (data: Partial<Teacher>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TeacherStep3 = ({ data, onUpdate, onNext, onPrevious }: TeacherStep3Props) => {
  const [additionalQuals, setAdditionalQuals] = useState<string[]>(
    data.qualification?.additionalQualifications || []
  );
  const [subjectExpertise, setSubjectExpertise] = useState<string[]>(
    data.qualification?.subjectExpertise || []
  );
  const [newQual, setNewQual] = useState("");
  const [newSubject, setNewSubject] = useState("");

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      highestQualification: data.qualification?.highestQualification || "",
      yearsOfExperience: data.qualification?.yearsOfExperience || 0,
      previousSchool: data.qualification?.previousSchool || "",
    },
  });

  const addQualification = () => {
    if (newQual.trim()) {
      setAdditionalQuals([...additionalQuals, newQual.trim()]);
      setNewQual("");
    }
  };

  const removeQualification = (index: number) => {
    setAdditionalQuals(additionalQuals.filter((_, i) => i !== index));
  };

  const addSubject = () => {
    if (newSubject.trim() && !subjectExpertise.includes(newSubject.trim())) {
      setSubjectExpertise([...subjectExpertise, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setSubjectExpertise(subjectExpertise.filter((s) => s !== subject));
  };

  const onSubmit = (formData: any) => {
    if (subjectExpertise.length === 0) {
      alert("Please add at least one subject expertise");
      return;
    }

    onUpdate({
      ...data,
      qualification: {
        highestQualification: formData.highestQualification,
        additionalQualifications: additionalQuals,
        yearsOfExperience: Number(formData.yearsOfExperience),
        previousSchool: formData.previousSchool,
        subjectExpertise,
      },
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Qualification & Experience
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="highestQualification">Highest Qualification *</Label>
              <Input
                id="highestQualification"
                {...register("highestQualification", { required: true })}
                placeholder="e.g., M.Sc, B.Ed"
              />
            </div>
            <div>
              <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                {...register("yearsOfExperience", { required: true, min: 0 })}
                placeholder="Enter years"
              />
            </div>
          </div>

          {/* Additional Qualifications */}
          <div>
            <Label>Additional Qualifications</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newQual}
                onChange={(e) => setNewQual(e.target.value)}
                placeholder="e.g., B.Sc, M.Ed"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addQualification())}
              />
              <Button type="button" onClick={addQualification} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {additionalQuals.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {additionalQuals.map((qual, index) => (
                  <Badge key={index} variant="secondary" className="gap-2">
                    {qual}
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Subject Expertise */}
          <div>
            <Label>Subject Expertise *</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g., Mathematics, Physics"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
              />
              <Button type="button" onClick={addSubject} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {subjectExpertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {subjectExpertise.map((subject) => (
                  <Badge key={subject} variant="default" className="gap-2">
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeSubject(subject)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="previousSchool">Previous School/Institution</Label>
            <Input
              id="previousSchool"
              {...register("previousSchool")}
              placeholder="Enter previous school name"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="submit" size="lg">
          Next: Employment Details
        </Button>
      </div>
    </form>
  );
};

export default TeacherStep3;
