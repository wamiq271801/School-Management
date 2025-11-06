import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Plus,
  FileText,
  Search,
  Filter,
  Calendar,
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
import { subscribeToStudents, subscribeToFeeTransactions, type Student, type FeeTransaction } from "@/lib/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = {
  paid: "hsl(122, 39%, 49%)",
  partial: "hsl(45, 100%, 51%)",
  pending: "hsl(199, 98%, 48%)",
  overdue: "hsl(4, 90%, 58%)",
};

export default function FeesDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    const unsubscribeStudents = subscribeToStudents((data) => {
      setStudents(data);
      setLoading(false);
    });

    const unsubscribeTransactions = subscribeToFeeTransactions((data) => {
      setTransactions(data);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeTransactions();
    };
  }, []);

  // Calculate statistics
  const totalStudents = students.length;
  const totalCollected = transactions.reduce((sum, t) => sum + t.amountPaid, 0);
  
  const studentsByStatus = {
    paid: students.filter((s) => s.fees?.paymentStatus === "paid").length,
    partial: students.filter((s) => s.fees?.paymentStatus === "partial").length,
    pending: students.filter((s) => s.fees?.paymentStatus === "pending").length,
    overdue: students.filter((s) => s.fees?.paymentStatus === "overdue").length,
  };

  const pendingAmount = students
    .filter((s) => s.fees?.paymentStatus !== "paid")
    .reduce((sum, s) => sum + (s.fees?.balanceDue || 0), 0);

  // Pie chart data
  const pieData = [
    { name: "Paid", value: studentsByStatus.paid, color: COLORS.paid },
    { name: "Partial", value: studentsByStatus.partial, color: COLORS.partial },
    { name: "Pending", value: studentsByStatus.pending, color: COLORS.pending },
    { name: "Overdue", value: studentsByStatus.overdue, color: COLORS.overdue },
  ];

  // Monthly collection data (last 6 months)
  const getMonthlyData = () => {
    const monthlyData: { [key: string]: number } = {};
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      months.push(monthKey);
      monthlyData[monthKey] = 0;
    }

    transactions.forEach((t) => {
      const date = new Date(t.paymentDate);
      const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += t.amountPaid;
      }
    });

    return months.map((month) => ({
      month,
      amount: monthlyData[month],
    }));
  };

  const monthlyData = getMonthlyData();

  // Filter students
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      fullName.includes(search) ||
      student.admissionNumber.toLowerCase().includes(search);
    
    const matchesClass = selectedClass === "all" || student.academic.admissionClass === selectedClass;
    const matchesStatus = selectedStatus === "all" || student.fees?.paymentStatus === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Get unique classes
  const uniqueClasses = Array.from(new Set(students.map((s) => s.academic.admissionClass))).sort();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Fees Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage fee collection, structures, and reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/fees/collect")}
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-level-2 h-11 rounded-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Collect Fees</span>
          </Button>
          <Button
            onClick={() => navigate("/fees/reports")}
            variant="outline"
            className="gap-2 h-11 rounded-xl"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Reports</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <h3 className="text-3xl font-heading font-bold text-foreground mt-2">{totalStudents}</h3>
                <div className="flex items-center gap-1 mt-3">
                  <TrendingUp className="w-4 h-4 text-success" />
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
                <p className="text-sm font-medium text-muted-foreground">Fees Collected</p>
                <h3 className="text-3xl font-heading font-bold text-foreground mt-2">
                  ₹{(totalCollected / 100000).toFixed(2)}L
                </h3>
                <div className="flex items-center gap-1 mt-3">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <p className="text-xs text-muted-foreground">{transactions.length} transactions</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Dues</p>
                <h3 className="text-3xl font-heading font-bold text-foreground mt-2">
                  ₹{(pendingAmount / 100000).toFixed(2)}L
                </h3>
                <div className="flex items-center gap-1 mt-3">
                  <Clock className="w-4 h-4 text-warning" />
                  <p className="text-xs text-muted-foreground">
                    {studentsByStatus.pending + studentsByStatus.partial} students
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0 transition-smooth hover:shadow-level-3">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <h3 className="text-3xl font-heading font-bold text-foreground mt-2">
                  {studentsByStatus.overdue}
                </h3>
                <div className="flex items-center gap-1 mt-3">
                  <Calendar className="w-4 h-4 text-destructive" />
                  <p className="text-xs text-muted-foreground">Students with overdue fees</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection Chart */}
        <Card className="lg:col-span-2 rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle className="text-xl font-heading font-semibold">Monthly Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Pie Chart */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle className="text-xl font-heading font-semibold">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List with Filters */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl font-heading font-semibold">Students Fee Status</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/fees/structure")}
                variant="outline"
                size="sm"
                className="gap-2 rounded-lg"
              >
                <FileText className="w-4 h-4" />
                Fee Structures
              </Button>
            </div>
          </div>
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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-40 rounded-lg border-0 bg-muted/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
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
                const feeStatus = student.fees?.paymentStatus || "pending";
                
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
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          ₹{student.fees?.balanceDue?.toLocaleString('en-IN') || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance Due</p>
                      </div>
                      <Badge
                        className={`${
                          feeStatus === "paid"
                            ? "bg-success text-success-foreground"
                            : feeStatus === "partial"
                            ? "bg-warning text-warning-foreground"
                            : feeStatus === "pending"
                            ? "bg-info text-info-foreground"
                            : "bg-destructive text-destructive-foreground"
                        }`}
                      >
                        {feeStatus}
                      </Badge>
                    </div>
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
                View All Students ({filteredStudents.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
