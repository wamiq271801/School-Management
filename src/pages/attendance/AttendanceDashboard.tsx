import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToStudents, type Student } from "@/lib/firestore";

export default function AttendanceDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data.filter((s) => s.status === "active"));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate stats (mock data for now - would be from actual attendance records)
  const totalStudents = students.length;
  const presentToday = Math.floor(totalStudents * 0.85); // 85% present
  const absentToday = Math.floor(totalStudents * 0.10); // 10% absent
  const lateToday = Math.floor(totalStudents * 0.03); // 3% late
  const leaveToday = totalStudents - presentToday - absentToday - lateToday;

  const attendancePercentage = totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(1) : 0;

  // Get unique classes
  const uniqueClasses = Array.from(new Set(students.map((s) => s.academic.admissionClass))).sort();

  // Filter students
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      fullName.includes(search) ||
      student.admissionNumber.toLowerCase().includes(search);

    const matchesClass = selectedClass === "all" || student.academic.admissionClass === selectedClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage student attendance records
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/attendance/add")}
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-level-2 h-11 rounded-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Mark Attendance</span>
          </Button>
          <Button
            onClick={() => navigate("/attendance/reports")}
            variant="outline"
            className="gap-2 h-11 rounded-xl"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Reports</span>
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs bg-muted/50 border-0 rounded-lg"
            />
            <span className="text-sm text-muted-foreground">
              Viewing attendance for: <span className="font-semibold text-foreground">{new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <h3 className="text-3xl font-heading font-bold text-foreground mt-2">{totalStudents}</h3>
                <div className="flex items-center gap-1 mt-3">
                  <Users className="w-4 h-4 text-info" />
                  <p className="text-xs text-muted-foreground">Active students</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <h3 className="text-3xl font-heading font-bold text-foreground mt-2">{presentToday}</h3>
                <div className="flex items-center gap-1 mt-3">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <p className="text-xs text-muted-foreground">{attendancePercentage}% attendance</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                <h3 className="text-3xl font-heading font-bold text-foreground mt-2">{absentToday}</h3>
                <div className="flex items-center gap-1 mt-3">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <p className="text-xs text-muted-foreground">{Math.round((absentToday / totalStudents) * 100)}% absent</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Late / Leave</p>
                <h3 className="text-3xl font-heading font-bold text-foreground mt-2">{lateToday + leaveToday}</h3>
                <div className="flex items-center gap-1 mt-3">
                  <Clock className="w-4 h-4 text-warning" />
                  <p className="text-xs text-muted-foreground">Late: {lateToday}, Leave: {leaveToday}</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List with Filters */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <CardTitle className="text-xl font-heading font-semibold">Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0 h-10 rounded-lg"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-40 rounded-lg border-0 bg-muted/50">
                <SelectValue placeholder="Class" />
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

          {/* Student List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No students found</div>
            ) : (
              filteredStudents.slice(0, 10).map((student) => {
                const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`;
                // Mock attendance status - would come from actual records
                const statuses = ["Present", "Absent", "Late", "Leave"];
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {student.basic.firstName[0]}{student.basic.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.admissionNumber} • Class {student.academic.admissionClass}-{student.academic.section}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        randomStatus === "Present"
                          ? "bg-success text-success-foreground"
                          : randomStatus === "Absent"
                          ? "bg-destructive text-destructive-foreground"
                          : randomStatus === "Late"
                          ? "bg-warning text-warning-foreground"
                          : "bg-info text-info-foreground"
                      }`}
                    >
                      {randomStatus}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          {filteredStudents.length > 10 && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/students")}
                className="rounded-lg"
              >
                View All Students
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
