import { useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscribeToFeeTransactions, type FeeTransaction } from "@/lib/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

export default function FeesReports() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToFeeTransactions((data) => setTransactions(data));
    return () => unsubscribe();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (startDate && new Date(t.paymentDate) < new Date(startDate)) return false;
    if (endDate && new Date(t.paymentDate) > new Date(endDate)) return false;
    return true;
  });

  const totalCollected = filteredTransactions.reduce((sum, t) => sum + t.amountPaid, 0);
  const averageTransaction = filteredTransactions.length > 0 
    ? totalCollected / filteredTransactions.length 
    : 0;

  // Payment mode distribution
  const paymentModeData = filteredTransactions.reduce((acc, t) => {
    const mode = t.paymentMode;
    const existing = acc.find(item => item.mode === mode);
    if (existing) {
      existing.amount += t.amountPaid;
      existing.count += 1;
    } else {
      acc.push({ mode, amount: t.amountPaid, count: 1 });
    }
    return acc;
  }, [] as { mode: string; amount: number; count: number }[]);

  // Monthly collection
  const monthlyData = filteredTransactions.reduce((acc, t) => {
    const month = new Date(t.paymentDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += t.amountPaid;
    } else {
      acc.push({ month, amount: t.amountPaid });
    }
    return acc;
  }, [] as { month: string; amount: number }[]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("SmartSchool - Fee Collection Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || 'All'} to ${endDate || 'All'}`, 14, 28);
    doc.text(`Total Collected: ₹${totalCollected.toLocaleString('en-IN')}`, 14, 35);
    
    const tableData = filteredTransactions.map(t => [
      t.transactionId,
      t.studentName,
      `${t.className}-${t.section}`,
      `₹${t.amountPaid.toLocaleString('en-IN')}`,
      t.paymentMode,
      new Date(t.paymentDate).toLocaleDateString('en-IN'),
    ]);

    autoTable(doc, {
      head: [["Transaction ID", "Student", "Class", "Amount", "Mode", "Date"]],
      body: tableData,
      startY: 42,
      theme: "grid",
      headStyles: { fillColor: [91, 72, 122] },
    });

    doc.save(`fee-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ["Transaction ID", "Student Name", "Admission No", "Class", "Section", "Amount", "Mode", "Date", "Receipt"];
    const rows = filteredTransactions.map(t => [
      t.transactionId,
      t.studentName,
      t.admissionNumber,
      t.className,
      t.section,
      t.amountPaid,
      t.paymentMode,
      new Date(t.paymentDate).toLocaleDateString('en-IN'),
      t.receiptDriveLink || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/fees")} className="rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Fee Reports</h1>
          <p className="text-muted-foreground mt-1">View and export fee collection reports</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-level-2 border-0 border-l-4 border-l-success">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-bold text-success">₹{totalCollected.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-level-2 border-0 border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold text-primary">{filteredTransactions.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-level-2 border-0 border-l-4 border-l-accent">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Transaction</p>
            <p className="text-2xl font-bold text-accent">₹{Math.round(averageTransaction).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Monthly Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="amount" fill="hsl(var(--success))" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-level-2 border-0">
          <CardHeader>
            <CardTitle>Payment Mode Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentModeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ mode, amount }) => `${mode}: ₹${amount.toLocaleString('en-IN')}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {paymentModeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-level-2 border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg" />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm">{t.transactionId}</TableCell>
                  <TableCell>{t.studentName}</TableCell>
                  <TableCell>{t.className}-{t.section}</TableCell>
                  <TableCell className="font-semibold">₹{t.amountPaid.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{t.paymentMode}</TableCell>
                  <TableCell>{new Date(t.paymentDate).toLocaleDateString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
