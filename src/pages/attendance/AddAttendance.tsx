import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, Coffee, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { subscribeToStudents, markAttendance, type Student } from "@/lib/firestore";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Leave";

interface StudentAttendance {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  status: AttendanceStatus;
  remarks: string;
}

export default function AddAttendance() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [subject, setSubject] = useState("");
  
  // Attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, StudentAttendance>>({});
  
  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data.filter((s) => s.status === "active"));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get unique classes and sections
  const uniqueClasses = Array.from(new Set(students.map((s) => s.academic.admissionClass))).sort();
  const uniqueSections = selectedClass
    ? Array.from(new Set(students.filter((s) => s.academic.admissionClass === selectedClass).map((s) => s.academic.section))).sort()
    : [];

  // Filter students by class and section
  const filteredStudents = students.filter(
    (s) => s.academic.admissionClass === selectedClass && s.academic.section === selectedSection
  );

  // Initialize attendance records when students change
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const records: Record<string, StudentAttendance> = {};
      filteredStudents.forEach((student) => {
        const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`;
        records[student.id] = {
          studentId: student.id,
          studentName: fullName,
          admissionNumber: student.admissionNumber,
          status: "Present", // Default to present
          remarks: "",
        };
      });
      setAttendanceRecords(records);
    } else {
      setAttendanceRecords({});
    }
  }, [selectedClass, selectedSection, filteredStudents.length]);

  const updateAttendanceStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const updateRemarks = (studentId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const markAllAs = (status: AttendanceStatus) => {
    const updatedRecords = { ...attendanceRecords };
    Object.keys(updatedRecords).forEach((studentId) => {
      updatedRecords[studentId].status = status;
    });
    setAttendanceRecords(updatedRecords);
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSection || Object.keys(attendanceRecords).length === 0) {
      toast({
        title: "Error",
        description: "Please select class, section and mark attendance",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const academicYear = new Date().getFullYear().toString();
      const records = Object.values(attendanceRecords).map((record) => ({
        ...record,
        className: selectedClass,
        section: selectedSection,
        date: selectedDate,
        markedBy: "admin", // Would be actual admin ID in production
      }));

      await markAttendance(academicYear, selectedClass, selectedSection, selectedDate, records);

      toast({
        title: "Success",
        description: `Attendance marked successfully for ${records.length} students`,
      });

      navigate("/attendance");
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusCounts = () => {
    const records = Object.values(attendanceRecords);
    return {
      present: records.filter((r) => r.status === "Present").length,
      absent: records.filter((r) => r.status === "Absent").length,
      late: records.filter((r) => r.status === "Late").length,
      leave: records.filter((r) => r.status === "Leave").length,
    };
  };

  const counts = getStatusCounts();
  const showStudentList = selectedClass && selectedSection && filteredStudents.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/attendance")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Mark Attendance</h1>
          <p className="text-muted-foreground mt-1">Record student attendance for the day</p>
        </div>
      </div>

      {/* Step 1: Select Class/Section */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10">
          <CardTitle className="text-xl font-heading">Step 1: Select Class & Section</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      Class {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={!selectedClass}
              >
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSections.map((section) => (
                    <SelectItem key={section} value={section}>
                      Section {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject (Optional)</Label>
            <Input
              placeholder="e.g., Mathematics, English"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-muted/50 border-0 rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Mark Attendance */}
      {showStudentList && (
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl font-heading">
                Step 2: Mark Attendance ({filteredStudents.length} Students)
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllAs("Present")}
                  className="gap-2 rounded-lg bg-success/10 hover:bg-success/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  All Present
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllAs("Absent")}
                  className="gap-2 rounded-lg bg-destructive/10 hover:bg-destructive/20"
                >
                  <XCircle className="w-4 h-4" />
                  All Absent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-success/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-foreground">{counts.present}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-foreground">{counts.absent}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-warning/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <div>
                    <p className="text-sm text-muted-foreground">Late</p>
                    <p className="text-2xl font-bold text-foreground">{counts.late}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-info/10">
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-info" />
                  <div>
                    <p className="text-sm text-muted-foreground">Leave</p>
                    <p className="text-2xl font-bold text-foreground">{counts.leave}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`;
                const attendance = attendanceRecords[student.id];

                return (
                  <div key={student.id} className="p-4 rounded-lg bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {student.basic.firstName[0]}{student.basic.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.admissionNumber} • Roll: {student.academic.rollNumber || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={attendance?.status === "Present" ? "default" : "outline"}
                          onClick={() => updateAttendanceStatus(student.id, "Present")}
                          className={`rounded-lg ${
                            attendance?.status === "Present"
                              ? "bg-success hover:bg-success/90"
                              : "hover:bg-success/10"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance?.status === "Absent" ? "default" : "outline"}
                          onClick={() => updateAttendanceStatus(student.id, "Absent")}
                          className={`rounded-lg ${
                            attendance?.status === "Absent"
                              ? "bg-destructive hover:bg-destructive/90"
                              : "hover:bg-destructive/10"
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance?.status === "Late" ? "default" : "outline"}
                          onClick={() => updateAttendanceStatus(student.id, "Late")}
                          className={`rounded-lg ${
                            attendance?.status === "Late"
                              ? "bg-warning hover:bg-warning/90"
                              : "hover:bg-warning/10"
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance?.status === "Leave" ? "default" : "outline"}
                          onClick={() => updateAttendanceStatus(student.id, "Leave")}
                          className={`rounded-lg ${
                            attendance?.status === "Leave"
                              ? "bg-info hover:bg-info/90"
                              : "hover:bg-info/10"
                          }`}
                        >
                          <Coffee className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {attendance?.status !== "Present" && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Remarks (Optional)</Label>
                        <Textarea
                          placeholder="Add reason or notes..."
                          value={attendance?.remarks || ""}
                          onChange={(e) => updateRemarks(student.id, e.target.value)}
                          className="mt-1 bg-muted/50 border-0 rounded-lg min-h-[60px]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Optional Documents */}
      {showStudentList && (
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10">
            <CardTitle className="text-xl font-heading">Step 3: Upload Documents (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload attendance sheet, teacher signature, or other supporting documents
              </p>
              <Button variant="outline" className="rounded-lg">
                Choose Files
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {showStudentList && (
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/attendance")}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2 rounded-lg bg-primary"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}
