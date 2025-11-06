import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, GraduationCap, DollarSign, Calendar, TrendingUp, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  subscribeToStudents, 
  subscribeToTeachers, 
  subscribeToFeeTransactions,
  type Student, 
  type Teacher,
  type FeeTransaction 
} from "@/lib/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))"];

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [academicYear, setAcademicYear] = useState("2024-25");

  useEffect(() => {
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubTeachers = subscribeToTeachers(setTeachers);
    const unsubTransactions = subscribeToFeeTransactions(setTransactions);
    
    return () => {
      unsubStudents();
      unsubTeachers();
      unsubTransactions();
    };
  }, []);

  // Calculate stats
  const totalStudents = students.filter(s => s.status === "active").length;
  const totalTeachers = teachers.filter(t => t.status === "Active").length;
  const totalFeesCollected = transactions.reduce((sum, t) => sum + t.amountPaid, 0);
  const pendingFees = students.reduce((sum, s) => sum + (s.fees?.balanceDue || 0), 0);

  // Fees collection by month
  const feesByMonth = transactions.reduce((acc, t) => {
    const month = new Date(t.paymentDate).toLocaleDateString('en-IN', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += t.amountPaid;
    } else {
      acc.push({ month, amount: t.amountPaid });
    }
    return acc;
  }, [] as { month: string; amount: number }[]);

  // Fee status distribution
  const feeStatusData = [
    { name: "Paid", value: students.filter(s => s.fees?.paymentStatus === "paid").length },
    { name: "Partial", value: students.filter(s => s.fees?.paymentStatus === "partial").length },
    { name: "Pending", value: students.filter(s => s.fees?.paymentStatus === "pending").length },
  ];

  // Students by class
  const studentsByClass = students.reduce((acc, s) => {
    const className = s.academic?.admissionClass || "Unknown";
    const existing = acc.find(item => item.class === className);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ class: className, count: 1 });
    }
    return acc;
  }, [] as { class: string; count: number }[]);

  // Teachers by department
  const teachersByDept = teachers.reduce((acc, t) => {
    const dept = t.employment?.department || "Unknown";
    const existing = acc.find(item => item.dept === dept);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ dept, count: 1 });
    }
    return acc;
  }, [] as { dept: string; count: number }[]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights into school operations</p>
        </div>
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger className="w-40 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-25">2024-25</SelectItem>
            <SelectItem value="2023-24">2023-24</SelectItem>
            <SelectItem value="2022-23">2022-23</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl shadow-level-2 border-0 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0 bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teachers</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalTeachers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0 bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fees Collected</p>
                <p className="text-3xl font-bold text-foreground mt-1">₹{totalFeesCollected.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0 bg-gradient-to-br from-warning/10 to-warning/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Fees</p>
                <p className="text-3xl font-bold text-foreground mt-1">₹{pendingFees.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="gap-2 rounded-lg h-auto py-4 flex-col items-start"
              onClick={() => navigate("/reports/students")}
            >
              <FileText className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Students Report</p>
                <p className="text-xs text-muted-foreground">View all student data</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="gap-2 rounded-lg h-auto py-4 flex-col items-start"
              onClick={() => navigate("/reports/teachers")}
            >
              <FileText className="w-5 h-5 text-accent" />
              <div className="text-left">
                <p className="font-semibold">Teachers Report</p>
                <p className="text-xs text-muted-foreground">View all teacher data</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="gap-2 rounded-lg h-auto py-4 flex-col items-start"
              onClick={() => navigate("/fees/reports")}
            >
              <FileText className="w-5 h-5 text-success" />
              <div className="text-left">
                <p className="font-semibold">Fees Report</p>
                <p className="text-xs text-muted-foreground">View fee transactions</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="gap-2 rounded-lg h-auto py-4 flex-col items-start"
              onClick={() => navigate("/attendance/reports")}
            >
              <FileText className="w-5 h-5 text-info" />
              <div className="text-left">
                <p className="font-semibold">Attendance Report</p>
                <p className="text-xs text-muted-foreground">View attendance data</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fees Collection Trend */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Monthly Fees Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="amount" fill="hsl(var(--success))" name="Amount Collected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Status Distribution */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Fee Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={feeStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {feeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Students by Class */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Students by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentsByClass}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Teachers by Department */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Teachers by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={teachersByDept}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ dept, count }) => `${dept}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {teachersByDept.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
