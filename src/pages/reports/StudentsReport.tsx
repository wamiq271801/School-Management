import { useState, useEffect } from "react";
import { ArrowLeft, Download, Filter, Search, FileSpreadsheet, FileText, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { subscribeToStudents, type Student } from "@/lib/firestore";
import { exportStudentsToExcel, exportStudentsToCSV } from "@/lib/exportUtils";
import ExportDialog from "@/components/exports/ExportDialog";
import { useToast } from "@/hooks/use-toast";

export default function StudentsReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = subscribeToStudents(setStudents);
    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      searchQuery === "" ||
      `${student.basic?.firstName} ${student.basic?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = classFilter === "all" || student.academic?.admissionClass === classFilter;
    const matchesFeeStatus = feeStatusFilter === "all" || student.fees?.paymentStatus === feeStatusFilter;
    
    return matchesSearch && matchesClass && matchesFeeStatus;
  });

  const handleQuickExport = async (format: 'excel' | 'csv') => {
    if (filteredStudents.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No students match the current filters.",
        variant: "destructive"
      });
      return;
    }

    try {
      const exportOptions = {
        includePersonalInfo: true,
        includeAcademicInfo: true,
        includeContactInfo: true,
        includeFeeInfo: true,
        filterByClass: classFilter !== 'all' ? classFilter : undefined,
        filterByFeeStatus: feeStatusFilter !== 'all' ? feeStatusFilter : undefined
      };

      if (format === 'excel') {
        await exportStudentsToExcel(filteredStudents, exportOptions);
        toast({
          title: "Excel Export Successful",
          description: `Exported ${filteredStudents.length} student records to Excel with advanced formatting.`
        });
      } else {
        await exportStudentsToCSV(filteredStudents);
        toast({
          title: "CSV Export Successful",
          description: `Exported ${filteredStudents.length} student records to CSV format.`
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting. Please try again.",
        variant: "destructive"
      });
    }
  };

  const classes = Array.from(new Set(students.map(s => s.academic?.admissionClass).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/reports")} className="rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Students Report</h1>
          <p className="text-muted-foreground mt-1">Comprehensive student data and analytics</p>
        </div>
      </div>

      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>Student Records ({filteredStudents.length})</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2 rounded-lg">
                    <Download className="w-4 h-4" />
                    Export Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-lg">
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => handleQuickExport('excel')}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Excel Report (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => handleQuickExport('csv')}
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    CSV Report (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <ExportDialog 
                      students={filteredStudents}
                      trigger={
                        <div className="flex items-center gap-2 w-full cursor-pointer">
                          <Settings className="w-4 h-4" />
                          Advanced Export Options
                        </div>
                      }
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={feeStatusFilter} onValueChange={setFeeStatusFilter}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Filter by Fee Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">{filteredStudents.length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-success">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Fees Paid</p>
                <p className="text-2xl font-bold text-success">
                  {filteredStudents.filter(s => s.fees?.paymentStatus === "paid").length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pending Dues</p>
                <p className="text-2xl font-bold text-warning">
                  ₹{filteredStudents.reduce((sum, s) => sum + (s.fees?.balanceDue || 0), 0).toLocaleString('en-IN')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Admission Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow 
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                    <TableCell className="font-medium">
                      {student.basic?.firstName} {student.basic?.lastName}
                    </TableCell>
                    <TableCell>{student.academic?.admissionClass || "N/A"}</TableCell>
                    <TableCell>{student.academic?.section || "N/A"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.fees?.paymentStatus === "paid" 
                          ? "bg-success/10 text-success"
                          : student.fees?.paymentStatus === "partial"
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {student.fees?.paymentStatus || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{(student.fees?.balanceDue || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{student.father?.mobile || student.mother?.mobile || "N/A"}</TableCell>
                    <TableCell>{new Date(student.admissionDate).toLocaleDateString('en-IN')}</TableCell>
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
