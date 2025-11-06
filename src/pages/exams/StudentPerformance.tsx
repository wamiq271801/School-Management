import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudentAllMarks, type StudentMarks } from "@/lib/firestoreExams";
import { getStudent, type Student } from "@/lib/firestore";

const StudentPerformance = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [allMarks, setAllMarks] = useState<StudentMarks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadData = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      const [studentData, marksData] = await Promise.all([
        getStudent(studentId),
        getStudentAllMarks(studentId),
      ]);
      
      setStudent(studentData);
      setAllMarks(marksData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-semibold">Student not found</h2>
        <Button onClick={() => navigate("/students")} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const performanceTrend = allMarks.map((mark, index) => ({
    exam: `Exam ${index + 1}`,
    percentage: mark.percentage,
    grade: mark.overallGrade,
  }));

  const subjectPerformance = allMarks.length > 0 
    ? allMarks[0].subjects.map(subject => ({
        subject: subject.subjectName,
        percentage: subject.percentage,
        grade: subject.grade,
      }))
    : [];

  const averagePercentage = allMarks.length > 0
    ? allMarks.reduce((sum, mark) => sum + mark.percentage, 0) / allMarks.length
    : 0;

  const fullName = `${student.basic.firstName} ${student.basic.lastName}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/students/${studentId}`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Academic Performance</h1>
          <p className="text-muted-foreground mt-1">{fullName} - {student.admissionNumber}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Exams</p>
              <p className="text-3xl font-bold text-foreground mt-2">{allMarks.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {averagePercentage.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Grade</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {allMarks.length > 0 ? allMarks[0].overallGrade : "-"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="exam" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Percentage"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Subject Performance */}
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">Subject-wise Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="percentage" fill="hsl(var(--primary))" name="Percentage" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Results Table */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Exam History</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Total Marks</TableHead>
              <TableHead>Marks Obtained</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMarks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No exam records found
                </TableCell>
              </TableRow>
            ) : (
              allMarks.map((mark) => (
                <TableRow key={mark.id}>
                  <TableCell className="font-medium">{mark.examId}</TableCell>
                  <TableCell>{mark.classId}</TableCell>
                  <TableCell>{mark.totalMaxMarks}</TableCell>
                  <TableCell className="font-semibold">{mark.totalMarksObtained}</TableCell>
                  <TableCell className="font-semibold">{mark.percentage.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        mark.overallGrade === "A+" || mark.overallGrade === "A"
                          ? "bg-success text-success-foreground"
                          : mark.overallGrade === "F"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {mark.overallGrade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(mark.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default StudentPerformance;
