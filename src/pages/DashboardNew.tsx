import { useState, useEffect } from "react";
import { Users, UserPlus, DollarSign, Calendar, TrendingUp, GraduationCap, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { supabase, type Student, type Teacher, type FeeTransaction, type Attendance } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  info: "hsl(var(--info))",
  destructive: "hsl(var(--destructive))"
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState("2024-25");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, transactionsRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('teachers').select('*').order('created_at', { ascending: false }),
        supabase.from('fee_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('attendance').select('*').gte('attendance_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);

      setStudents(studentsRes.data || []);
      setTeachers(teachersRes.data || []);
      setTransactions(transactionsRes.data || []);
      setAttendance(attendanceRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeStudents = students.filter(s => s.status === 'active').length;
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;
  const totalFeesCollected = transactions.reduce((sum, t) => sum + Number(t.amount_paid), 0);

  const todayAttendance = attendance.filter(a => a.attendance_date === new Date().toISOString().split('T')[0]);
  const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
  const avgAttendance = todayAttendance.length > 0 ? (presentToday / todayAttendance.length * 100).toFixed(1) : '0';

  const stats = [
    {
      title: "Total Students",
      value: activeStudents.toString(),
      change: `${students.length} total enrolled`,
      icon: Users,
      color: "bg-info/10 text-info",
    },
    {
      title: "Total Teachers",
      value: activeTeachers.toString(),
      change: `${teachers.filter(t => t.status === 'On Leave').length} on leave`,
      icon: GraduationCap,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Fees Collected",
      value: `₹${(totalFeesCollected / 100000).toFixed(2)}L`,
      change: `${transactions.length} transactions`,
      icon: DollarSign,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Avg Attendance",
      value: `${avgAttendance}%`,
      change: `${presentToday}/${todayAttendance.length} present today`,
      icon: Calendar,
      color: "bg-success/10 text-success",
    },
  ];

  const feeCollectionData = transactions.reduce((acc, t) => {
    const month = new Date(t.payment_date).toLocaleDateString('en-IN', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += Number(t.amount_paid);
    } else {
      acc.push({ month, amount: Number(t.amount_paid) });
    }
    return acc;
  }, [] as { month: string; amount: number }[]).slice(0, 6);

  const studentsByClass = students.reduce((acc, s) => {
    const className = s.current_class;
    const existing = acc.find(item => item.class === className);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ class: className, count: 1 });
    }
    return acc;
  }, [] as { class: string; count: number }[]).slice(0, 10);

  const teachersByDept = teachers.reduce((acc, t) => {
    const dept = t.department;
    const existing = acc.find(item => item.dept === dept);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ dept, count: 1 });
    }
    return acc;
  }, [] as { dept: string; count: number }[]);

  const attendanceSummary = [
    { name: "Present", value: attendance.filter(a => a.status === 'Present').length, color: CHART_COLORS.success },
    { name: "Absent", value: attendance.filter(a => a.status === 'Absent').length, color: CHART_COLORS.destructive },
    { name: "Late", value: attendance.filter(a => a.status === 'Late').length, color: CHART_COLORS.warning },
    { name: "Leave", value: attendance.filter(a => a.status === 'Leave').length, color: CHART_COLORS.info },
  ];

  const categoryDistribution = [
    { name: "General", value: students.filter(s => s.category === 'General').length, color: CHART_COLORS.primary },
    { name: "OBC", value: students.filter(s => s.category === 'OBC').length, color: CHART_COLORS.accent },
    { name: "SC", value: students.filter(s => s.category === 'SC').length, color: CHART_COLORS.success },
    { name: "ST", value: students.filter(s => s.category === 'ST').length, color: CHART_COLORS.warning },
    { name: "EWS", value: students.filter(s => s.category === 'EWS').length, color: CHART_COLORS.info },
  ];

  const recentAdmissions = students.slice(0, 4).map(s => ({
    id: s.id,
    admissionNumber: s.admission_number,
    name: `${s.first_name} ${s.last_name}`,
    class: s.current_class,
    section: s.section,
    date: new Date(s.admission_date).toLocaleDateString('en-IN')
  }));

  const alerts = [
    { type: "warning", message: `${students.filter(s => !s.aadhaar_number).length} students without Aadhaar`, count: students.filter(s => !s.aadhaar_number).length },
    { type: "info", message: `${students.filter(s => s.rte_beneficiary).length} RTE students enrolled`, count: students.filter(s => s.rte_beneficiary).length },
    { type: "warning", message: `${students.filter(s => s.status === 'tc_issued').length} students with TC issued`, count: students.filter(s => s.status === 'tc_issued').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard & Analytics</h1>
            <p className="text-muted-foreground mt-1">Comprehensive school management overview</p>
          </div>
          <div className="flex gap-3">
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-40 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-25">2024-25</SelectItem>
                <SelectItem value="2023-24">2023-24</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => navigate("/admission/student-info")}
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-level-2 h-11 rounded-xl"
            >
              <UserPlus className="w-5 h-5" />
              New Admission
            </Button>
          </div>
        </div>

        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          <TabsTrigger value="insights">Detailed Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title} className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <h3 className="text-3xl font-heading font-bold text-foreground mt-2">{stat.value}</h3>
                      <div className="flex items-center gap-1 mt-3">
                        <TrendingUp className="w-4 h-4 text-success" />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-xl shadow-level-2 border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-heading font-semibold">Recent Admissions</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/students")}>
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
                          <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {student.class}-{student.section}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{student.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-level-2 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading font-semibold">Important Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg cursor-pointer transition-smooth ${
                      alert.type === "warning"
                        ? "bg-warning/10 hover:bg-warning/20"
                        : "bg-info/10 hover:bg-info/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-foreground flex-1">{alert.message}</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          alert.type === "warning"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-xl shadow-level-2 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading font-semibold">Fee Collection (Last 6 Months)</CardTitle>
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
                      formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                    />
                    <Bar dataKey="amount" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-level-2 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading font-semibold">Teachers by Department</CardTitle>
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
                    <Bar dataKey="count" fill={CHART_COLORS.accent} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-xl shadow-level-2 border-0 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{students.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-level-2 border-0 bg-gradient-to-br from-accent/10 to-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Teachers</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{teachers.length}</p>
                  </div>
                  <GraduationCap className="w-12 h-12 text-accent opacity-20" />
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
                  <DollarSign className="w-12 h-12 text-success opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-level-2 border-0 bg-gradient-to-br from-info/10 to-info/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">RTE Students</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{students.filter(s => s.rte_beneficiary).length}</p>
                  </div>
                  <FileText className="w-12 h-12 text-info opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl shadow-level-2 border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quick Report Actions</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="gap-2 rounded-lg h-auto py-4 flex-col items-start"
                  onClick={() => navigate("/students")}
                >
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Students Report</p>
                    <p className="text-xs text-muted-foreground">All student data</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 rounded-lg h-auto py-4 flex-col items-start"
                  onClick={() => navigate("/teachers")}
                >
                  <FileText className="w-5 h-5 text-accent" />
                  <div className="text-left">
                    <p className="font-semibold">Teachers Report</p>
                    <p className="text-xs text-muted-foreground">All teacher data</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 rounded-lg h-auto py-4 flex-col items-start"
                  onClick={() => navigate("/fees")}
                >
                  <FileText className="w-5 h-5 text-success" />
                  <div className="text-left">
                    <p className="font-semibold">Fees Report</p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 rounded-lg h-auto py-4 flex-col items-start"
                  onClick={() => navigate("/attendance")}
                >
                  <FileText className="w-5 h-5 text-info" />
                  <div className="text-left">
                    <p className="font-semibold">Attendance Report</p>
                    <p className="text-xs text-muted-foreground">Daily records</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-xl shadow-level-2 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading font-semibold">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
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

            <Card className="rounded-xl shadow-level-2 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading font-semibold">Students by Class</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={studentsByClass}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="class" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem"
                      }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-xl shadow-level-2 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading font-semibold">Attendance (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={attendanceSummary}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceSummary.map((entry, index) => (
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

            <Card className="rounded-xl shadow-level-2 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading font-semibold">Key Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Male Students</span>
                  <span className="text-lg font-bold text-primary">{students.filter(s => s.gender === 'Male').length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Female Students</span>
                  <span className="text-lg font-bold text-accent">{students.filter(s => s.gender === 'Female').length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">RTE Quota</span>
                  <span className="text-lg font-bold text-success">{students.filter(s => s.rte_beneficiary).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">BPL Category</span>
                  <span className="text-lg font-bold text-warning">{students.filter(s => s.bpl_category).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">TC Issued</span>
                  <span className="text-lg font-bold text-destructive">{students.filter(s => s.status === 'tc_issued').length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
