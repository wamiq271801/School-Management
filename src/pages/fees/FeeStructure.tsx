import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  subscribeToFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  type FeeStructure,
} from "@/lib/firestore";

export default function FeeStructurePage() {
  const { toast } = useToast();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState({
    className: "",
    academicYear: "",
    admissionFee: 0,
    tuitionFee: 0,
    transportFee: 0,
    labFee: 0,
    examFee: 0,
    otherCharges: 0,
  });

  useEffect(() => {
    const unsubscribe = subscribeToFeeStructures((data) => {
      setStructures(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const calculateTotal = () => {
    return (
      formData.admissionFee +
      formData.tuitionFee +
      formData.transportFee +
      formData.labFee +
      formData.examFee +
      formData.otherCharges
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const totalAnnual = calculateTotal();

      if (selectedStructure) {
        // Update existing structure
        await updateFeeStructure(selectedStructure.id, {
          ...formData,
          totalAnnual,
        });
        toast({
          title: "Fee Structure Updated",
          description: "Fee structure has been successfully updated.",
        });
      } else {
        // Create new structure
        await createFeeStructure({
          ...formData,
          totalAnnual,
        });
        toast({
          title: "Fee Structure Created",
          description: "New fee structure has been successfully created.",
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving fee structure:", error);
      toast({
        title: "Error",
        description: "Failed to save fee structure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (structure: FeeStructure) => {
    setSelectedStructure(structure);
    setFormData({
      className: structure.className,
      academicYear: structure.academicYear,
      admissionFee: structure.admissionFee,
      tuitionFee: structure.tuitionFee,
      transportFee: structure.transportFee,
      labFee: structure.labFee,
      examFee: structure.examFee,
      otherCharges: structure.otherCharges,
    });
    setDialogOpen(true);
  };

  const handleClone = (structure: FeeStructure) => {
    setSelectedStructure(null);
    setFormData({
      className: structure.className,
      academicYear: new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString().slice(-2),
      admissionFee: structure.admissionFee,
      tuitionFee: structure.tuitionFee,
      transportFee: structure.transportFee,
      labFee: structure.labFee,
      examFee: structure.examFee,
      otherCharges: structure.otherCharges,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedStructure) return;

    try {
      await deleteFeeStructure(selectedStructure.id);
      toast({
        title: "Fee Structure Deleted",
        description: "Fee structure has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setSelectedStructure(null);
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      toast({
        title: "Error",
        description: "Failed to delete fee structure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      className: "",
      academicYear: "",
      admissionFee: 0,
      tuitionFee: 0,
      transportFee: 0,
      labFee: 0,
      examFee: 0,
      otherCharges: 0,
    });
    setSelectedStructure(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Fee Structures</h1>
          <p className="text-muted-foreground mt-1">
            Manage fee structures for different classes and academic years
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-level-2 h-11 rounded-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Fee Structure</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading">
                {selectedStructure ? "Edit Fee Structure" : "Add New Fee Structure"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name *</Label>
                  <Input
                    id="className"
                    placeholder="e.g., 10th A"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Input
                    id="academicYear"
                    placeholder="e.g., 2025-26"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Fee Components</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admissionFee">Admission Fee (₹)</Label>
                    <Input
                      id="admissionFee"
                      type="number"
                      value={formData.admissionFee}
                      onChange={(e) =>
                        setFormData({ ...formData, admissionFee: Number(e.target.value) })
                      }
                      min="0"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tuitionFee">Tuition Fee (₹)</Label>
                    <Input
                      id="tuitionFee"
                      type="number"
                      value={formData.tuitionFee}
                      onChange={(e) =>
                        setFormData({ ...formData, tuitionFee: Number(e.target.value) })
                      }
                      min="0"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transportFee">Transport Fee (₹)</Label>
                    <Input
                      id="transportFee"
                      type="number"
                      value={formData.transportFee}
                      onChange={(e) =>
                        setFormData({ ...formData, transportFee: Number(e.target.value) })
                      }
                      min="0"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labFee">Lab Fee (₹)</Label>
                    <Input
                      id="labFee"
                      type="number"
                      value={formData.labFee}
                      onChange={(e) =>
                        setFormData({ ...formData, labFee: Number(e.target.value) })
                      }
                      min="0"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examFee">Exam Fee (₹)</Label>
                    <Input
                      id="examFee"
                      type="number"
                      value={formData.examFee}
                      onChange={(e) =>
                        setFormData({ ...formData, examFee: Number(e.target.value) })
                      }
                      min="0"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherCharges">Other Charges (₹)</Label>
                    <Input
                      id="otherCharges"
                      type="number"
                      value={formData.otherCharges}
                      onChange={(e) =>
                        setFormData({ ...formData, otherCharges: Number(e.target.value) })
                      }
                      min="0"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total Annual Fee:</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{calculateTotal().toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg bg-primary">
                  {selectedStructure ? "Update Structure" : "Create Structure"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fee Structures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Loading fee structures...
          </div>
        ) : structures.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No fee structures found. Create one to get started.
          </div>
        ) : (
          structures.map((structure) => (
            <Card key={structure.id} className="rounded-xl shadow-level-2 border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-heading">{structure.className}</CardTitle>
                    <Badge className="mt-2 bg-primary/20 text-primary border-0">
                      {structure.academicYear}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClone(structure)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-background/50"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(structure)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-background/50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedStructure(structure);
                        setDeleteDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/20 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Admission Fee:</span>
                    <span className="font-medium">₹{structure.admissionFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tuition Fee:</span>
                    <span className="font-medium">₹{structure.tuitionFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transport Fee:</span>
                    <span className="font-medium">₹{structure.transportFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lab Fee:</span>
                    <span className="font-medium">₹{structure.labFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exam Fee:</span>
                    <span className="font-medium">₹{structure.examFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Other Charges:</span>
                    <span className="font-medium">₹{structure.otherCharges.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total Annual:</span>
                    <span className="text-xl font-bold text-primary">
                      ₹{structure.totalAnnual.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the fee structure for{" "}
              <span className="font-semibold">{selectedStructure?.className}</span> (
              {selectedStructure?.academicYear}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-lg"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
