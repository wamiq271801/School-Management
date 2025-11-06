import ExcelJS from 'exceljs';
import { Student } from './firestore';

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

// Excel Export Functions
export class StudentExcelExporter {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'SmartSchool Management System';
    this.workbook.created = new Date();
  }

  async exportStudents(students: Student[], options: {
    includePersonalInfo?: boolean;
    includeAcademicInfo?: boolean;
    includeContactInfo?: boolean;
    includeFeeInfo?: boolean;
    includeDocuments?: boolean;
    filterByClass?: string;
    filterBySection?: string;
    filterByFeeStatus?: string;
  } = {}): Promise<void> {
    // Create main worksheet
    this.worksheet = this.workbook.addWorksheet('Students Report', {
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
    await this.setupHeader(students.length, options);
    
    // Set up columns based on options
    const columns = this.getColumns(options);
    this.worksheet.columns = columns;

    // Add data rows
    await this.addDataRows(students, options);

    // Apply formatting
    await this.applyFormatting(students.length, options);

    // Add summary sheet
    await this.addSummarySheet(students, options);

    // Add charts if needed
    if (students.length > 0) {
      await this.addChartsSheet(students);
    }

    // Save file
    const buffer = await this.workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, `students-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  private setupHeader(totalStudents: number, options: any): void {
    // School header with logo space
    const logoRow = this.worksheet.addRow(['SMARTSCHOOL MANAGEMENT SYSTEM']);
    logoRow.height = 35;
    logoRow.getCell(1).font = { size: 20, bold: true, color: { argb: COLORS.primary.replace('#', '') } };
    logoRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    logoRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light.replace('#', '') } };

    // School address/contact info
    const addressRow = this.worksheet.addRow(['Address: School Address | Phone: +91-XXXXXXXXXX | Email: info@smartschool.edu']);
    addressRow.height = 20;
    addressRow.getCell(1).font = { size: 10, italic: true, color: { argb: COLORS.gray.replace('#', '') } };
    addressRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Empty row
    this.worksheet.addRow([]);

    // Report title with decorative border
    const titleRow = this.worksheet.addRow(['STUDENT MANAGEMENT REPORT']);
    titleRow.height = 30;
    titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary.replace('#', '') } };
    titleRow.getCell(1).border = {
      top: { style: 'thick', color: { argb: COLORS.secondary.replace('#', '') } },
      left: { style: 'thick', color: { argb: COLORS.secondary.replace('#', '') } },
      bottom: { style: 'thick', color: { argb: COLORS.secondary.replace('#', '') } },
      right: { style: 'thick', color: { argb: COLORS.secondary.replace('#', '') } }
    };

    // Report metadata
    const metaRow1 = this.worksheet.addRow(['Report Generated On:', new Date().toLocaleDateString('en-IN', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    })]);
    metaRow1.getCell(1).font = { bold: true, color: { argb: COLORS.dark.replace('#', '') } };
    metaRow1.getCell(2).font = { color: { argb: COLORS.gray.replace('#', '') } };

    const metaRow2 = this.worksheet.addRow(['Total Students:', totalStudents]);
    metaRow2.getCell(1).font = { bold: true, color: { argb: COLORS.dark.replace('#', '') } };
    metaRow2.getCell(2).font = { bold: true, color: { argb: COLORS.primary.replace('#', '') } };

    const metaRow3 = this.worksheet.addRow(['Applied Filters:', this.getFilterText(options)]);
    metaRow3.getCell(1).font = { bold: true, color: { argb: COLORS.dark.replace('#', '') } };
    metaRow3.getCell(2).font = { color: { argb: COLORS.gray.replace('#', '') } };

    const metaRow4 = this.worksheet.addRow(['Academic Year:', new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)]);
    metaRow4.getCell(1).font = { bold: true, color: { argb: COLORS.dark.replace('#', '') } };
    metaRow4.getCell(2).font = { color: { argb: COLORS.gray.replace('#', '') } };

    // Empty rows for spacing
    this.worksheet.addRow([]);
    this.worksheet.addRow([]);
  }

  private getColumns(options: any): ExcelJS.Column[] {
    const columns: ExcelJS.Column[] = [];

    // Basic Information Section
    columns.push(
      { header: 'SR. NO.', key: 'sno', width: 8 },
      { header: 'ADMISSION NUMBER', key: 'admissionNumber', width: 18 },
      { header: 'STUDENT FULL NAME', key: 'fullName', width: 30 },
      { header: 'CLASS', key: 'class', width: 12 },
      { header: 'SECTION', key: 'section', width: 12 },
      { header: 'ROLL NUMBER', key: 'rollNumber', width: 15 }
    );

    if (options.includePersonalInfo !== false) {
      columns.push(
        { header: 'GENDER', key: 'gender', width: 12 },
        { header: 'DATE OF BIRTH', key: 'dateOfBirth', width: 18 },
        { header: 'AGE (YEARS)', key: 'age', width: 12 },
        { header: 'BLOOD GROUP', key: 'bloodGroup', width: 15 },
        { header: 'CATEGORY', key: 'category', width: 15 },
        { header: 'RELIGION', key: 'religion', width: 15 },
        { header: 'NATIONALITY', key: 'nationality', width: 15 },
        { header: 'MOTHER TONGUE', key: 'motherTongue', width: 18 },
        { header: 'PLACE OF BIRTH', key: 'placeOfBirth', width: 20 }
      );
    }

    if (options.includeContactInfo !== false) {
      columns.push(
        { header: 'FATHER NAME', key: 'fatherName', width: 25 },
        { header: 'FATHER OCCUPATION', key: 'fatherOccupation', width: 20 },
        { header: 'FATHER MOBILE', key: 'fatherMobile', width: 18 },
        { header: 'FATHER EMAIL', key: 'fatherEmail', width: 25 },
        { header: 'MOTHER NAME', key: 'motherName', width: 25 },
        { header: 'MOTHER OCCUPATION', key: 'motherOccupation', width: 20 },
        { header: 'MOTHER MOBILE', key: 'motherMobile', width: 18 },
        { header: 'MOTHER EMAIL', key: 'motherEmail', width: 25 },
        { header: 'PRIMARY CONTACT', key: 'primaryContact', width: 18 },
        { header: 'PERMANENT ADDRESS', key: 'permanentAddress', width: 40 },
        { header: 'CURRENT ADDRESS', key: 'currentAddress', width: 40 },
        { header: 'DISTANCE FROM SCHOOL (KM)', key: 'distanceFromSchool', width: 25 }
      );
    }

    if (options.includeAcademicInfo !== false) {
      columns.push(
        { header: 'ACADEMIC YEAR', key: 'academicYear', width: 18 },
        { header: 'ADMISSION DATE', key: 'admissionDate', width: 18 },
        { header: 'PREVIOUS SCHOOL NAME', key: 'previousSchoolName', width: 30 },
        { header: 'PREVIOUS CLASS', key: 'previousClass', width: 18 },
        { header: 'PREVIOUS PERCENTAGE', key: 'previousPercentage', width: 20 },
        { header: 'PREVIOUS BOARD', key: 'previousBoard', width: 20 },
        { header: 'TRANSFER CERTIFICATE NO.', key: 'tcNumber', width: 25 },
        { header: 'TC ISSUE DATE', key: 'tcIssueDate', width: 18 }
      );
    }

    if (options.includeFeeInfo !== false) {
      columns.push(
        { header: 'ADMISSION FEE (₹)', key: 'admissionFee', width: 18 },
        { header: 'TUITION FEE (₹)', key: 'tuitionFee', width: 18 },
        { header: 'ANNUAL CHARGES (₹)', key: 'annualCharges', width: 20 },
        { header: 'TRANSPORT FEE (₹)', key: 'transportFee', width: 18 },
        { header: 'CAUTION DEPOSIT (₹)', key: 'cautionDeposit', width: 20 },
        { header: 'COMPUTER LAB FEE (₹)', key: 'computerLabFee', width: 22 },
        { header: 'LIBRARY FEE (₹)', key: 'libraryFee', width: 18 },
        { header: 'EXAMINATION FEE (₹)', key: 'examinationFee', width: 20 },
        { header: 'OTHER CHARGES (₹)', key: 'otherCharges', width: 18 },
        { header: 'TOTAL FEE (₹)', key: 'totalFee', width: 18 },
        { header: 'AMOUNT PAID (₹)', key: 'amountPaid', width: 18 },
        { header: 'BALANCE DUE (₹)', key: 'balanceDue', width: 18 },
        { header: 'PAYMENT STATUS', key: 'feeStatus', width: 18 },
        { header: 'LAST PAYMENT DATE', key: 'lastPaymentDate', width: 20 }
      );
    }

    if (options.includeDocuments !== false) {
      columns.push(
        { header: 'PHOTO UPLOADED', key: 'photoUploaded', width: 18 },
        { header: 'BIRTH CERTIFICATE', key: 'birthCertificate', width: 20 },
        { header: 'AADHAR CARD (STUDENT)', key: 'aadharStudent', width: 25 },
        { header: 'AADHAR CARD (FATHER)', key: 'aadharFather', width: 25 },
        { header: 'AADHAR CARD (MOTHER)', key: 'aadharMother', width: 25 },
        { header: 'TRANSFER CERTIFICATE', key: 'transferCertificate', width: 25 },
        { header: 'PREVIOUS MARKSHEET', key: 'previousMarksheet', width: 25 },
        { header: 'CASTE CERTIFICATE', key: 'casteCertificate', width: 22 },
        { header: 'INCOME CERTIFICATE', key: 'incomeCertificate', width: 22 },
        { header: 'MEDICAL CERTIFICATE', key: 'medicalCertificate', width: 25 },
        { header: 'ADDRESS PROOF', key: 'addressProof', width: 20 }
      );
    }

    columns.push(
      { header: 'STUDENT STATUS', key: 'status', width: 18 },
      { header: 'CREATED DATE', key: 'createdDate', width: 18 },
      { header: 'LAST UPDATED', key: 'lastUpdated', width: 18 }
    );

    return columns;
  }

  private async addDataRows(students: Student[], options: any): Promise<void> {
    // Add section headers before data
    this.addSectionHeaders(options);
    
    students.forEach((student, index) => {
      const rowData: any = {
        sno: index + 1,
        admissionNumber: student.admissionNumber || 'N/A',
        fullName: `${student.basic?.firstName || ''} ${student.basic?.middleName || ''} ${student.basic?.lastName || ''}`.trim() || 'N/A',
        class: student.academic?.admissionClass || 'N/A',
        section: student.academic?.section || 'N/A',
        rollNumber: student.academic?.rollNumber || 'Not Assigned',
      };

      if (options.includePersonalInfo !== false) {
        const dob = student.basic?.dateOfBirth ? new Date(student.basic.dateOfBirth) : null;
        const age = dob ? Math.floor((new Date().getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 'N/A';
        
        rowData.gender = student.basic?.gender || 'N/A';
        rowData.dateOfBirth = dob ? dob.toLocaleDateString('en-IN') : 'N/A';
        rowData.age = age;
        rowData.bloodGroup = student.basic?.bloodGroup || 'N/A';
        rowData.category = student.basic?.category || 'N/A';
        rowData.religion = student.basic?.religion || 'N/A';
        rowData.nationality = student.basic?.nationality || 'N/A';
        rowData.motherTongue = student.basic?.motherTongue || 'N/A';
        rowData.placeOfBirth = student.basic?.placeOfBirth || 'N/A';
      }

      if (options.includeContactInfo !== false) {
        rowData.fatherName = student.father?.name || 'N/A';
        rowData.fatherOccupation = student.father?.occupation || 'N/A';
        rowData.fatherMobile = student.father?.mobile || 'N/A';
        rowData.fatherEmail = student.father?.email || 'N/A';
        rowData.motherName = student.mother?.name || 'N/A';
        rowData.motherOccupation = student.mother?.occupation || 'N/A';
        rowData.motherMobile = student.mother?.mobile || 'N/A';
        rowData.motherEmail = student.mother?.email || 'N/A';
        rowData.primaryContact = student.primaryContact || 'N/A';
        
        rowData.permanentAddress = student.permanentAddress ? 
          `${student.permanentAddress.line1 || ''}, ${student.permanentAddress.line2 || ''}, ${student.permanentAddress.city || ''}, ${student.permanentAddress.state || ''} - ${student.permanentAddress.pincode || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') : 'N/A';
        
        rowData.currentAddress = student.currentAddress ? 
          `${student.currentAddress.line1 || ''}, ${student.currentAddress.line2 || ''}, ${student.currentAddress.city || ''}, ${student.currentAddress.state || ''} - ${student.currentAddress.pincode || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') : 'Same as Permanent';
        
        rowData.distanceFromSchool = student.permanentAddress?.distanceFromSchool || 'N/A';
      }

      if (options.includeAcademicInfo !== false) {
        rowData.academicYear = student.academic?.currentYear || 'N/A';
        rowData.admissionDate = student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-IN') : 'N/A';
        rowData.previousSchoolName = student.academic?.previousSchool?.name || 'N/A';
        rowData.previousClass = student.academic?.previousSchool?.lastClass || 'N/A';
        rowData.previousPercentage = student.academic?.previousSchool?.percentage ? `${student.academic.previousSchool.percentage}%` : 'N/A';
        rowData.previousBoard = student.academic?.previousSchool?.board || 'N/A';
        rowData.tcNumber = student.academic?.previousSchool?.transferCertificate?.number || 'N/A';
        rowData.tcIssueDate = student.academic?.previousSchool?.transferCertificate?.issueDate ? 
          new Date(student.academic.previousSchool.transferCertificate.issueDate).toLocaleDateString('en-IN') : 'N/A';
      }

      if (options.includeFeeInfo !== false) {
        const feeStructure = student.fees?.structure;
        rowData.admissionFee = feeStructure?.admissionFee ? feeStructure.admissionFee.toLocaleString('en-IN') : '0';
        rowData.tuitionFee = feeStructure?.tuitionFee ? feeStructure.tuitionFee.toLocaleString('en-IN') : '0';
        rowData.annualCharges = feeStructure?.annualCharges ? feeStructure.annualCharges.toLocaleString('en-IN') : '0';
        rowData.transportFee = feeStructure?.transportFee ? feeStructure.transportFee.toLocaleString('en-IN') : '0';
        rowData.cautionDeposit = feeStructure?.cautionDeposit ? feeStructure.cautionDeposit.toLocaleString('en-IN') : '0';
        rowData.computerLabFee = feeStructure?.computerLabFee ? feeStructure.computerLabFee.toLocaleString('en-IN') : '0';
        rowData.libraryFee = feeStructure?.libraryFee ? feeStructure.libraryFee.toLocaleString('en-IN') : '0';
        rowData.examinationFee = feeStructure?.examinationFee ? feeStructure.examinationFee.toLocaleString('en-IN') : '0';
        rowData.otherCharges = feeStructure?.otherCharges ? feeStructure.otherCharges.toLocaleString('en-IN') : '0';
        rowData.totalFee = student.fees?.totalFee ? student.fees.totalFee.toLocaleString('en-IN') : '0';
        rowData.amountPaid = student.fees?.amountPaid ? student.fees.amountPaid.toLocaleString('en-IN') : '0';
        rowData.balanceDue = student.fees?.balanceDue ? student.fees.balanceDue.toLocaleString('en-IN') : '0';
        rowData.feeStatus = (student.fees?.paymentStatus || 'pending').toUpperCase();
        
        // Get last payment date from payment history
        const lastPayment = student.fees?.paymentHistory?.[0];
        rowData.lastPaymentDate = lastPayment?.paymentDate ? 
          new Date(lastPayment.paymentDate).toLocaleDateString('en-IN') : 'No Payment Yet';
      }

      if (options.includeDocuments !== false) {
        const docs = student.documents;
        rowData.photoUploaded = docs?.photo ? 'YES' : 'NO';
        rowData.birthCertificate = docs?.birthCertificate ? 'YES' : 'NO';
        rowData.aadharStudent = docs?.aadharStudent ? 'YES' : 'NO';
        rowData.aadharFather = docs?.aadharFather ? 'YES' : 'NO';
        rowData.aadharMother = docs?.aadharMother ? 'YES' : 'NO';
        rowData.transferCertificate = docs?.transferCertificate ? 'YES' : 'NO';
        rowData.previousMarksheet = docs?.previousMarksheet ? 'YES' : 'NO';
        rowData.casteCertificate = docs?.casteCertificate ? 'YES' : 'NO';
        rowData.incomeCertificate = docs?.incomeCertificate ? 'YES' : 'NO';
        rowData.medicalCertificate = docs?.medicalCertificate ? 'YES' : 'NO';
        rowData.addressProof = docs?.addressProof ? 'YES' : 'NO';
      }

      rowData.status = (student.status || 'draft').toUpperCase();
      rowData.createdDate = student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN') : 'N/A';
      rowData.lastUpdated = student.updatedAt ? new Date(student.updatedAt).toLocaleDateString('en-IN') : 'N/A';

      const row = this.worksheet.addRow(rowData);
      
      // Apply conditional formatting
      this.applyRowFormatting(row, student, options);
    });
  }

  private addSectionHeaders(options: any): void {
    // Add a section title row
    const sectionRow = this.worksheet.addRow(['STUDENT DATA RECORDS']);
    sectionRow.height = 25;
    sectionRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FFFFFF' } };
    sectionRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sectionRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary.replace('#', '') } };
    
    // Empty row
    this.worksheet.addRow([]);
  }

  private applyRowFormatting(row: ExcelJS.Row, student: Student, options: any): void {
    // Apply conditional formatting based on fee status
    if (options.includeFeeInfo !== false && student.fees?.paymentStatus) {
      const feeStatusCell = row.getCell('feeStatus');
      switch (student.fees.paymentStatus) {
        case 'paid':
          feeStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B98120' } };
          feeStatusCell.font = { color: { argb: '10B981' }, bold: true };
          break;
        case 'partial':
          feeStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B20' } };
          feeStatusCell.font = { color: { argb: 'F59E0B' }, bold: true };
          break;
        case 'overdue':
          feeStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF444420' } };
          feeStatusCell.font = { color: { argb: 'EF4444' }, bold: true };
          break;
        default:
          feeStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F620' } };
          feeStatusCell.font = { color: { argb: '3B82F6' }, bold: true };
      }
    }

    // Highlight inactive students
    if (student.status === 'inactive') {
      row.eachCell((cell) => {
        if (!cell.fill || !cell.fill.fgColor) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6B728010' } };
        }
      });
    }

    // Apply document status formatting
    if (options.includeDocuments !== false) {
      const docFields = ['photoUploaded', 'birthCertificate', 'aadharStudent', 'aadharFather', 'aadharMother', 
                        'transferCertificate', 'previousMarksheet', 'casteCertificate', 'incomeCertificate', 
                        'medicalCertificate', 'addressProof'];
      
      docFields.forEach(field => {
        const cell = row.getCell(field);
        if (cell.value === 'YES') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B98120' } };
          cell.font = { color: { argb: '10B981' }, bold: true };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF444420' } };
          cell.font = { color: { argb: 'EF4444' }, bold: true };
        }
      });
    }
  }

  private async applyFormatting(totalRows: number, options: any): Promise<void> {
    const totalColumns = this.worksheet.columns.length;
    const lastColumn = this.getColumnLetter(totalColumns);
    
    // Merge header cells
    this.worksheet.mergeCells(`A1:${lastColumn}1`); // School name
    this.worksheet.mergeCells(`A2:${lastColumn}2`); // School address
    this.worksheet.mergeCells(`A4:${lastColumn}4`); // Report title
    
    // Format metadata rows
    for (let i = 5; i <= 8; i++) {
      const row = this.worksheet.getRow(i);
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      row.getCell(1).border = {
        top: { style: 'thin', color: { argb: '6B7280' } },
        left: { style: 'thin', color: { argb: '6B7280' } },
        bottom: { style: 'thin', color: { argb: '6B7280' } },
        right: { style: 'thin', color: { argb: '6B7280' } }
      };
      row.getCell(2).border = {
        top: { style: 'thin', color: { argb: '6B7280' } },
        left: { style: 'thin', color: { argb: '6B7280' } },
        bottom: { style: 'thin', color: { argb: '6B7280' } },
        right: { style: 'thin', color: { argb: '6B7280' } }
      };
    }

    // Format section header
    const sectionHeaderRow = this.worksheet.getRow(10);
    this.worksheet.mergeCells(`A10:${lastColumn}10`);
    sectionHeaderRow.getCell(1).border = {
      top: { style: 'thick', color: { argb: COLORS.secondary.replace('#', '') } },
      left: { style: 'thick', color: { argb: COLORS.secondary.replace('#', '') } },
      bottom: { style: 'thick', color: { argb: COLORS.secondary.replace('#', '') } },
      right: { style: 'thick', color: { argb: COLORS.secondary.replace('#', '') } }
    };

    // Find the actual header row (should be row 12)
    const headerRowIndex = 12;
    const headerRow = this.worksheet.getRow(headerRowIndex);
    headerRow.height = 30;
    
    // Format header row
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary.replace('#', '') } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thick', color: { argb: 'FFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFF' } },
        bottom: { style: 'thick', color: { argb: 'FFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFF' } }
      };
    });

    // Format data rows
    const dataStartRow = headerRowIndex + 1;
    const dataEndRow = dataStartRow + totalRows - 1;
    
    for (let i = dataStartRow; i <= dataEndRow; i++) {
      const row = this.worksheet.getRow(i);
      row.height = 20;
      
      row.eachCell((cell, colNumber) => {
        // Basic cell formatting
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E5E7EB' } },
          left: { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          right: { style: 'thin', color: { argb: 'E5E7EB' } }
        };
        
        // Alternate row colors
        if (i % 2 === 0) {
          if (!cell.fill || !cell.fill.fgColor || cell.fill.fgColor.argb === 'FFFFFF') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
          }
        }
        
        // Center align specific columns
        const column = this.worksheet.getColumn(colNumber);
        if (column && column.key) {
          const centerAlignFields = ['sno', 'class', 'section', 'rollNumber', 'gender', 'age', 'bloodGroup', 
                                   'primaryContact', 'feeStatus', 'status', 'photoUploaded', 'birthCertificate',
                                   'aadharStudent', 'aadharFather', 'aadharMother', 'transferCertificate',
                                   'previousMarksheet', 'casteCertificate', 'incomeCertificate', 
                                   'medicalCertificate', 'addressProof'];
          
          if (centerAlignFields.includes(column.key as string)) {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          }
          
          // Right align numeric fields
          const rightAlignFields = ['admissionFee', 'tuitionFee', 'annualCharges', 'transportFee', 
                                   'cautionDeposit', 'computerLabFee', 'libraryFee', 'examinationFee',
                                   'otherCharges', 'totalFee', 'amountPaid', 'balanceDue', 'distanceFromSchool'];
          
          if (rightAlignFields.includes(column.key as string)) {
            cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
          }
        }
      });
    }

    // Freeze panes (freeze first 6 columns and header row)
    this.worksheet.views = [{
      state: 'frozen',
      xSplit: 6,
      ySplit: headerRowIndex,
      topLeftCell: 'G13'
    }];

    // Auto-fit columns with better logic
    this.worksheet.columns.forEach((column, index) => {
      if (column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.value) {
            const cellLength = cell.value.toString().length;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        });
        
        // Set minimum and maximum widths
        const minWidth = 10;
        const maxWidth = 50;
        const calculatedWidth = Math.max(maxLength + 2, minWidth);
        column.width = Math.min(calculatedWidth, maxWidth);
      }
    });

    // Add print settings
    this.worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5, right: 0.5, top: 0.75, bottom: 0.75,
        header: 0.3, footer: 0.3
      },
      printTitlesRow: `${headerRowIndex}:${headerRowIndex}`,
      printArea: `A1:${lastColumn}${dataEndRow}`
    };
  }

  private async addSummarySheet(students: Student[], options: any): Promise<void> {
    const summarySheet = this.workbook.addWorksheet('Summary');
    
    // Summary statistics
    const stats = this.calculateStatistics(students);
    
    summarySheet.addRow(['Student Summary Statistics']);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Students', stats.total]);
    summarySheet.addRow(['Active Students', stats.active]);
    summarySheet.addRow(['Inactive Students', stats.inactive]);
    summarySheet.addRow([]);
    
    summarySheet.addRow(['Fee Statistics']);
    summarySheet.addRow(['Fees Paid', stats.feesPaid]);
    summarySheet.addRow(['Fees Partial', stats.feesPartial]);
    summarySheet.addRow(['Fees Pending', stats.feesPending]);
    summarySheet.addRow(['Fees Overdue', stats.feesOverdue]);
    summarySheet.addRow([]);
    
    summarySheet.addRow(['Class Distribution']);
    Object.entries(stats.classDist).forEach(([className, count]) => {
      summarySheet.addRow([className, count]);
    });

    // Format summary sheet
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 15;
    
    summarySheet.getRow(1).font = { size: 16, bold: true, color: { argb: COLORS.primary.replace('#', '') } };
    summarySheet.getRow(7).font = { size: 14, bold: true, color: { argb: COLORS.secondary.replace('#', '') } };
    summarySheet.getRow(13).font = { size: 14, bold: true, color: { argb: COLORS.secondary.replace('#', '') } };
  }

  private async addChartsSheet(students: Student[]): Promise<void> {
    // Note: ExcelJS doesn't support charts directly, but we can prepare data for charts
    const chartsSheet = this.workbook.addWorksheet('Charts Data');
    
    const stats = this.calculateStatistics(students);
    
    // Fee status data for charts
    chartsSheet.addRow(['Fee Status', 'Count']);
    chartsSheet.addRow(['Paid', stats.feesPaid]);
    chartsSheet.addRow(['Partial', stats.feesPartial]);
    chartsSheet.addRow(['Pending', stats.feesPending]);
    chartsSheet.addRow(['Overdue', stats.feesOverdue]);
    
    chartsSheet.addRow([]);
    
    // Class distribution data
    chartsSheet.addRow(['Class', 'Students']);
    Object.entries(stats.classDist).forEach(([className, count]) => {
      chartsSheet.addRow([className, count]);
    });
  }

  private calculateStatistics(students: Student[]) {
    const stats = {
      total: students.length,
      active: students.filter(s => s.status === 'active').length,
      inactive: students.filter(s => s.status === 'inactive').length,
      feesPaid: students.filter(s => s.fees?.paymentStatus === 'paid').length,
      feesPartial: students.filter(s => s.fees?.paymentStatus === 'partial').length,
      feesPending: students.filter(s => s.fees?.paymentStatus === 'pending').length,
      feesOverdue: students.filter(s => s.fees?.paymentStatus === 'overdue').length,
      classDist: {} as Record<string, number>
    };

    // Calculate class distribution
    students.forEach(student => {
      const className = student.academic.admissionClass;
      stats.classDist[className] = (stats.classDist[className] || 0) + 1;
    });

    return stats;
  }

  private getFilterText(options: any): string {
    const filters = [];
    if (options.filterByClass) filters.push(`Class: ${options.filterByClass}`);
    if (options.filterBySection) filters.push(`Section: ${options.filterBySection}`);
    if (options.filterByFeeStatus) filters.push(`Fee Status: ${options.filterByFeeStatus}`);
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

// Export utility functions
export const exportStudentsToExcel = async (
  students: Student[], 
  options: any = {}
): Promise<void> => {
  const exporter = new StudentExcelExporter();
  await exporter.exportStudents(students, options);
};

// Simplified CSV export for quick use
export const exportStudentsToCSV = async (
  students: Student[]
): Promise<void> => {
  const headers = [
    'Admission Number', 'Student Name', 'Class', 'Section', 'Roll Number',
    'Gender', 'Date of Birth', 'Father Name', 'Father Mobile', 
    'Mother Name', 'Mother Mobile', 'Fee Status', 'Balance Due', 'Status'
  ];
  
  const rows = students.map(student => [
    student.admissionNumber || 'N/A',
    `${student.basic?.firstName || ''} ${student.basic?.lastName || ''}`.trim() || 'N/A',
    student.academic?.admissionClass || 'N/A',
    student.academic?.section || 'N/A',
    student.academic?.rollNumber || 'N/A',
    student.basic?.gender || 'N/A',
    student.basic?.dateOfBirth ? new Date(student.basic.dateOfBirth).toLocaleDateString('en-IN') : 'N/A',
    student.father?.name || 'N/A',
    student.father?.mobile || 'N/A',
    student.mother?.name || 'N/A',
    student.mother?.mobile || 'N/A',
    student.fees?.paymentStatus || 'pending',
    student.fees?.balanceDue ? `₹${student.fees.balanceDue.toLocaleString('en-IN')}` : '₹0',
    student.status || 'draft'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};