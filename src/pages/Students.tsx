import { useState, useEffect } from "react";
import { Search, Filter, Download, Plus, Eye, Edit, DollarSign, RefreshCw, Trash2, FileSpreadsheet, FileText, Settings, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  subscribeToStudents, 
  deleteStudent, 
  bulkUpdateStudents, 
  bulkDeleteStudents,
  updateStudent,
  type Student 
} from "@/lib/firestore";
import ExportDialog from "@/components/exports/ExportDialog";
import { exportStudentsToExcel, exportStudentsToCSV } from "@/lib/exportUtils";

const getFeeStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-success text-success-foreground">Paid</Badge>;
    case "partial":
      return <Badge className="bg-warning text-warning-foreground">Partial</Badge>;
    case "pending":
      return <Badge className="bg-info text-info-foreground">Pending</Badge>;
    case "overdue":
      return <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>;
    default:
      return null;
  }
};

export default function Students() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Subscribe to real-time students data
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data);
      setLoading(false);
      setSyncing(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    return (
      fullName.includes(search) ||
      student.admissionNumber.toLowerCase().includes(search) ||
      student.academic.rollNumber?.toLowerCase().includes(search)
    );
  });

  async function handleDeleteStudent(studentId: string, admissionNumber: string) {
    if (!confirm(`Are you sure you want to delete student ${admissionNumber}?`)) {
      return;
    }

    try {
      await deleteStudent(studentId);
      toast({
        title: "Student Deleted",
        description: "Student record has been permanently deleted.",
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    }
  }

  function handleRefresh() {
    setSyncing(true);
    // The subscription will automatically update
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedStudents.length} student(s)?`)) {
      return;
    }

    try {
      await bulkDeleteStudents(selectedStudents);
      toast({
        title: "Success",
        description: `${selectedStudents.length} student(s) deleted successfully`,
      });
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error deleting students:", error);
      toast({
        title: "Error",
        description: "Failed to delete some students",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async (status: "active" | "inactive") => {
    if (selectedStudents.length === 0) return;

    try {
      await bulkUpdateStudents(selectedStudents, { status });
      toast({
        title: "Success",
        description: `${selectedStudents.length} student(s) updated to ${status}`,
      });
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error updating students:", error);
      toast({
        title: "Error",
        description: "Failed to update some students",
        variant: "destructive",
      });
    }
  };

  const handleQuickExport = async (format: 'excel' | 'csv') => {
    if (filteredStudents.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No students available for export.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (format === 'excel') {
        await exportStudentsToExcel(filteredStudents, {
          includePersonalInfo: true,
          includeAcademicInfo: true,
          includeContactInfo: true,
          includeFeeInfo: true
        });
        toast({
          title: "Excel Export Successful",
          description: `Exported ${filteredStudents.length} student records to Excel.`
        });
      } else {
        await exportStudentsToCSV(filteredStudents);
        toast({
          title: "CSV Export Successful",
          description: `Exported ${filteredStudents.length} student records to CSV.`
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

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-bold text-foreground">All Students</h1>
            {syncing && <RefreshCw className="w-5 h-5 animate-spin text-primary" />}
          </div>
          <p className="text-muted-foreground mt-1">
            Total: <span className="font-semibold text-foreground">{students.length}</span> students
            {loading && " (Loading...)"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-level-2 h-11 rounded-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Student</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <DropdownMenuItem 
              onClick={() => navigate("/admission/student-info")}
              className="cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">Single Add</div>
                <div className="text-xs text-muted-foreground">Add one student manually</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate("/import")}
              className="cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">Bulk Import</div>
                <div className="text-xs text-muted-foreground">Import multiple students via Excel</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Control Bar */}
      <Card className="p-4 rounded-xl shadow-level-2 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, admission no., roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 h-10 rounded-lg"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {selectedStudents.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                    Bulk Actions ({selectedStudents.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-lg">
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("active")}>
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("inactive")}>
                    Mark as Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleBulkDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 rounded-lg"
              onClick={handleRefresh}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-lg">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => handleQuickExport('excel')}
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Quick Excel Export
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => handleQuickExport('csv')}
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  Quick CSV Export
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <ExportDialog 
                    students={filteredStudents}
                    trigger={
                      <div className="flex items-center gap-2 w-full cursor-pointer">
                        <Settings className="w-4 h-4" />
                        Advanced Export
                      </div>
                    }
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="rounded-xl shadow-level-2 border-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredStudents.length > 0 &&
                    selectedStudents.length === filteredStudents.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold">Admission No.</TableHead>
              <TableHead className="font-semibold">Student Name</TableHead>
              <TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Section</TableHead>
              <TableHead className="font-semibold">Roll No.</TableHead>
              <TableHead className="font-semibold">Gender</TableHead>
              <TableHead className="font-semibold">Date of Birth</TableHead>
              <TableHead className="font-semibold">Fee Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`;
                const initials = `${student.basic.firstName[0]}${student.basic.lastName[0]}`;
                const dob = new Date(student.basic.dateOfBirth).toLocaleDateString('en-IN');
                
                return (
                  <TableRow
                    key={student.id}
                    className="hover:bg-muted/50 cursor-pointer transition-smooth"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) =>
                          handleSelectStudent(student.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {initials}
                          </span>
                        </div>
                        <span className="font-medium">{fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                        {student.academic.admissionClass}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                        {student.academic.section}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{student.academic.rollNumber || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{student.basic.gender}</TableCell>
                    <TableCell className="text-muted-foreground">{dob}</TableCell>
                    <TableCell>{getFeeStatusBadge(student.fees?.paymentStatus || "pending")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="rounded-lg">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-lg">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => navigate(`/students/${student.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="w-4 h-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => navigate(`/fees/manage?studentId=${student.id}`)}
                          >
                            <DollarSign className="w-4 h-4" />
                            Add Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-destructive"
                            onClick={() => handleDeleteStudent(student.id, student.admissionNumber)}
                          >
                            <Edit className="w-4 h-4" />
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">1-{filteredStudents.length}</span> of{" "}
          <span className="font-medium text-foreground">{students.length}</span> students
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="rounded-lg">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground rounded-lg">
            1
          </Button>
          <Button variant="outline" size="sm" disabled className="rounded-lg">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
