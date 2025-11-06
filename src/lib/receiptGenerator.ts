import jsPDF from "jspdf";

export interface ReceiptData {
  transactionId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  amountPaid: number;
  paymentMode: string;
  paymentDate: string;
  transactionRef?: string;
  totalDue: number;
  balanceAfter: number;
  feeComponents?: {
    label: string;
    amount: number;
  }[];
}

export async function generateFeeReceipt(receiptData: ReceiptData): Promise<Blob> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // School Header
  pdf.setFillColor(37, 99, 235); // Primary color
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("SmartSchool", pageWidth / 2, 20, { align: "center" });
  
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text("Fee Payment Receipt", pageWidth / 2, 30, { align: "center" });
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  // Receipt Details Header
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Receipt No: ${receiptData.transactionId}`, 20, 55);
  pdf.text(`Date: ${new Date(receiptData.paymentDate).toLocaleDateString('en-IN')}`, pageWidth - 20, 55, { align: "right" });
  
  // Student Information
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Student Information", 20, 70);
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  let yPos = 80;
  
  pdf.text(`Name: ${receiptData.studentName}`, 20, yPos);
  yPos += 8;
  pdf.text(`Admission No: ${receiptData.admissionNumber}`, 20, yPos);
  yPos += 8;
  pdf.text(`Class: ${receiptData.className} - ${receiptData.section}`, 20, yPos);
  yPos += 15;
  
  // Payment Details
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Payment Details", 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  
  // Fee Components Table (if provided)
  if (receiptData.feeComponents && receiptData.feeComponents.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Fee Component", 20, yPos);
    pdf.text("Amount", pageWidth - 20, yPos, { align: "right" });
    yPos += 5;
    
    // Draw line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    pdf.setFont("helvetica", "normal");
    receiptData.feeComponents.forEach((component) => {
      pdf.text(component.label, 20, yPos);
      pdf.text(`₹${component.amount.toLocaleString('en-IN')}`, pageWidth - 20, yPos, { align: "right" });
      yPos += 7;
    });
    
    yPos += 5;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
  }
  
  // Payment Summary
  pdf.setFont("helvetica", "bold");
  pdf.text("Amount Paid:", 20, yPos);
  pdf.text(`₹${receiptData.amountPaid.toLocaleString('en-IN')}`, pageWidth - 20, yPos, { align: "right" });
  yPos += 8;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("Payment Mode:", 20, yPos);
  pdf.text(receiptData.paymentMode, pageWidth - 20, yPos, { align: "right" });
  yPos += 8;
  
  if (receiptData.transactionRef) {
    pdf.text("Transaction Reference:", 20, yPos);
    pdf.text(receiptData.transactionRef, pageWidth - 20, yPos, { align: "right" });
    yPos += 8;
  }
  
  yPos += 5;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;
  
  // Balance Information
  pdf.setFont("helvetica", "bold");
  pdf.text("Total Fee:", 20, yPos);
  pdf.text(`₹${receiptData.totalDue.toLocaleString('en-IN')}`, pageWidth - 20, yPos, { align: "right" });
  yPos += 8;
  
  pdf.setFontSize(12);
  pdf.setTextColor(220, 38, 38); // Red for balance
  pdf.text("Balance Due:", 20, yPos);
  pdf.text(`₹${receiptData.balanceAfter.toLocaleString('en-IN')}`, pageWidth - 20, yPos, { align: "right" });
  
  // Footer
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "italic");
  const footerY = pdf.internal.pageSize.getHeight() - 30;
  pdf.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, footerY, { align: "center" });
  pdf.text("For any queries, please contact the school administration.", pageWidth / 2, footerY + 5, { align: "center" });
  
  // Authorized Signature section
  pdf.setFont("helvetica", "normal");
  pdf.text("_____________________", pageWidth - 60, footerY + 15);
  pdf.text("Authorized Signature", pageWidth - 60, footerY + 20);
  
  return pdf.output('blob');
}

export function downloadReceipt(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
