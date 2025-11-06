import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { subscribeToTeachers, deleteTeacher, updateTeacher, Teacher } from "@/lib/firestore";

const Teachers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTeachers((data) => {
      setTeachers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [teachers, searchQuery, statusFilter, departmentFilter]);

  const filterTeachers = () => {
    let filtered = [...teachers];

    if (searchQuery) {
      filtered = filtered.filter(
        (teacher) =>
          `${teacher.personal.firstName} ${teacher.personal.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          teacher.teacherId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          teacher.contact.mobile.includes(searchQuery)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((teacher) => teacher.status === statusFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (teacher) => teacher.employment.department === departmentFilter
      );
    }

    setFilteredTeachers(filtered);
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;

    try {
      await deleteTeacher(teacherToDelete);
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Error",
        description: "Failed to delete teacher",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeachers(filteredTeachers.map((t) => t.id));
    } else {
      setSelectedTeachers([]);
    }
  };

  const handleSelectTeacher = (teacherId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeachers([...selectedTeachers, teacherId]);
    } else {
      setSelectedTeachers(selectedTeachers.filter((id) => id !== teacherId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeachers.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedTeachers.length} teacher(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedTeachers.map((id) => deleteTeacher(id)));
      toast({
        title: "Success",
        description: `${selectedTeachers.length} teacher(s) deleted successfully`,
      });
      setSelectedTeachers([]);
    } catch (error) {
      console.error("Error deleting teachers:", error);
      toast({
        title: "Error",
        description: "Failed to delete some teachers",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async (status: "Active" | "On Leave" | "Resigned") => {
    if (selectedTeachers.length === 0) return;

    try {
      await Promise.all(
        selectedTeachers.map((id) => updateTeacher(id, { status }))
      );
      toast({
        title: "Success",
        description: `${selectedTeachers.length} teacher(s) updated to ${status}`,
      });
      setSelectedTeachers([]);
    } catch (error) {
      console.error("Error updating teachers:", error);
      toast({
        title: "Error",
        description: "Failed to update some teachers",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "On Leave":
        return "secondary";
      case "Resigned":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Teachers Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all teachers and their information
          </p>
        </div>
        <Button
          onClick={() => navigate("/teachers/manage")}
          className="gap-2 rounded-xl shadow-level-2"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Add Teacher
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 rounded-xl shadow-level-2 border-0">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            {selectedTeachers.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                    Bulk Actions ({selectedTeachers.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-lg">
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("Active")}>
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("On Leave")}>
                    Mark as On Leave
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("Resigned")}>
                    Mark as Resigned
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-muted/50 border-0 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Resigned">Resigned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px] bg-muted/50 border-0 rounded-lg">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Social Science">Social Science</SelectItem>
                <SelectItem value="Physical Education">Physical Education</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2 rounded-lg">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Teachers Table */}
      <Card className="rounded-xl shadow-level-2 border-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredTeachers.length > 0 &&
                    selectedTeachers.length === filteredTeachers.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold">Teacher ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Designation</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No teachers found
                </TableCell>
              </TableRow>
            ) : (
              filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-muted/50 transition-smooth">
                  <TableCell>
                    <Checkbox
                      checked={selectedTeachers.includes(teacher.id)}
                      onCheckedChange={(checked) =>
                        handleSelectTeacher(teacher.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{teacher.teacherId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {teacher.personal.profilePhotoUrl ? (
                        <img
                          src={teacher.personal.profilePhotoUrl}
                          alt={`${teacher.personal.firstName} ${teacher.personal.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {teacher.personal.firstName[0]}
                            {teacher.personal.lastName[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {teacher.personal.firstName} {teacher.personal.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {teacher.qualification.subjectExpertise.join(", ")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.employment.department}</TableCell>
                  <TableCell>{teacher.employment.designation}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{teacher.contact.mobile}</div>
                      {teacher.contact.email && (
                        <div className="text-muted-foreground">{teacher.contact.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(teacher.status)}>
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/teachers/${teacher.id}/manage`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTeacherToDelete(teacher.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <div className="text-2xl font-bold text-foreground">{teachers.length}</div>
          <div className="text-sm text-muted-foreground">Total Teachers</div>
        </Card>
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <div className="text-2xl font-bold text-foreground">
            {teachers.filter((t) => t.status === "Active").length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </Card>
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <div className="text-2xl font-bold text-foreground">
            {teachers.filter((t) => t.status === "On Leave").length}
          </div>
          <div className="text-sm text-muted-foreground">On Leave</div>
        </Card>
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <div className="text-2xl font-bold text-foreground">
            {new Set(teachers.map((t) => t.employment.department)).size}
          </div>
          <div className="text-sm text-muted-foreground">Departments</div>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this teacher? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Teachers;
