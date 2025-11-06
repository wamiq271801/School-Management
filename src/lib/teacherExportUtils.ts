import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Teacher } from './firestore';

// Color scheme for exports
const COLORS = {
  primary: '#5B4A7A',
  secondary: '#8B7AA8',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  light: '#F8FAFC',
  dark: '#1E293B',
  white: '#FFFFFF',
  gray: '#6B7280'
};

// Teacher Excel Export
export class TeacherExcelExporter {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'SmartSchool Management System';
    this.workbook.created = new Date();
  }

  async exportTeachers(teachers: Teacher[], options: {
    includePersonalInfo?: boolean;
    includeContactInfo?: boolean;
    includeQualificationInfo?: boolean;
    includeEmploymentInfo?: boolean;
    includeSalaryInfo?: boolean;
    filterByDepartment?: string;
    filterByStatus?: string;
  } = {}): Promise<void> {
    // Create main worksheet
    this.worksheet = this.workbook.addWorksheet('Teachers Report', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        margins: {
          left: 0.7, right: 0.7, top: 0.75, bottom: 0.75,
          header: 0.3, footer: 0.3
        }
      }
    });

    // Set up header
    await this.setupHeader(teachers.length, options);
    
    // Set up columns based on options
    const columns = this.getColumns(options);
    this.worksheet.columns = columns;

    // Add data rows
    await this.addDataRows(teachers, options);

    // Apply formatting
    await this.applyFormatting(teachers.length, options);

    // Add summary sheet
    await this.addSummarySheet(teachers, options);

    // Save file
    const buffer = await this.workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, `teachers-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  private setupHeader(totalTeachers: number, options: any): void {
    // School header
    const headerRow1 = this.worksheet.addRow(['SmartSchool Management System']);
    headerRow1.height = 30;
    headerRow1.getCell(1).font = { size: 18, bold: true, color: { argb: COLORS.primary.replace('#', '') } };
    headerRow1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Report title
    const headerRow2 = this.worksheet.addRow(['Teacher Management Report']);
    headerRow2.height = 25;
    headerRow2.getCell(1).font = { size: 14, bold: true, color: { argb: COLORS.secondary.replace('#', '') } };
    headerRow2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Report details
    const detailsRow = this.worksheet.addRow([
      `Generated on: ${new Date().toLocaleDateString('en-IN')} | Total Teachers: ${totalTeachers} | Filters: ${this.getFilterText(options)}`
    ]);
    detailsRow.getCell(1).font = { size: 10, italic: true, color: { argb: COLORS.gray.replace('#', '') } };
    detailsRow.getCell(1).alignment = { horizontal: 'center' };

    // Empty row for spacing
    this.worksheet.addRow([]);
  }

  private getColumns(options: any): ExcelJS.Column[] {
    const columns: ExcelJS.Column[] = [
      { header: 'S.No.', key: 'sno', width: 8 },
      { header: 'Teacher ID', key: 'teacherId', width: 15 },
      { header: 'Teacher Name', key: 'fullName', width: 25 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Designation', key: 'designation', width: 15 },
    ];

    if (options.includePersonalInfo !== false) {
      columns.push(
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
        { header: 'Blood Group', key: 'bloodGroup', width: 12 }
      );
    }

    if (options.includeContactInfo !== false) {
      columns.push(
        { header: 'Mobile', key: 'mobile', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Address', key: 'address', width: 30 }
      );
    }

    if (options.includeQualificationInfo !== false) {
      columns.push(
        { header: 'Highest Qualification', key: 'qualification', width: 20 },
        { header: 'Experience (Years)', key: 'experience', width: 15 },
        { header: 'Subject Expertise', key: 'subjects', width: 25 }
      );
    }

    if (options.includeEmploymentInfo !== false) {
      columns.push(
        { header: 'Date of Joining', key: 'joiningDate', width: 15 },
        { header: 'Employee Type', key: 'employeeType', width: 15 },
        { header: 'Assigned Subjects', key: 'assignedSubjects', width: 25 }
      );
    }

    if (options.includeSalaryInfo !== false) {
      columns.push(
        { header: 'Basic Salary', key: 'basicSalary', width: 12 },
        { header: 'Net Salary', key: 'netSalary', width: 12 }
      );
    }

    columns.push({ header: 'Status', key: 'status', width: 12 });

    return columns;
  }

  private async addDataRows(teachers: Teacher[], options: any): Promise<void> {
    teachers.forEach((teacher, index) => {
      const rowData: any = {
        sno: index + 1,
        teacherId: teacher.teacherId,
        fullName: `${teacher.personal.firstName} ${teacher.personal.middleName || ''} ${teacher.personal.lastName}`.trim(),
        department: teacher.employment.department,
        designation: teacher.employment.designation,
      };

      if (options.includePersonalInfo !== false) {
        rowData.gender = teacher.personal.gender;
        rowData.dateOfBirth = new Date(teacher.personal.dateOfBirth).toLocaleDateString('en-IN');
        rowData.bloodGroup = teacher.personal.bloodGroup || 'N/A';
      }

      if (options.includeContactInfo !== false) {
        rowData.mobile = teacher.contact.mobile;
        rowData.email = teacher.contact.email || 'N/A';
        rowData.address = teacher.contact.residentialAddress ? 
          `${teacher.contact.residentialAddress.line1}, ${teacher.contact.residentialAddress.city}, ${teacher.contact.residentialAddress.state}` : 'N/A';
      }

      if (options.includeQualificationInfo !== false) {
        rowData.qualification = teacher.qualification.highestQualification;
        rowData.experience = teacher.qualification.yearsOfExperience;
        rowData.subjects = teacher.qualification.subjectExpertise.join(', ');
      }

      if (options.includeEmploymentInfo !== false) {
        rowData.joiningDate = new Date(teacher.employment.dateOfJoining).toLocaleDateString('en-IN');
        rowData.employeeType = teacher.employment.employeeType;
        rowData.assignedSubjects = teacher.employment.assignedSubjects.join(', ');
      }

      if (options.includeSalaryInfo !== false) {
        rowData.basicSalary = `₹${teacher.employment.salary.basic.toLocaleString('en-IN')}`;
        rowData.netSalary = `₹${teacher.employment.salary.netSalary.toLocaleString('en-IN')}`;
      }

      rowData.status = teacher.status;

      const row = this.worksheet.addRow(rowData);
      
      // Apply conditional formatting based on status
      const statusCell = row.getCell('status');
      switch (teacher.status) {
        case 'Active':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success.replace('#', '') + '20' } };
          statusCell.font = { color: { argb: COLORS.success.replace('#', '') }, bold: true };
          break;
        case 'On Leave':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warning.replace('#', '') + '20' } };
          statusCell.font = { color: { argb: COLORS.warning.replace('#', '') }, bold: true };
          break;
        case 'Resigned':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.danger.replace('#', '') + '20' } };
          statusCell.font = { color: { argb: COLORS.danger.replace('#', '') }, bold: true };
          break;
      }
    });
  }

  private async applyFormatting(totalRows: number, options: any): Promise<void> {
    // Header row formatting
    const headerRow = this.worksheet.getRow(5);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary.replace('#', '') } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFF' } }
      };
    });

    // Data rows formatting
    for (let i = 6; i <= 5 + totalRows; i++) {
      const row = this.worksheet.getRow(i);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: COLORS.gray.replace('#', '') } },
          left: { style: 'thin', color: { argb: COLORS.gray.replace('#', '') } },
          bottom: { style: 'thin', color: { argb: COLORS.gray.replace('#', '') } },
          right: { style: 'thin', color: { argb: COLORS.gray.replace('#', '') } }
        };
        cell.alignment = { vertical: 'middle' };
      });

      // Alternate row colors
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          if (!cell.fill || !cell.fill.fgColor) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light.replace('#', '') } };
          }
        });
      }
    }

    // Merge header cells
    this.worksheet.mergeCells('A1:' + this.getColumnLetter(this.worksheet.columns.length) + '1');
    this.worksheet.mergeCells('A2:' + this.getColumnLetter(this.worksheet.columns.length) + '2');
    this.worksheet.mergeCells('A3:' + this.getColumnLetter(this.worksheet.columns.length) + '3');
  }

  private async addSummarySheet(teachers: Teacher[], options: any): Promise<void> {
    const summarySheet = this.workbook.addWorksheet('Summary');
    
    const stats = this.calculateStatistics(teachers);
    
    summarySheet.addRow(['Teacher Summary Statistics']);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Teachers', stats.total]);
    summarySheet.addRow(['Active Teachers', stats.active]);
    summarySheet.addRow(['On Leave', stats.onLeave]);
    summarySheet.addRow(['Resigned', stats.resigned]);
    summarySheet.addRow([]);
    
    summarySheet.addRow(['Department Distribution']);
    Object.entries(stats.deptDist).forEach(([dept, count]) => {
      summarySheet.addRow([dept, count]);
    });

    // Format summary sheet
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 15;
    
    summarySheet.getRow(1).font = { size: 16, bold: true, color: { argb: COLORS.primary.replace('#', '') } };
    summarySheet.getRow(8).font = { size: 14, bold: true, color: { argb: COLORS.secondary.replace('#', '') } };
  }

  private calculateStatistics(teachers: Teacher[]) {
    const stats = {
      total: teachers.length,
      active: teachers.filter(t => t.status === 'Active').length,
      onLeave: teachers.filter(t => t.status === 'On Leave').length,
      resigned: teachers.filter(t => t.status === 'Resigned').length,
      deptDist: {} as Record<string, number>
    };

    // Calculate department distribution
    teachers.forEach(teacher => {
      const dept = teacher.employment.department;
      stats.deptDist[dept] = (stats.deptDist[dept] || 0) + 1;
    });

    return stats;
  }

  private getFilterText(options: any): string {
    const filters = [];
    if (options.filterByDepartment) filters.push(`Department: ${options.filterByDepartment}`);
    if (options.filterByStatus) filters.push(`Status: ${options.filterByStatus}`);
    return filters.length > 0 ? filters.join(', ') : 'None';
  }

  private getColumnLetter(columnNumber: number): string {
    let columnName = '';
    while (columnNumber > 0) {
      const modulo = (columnNumber - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      columnNumber = Math.floor((columnNumber - modulo) / 26);
    }
    return columnName;
  }

  private downloadFile(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

// Teacher PDF Export
export class TeacherPDFExporter {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF('landscape', 'mm', 'a4');
  }

  async exportTeachers(teachers: Teacher[], options: any = {}): Promise<void> {
    this.addHeader(teachers.length, options);
    this.addSummarySection(teachers);
    this.addMainTable(teachers, options);
    this.addFooter();
    
    this.doc.save(`teachers-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private addHeader(totalTeachers: number, options: any): void {
    this.doc.setFontSize(20);
    this.doc.setTextColor(91, 72, 122);
    this.doc.text('SmartSchool Management System', 148, 20, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(139, 122, 168);
    this.doc.text('Teacher Management Report', 148, 30, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(107, 114, 128);
    const reportDetails = `Generated on: ${new Date().toLocaleDateString('en-IN')} | Total Teachers: ${totalTeachers}`;
    this.doc.text(reportDetails, 148, 38, { align: 'center' });
    
    this.doc.setDrawColor(91, 72, 122);
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 45, 277, 45);
  }

  private addSummarySection(teachers: Teacher[]): void {
    const stats = this.calculateStatistics(teachers);
    
    let yPos = 55;
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    
    this.addSummaryBox(25, yPos, 'Total Teachers', stats.total.toString(), COLORS.primary);
    this.addSummaryBox(85, yPos, 'Active', stats.active.toString(), COLORS.success);
    this.addSummaryBox(145, yPos, 'On Leave', stats.onLeave.toString(), COLORS.warning);
    this.addSummaryBox(205, yPos, 'Resigned', stats.resigned.toString(), COLORS.danger);
  }

  private addSummaryBox(x: number, y: number, label: string, value: string, color: string): void {
    this.doc.setFillColor(this.hexToRgb(color + '20'));
    this.doc.rect(x, y, 50, 25, 'F');
    
    this.doc.setDrawColor(this.hexToRgb(color));
    this.doc.setLineWidth(0.5);
    this.doc.rect(x, y, 50, 25);
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(this.hexToRgb(color));
    this.doc.text(label, x + 25, y + 8, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(value, x + 25, y + 18, { align: 'center' });
    this.doc.setFont(undefined, 'normal');
  }

  private addMainTable(teachers: Teacher[], options: any): void {
    const columns = this.getTableColumns(options);
    const rows = this.getTableRows(teachers, options);
    
    autoTable(this.doc, {
      head: [columns],
      body: rows,
      startY: 90,
      theme: 'grid',
      headStyles: {
        fillColor: [91, 72, 122],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      pageBreak: 'auto',
      showHead: 'everyPage'
    });
  }

  private getTableColumns(options: any): string[] {
    const columns = ['S.No.', 'Teacher ID', 'Name', 'Department', 'Designation'];
    
    if (options.includeContactInfo !== false) {
      columns.push('Mobile', 'Email');
    }
    
    if (options.includeQualificationInfo !== false) {
      columns.push('Qualification', 'Experience');
    }
    
    columns.push('Status');
    
    return columns;
  }

  private getTableRows(teachers: Teacher[], options: any): string[][] {
    return teachers.map((teacher, index) => {
      const row = [
        (index + 1).toString(),
        teacher.teacherId,
        `${teacher.personal.firstName} ${teacher.personal.lastName}`,
        teacher.employment.department,
        teacher.employment.designation
      ];
      
      if (options.includeContactInfo !== false) {
        row.push(
          teacher.contact.mobile,
          teacher.contact.email || 'N/A'
        );
      }
      
      if (options.includeQualificationInfo !== false) {
        row.push(
          teacher.qualification.highestQualification,
          teacher.qualification.yearsOfExperience.toString()
        );
      }
      
      row.push(teacher.status);
      
      return row;
    });
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      this.doc.setDrawColor(91, 72, 122);
      this.doc.setLineWidth(0.5);
      this.doc.line(20, 200, 277, 200);
      
      this.doc.setFontSize(8);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('SmartSchool Management System - Confidential Document', 20, 207);
      this.doc.text(`Page ${i} of ${pageCount}`, 277, 207, { align: 'right' });
      this.doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 148, 207, { align: 'center' });
    }
  }

  private calculateStatistics(teachers: Teacher[]) {
    return {
      total: teachers.length,
      active: teachers.filter(t => t.status === 'Active').length,
      onLeave: teachers.filter(t => t.status === 'On Leave').length,
      resigned: teachers.filter(t => t.status === 'Resigned').length,
    };
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }
}

// Export utility functions
export const exportTeachersToExcel = async (
  teachers: Teacher[], 
  options: any = {}
): Promise<void> => {
  const exporter = new TeacherExcelExporter();
  await exporter.exportTeachers(teachers, options);
};

export const exportTeachersToPDF = async (
  teachers: Teacher[], 
  options: any = {}
): Promise<void> => {
  const exporter = new TeacherPDFExporter();
  await exporter.exportTeachers(teachers, options);
};