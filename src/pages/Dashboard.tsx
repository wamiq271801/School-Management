import { Users, UserPlus, DollarSign, Clock, TrendingUp, TrendingDown, GraduationCap, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const stats = [
  {
    title: "Total Students",
    value: "245",
    change: "+12 this month",
    trend: "up",
    icon: Users,
    color: "bg-info/10 text-info",
  },
  {
    title: "Total Teachers",
    value: "32",
    change: "2 on leave",
    trend: "up",
    icon: GraduationCap,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Fees Collected",
    value: "₹12,45,000",
    change: "78% of expected",
    trend: "up",
    icon: DollarSign,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Avg Attendance",
    value: "89.5%",
    change: "+2.3% this week",
    trend: "up",
    icon: Calendar,
    color: "bg-success/10 text-success",
  },
];

// Fee Collection Data
const feeCollectionData = [
  { month: "Apr", amount: 145000 },
  { month: "May", amount: 152000 },
  { month: "Jun", amount: 138000 },
  { month: "Jul", amount: 165000 },
  { month: "Aug", amount: 142000 },
  { month: "Sep", amount: 158000 },
];

// Fee Status Data
const feeStatusData = [
  { name: "Paid", value: 78, color: "hsl(var(--success))" },
  { name: "Pending", value: 15, color: "hsl(var(--warning))" },
  { name: "Overdue", value: 7, color: "hsl(var(--destructive))" },
];

// Attendance Data
const attendanceData = [
  { name: "Present", value: 89.5, color: "hsl(var(--success))" },
  { name: "Absent", value: 5.2, color: "hsl(var(--destructive))" },
  { name: "Late", value: 3.1, color: "hsl(var(--warning))" },
  { name: "Leave", value: 2.2, color: "hsl(var(--info))" },
];

// Teachers by Department
const teachersByDept = [
  { dept: "Science", count: 8 },
  { dept: "Math", count: 6 },
  { dept: "English", count: 5 },
  { dept: "Social", count: 7 },
  { dept: "Arts", count: 6 },
];

const recentAdmissions = [
  { id: "STU-2025-00001", name: "Aarav Sharma", class: "5", section: "A", date: "24 Oct 2025" },
  { id: "STU-2025-00002", name: "Diya Patel", class: "3", section: "B", date: "23 Oct 2025" },
  { id: "STU-2025-00003", name: "Rohan Kumar", class: "8", section: "A", date: "22 Oct 2025" },
  { id: "STU-2025-00004", name: "Ananya Singh", class: "2", section: "C", date: "21 Oct 2025" },
];

const alerts = [
  { type: "warning", message: "12 students with missing documents", count: 12 },
  { type: "error", message: "8 students with overdue fees", count: 8 },
  { type: "info", message: "25 fee payments due this week", count: 25 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your school overview.</p>
        </div>
        <Button
          onClick={() => navigate("/admission/step-1")}
          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-level-2 h-11 rounded-xl"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-medium">New Admission</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-heading font-bold text-foreground mt-2">{stat.value}</h3>
                  <div className="flex items-center gap-1 mt-3">
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics & Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Trend */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading font-semibold">Fee Collection Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly collection overview</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={feeCollectionData}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem"
                  }} 
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Payment Status */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading font-semibold">Fee Payment Status</CardTitle>
            <p className="text-sm text-muted-foreground">Current payment distribution</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={feeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {feeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem"
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading font-semibold">Attendance Summary</CardTitle>
            <p className="text-sm text-muted-foreground">Today's attendance breakdown</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem"
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Teachers by Department */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading font-semibold">Teachers by Department</CardTitle>
            <p className="text-sm text-muted-foreground">Department-wise distribution</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={teachersByDept}>
                <XAxis dataKey="dept" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem"
                  }} 
                />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Admissions */}
        <Card className="lg:col-span-2 rounded-xl shadow-level-2 border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-heading font-semibold">Recent Admissions</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/students")}
                className="text-primary hover:text-primary"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAdmissions.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {student.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        Class {student.class}-{student.section}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{student.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Reminders */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading font-semibold">Alerts & Reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg cursor-pointer transition-smooth ${
                  alert.type === "error"
                    ? "bg-destructive/10 hover:bg-destructive/20"
                    : alert.type === "warning"
                    ? "bg-warning/10 hover:bg-warning/20"
                    : "bg-info/10 hover:bg-info/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-foreground flex-1">{alert.message}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      alert.type === "error"
                        ? "bg-destructive text-destructive-foreground"
                        : alert.type === "warning"
                        ? "bg-warning text-warning-foreground"
                        : "bg-info text-info-foreground"
                    }`}
                  >
                    {alert.count}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
