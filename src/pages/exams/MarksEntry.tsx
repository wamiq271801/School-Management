import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getExam,
  getMarksByExam,
  saveStudentMarks,
  updateStudentMarks,
  getStudentMarks,
  calculateGrade,
  type ExamType,
  type StudentMarks,
  type SubjectMarks,
} from "@/lib/firestoreExams";
import { getStudents, type Student } from "@/lib/firestore";
import { generateMarksheet } from "@/lib/marksheetGenerator";

const MarksEntry = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [exam, setExam] = useState<ExamType | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<Map<string, StudentMarks>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      loadData();
    }
  }, [examId]);

  const loadData = async () => {
    if (!examId) return;
    
    try {
      setLoading(true);
      const examData = await getExam(examId);
      if (!examData) {
        toast({
          title: "Error",
          description: "Exam not found",
          variant: "destructive",
        });
        return;
      }
      
      setExam(examData);
      
      // Load students from the same class
      const studentsData = await getStudents({ 
        class: examData.classId 
      });
      setStudents(studentsData);
      
      // Load existing marks
      const existingMarks = await getMarksByExam(examId);
      const marksMap = new Map<string, StudentMarks>();
      existingMarks.forEach(mark => {
        marksMap.set(mark.studentId, mark);
      });
      setMarksData(marksMap);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load exam data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId: string, subjectName: string, value: string) => {
    if (!exam) return;
    
    const marksObtained = parseInt(value) || 0;
    const percentage = (marksObtained / exam.totalMarks) * 100;
    const grade = calculateGrade(percentage);
    
    const currentMarks = marksData.get(studentId);
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const subjectMarks: SubjectMarks = {
      subjectId: subjectName,
      subjectName,
      marksObtained,
      totalMarks: exam.totalMarks,
      grade,
      percentage,
    };
    
    const updatedSubjects = currentMarks?.subjects || [];
    const subjectIndex = updatedSubjects.findIndex(s => s.subjectName === subjectName);
    
    if (subjectIndex >= 0) {
      updatedSubjects[subjectIndex] = subjectMarks;
    } else {
      updatedSubjects.push(subjectMarks);
    }
    
    const totalObtained = updatedSubjects.reduce((sum, s) => sum + s.marksObtained, 0);
    const totalMax = updatedSubjects.length * exam.totalMarks;
    const overallPercentage = (totalObtained / totalMax) * 100;
    
    const newMarks: StudentMarks = {
      id: currentMarks?.id || "",
      examId,
      studentId,
      studentName: `${student.basic.firstName} ${student.basic.lastName}`,
      admissionNumber: student.admissionNumber,
      classId: exam.classId,
      section: student.academic.section,
      academicYear: exam.academicYear,
      subjects: updatedSubjects,
      totalMarksObtained: totalObtained,
      totalMaxMarks: totalMax,
      percentage: overallPercentage,
      overallGrade: calculateGrade(overallPercentage),
      createdAt: currentMarks?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const newMarksData = new Map(marksData);
    newMarksData.set(studentId, newMarks);
    setMarksData(newMarksData);
  };

  const handleSaveMarks = async (studentId: string) => {
    const marks = marksData.get(studentId);
    if (!marks) return;
    
    try {
      if (marks.id) {
        await updateStudentMarks(marks.id, marks);
      } else {
        const id = await saveStudentMarks(marks);
        const updatedMarks = { ...marks, id };
        const newMarksData = new Map(marksData);
        newMarksData.set(studentId, updatedMarks);
        setMarksData(newMarksData);
      }
      
      toast({
        title: "Success",
        description: "Marks saved successfully",
      });
    } catch (error) {
      console.error("Error saving marks:", error);
      toast({
        title: "Error",
        description: "Failed to save marks",
        variant: "destructive",
      });
    }
  };

  const handleGenerateMarksheet = async (studentId: string) => {
    const marks = marksData.get(studentId);
    const student = students.find(s => s.id === studentId);
    
    if (!marks || !student || !exam) return;
    
    try {
      await generateMarksheet(student, exam, marks);
      toast({
        title: "Success",
        description: "Marksheet generated successfully",
      });
    } catch (error) {
      console.error("Error generating marksheet:", error);
      toast({
        title: "Error",
        description: "Failed to generate marksheet",
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

  if (!exam) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-semibold">Exam not found</h2>
        <Button onClick={() => navigate("/exams")} className="mt-4">
          Back to Exams
        </Button>
      </div>
    );
  }

  const subjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/exams")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">{exam.name}</h1>
            <p className="text-muted-foreground mt-1">Class: {exam.classId} | Total Marks: {exam.totalMarks}</p>
          </div>
        </div>
      </div>

      {/* Marks Entry Table */}
      <Card className="rounded-xl shadow-level-2 border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10">Student Name</TableHead>
                <TableHead>Admission No.</TableHead>
                {subjects.map((subject) => (
                  <TableHead key={subject}>{subject}</TableHead>
                ))}
                <TableHead>Total</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={subjects.length + 6} className="text-center text-muted-foreground py-8">
                    No students found for this class
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => {
                  const studentMarks = marksData.get(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="sticky left-0 bg-card z-10 font-medium">
                        {student.basic.firstName} {student.basic.lastName}
                      </TableCell>
                      <TableCell>{student.admissionNumber}</TableCell>
                      {subjects.map((subject) => {
                        const subjectMark = studentMarks?.subjects.find(s => s.subjectName === subject);
                        return (
                          <TableCell key={subject}>
                            <Input
                              type="number"
                              min="0"
                              max={exam.totalMarks}
                              value={subjectMark?.marksObtained || ""}
                              onChange={(e) => handleMarksChange(student.id, subject, e.target.value)}
                              className="w-20 rounded-lg"
                              placeholder="0"
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="font-semibold">
                        {studentMarks?.totalMarksObtained || 0}/{studentMarks?.totalMaxMarks || 0}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {studentMarks?.percentage.toFixed(1) || "0"}%
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          studentMarks?.overallGrade === "A+" || studentMarks?.overallGrade === "A" 
                            ? "bg-success/20 text-success" 
                            : studentMarks?.overallGrade === "F"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {studentMarks?.overallGrade || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveMarks(student.id)}
                            className="gap-2 rounded-lg"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateMarksheet(student.id)}
                            className="gap-2 rounded-lg"
                            disabled={!studentMarks}
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default MarksEntry;
