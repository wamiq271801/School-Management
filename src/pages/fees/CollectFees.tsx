import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ArrowLeft, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { subscribeToStudents, getStudentFeeDetails, createFeeTransaction, updateStudentFeeDetails, updateStudent, type Student, type FeeDetails } from "@/lib/firestore";
import { generateFeeReceipt, downloadReceipt, type ReceiptData } from "@/lib/receiptGenerator";
import { uploadFileToDrive, getOrCreateStudentFolder, isUserSignedIn } from "@/lib/googleDrive";

export default function CollectFees() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amountPaid: "",
    paymentMode: "Cash" as "Cash" | "Cheque" | "UPI" | "Bank Transfer" | "Online",
    paymentDate: new Date().toISOString().split('T')[0],
    transactionRef: "",
    remarks: "",
  });

  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => setStudents(data.filter(s => s.status === 'active')));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const studentId = searchParams.get('studentId');
    if (studentId) {
      const student = students.find(s => s.id === studentId);
      if (student) handleSelectStudent(student);
    }
  }, [searchParams, students]);

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const details = await getStudentFeeDetails(student.id);
      setFeeDetails(details);
    } catch (error) {
      console.error("Error fetching fee details:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !feeDetails) return;

    setLoading(true);
    try {
      const amountPaid = Number(formData.amountPaid);
      const newBalance = feeDetails.balance - amountPaid;
      const newTotalPaid = feeDetails.totalPaid + amountPaid;
      const newPaymentStatus = newBalance <= 0 ? "Paid" : newBalance < feeDetails.totalDue ? "Partial" : "Pending";

      // Generate receipt
      const receiptData: ReceiptData = {
        transactionId: "TXN-" + Date.now(),
        studentName: `${selectedStudent.basic.firstName} ${selectedStudent.basic.lastName}`,
        admissionNumber: selectedStudent.admissionNumber,
        className: selectedStudent.academic.admissionClass,
        section: selectedStudent.academic.section,
        amountPaid,
        paymentMode: formData.paymentMode,
        paymentDate: formData.paymentDate,
        transactionRef: formData.transactionRef,
        totalDue: feeDetails.totalDue,
        balanceAfter: newBalance,
      };

      const receiptBlob = await generateFeeReceipt(receiptData);
      const receiptFileName = `Receipt_${selectedStudent.admissionNumber}_${Date.now()}.pdf`;
      
      // Create transaction
      const transactionId = await createFeeTransaction({
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.basic.firstName} ${selectedStudent.basic.lastName}`,
        admissionNumber: selectedStudent.admissionNumber,
        className: selectedStudent.academic.admissionClass,
        section: selectedStudent.academic.section,
        amountPaid,
        totalDueBefore: feeDetails.balance + amountPaid,
        balanceAfter: newBalance,
        paymentMode: formData.paymentMode,
        transactionRef: formData.transactionRef,
        paymentDate: formData.paymentDate,
        remarks: formData.remarks,
        receiptFileName,
        createdBy: "admin",
      });

      // Update student fee details
      await updateStudentFeeDetails(selectedStudent.id, {
        totalPaid: newTotalPaid,
        balance: newBalance,
        paymentStatus: newPaymentStatus as any,
        lastPaymentDate: formData.paymentDate,
      });

      // Update student record
      await updateStudent(selectedStudent.id, {
        fees: {
          structure: feeDetails as any,
          totalFee: feeDetails.totalDue,
          amountPaid: newTotalPaid,
          balanceDue: newBalance,
          paymentStatus: newPaymentStatus as any,
        },
      });

      // Download receipt
      downloadReceipt(receiptBlob, receiptFileName);

      toast({
        title: "Payment Collected Successfully",
        description: `₹${amountPaid} collected from ${selectedStudent.basic.firstName}. Receipt downloaded.`,
      });

      // Reset form
      setSelectedStudent(null);
      setFeeDetails(null);
      setFormData({
        amountPaid: "",
        paymentMode: "Cash",
        paymentDate: new Date().toISOString().split('T')[0],
        transactionRef: "",
        remarks: "",
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || student.admissionNumber.toLowerCase().includes(search);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/fees")} className="rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Collect Fees</h1>
          <p className="text-muted-foreground mt-1">Record student fee payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Search */}
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Search Student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`p-3 rounded-lg cursor-pointer transition-smooth ${
                    selectedStudent?.id === student.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 hover:bg-muted"
                  }`}
                >
                  <p className="font-medium">{`${student.basic.firstName} ${student.basic.lastName}`}</p>
                  <p className="text-xs opacity-80">{student.admissionNumber}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="lg:col-span-2 rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <div className="text-center py-12 text-muted-foreground">
                Select a student to collect fees
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 bg-primary/10 rounded-xl space-y-2">
                  <h3 className="font-semibold text-lg">{`${selectedStudent.basic.firstName} ${selectedStudent.basic.lastName}`}</h3>
                  <p className="text-sm">{selectedStudent.admissionNumber} • Class {selectedStudent.academic.admissionClass}-{selectedStudent.academic.section}</p>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Due</p>
                      <p className="text-lg font-bold">₹{feeDetails?.totalDue.toLocaleString('en-IN') || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-lg font-bold text-success">₹{feeDetails?.totalPaid.toLocaleString('en-IN') || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-lg font-bold text-destructive">₹{feeDetails?.balance.toLocaleString('en-IN') || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount Paid (₹) *</Label>
                    <Input
                      type="number"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                      max={feeDetails?.balance || 0}
                      required
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Date *</Label>
                    <Input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      required
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode *</Label>
                    <Select value={formData.paymentMode} onValueChange={(value: any) => setFormData({ ...formData, paymentMode: value })}>
                      <SelectTrigger className="rounded-lg">
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
                  <div className="space-y-2">
                    <Label>Transaction Reference</Label>
                    <Input
                      value={formData.transactionRef}
                      onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                      placeholder="Optional"
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                    className="rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1 rounded-lg bg-accent">
                    {loading ? "Processing..." : "Collect Payment"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedStudent(null)} className="rounded-lg">
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
