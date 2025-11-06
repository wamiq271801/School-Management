import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getStudent,
  getFeeStructures,
  createFeeTransaction,
  updateStudent,
  type Student,
  type FeeStructure,
} from "@/lib/firestore";
import { generateFeeReceipt } from "@/lib/receiptGenerator";

const ManageFees = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<string>("");
  
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "Cash" as "Cash" | "Cheque" | "UPI" | "Bank Transfer" | "Online",
    paidAmount: 0,
    transactionRef: "",
    remarks: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFeeStructures();
    if (studentIdParam) {
      loadStudent(studentIdParam);
    }
  }, [studentIdParam]);

  const loadFeeStructures = async () => {
    try {
      const structures = await getFeeStructures();
      setFeeStructures(structures);
    } catch (error) {
      console.error("Error loading fee structures:", error);
    }
  };

  const loadStudent = async (studentId: string) => {
    try {
      const student = await getStudent(studentId);
      if (student) {
        setSelectedStudent(student);
        setSearchQuery(`${student.basic.firstName} ${student.basic.lastName}`);
      }
    } catch (error) {
      console.error("Error loading student:", error);
      toast({
        title: "Error",
        description: "Failed to load student details",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    // In a real implementation, you'd search by name/admission number
    toast({
      title: "Search",
      description: "Search functionality to be implemented with student lookup",
    });
  };

  const handleAssignStructure = async () => {
    if (!selectedStudent || !selectedStructure) {
      toast({
        title: "Error",
        description: "Please select both student and fee structure",
        variant: "destructive",
      });
      return;
    }

    const structure = feeStructures.find((s) => s.id === selectedStructure);
    if (!structure) return;

    try {
      await updateStudent(selectedStudent.id, {
        fees: {
          structure: {
            admissionFee: structure.admissionFee,
            tuitionFee: structure.tuitionFee,
            transportFee: structure.transportFee,
            annualCharges: 0,
            cautionDeposit: 0,
            computerLabFee: structure.labFee || 0,
            libraryFee: 0,
            examinationFee: structure.examFee || 0,
            otherCharges: structure.otherCharges,
          },
          totalFee: structure.totalAnnual,
          amountPaid: selectedStudent.fees?.amountPaid || 0,
          balanceDue: structure.totalAnnual - (selectedStudent.fees?.amountPaid || 0),
          paymentStatus: "pending" as const,
        },
      });

      toast({
        title: "Success",
        description: "Fee structure assigned successfully",
      });

      // Reload student data
      loadStudent(selectedStudent.id);
    } catch (error) {
      console.error("Error assigning fee structure:", error);
      toast({
        title: "Error",
        description: "Failed to assign fee structure",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedStudent || !selectedStudent.fees) {
      toast({
        title: "Error",
        description: "Please select a student with assigned fee structure",
        variant: "destructive",
      });
      return;
    }

    if (paymentData.paidAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const newAmountPaid = (selectedStudent.fees.amountPaid || 0) + paymentData.paidAmount;
      const newBalanceDue = selectedStudent.fees.totalFee - newAmountPaid;

      // Determine payment status
      let paymentStatus: "paid" | "partial" | "pending" | "overdue" = "pending";
      if (newBalanceDue === 0) {
        paymentStatus = "paid";
      } else if (newAmountPaid > 0) {
        paymentStatus = "partial";
      }

      // Create transaction record
      const transactionId = await createFeeTransaction({
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.basic.firstName} ${selectedStudent.basic.lastName}`,
        admissionNumber: selectedStudent.admissionNumber,
        className: selectedStudent.academic.admissionClass,
        section: selectedStudent.academic.section,
        amountPaid: paymentData.paidAmount,
        totalDueBefore: selectedStudent.fees.balanceDue,
        balanceAfter: newBalanceDue,
        paymentMode: paymentData.paymentMode,
        transactionRef: paymentData.transactionRef,
        paymentDate: paymentData.paymentDate,
        remarks: paymentData.remarks,
      });

      // Update student fees
      await updateStudent(selectedStudent.id, {
        fees: {
          ...selectedStudent.fees,
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          paymentStatus,
        },
      });

      // Generate receipt
      generateFeeReceipt({
        transactionId,
        studentName: `${selectedStudent.basic.firstName} ${selectedStudent.basic.lastName}`,
        admissionNumber: selectedStudent.admissionNumber,
        className: selectedStudent.academic.admissionClass,
        section: selectedStudent.academic.section,
        amountPaid: paymentData.paidAmount,
        paymentMode: paymentData.paymentMode,
        paymentDate: paymentData.paymentDate,
        totalDue: selectedStudent.fees.totalFee,
        balanceAfter: newBalanceDue,
      });

      toast({
        title: "Success",
        description: "Payment collected and receipt generated successfully",
      });

      // Reset form
      setPaymentData({
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: "Cash",
        paidAmount: 0,
        transactionRef: "",
        remarks: "",
      });

      // Reload student data
      loadStudent(selectedStudent.id);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/fees")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Manage Fees
            </h1>
            <p className="text-muted-foreground mt-1">
              Assign fee structure and collect payments
            </p>
          </div>
        </div>
      </div>

      {/* Student Search */}
      <Card className="p-6 rounded-xl shadow-level-2 border-0">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Search Student
        </h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, admission number, or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50 border-0 rounded-lg"
            />
          </div>
          <Button onClick={handleSearch} className="gap-2 rounded-lg">
            <Search className="w-4 h-4" />
            Search
          </Button>
        </div>

        {selectedStudent && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground">
                  {selectedStudent.basic.firstName} {selectedStudent.basic.lastName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedStudent.admissionNumber} • Class{" "}
                  {selectedStudent.academic.admissionClass} -{" "}
                  {selectedStudent.academic.section}
                </p>
              </div>
              {selectedStudent.fees && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{selectedStudent.fees.balanceDue.toLocaleString()}
                  </p>
                  <Badge
                    className={
                      selectedStudent.fees.paymentStatus === "paid"
                        ? "bg-success text-success-foreground"
                        : selectedStudent.fees.paymentStatus === "partial"
                        ? "bg-warning text-warning-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }
                  >
                    {selectedStudent.fees.paymentStatus}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Fee Structure Assignment */}
      {selectedStudent && (
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Assign Fee Structure
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Select Fee Structure</Label>
              <Select value={selectedStructure} onValueChange={setSelectedStructure}>
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue placeholder="Select a fee structure" />
                </SelectTrigger>
                <SelectContent>
                  {feeStructures.map((structure) => (
                    <SelectItem key={structure.id} value={structure.id}>
                      {structure.className} - {structure.academicYear} (₹
                      {structure.totalAnnual.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStructure && (
              <div className="p-4 bg-muted/50 rounded-lg">
                {(() => {
                  const structure = feeStructures.find(
                    (s) => s.id === selectedStructure
                  );
                  if (!structure) return null;
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Admission Fee</p>
                        <p className="text-lg font-semibold">
                          ₹{structure.admissionFee.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tuition Fee</p>
                        <p className="text-lg font-semibold">
                          ₹{structure.tuitionFee.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Transport Fee</p>
                        <p className="text-lg font-semibold">
                          ₹{structure.transportFee.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lab Fee</p>
                        <p className="text-lg font-semibold">
                          ₹{structure.labFee.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Exam Fee</p>
                        <p className="text-lg font-semibold">
                          ₹{structure.examFee.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Other Charges</p>
                        <p className="text-lg font-semibold">
                          ₹{structure.otherCharges.toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-border">
                        <p className="text-sm text-muted-foreground">Total Annual Fee</p>
                        <p className="text-2xl font-bold text-primary">
                          ₹{structure.totalAnnual.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <Button
              onClick={handleAssignStructure}
              disabled={!selectedStructure}
              className="w-full rounded-lg"
            >
              Assign Fee Structure
            </Button>
          </div>
        </Card>
      )}

      {/* Payment Collection */}
      {selectedStudent && selectedStudent.fees && (
        <Card className="p-6 rounded-xl shadow-level-2 border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Collect Payment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, paymentDate: e.target.value })
                }
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Payment Mode</Label>
              <Select
                value={paymentData.paymentMode}
                onValueChange={(value: any) =>
                  setPaymentData({ ...paymentData, paymentMode: value })
                }
              >
                <SelectTrigger className="bg-muted/50 border-0 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount Paid (₹)</Label>
              <Input
                type="number"
                value={paymentData.paidAmount || ""}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    paidAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Enter amount"
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div>
              <Label>Transaction Reference (Optional)</Label>
              <Input
                value={paymentData.transactionRef}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    transactionRef: e.target.value,
                  })
                }
                placeholder="Transaction ID / Cheque No."
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={paymentData.remarks}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, remarks: e.target.value })
                }
                placeholder="Add any notes about this payment..."
                className="bg-muted/50 border-0 rounded-lg"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-xl font-bold text-foreground">
                  ₹{selectedStudent.fees.totalFee.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Already Paid</p>
                <p className="text-xl font-bold text-success">
                  ₹{selectedStudent.fees.amountPaid.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance After Payment</p>
                <p className="text-xl font-bold text-primary">
                  ₹
                  {(
                    selectedStudent.fees.balanceDue - paymentData.paidAmount
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              onClick={handlePaymentSubmit}
              disabled={submitting || paymentData.paidAmount <= 0}
              className="flex-1 rounded-lg"
            >
              {submitting ? "Processing..." : "Collect Payment & Generate Receipt"}
            </Button>
            <Button variant="outline" className="gap-2 rounded-lg">
              <Upload className="w-4 h-4" />
              Upload External Receipt
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ManageFees;
