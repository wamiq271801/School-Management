import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createTeacher,
  updateTeacher,
  getTeacher,
  type Teacher,
} from "@/lib/firestore";

const ManageTeacher = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!id);

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "Male" as "Male" | "Female" | "Other",
    dateOfBirth: "",
    aadharNumber: "",
    panNumber: "",
    nationality: "Indian",
    category: "General",
    
    // Contact Info
    mobile: "",
    alternateMobile: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactMobile: "",
    
    // Qualification
    highestQualification: "",
    yearsOfExperience: 0,
    previousSchool: "",
    subjectExpertise: [] as string[],
    
    // Employment
    dateOfJoining: "",
    department: "",
    designation: "",
    employeeType: "Permanent" as "Permanent" | "Contract" | "Visiting",
    assignedSubjects: [] as string[],
    workingShift: "Morning" as "Morning" | "Evening" | "Both",
    
    // Salary
    basicSalary: 0,
    hra: 0,
    allowances: 0,
    deductions: 0,
    
    // Status
    status: "Active" as "Active" | "On Leave" | "Resigned",
  });

  const [subjectInput, setSubjectInput] = useState("");
  const [assignedSubjectInput, setAssignedSubjectInput] = useState("");

  useEffect(() => {
    if (id) {
      loadTeacher();
    }
  }, [id]);

  const loadTeacher = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const teacher = await getTeacher(id);
      if (teacher) {
        setFormData({
          firstName: teacher.personal.firstName,
          middleName: teacher.personal.middleName || "",
          lastName: teacher.personal.lastName,
          gender: teacher.personal.gender,
          dateOfBirth: teacher.personal.dateOfBirth,
          aadharNumber: teacher.personal.aadharNumber || "",
          panNumber: teacher.personal.panNumber || "",
          nationality: teacher.personal.nationality,
          category: teacher.personal.category,
          mobile: teacher.contact.mobile,
          alternateMobile: teacher.contact.alternateMobile || "",
          email: teacher.contact.email || "",
          addressLine1: teacher.contact.residentialAddress.line1,
          addressLine2: teacher.contact.residentialAddress.line2 || "",
          city: teacher.contact.residentialAddress.city,
          state: teacher.contact.residentialAddress.state,
          pincode: teacher.contact.residentialAddress.pincode,
          emergencyContactName: teacher.contact.emergencyContact?.name || "",
          emergencyContactRelation: teacher.contact.emergencyContact?.relation || "",
          emergencyContactMobile: teacher.contact.emergencyContact?.mobile || "",
          highestQualification: teacher.qualification.highestQualification,
          yearsOfExperience: teacher.qualification.yearsOfExperience,
          previousSchool: teacher.qualification.previousSchool || "",
          subjectExpertise: teacher.qualification.subjectExpertise,
          dateOfJoining: teacher.employment.dateOfJoining,
          department: teacher.employment.department,
          designation: teacher.employment.designation,
          employeeType: teacher.employment.employeeType,
          assignedSubjects: teacher.employment.assignedSubjects,
          workingShift: teacher.employment.workingShift || "Morning",
          basicSalary: teacher.employment.salary.basic,
          hra: teacher.employment.salary.hra,
          allowances: teacher.employment.salary.allowances,
          deductions: teacher.employment.salary.deductions,
          status: teacher.status,
        });
      }
    } catch (error) {
      console.error("Error loading teacher:", error);
      toast({
        title: "Error",
        description: "Failed to load teacher details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    if (subjectInput.trim() && !formData.subjectExpertise.includes(subjectInput.trim())) {
      setFormData({
        ...formData,
        subjectExpertise: [...formData.subjectExpertise, subjectInput.trim()],
      });
      setSubjectInput("");
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjectExpertise: formData.subjectExpertise.filter((s) => s !== subject),
    });
  };

  const handleAddAssignedSubject = () => {
    if (
      assignedSubjectInput.trim() &&
      !formData.assignedSubjects.includes(assignedSubjectInput.trim())
    ) {
      setFormData({
        ...formData,
        assignedSubjects: [...formData.assignedSubjects, assignedSubjectInput.trim()],
      });
      setAssignedSubjectInput("");
    }
  };

  const handleRemoveAssignedSubject = (subject: string) => {
    setFormData({
      ...formData,
      assignedSubjects: formData.assignedSubjects.filter((s) => s !== subject),
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "Please enter first name and last name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.mobile) {
      toast({
        title: "Error",
        description: "Please enter mobile number",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const netSalary =
        formData.basicSalary +
        formData.hra +
        formData.allowances -
        formData.deductions;

      const teacherData: Partial<Teacher> = {
        personal: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          aadharNumber: formData.aadharNumber,
          panNumber: formData.panNumber,
          nationality: formData.nationality,
          category: formData.category,
        },
        contact: {
          mobile: formData.mobile,
          alternateMobile: formData.alternateMobile,
          email: formData.email,
          residentialAddress: {
            line1: formData.addressLine1,
            line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          emergencyContact: formData.emergencyContactName
            ? {
                name: formData.emergencyContactName,
                relation: formData.emergencyContactRelation,
                mobile: formData.emergencyContactMobile,
              }
            : undefined,
        },
        qualification: {
          highestQualification: formData.highestQualification,
          yearsOfExperience: formData.yearsOfExperience,
          previousSchool: formData.previousSchool,
          subjectExpertise: formData.subjectExpertise,
        },
        employment: {
          dateOfJoining: formData.dateOfJoining,
          department: formData.department,
          designation: formData.designation,
          employeeType: formData.employeeType,
          assignedSubjects: formData.assignedSubjects,
          workingShift: formData.workingShift,
          salary: {
            basic: formData.basicSalary,
            hra: formData.hra,
            allowances: formData.allowances,
            deductions: formData.deductions,
            netSalary,
          },
        },
        status: formData.status,
      };

      if (id) {
        await updateTeacher(id, teacherData);
        toast({
          title: "Success",
          description: "Teacher updated successfully",
        });
        navigate(`/teachers/${id}`);
      } else {
        const teacherId = await createTeacher(teacherData);
        toast({
          title: "Success",
          description: "Teacher added successfully",
        });
        navigate(`/teachers/${teacherId}`);
      }
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast({
        title: "Error",
        description: `Failed to ${id ? "update" : "add"} teacher`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/teachers")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {id ? "Edit Teacher" : "Add New Teacher"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {id
              ? "Update teacher information"
              : "Fill in all required information to add a new teacher"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="Enter first name"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input
                value={formData.middleName}
                onChange={(e) =>
                  setFormData({ ...formData, middleName: e.target.value })
                }
                placeholder="Enter middle name"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Enter last name"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="General/OBC/SC/ST"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Aadhar Number</Label>
              <Input
                value={formData.aadharNumber}
                onChange={(e) =>
                  setFormData({ ...formData, aadharNumber: e.target.value })
                }
                placeholder="Enter Aadhar number"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>PAN Number</Label>
              <Input
                value={formData.panNumber}
                onChange={(e) =>
                  setFormData({ ...formData, panNumber: e.target.value })
                }
                placeholder="Enter PAN number"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Mobile Number *</Label>
              <Input
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                placeholder="Enter mobile number"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Alternate Mobile</Label>
              <Input
                value={formData.alternateMobile}
                onChange={(e) =>
                  setFormData({ ...formData, alternateMobile: e.target.value })
                }
                placeholder="Enter alternate mobile"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Address Line 1</Label>
              <Input
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
                placeholder="House no., street name"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Address Line 2</Label>
              <Input
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
                }
                placeholder="Locality, landmark"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Enter city"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="Enter state"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
                placeholder="Enter pincode"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Emergency Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.emergencyContactName}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactName: e.target.value })
                  }
                  placeholder="Enter name"
                  className="bg-muted/50 border-0 rounded-lg"
                />
              </div>
              <div>
                <Label>Relation</Label>
                <Input
                  value={formData.emergencyContactRelation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContactRelation: e.target.value,
                    })
                  }
                  placeholder="Father/Mother/Spouse"
                  className="bg-muted/50 border-0 rounded-lg"
                />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input
                  value={formData.emergencyContactMobile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContactMobile: e.target.value,
                    })
                  }
                  placeholder="Enter mobile number"
                  className="bg-muted/50 border-0 rounded-lg"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Qualification */}
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Qualification & Experience
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Highest Qualification</Label>
              <Input
                value={formData.highestQualification}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    highestQualification: e.target.value,
                  })
                }
                placeholder="B.Ed, M.Ed, etc."
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Years of Experience</Label>
              <Input
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    yearsOfExperience: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Previous School</Label>
              <Input
                value={formData.previousSchool}
                onChange={(e) =>
                  setFormData({ ...formData, previousSchool: e.target.value })
                }
                placeholder="Enter previous school name"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Subject Expertise</Label>
              <div className="flex gap-2">
                <Input
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="Enter subject and press Add"
                  className="bg-muted/50 border-0 rounded-lg"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubject();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddSubject}
                  variant="outline"
                  className="rounded-lg"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjectExpertise.map((subject) => (
                  <div
                    key={subject}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-2"
                  >
                    <span>{subject}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subject)}
                      className="text-primary hover:text-primary/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Employment Details */}
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Employment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date of Joining</Label>
              <Input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfJoining: e.target.value })
                }
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Social Science">Social Science</SelectItem>
                  <SelectItem value="Physical Education">
                    Physical Education
                  </SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Designation</Label>
              <Input
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                placeholder="Teacher/HOD/Principal"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Employee Type</Label>
              <Select
                value={formData.employeeType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, employeeType: value })
                }
              >
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
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
                value={formData.workingShift}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, workingShift: value })
                }
              >
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Assigned Subjects</Label>
              <div className="flex gap-2">
                <Input
                  value={assignedSubjectInput}
                  onChange={(e) => setAssignedSubjectInput(e.target.value)}
                  placeholder="Enter subject and press Add"
                  className="bg-muted/50 border-0 rounded-lg"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAssignedSubject();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddAssignedSubject}
                  variant="outline"
                  className="rounded-lg"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.assignedSubjects.map((subject) => (
                  <div
                    key={subject}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-2"
                  >
                    <span>{subject}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignedSubject(subject)}
                      className="text-primary hover:text-primary/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Salary Details */}
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Salary Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Basic Salary (₹)</Label>
              <Input
                type="number"
                value={formData.basicSalary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basicSalary: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>HRA (₹)</Label>
              <Input
                type="number"
                value={formData.hra}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hra: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Allowances (₹)</Label>
              <Input
                type="number"
                value={formData.allowances}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allowances: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Deductions (₹)</Label>
              <Input
                type="number"
                value={formData.deductions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deductions: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div className="md:col-span-2 p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">
                  Net Salary
                </span>
                <span className="text-2xl font-bold text-primary">
                  ₹
                  {(
                    formData.basicSalary +
                    formData.hra +
                    formData.allowances -
                    formData.deductions
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-lg h-12"
          >
            {submitting
              ? "Saving..."
              : id
              ? "Update Teacher"
              : "Add Teacher"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/teachers")}
            className="rounded-lg h-12"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageTeacher;
