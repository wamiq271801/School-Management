import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Teacher } from "@/lib/firestore";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeacherStep4Props {
  data: Partial<Teacher>;
  onUpdate: (data: Partial<Teacher>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TeacherStep4 = ({ data, onUpdate, onNext, onPrevious }: TeacherStep4Props) => {
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>(
    data.employment?.assignedSubjects || []
  );
  const [classResponsibilities, setClassResponsibilities] = useState<string[]>(
    data.employment?.classResponsibilities || []
  );
  const [newSubject, setNewSubject] = useState("");
  const [newClass, setNewClass] = useState("");

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      dateOfJoining: data.employment?.dateOfJoining || "",
      department: data.employment?.department || "",
      designation: data.employment?.designation || "",
      employeeType: data.employment?.employeeType || "Permanent",
      workingShift: data.employment?.workingShift || "Morning",
      basic: data.employment?.salary?.basic || 0,
      hra: data.employment?.salary?.hra || 0,
      allowances: data.employment?.salary?.allowances || 0,
      deductions: data.employment?.salary?.deductions || 0,
    },
  });

  const basic = watch("basic");
  const hra = watch("hra");
  const allowances = watch("allowances");
  const deductions = watch("deductions");
  const [netSalary, setNetSalary] = useState(0);

  useEffect(() => {
    const net =
      Number(basic) + Number(hra) + Number(allowances) - Number(deductions);
    setNetSalary(net);
  }, [basic, hra, allowances, deductions]);

  const addSubject = () => {
    if (newSubject.trim() && !assignedSubjects.includes(newSubject.trim())) {
      setAssignedSubjects([...assignedSubjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setAssignedSubjects(assignedSubjects.filter((s) => s !== subject));
  };

  const addClass = () => {
    if (newClass.trim() && !classResponsibilities.includes(newClass.trim())) {
      setClassResponsibilities([...classResponsibilities, newClass.trim()]);
      setNewClass("");
    }
  };

  const removeClass = (cls: string) => {
    setClassResponsibilities(classResponsibilities.filter((c) => c !== cls));
  };

  const onSubmit = (formData: any) => {
    if (assignedSubjects.length === 0) {
      alert("Please add at least one assigned subject");
      return;
    }

    onUpdate({
      ...data,
      employment: {
        dateOfJoining: formData.dateOfJoining,
        department: formData.department,
        designation: formData.designation,
        employeeType: formData.employeeType,
        workingShift: formData.workingShift,
        assignedSubjects,
        classResponsibilities,
        salary: {
          basic: Number(formData.basic),
          hra: Number(formData.hra),
          allowances: Number(formData.allowances),
          deductions: Number(formData.deductions),
          netSalary,
        },
      },
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Employment Details
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateOfJoining">Date of Joining *</Label>
              <Input
                id="dateOfJoining"
                type="date"
                {...register("dateOfJoining", { required: true })}
              />
            </div>
            <div>
              <Label>Department *</Label>
              <Select
                defaultValue={watch("department")}
                onValueChange={(value) => setValue("department", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Social Science">Social Science</SelectItem>
                  <SelectItem value="Physical Education">Physical Education</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Designation *</Label>
              <Select
                defaultValue={watch("designation")}
                onValueChange={(value) => setValue("designation", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Senior Teacher">Senior Teacher</SelectItem>
                  <SelectItem value="HOD">HOD</SelectItem>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                  <SelectItem value="Lab Incharge">Lab Incharge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Employee Type *</Label>
              <Select
                defaultValue={watch("employeeType")}
                onValueChange={(value) => setValue("employeeType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Visiting">Visiting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Working Shift</Label>
              <Select
                defaultValue={watch("workingShift")}
                onValueChange={(value) => setValue("workingShift", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned Subjects */}
          <div>
            <Label>Assigned Subjects *</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g., Mathematics, Class 10"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
              />
              <Button type="button" onClick={addSubject} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {assignedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {assignedSubjects.map((subject) => (
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

          {/* Class Responsibilities */}
          <div>
            <Label>Class Responsibilities</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                placeholder="e.g., Class 10A, Class 9B"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addClass())}
              />
              <Button type="button" onClick={addClass} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {classResponsibilities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {classResponsibilities.map((cls) => (
                  <Badge key={cls} variant="secondary" className="gap-2">
                    {cls}
                    <button
                      type="button"
                      onClick={() => removeClass(cls)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Salary Details */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Salary Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basic">Basic Pay *</Label>
                <Input
                  id="basic"
                  type="number"
                  {...register("basic", { required: true, min: 0 })}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="hra">HRA</Label>
                <Input
                  id="hra"
                  type="number"
                  {...register("hra", { min: 0 })}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="allowances">Allowances</Label>
                <Input
                  id="allowances"
                  type="number"
                  {...register("allowances", { min: 0 })}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="deductions">Deductions</Label>
                <Input
                  id="deductions"
                  type="number"
                  {...register("deductions", { min: 0 })}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Net Salary</span>
                <span className="text-2xl font-bold text-primary">₹{netSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="submit" size="lg">
          Next: Upload Documents
        </Button>
      </div>
    </form>
  );
};

export default TeacherStep4;
