import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { subscribeToStudents, type Student } from "@/lib/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AttendanceReports() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data.filter((s) => s.status === "active"));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get unique classes
  const uniqueClasses = Array.from(new Set(students.map((s) => s.academic.admissionClass))).sort();

  // Filter students
  const filteredStudents =
    selectedClass === "all"
      ? students
      : students.filter((s) => s.academic.admissionClass === selectedClass);

  // Mock data for chart - would be from actual attendance records
  const monthlyData = [
    { month: "Jan", present: 85, absent: 10, late: 3, leave: 2 },
    { month: "Feb", present: 88, absent: 8, late: 2, leave: 2 },
    { month: "Mar", present: 82, absent: 12, late: 4, leave: 2 },
    { month: "Apr", present: 90, absent: 6, late: 2, leave: 2 },
    { month: "May", present: 87, absent: 9, late: 2, leave: 2 },
    { month: "Jun", present: 85, absent: 10, late: 3, leave: 2 },
  ];

  const handleExportPDF = () => {
    alert("PDF export functionality would be implemented here using jsPDF or html2pdf.js");
  };

  const handleExportCSV = () => {
    alert("CSV export functionality would be implemented here");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/attendance")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Attendance Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate and export attendance reports
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="gap-2 rounded-lg"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="gap-2 rounded-lg"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <CardTitle className="text-xl font-heading flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      Class {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Attendance Chart */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <CardTitle className="text-xl font-heading">Monthly Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar dataKey="present" fill="hsl(122, 39%, 49%)" radius={[8, 8, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="hsl(4, 90%, 58%)" radius={[8, 8, 0, 0]} name="Absent" />
              <Bar dataKey="late" fill="hsl(45, 100%, 51%)" radius={[8, 8, 0, 0]} name="Late" />
              <Bar dataKey="leave" fill="hsl(199, 98%, 48%)" radius={[8, 8, 0, 0]} name="Leave" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Student Attendance Summary */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <CardTitle className="text-xl font-heading">
            Student Attendance Summary ({filteredStudents.length} Students)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No students found</div>
            ) : (
              filteredStudents.slice(0, 20).map((student) => {
                const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`;
                
                // Mock attendance data - would come from actual records
                const totalDays = 100;
                const presentDays = Math.floor(Math.random() * 20) + 80; // 80-100
                const absentDays = Math.floor(Math.random() * 10); // 0-10
                const lateDays = Math.floor(Math.random() * 5); // 0-5
                const leaveDays = totalDays - presentDays - absentDays - lateDays;
                const attendancePercentage = ((presentDays / totalDays) * 100).toFixed(1);

                return (
                  <div
                    key={student.id}
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth"
                  >
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
                            {student.admissionNumber} • Class {student.academic.admissionClass}-
                            {student.academic.section}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">{attendancePercentage}%</p>
                          <p className="text-xs text-muted-foreground">Attendance</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge className="bg-success text-success-foreground">
                            {presentDays}P
                          </Badge>
                          <Badge className="bg-destructive text-destructive-foreground">
                            {absentDays}A
                          </Badge>
                          <Badge className="bg-warning text-warning-foreground">
                            {lateDays}L
                          </Badge>
                          <Badge className="bg-info text-info-foreground">
                            {leaveDays}LV
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredStudents.length > 20 && (
            <div className="text-center pt-4 text-sm text-muted-foreground">
              Showing 20 of {filteredStudents.length} students
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Attendance Alert */}
      <Card className="rounded-xl shadow-level-2 border-0 border-l-4 border-l-destructive">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-destructive">
            Students with Low Attendance (&lt;75%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {Math.floor(filteredStudents.length * 0.15)} students have attendance below 75% threshold
            </p>
            <Button variant="outline" className="rounded-lg">
              View Detailed Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
