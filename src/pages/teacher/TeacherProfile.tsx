import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  DollarSign,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getTeacher, deleteTeacher, Teacher } from "@/lib/firestore";

const TeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      setTeacher(data);
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

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteTeacher(id);
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
      navigate("/teachers");
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Error",
        description: "Failed to delete teacher",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-foreground">Teacher not found</h2>
          <Button onClick={() => navigate("/teachers")} className="mt-4">
            Back to Teachers
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "On Leave":
        return "secondary";
      case "Resigned":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/teachers")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/teachers/${id}/edit`)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-card rounded-xl border border-border p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {teacher.personal.profilePhotoUrl ? (
            <img
              src={teacher.personal.profilePhotoUrl}
              alt={`${teacher.personal.firstName} ${teacher.personal.lastName}`}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {teacher.personal.firstName[0]}
                {teacher.personal.lastName[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold text-foreground">
                {teacher.personal.firstName} {teacher.personal.middleName}{" "}
                {teacher.personal.lastName}
              </h1>
              <Badge variant={getStatusBadgeVariant(teacher.status)}>
                {teacher.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>
                  {teacher.employment.designation} - {teacher.employment.department}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>{teacher.qualification.highestQualification}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined: {teacher.employment.dateOfJoining}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {teacher.qualification.subjectExpertise.map((subject) => (
                <Badge key={subject} variant="outline">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Teacher ID</div>
            <div className="text-lg font-semibold text-foreground">
              {teacher.teacherId}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Gender:</span>
                  <span className="ml-2 text-foreground">{teacher.personal.gender}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date of Birth:</span>
                  <span className="ml-2 text-foreground">
                    {teacher.personal.dateOfBirth}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Nationality:</span>
                  <span className="ml-2 text-foreground">
                    {teacher.personal.nationality}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="ml-2 text-foreground">{teacher.personal.category}</span>
                </div>
                {teacher.personal.bloodGroup && (
                  <div>
                    <span className="text-sm text-muted-foreground">Blood Group:</span>
                    <span className="ml-2 text-foreground">
                      {teacher.personal.bloodGroup}
                    </span>
                  </div>
                )}
                {teacher.personal.maritalStatus && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Marital Status:
                    </span>
                    <span className="ml-2 text-foreground">
                      {teacher.personal.maritalStatus}
                    </span>
                  </div>
                )}
                {teacher.personal.aadharNumber && (
                  <div>
                    <span className="text-sm text-muted-foreground">Aadhar:</span>
                    <span className="ml-2 text-foreground">
                      {teacher.personal.aadharNumber}
                    </span>
                  </div>
                )}
                {teacher.personal.panNumber && (
                  <div>
                    <span className="text-sm text-muted-foreground">PAN:</span>
                    <span className="ml-2 text-foreground">
                      {teacher.personal.panNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <div className="text-foreground">{teacher.contact.mobile}</div>
                    {teacher.contact.alternateMobile && (
                      <div className="text-sm text-muted-foreground">
                        Alt: {teacher.contact.alternateMobile}
                      </div>
                    )}
                  </div>
                </div>
                {teacher.contact.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="text-foreground">{teacher.contact.email}</div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <div className="text-foreground">
                    {teacher.contact.residentialAddress.line1},{" "}
                    {teacher.contact.residentialAddress.line2 && (
                      <>{teacher.contact.residentialAddress.line2}, </>
                    )}
                    {teacher.contact.residentialAddress.city},{" "}
                    {teacher.contact.residentialAddress.state} -{" "}
                    {teacher.contact.residentialAddress.pincode}
                  </div>
                </div>
                {teacher.contact.emergencyContact && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm font-medium text-foreground mb-2">
                      Emergency Contact
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{" "}
                        {teacher.contact.emergencyContact.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Relation:</span>{" "}
                        {teacher.contact.emergencyContact.relation}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{" "}
                        {teacher.contact.emergencyContact.mobile}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Qualification */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Qualification & Experience
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Highest Qualification:
                  </span>
                  <span className="ml-2 text-foreground font-medium">
                    {teacher.qualification.highestQualification}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Experience:</span>
                  <span className="ml-2 text-foreground">
                    {teacher.qualification.yearsOfExperience} years
                  </span>
                </div>
                {teacher.qualification.previousSchool && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Previous School:
                    </span>
                    <span className="ml-2 text-foreground">
                      {teacher.qualification.previousSchool}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Additional Qualifications:
                </div>
                {teacher.qualification.additionalQualifications &&
                teacher.qualification.additionalQualifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {teacher.qualification.additionalQualifications.map((qual) => (
                      <Badge key={qual} variant="secondary">
                        {qual}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Department:</span>
                  <span className="ml-2 text-foreground font-medium">
                    {teacher.employment.department}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Designation:</span>
                  <span className="ml-2 text-foreground">
                    {teacher.employment.designation}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Employee Type:</span>
                  <span className="ml-2 text-foreground">
                    {teacher.employment.employeeType}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date of Joining:</span>
                  <span className="ml-2 text-foreground">
                    {teacher.employment.dateOfJoining}
                  </span>
                </div>
                {teacher.employment.workingShift && (
                  <div>
                    <span className="text-sm text-muted-foreground">Working Shift:</span>
                    <span className="ml-2 text-foreground">
                      {teacher.employment.workingShift}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Assigned Subjects:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teacher.employment.assignedSubjects.map((subject) => (
                      <Badge key={subject} variant="default">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
                {teacher.employment.classResponsibilities &&
                  teacher.employment.classResponsibilities.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Class Responsibilities:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {teacher.employment.classResponsibilities.map((cls) => (
                          <Badge key={cls} variant="secondary">
                            {cls}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacher.documents?.aadharCard && (
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Aadhar Card</div>
                      <div className="text-sm text-muted-foreground">
                        {teacher.documents.aadharCard.fileName}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(teacher.documents?.aadharCard?.url, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {teacher.documents?.panCard && (
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">PAN Card</div>
                      <div className="text-sm text-muted-foreground">
                        {teacher.documents.panCard.fileName}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(teacher.documents?.panCard?.url, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {teacher.documents?.joiningLetter && (
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Joining Letter</div>
                      <div className="text-sm text-muted-foreground">
                        {teacher.documents.joiningLetter.fileName}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      window.open(teacher.documents?.joiningLetter?.url, "_blank")
                    }
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {teacher.documents?.addressProof && (
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Address Proof</div>
                      <div className="text-sm text-muted-foreground">
                        {teacher.documents.addressProof.fileName}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(teacher.documents?.addressProof?.url, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {teacher.documents?.bankPassbook && (
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Bank Passbook</div>
                      <div className="text-sm text-muted-foreground">
                        {teacher.documents.bankPassbook.fileName}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(teacher.documents?.bankPassbook?.url, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            {(!teacher.documents ||
              Object.keys(teacher.documents).length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No documents uploaded
              </p>
            )}
          </div>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Salary Structure</h3>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download Payslip
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Basic Pay</span>
                  <span className="font-semibold text-foreground">
                    ₹{teacher.employment.salary.basic.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-muted-foreground">HRA</span>
                  <span className="font-semibold text-foreground">
                    ₹{teacher.employment.salary.hra.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Allowances</span>
                  <span className="font-semibold text-foreground">
                    ₹{teacher.employment.salary.allowances.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Deductions</span>
                  <span className="font-semibold text-destructive">
                    -₹{teacher.employment.salary.deductions.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center p-8 bg-primary/10 rounded-xl border-2 border-primary/20">
                  <DollarSign className="w-12 h-12 text-primary mx-auto mb-3" />
                  <div className="text-sm text-muted-foreground mb-2">Net Salary</div>
                  <div className="text-4xl font-bold text-primary">
                    ₹{teacher.employment.salary.netSalary.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">per month</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this teacher? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherProfile;
