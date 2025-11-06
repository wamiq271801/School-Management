import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, DollarSign, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  getStudent,
  getFeeTransactions,
  deleteStudent,
  type Student,
  type FeeTransaction,
} from "@/lib/firestore";

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadStudent();
      loadTransactions();
    }
  }, [id]);

  const loadStudent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getStudent(id);
      setStudent(data);
    } catch (error) {
      console.error("Error loading student:", error);
      toast({
        title: "Error",
        description: "Failed to load student details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!id) return;
    try {
      const data = await getFeeTransactions({ studentId: id });
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this student?")) return;

    try {
      await deleteStudent(id);
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      navigate("/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-semibold">Student not found</h2>
        <Button onClick={() => navigate("/students")} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

  const fullName = `${student.basic.firstName} ${student.basic.middleName || ""} ${student.basic.lastName}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/students")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/students/${id}/performance`)}
            className="gap-2 rounded-lg"
          >
            <TrendingUp className="w-4 h-4" />
            View Performance
          </Button>
          <Button variant="outline" className="gap-2 rounded-lg">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="gap-2 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="p-8 rounded-xl shadow-level-2 border-0">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">
              {student.basic.firstName[0]}
              {student.basic.lastName[0]}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              {fullName}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
              <div>
                <span className="text-sm">Admission No: </span>
                <span className="font-semibold">{student.admissionNumber}</span>
              </div>
              <div>
                <span className="text-sm">Class: </span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                  {student.academic.admissionClass} - {student.academic.section}
                </Badge>
              </div>
              <div>
                <span className="text-sm">Roll No: </span>
                <span className="font-semibold">{student.academic.rollNumber}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge
              className={
                student.status === "active"
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }
            >
              {student.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="rounded-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="p-6 rounded-xl shadow-level-2 border-0">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Gender:</span>
                  <span className="ml-2 text-foreground">{student.basic.gender}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date of Birth:</span>
                  <span className="ml-2 text-foreground">
                    {new Date(student.basic.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Nationality:</span>
                  <span className="ml-2 text-foreground">{student.basic.nationality}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="ml-2 text-foreground">{student.basic.category}</span>
                </div>
                {student.basic.bloodGroup && (
                  <div>
                    <span className="text-sm text-muted-foreground">Blood Group:</span>
                    <span className="ml-2 text-foreground">{student.basic.bloodGroup}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Parent Information */}
            <Card className="p-6 rounded-xl shadow-level-2 border-0">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Parent Information
              </h3>
              {student.father && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground">Father</h4>
                  <div className="space-y-2 mt-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {student.father.name}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Mobile:</span>{" "}
                      {student.father.mobile}
                    </div>
                    {student.father.occupation && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Occupation:</span>{" "}
                        {student.father.occupation}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {student.mother && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Mother</h4>
                  <div className="space-y-2 mt-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {student.mother.name}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Mobile:</span>{" "}
                      {student.mother.mobile}
                    </div>
                    {student.mother.occupation && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Occupation:</span>{" "}
                        {student.mother.occupation}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-6">
          {student.fees ? (
            <>
              {/* Fee Overview */}
              <Card className="p-6 rounded-xl shadow-level-2 border-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Fee Overview</h3>
                  <Button
                    onClick={() => navigate(`/fees/manage?studentId=${id}`)}
                    className="gap-2 rounded-lg"
                  >
                    <DollarSign className="w-4 h-4" />
                    Collect Fees
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Fee</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      ₹{student.fees.totalFee.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-3xl font-bold text-success mt-2">
                      ₹{student.fees.amountPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Balance Due</p>
                    <p className="text-3xl font-bold text-destructive mt-2">
                      ₹{student.fees.balanceDue.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Payment Progress</span>
                    <span className="text-sm font-semibold text-foreground">
                      {Math.round((student.fees.amountPaid / student.fees.totalFee) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{
                        width: `${(student.fees.amountPaid / student.fees.totalFee) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Fee Structure Breakdown */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-4">
                    Fee Structure Breakdown
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Admission Fee</p>
                      <p className="text-lg font-semibold">
                        ₹{student.fees.structure.admissionFee.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tuition Fee</p>
                      <p className="text-lg font-semibold">
                        ₹{student.fees.structure.tuitionFee.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transport Fee</p>
                      <p className="text-lg font-semibold">
                        ₹{student.fees.structure.transportFee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Transaction History */}
              <Card className="p-6 rounded-xl shadow-level-2 border-0">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Transaction History
                </h3>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions found
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Balance After</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {transaction.transactionId}
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-semibold text-success">
                            ₹{transaction.amountPaid.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.paymentMode}</Badge>
                          </TableCell>
                          <TableCell>
                            ₹{transaction.balanceAfter.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {transaction.receiptDriveLink ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() =>
                                  window.open(transaction.receiptDriveLink, "_blank")
                                }
                              >
                                <FileText className="w-4 h-4" />
                                View
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-6 rounded-xl shadow-level-2 border-0 text-center">
              <p className="text-muted-foreground mb-4">
                No fee structure assigned to this student
              </p>
              <Button
                onClick={() => navigate(`/fees/manage?studentId=${id}`)}
                className="gap-2 rounded-lg"
              >
                <DollarSign className="w-4 h-4" />
                Assign Fee Structure
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="p-6 rounded-xl shadow-level-2 border-0">
            <h3 className="text-lg font-semibold text-foreground mb-4">Documents</h3>
            <p className="text-muted-foreground">Document management coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProfile;
