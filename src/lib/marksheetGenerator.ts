import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student } from "./firestore";
import type { ExamType, StudentMarks } from "./firestoreExams";
import { uploadFileToDrive } from "./googleDrive";
import { savePerformanceReport, type PerformanceReport } from "./firestoreExams";
import { triggerMarksheetReadyNotification } from "./firestoreNotifications";

export async function generateMarksheet(
  student: Student,
  exam: ExamType,
  marks: StudentMarks
): Promise<void> {
  const doc = new jsPDF();
  
  // School header
  const schoolName = localStorage.getItem("school_name") || "SmartSchool";
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, doc.internal.pageSize.width / 2, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Academic Performance Report", doc.internal.pageSize.width / 2, 30, { align: "center" });
  
  // Student details
  doc.setFontSize(10);
  const yStart = 45;
  doc.text(`Student Name: ${student.basic.firstName} ${student.basic.lastName}`, 20, yStart);
  doc.text(`Admission No: ${student.admissionNumber}`, 20, yStart + 7);
  doc.text(`Class: ${student.academic.admissionClass} - ${student.academic.section}`, 20, yStart + 14);
  doc.text(`Exam: ${exam.name}`, 20, yStart + 21);
  doc.text(`Academic Year: ${exam.academicYear}`, 20, yStart + 28);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, yStart + 28);
  
  // Marks table
  const tableData = marks.subjects.map((subject) => [
    subject.subjectName,
    subject.totalMarks.toString(),
    subject.marksObtained.toString(),
    subject.percentage.toFixed(1) + "%",
    subject.grade,
  ]);
  
  autoTable(doc, {
    startY: yStart + 40,
    head: [["Subject", "Max Marks", "Marks Obtained", "Percentage", "Grade"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Performance", 20, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Total Marks: ${marks.totalMarksObtained} / ${marks.totalMaxMarks}`, 20, finalY + 10);
  doc.text(`Percentage: ${marks.percentage.toFixed(2)}%`, 20, finalY + 17);
  doc.text(`Grade: ${marks.overallGrade}`, 20, finalY + 24);
  
  // Grade interpretation
  doc.setFontSize(9);
  doc.text("Grading System: A+ (90-100) | A (80-89) | B+ (70-79) | B (60-69) | C (50-59) | D (35-49) | F (<35)", 20, finalY + 35);
  
  // Save PDF
  const fileName = `${student.admissionNumber}_${exam.name.replace(/\s+/g, "_")}_Marksheet.pdf`;
  
  // Download locally
  doc.save(fileName);
  
  // Try to upload to Google Drive if configured
  try {
    const apiKey = localStorage.getItem("drive_api_key");
    const rootFolderId = localStorage.getItem("drive_root_folder_id");
    
    if (apiKey && rootFolderId) {
      const pdfBlob = doc.output("blob");
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      
      // Upload to Drive
      const result = await uploadFileToDrive(file, rootFolderId);
      
      // Save report reference in Firestore
      await savePerformanceReport({
        studentId: student.id,
        examId: exam.id,
        driveLink: result.webViewLink,
        fileName: result.fileName,
      });
      
      // Send notification to student
      await triggerMarksheetReadyNotification(
        student.id,
        exam.name,
        result.webViewLink
      );
    }
  } catch (error) {
    console.error("Error uploading to Drive:", error);
    // Continue even if upload fails
  }
}
