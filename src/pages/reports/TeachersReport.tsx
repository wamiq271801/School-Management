import { useState, useEffect } from "react";
import { ArrowLeft, Download, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { subscribeToTeachers, type Teacher } from "@/lib/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))"];

export default function TeachersReport() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = subscribeToTeachers(setTeachers);
    return () => unsubscribe();
  }, []);

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      searchQuery === "" ||
      `${teacher.personal?.firstName} ${teacher.personal?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = departmentFilter === "all" || teacher.employment?.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || teacher.status === statusFilter;
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Analytics data
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

  const statusDistribution = [
    { name: "Active", value: teachers.filter(t => t.status === "Active").length },
    { name: "On Leave", value: teachers.filter(t => t.status === "On Leave").length },
    { name: "Resigned", value: teachers.filter(t => t.status === "Resigned").length },
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("SmartSchool - Teachers Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
    
    const tableData = filteredTeachers.map(t => [
      t.teacherId,
      `${t.personal?.firstName} ${t.personal?.lastName}`,
      t.employment?.department || "N/A",
      t.employment?.designation || "N/A",
      new Date(t.employment?.dateOfJoining).toLocaleDateString('en-IN'),
      t.status,
    ]);

    autoTable(doc, {
      head: [["Teacher ID", "Name", "Department", "Designation", "Joining Date", "Status"]],
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [91, 72, 122] },
    });

    doc.save(`teachers-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ["Teacher ID", "Name", "Department", "Designation", "Joining Date", "Experience", "Status", "Contact"];
    const rows = filteredTeachers.map(t => [
      t.teacherId,
      `${t.personal?.firstName} ${t.personal?.lastName}`,
      t.employment?.department || "N/A",
      t.employment?.designation || "N/A",
      new Date(t.employment?.dateOfJoining).toLocaleDateString('en-IN'),
      `${t.qualification?.yearsOfExperience || 0} years`,
      t.status,
      t.contact?.mobile || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teachers-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const departments = Array.from(new Set(teachers.map(t => t.employment?.department).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/reports")} className="rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Teachers Report</h1>
          <p className="text-muted-foreground mt-1">Comprehensive teacher data and analytics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl shadow-level-2 border-0 border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Teachers</p>
            <p className="text-2xl font-bold text-foreground">{filteredTeachers.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-level-2 border-0 border-l-4 border-l-success">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">
              {filteredTeachers.filter(t => t.status === "Active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-level-2 border-0 border-l-4 border-l-warning">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">On Leave</p>
            <p className="text-2xl font-bold text-warning">
              {filteredTeachers.filter(t => t.status === "On Leave").length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-level-2 border-0 border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Resigned</p>
            <p className="text-2xl font-bold text-destructive">
              {filteredTeachers.filter(t => t.status === "Resigned").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Teachers by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teachersByDept}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--accent))" name="Teachers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>Teacher Records ({filteredTeachers.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 rounded-lg" onClick={exportToCSV}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button className="gap-2 rounded-lg" onClick={exportToPDF}>
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Resigned">Resigned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow 
                    key={teacher.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{teacher.teacherId}</TableCell>
                    <TableCell className="font-medium">
                      {teacher.personal?.firstName} {teacher.personal?.lastName}
                    </TableCell>
                    <TableCell>{teacher.employment?.department || "N/A"}</TableCell>
                    <TableCell>{teacher.employment?.designation || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(teacher.employment?.dateOfJoining).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>{teacher.qualification?.yearsOfExperience || 0} years</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        teacher.status === "Active" 
                          ? "bg-success/10 text-success"
                          : teacher.status === "On Leave"
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {teacher.status}
                      </span>
                    </TableCell>
                    <TableCell>{teacher.contact?.mobile || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
