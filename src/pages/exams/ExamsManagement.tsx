import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createExam,
  updateExam,
  deleteExam,
  subscribeToExams,
  generateExamId,
  type ExamType,
} from "@/lib/firestoreExams";
import { triggerExamAddedNotification } from "@/lib/firestoreNotifications";

const ExamsManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [exams, setExams] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamType | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "Unit Test" as ExamType["type"],
    totalMarks: "",
    academicYear: new Date().getFullYear().toString(),
    classId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const unsubscribe = subscribeToExams((data) => {
      setExams(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingExam) {
        await updateExam(editingExam.id, {
          name: formData.name,
          type: formData.type,
          totalMarks: parseInt(formData.totalMarks),
          academicYear: formData.academicYear,
          classId: formData.classId,
          dateRange: {
            start: formData.startDate,
            end: formData.endDate,
          },
        });
        
        toast({
          title: "Success",
          description: "Exam updated successfully",
        });
      } else {
        const examId = await createExam({
          name: formData.name,
          type: formData.type,
          totalMarks: parseInt(formData.totalMarks),
          academicYear: formData.academicYear,
          classId: formData.classId,
          subjects: [],
          dateRange: {
            start: formData.startDate,
            end: formData.endDate,
          },
        });
        
        // Trigger notification
        await triggerExamAddedNotification(
          formData.classId,
          formData.name,
          formData.startDate
        );
        
        toast({
          title: "Success",
          description: "Exam created successfully",
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving exam:", error);
      toast({
        title: "Error",
        description: "Failed to save exam",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    
    try {
      await deleteExam(examId);
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (exam: ExamType) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      type: exam.type,
      totalMarks: exam.totalMarks.toString(),
      academicYear: exam.academicYear,
      classId: exam.classId,
      startDate: exam.dateRange.start,
      endDate: exam.dateRange.end,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Unit Test",
      totalMarks: "",
      academicYear: new Date().getFullYear().toString(),
      classId: "",
      startDate: "",
      endDate: "",
    });
    setEditingExam(null);
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
          <h1 className="text-3xl font-heading font-bold text-foreground">Exams & Marks</h1>
          <p className="text-muted-foreground mt-1">Manage exams and student performance</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-lg shadow-level-2">
              <Plus className="w-4 h-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle>{editingExam ? "Edit Exam" : "Create New Exam"}</DialogTitle>
              <DialogDescription>
                {editingExam ? "Update exam details" : "Add a new exam to the system"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Exam Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mid-term Examination 2024"
                  required
                  className="rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Exam Type</Label>
                  <Select value={formData.type} onValueChange={(value: ExamType["type"]) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unit Test">Unit Test</SelectItem>
                      <SelectItem value="Midterm">Midterm</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    placeholder="100"
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="2024"
                    required
                    className="rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <Input
                    id="classId"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    placeholder="10-A"
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" className="rounded-lg">
                  {editingExam ? "Update Exam" : "Create Exam"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exams Table */}
      <Card className="rounded-xl shadow-level-2 border-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Total Marks</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No exams found. Create your first exam to get started.
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg">
                      {exam.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{exam.classId}</TableCell>
                  <TableCell>{exam.totalMarks}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(exam.dateRange.start).toLocaleDateString()} -{" "}
                    {new Date(exam.dateRange.end).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{exam.academicYear}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/exams/${exam.id}/marks`)}
                        className="gap-2 rounded-lg"
                      >
                        <FileText className="w-4 h-4" />
                        Marks Entry
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(exam)}
                        className="rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(exam.id)}
                        className="text-destructive hover:text-destructive rounded-lg"
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
    </div>
  );
};

export default ExamsManagement;
