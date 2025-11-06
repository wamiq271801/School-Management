import ExcelJS from 'exceljs';
import type { Student } from '@/services/studentService';

// Color scheme matching export structure
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

interface TemplateOptions {
  includeExamples?: boolean;
  includeAllFields?: boolean;
}

/**
 * Generate import template that matches exact export structure
 */
export class EnhancedTemplateGenerator {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'SmartSchool Management System';
    this.workbook.created = new Date();
  }

  async generateTemplate(options: TemplateOptions = {}): Promise<ExcelJS.Workbook> {
    // Create instructions sheet
    this.createInstructionsSheet();
    
    // Create validation data sheet
    this.createValidationSheet();
    
    // Create main import sheet
    this.createImportSheet(options);
    
    return this.workbook;
  }

  private createInstructionsSheet(): void {
    const sheet = this.workbook.addWorksheet('INSTRUCTIONS', {
      properties: { tabColor: { argb: COLORS.info.replace('#', '') } }
    });

    // Header
    const headerRow = sheet.addRow(['SMARTSCHOOL BULK IMPORT TEMPLATE']);
    headerRow.height = 35;
    headerRow.getCell(1).font = { size: 20, bold: true, color: { argb: COLORS.primary.replace('#', '') } };
    headerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light.replace('#', '') } };

    sheet.mergeCells('A1:F1');

    // Version and date
    const versionRow = sheet.addRow([`Template Version: v2.0.0 | Generated: ${new Date().toLocaleDateString('en-IN')}`]);
    versionRow.getCell(1).font = { size: 10, italic: true, color: { argb: COLORS.gray.replace('#', '') } };
    versionRow.getCell(1).alignment = { horizontal: 'center' };
    sheet.mergeCells('A2:F2');

    sheet.addRow([]);

    // Instructions
    const instructions = [
      ['📋 IMPORTANT INSTRUCTIONS', ''],
      ['', ''],
      ['Template Structure', 'This template matches the exact structure of the student export system for seamless data integration.'],
      ['', ''],
      ['Required Fields', 'Fields marked with * are mandatory. The system will reject rows with missing required data.'],
      ['', ''],
      ['Data Format', 'Follow the exact format shown in examples. Use dropdowns where provided.'],
      ['', ''],
      ['Date Format', 'All dates must be in YYYY-MM-DD format (ISO 8601 standard).'],
      ['', ''],
      ['Phone Numbers', 'Use format: +91-9876543210 or 9876543210 (10-15 digits).'],
      ['', ''],
      ['Addresses', 'Provide complete address information. Use comma-separated format for better parsing.'],
      ['', ''],
      ['Document References', 'If uploading documents separately, use consistent naming: AdmissionNo_DocumentType.ext'],
      ['', ''],
      ['Validation', 'The system will validate all data against school standards before import.'],
      ['', ''],
      ['Support', 'For assistance, contact your system administrator.'],
    ];\

    let rowNum = 4;
    instructions.forEach(([label, value]) => {
      const row = sheet.addRow([label, value]);
      if (label && !value) {
        sheet.mergeCells(`A${rowNum}:F${rowNum}`);
        row.getCell(1).font = { size: 12, bold: true, color: { argb: COLORS.primary.replace('#', '') } };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light.replace('#', '') } };
      } else if (label) {
        row.getCell(1).font = { bold: true, color: { argb: COLORS.dark.replace('#', '') } };
        sheet.mergeCells(`B${rowNum}:F${rowNum}`);
      }
      rowNum++;
    });

    // Set column widths
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 80;
  }

  private createValidationSheet(): void {
    const sheet = this.workbook.addWorksheet('VALIDATION_DATA', {
      properties: { tabColor: { argb: COLORS.gray.replace('#', '') } },
      state: 'hidden'
    });

    // Define validation lists that match export structure
    const validationData = {
      Genders: ['Male', 'Female', 'Other'],
      Classes: ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      Sections: ['A', 'B', 'C', 'D', 'E'],
      BloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'],
      Categories: ['General', 'OBC', 'SC', 'ST', 'EWS'],
      Religions: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'],
      States: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Other'],
      Countries: ['India', 'Other'],
      PrimaryContact: ['father', 'mother', 'guardian'],
      YesNo: ['Yes', 'No'],
      Status: ['active', 'inactive', 'draft'],
      AcademicYears: ['2024-25', '2025-26', '2026-27', '2027-28']
    };

    let col = 1;
    Object.entries(validationData).forEach(([key, values]) => {
      const columnLetter = this.getColumnLetter(col);
      
      // Header
      sheet.getCell(`${columnLetter}1`).value = key;
      sheet.getCell(`${columnLetter}1`).font = { bold: true };
      
      // Values
      values.forEach((value, index) => {
        sheet.getCell(`${columnLetter}${index + 2}`).value = value;
      });
      
      // Create named range
      this.workbook.definedNames.add(
        `VALIDATION_DATA!$${columnLetter}$2:$${columnLetter}$${values.length + 1}`,
        key
      );
      
      col++;
    });
  }

  private createImportSheet(options: TemplateOptions): void {
    this.worksheet = this.workbook.addWorksheet('STUDENT_IMPORT', {
      properties: { tabColor: { argb: COLORS.success.replace('#', '') } }
    });

    // Add header section
    this.addHeaderSection();
    
    // Define columns that match export structure
    const columns = this.getImportColumns(options.includeAllFields);
    
    // Set up columns
    this.worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width
    }));

    // Format header row
    this.formatHeaderRow(columns);
    
    // Add validation and formatting
    this.addValidationAndFormatting(columns);
    
    // Add example data if requested
    if (options.includeExamples) {
      this.addExampleData(columns);
    }

    // Protect sheet
    this.protectSheet();
  }

  private addHeaderSection(): void {
    // School header
    const headerRow1 = this.worksheet.addRow(['SMARTSCHOOL MANAGEMENT SYSTEM - STUDENT IMPORT']);
    headerRow1.height = 30;
    headerRow1.getCell(1).font = { size: 16, bold: true, color: { argb: COLORS.primary.replace('#', '') } };
    headerRow1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light.replace('#', '') } };

    // Instructions row
    const headerRow2 = this.worksheet.addRow(['Fill in student data below. Required fields are marked with *. Use dropdowns where available.']);
    headerRow2.getCell(1).font = { size: 10, italic: true, color: { argb: COLORS.gray.replace('#', '') } };
    headerRow2.getCell(1).alignment = { horizontal: 'center' };

    // Empty row
    this.worksheet.addRow([]);
  }

  private getImportColumns(includeAllFields: boolean = false): any[] {
    const basicColumns = [
      // Basic Information (matches export structure)
      { key: 'sno', header: 'SR. NO.', width: 8, required: false, type: 'number' },
      { key: 'admissionNumber', header: 'ADMISSION NUMBER', width: 18, required: false },
      { key: 'firstName', header: 'FIRST NAME *', width: 20, required: true },
      { key: 'middleName', header: 'MIDDLE NAME', width: 20, required: false },
      { key: 'lastName', header: 'LAST NAME *', width: 20, required: true },
      { key: 'gender', header: 'GENDER *', width: 12, required: true, dropdown: 'Genders' },
      { key: 'dateOfBirth', header: 'DATE OF BIRTH *\\n(YYYY-MM-DD)', width: 18, required: true, type: 'date' },
      { key: 'bloodGroup', header: 'BLOOD GROUP', width: 15, required: false, dropdown: 'BloodGroups' },
      { key: 'category', header: 'CATEGORY *', width: 15, required: true, dropdown: 'Categories' },
      { key: 'religion', header: 'RELIGION', width: 15, required: false, dropdown: 'Religions' },
      { key: 'nationality', header: 'NATIONALITY *', width: 15, required: true },
      { key: 'motherTongue', header: 'MOTHER TONGUE', width: 18, required: false },
      
      // Academic Information
      { key: 'admissionClass', header: 'CLASS *', width: 12, required: true, dropdown: 'Classes' },
      { key: 'section', header: 'SECTION *', width: 12, required: true, dropdown: 'Sections' },
      { key: 'rollNumber', header: 'ROLL NUMBER', width: 15, required: false },
      { key: 'academicYear', header: 'ACADEMIC YEAR *', width: 15, required: true, dropdown: 'AcademicYears' },
      
      // Contact Information
      { key: 'fatherName', header: 'FATHER NAME *', width: 25, required: true },
      { key: 'fatherMobile', header: 'FATHER MOBILE *', width: 18, required: true },
      { key: 'fatherEmail', header: 'FATHER EMAIL', width: 25, required: false },
      { key: 'fatherOccupation', header: 'FATHER OCCUPATION', width: 20, required: false },
      { key: 'motherName', header: 'MOTHER NAME *', width: 25, required: true },
      { key: 'motherMobile', header: 'MOTHER MOBILE *', width: 18, required: true },
      { key: 'motherEmail', header: 'MOTHER EMAIL', width: 25, required: false },
      { key: 'motherOccupation', header: 'MOTHER OCCUPATION', width: 20, required: false },
      { key: 'primaryContact', header: 'PRIMARY CONTACT *', width: 18, required: true, dropdown: 'PrimaryContact' },
      
      // Address Information
      { key: 'permanentAddressLine1', header: 'PERMANENT ADDRESS LINE 1 *', width: 30, required: true },
      { key: 'permanentAddressLine2', header: 'PERMANENT ADDRESS LINE 2', width: 30, required: false },
      { key: 'permanentCity', header: 'PERMANENT CITY *', width: 18, required: true },
      { key: 'permanentState', header: 'PERMANENT STATE *', width: 18, required: true, dropdown: 'States' },
      { key: 'permanentPincode', header: 'PERMANENT PINCODE *', width: 15, required: true },
      { key: 'permanentCountry', header: 'PERMANENT COUNTRY *', width: 18, required: true, dropdown: 'Countries' },
      
      // Status
      { key: 'status', header: 'STUDENT STATUS', width: 15, required: false, dropdown: 'Status' }
    ];

    if (includeAllFields) {
      // Add extended fields for comprehensive import
      const extendedColumns = [
        { key: 'placeOfBirth', header: 'PLACE OF BIRTH', width: 20, required: false },
        { key: 'caste', header: 'CASTE', width: 15, required: false },
        { key: 'guardianName', header: 'GUARDIAN NAME', width: 25, required: false },
        { key: 'guardianMobile', header: 'GUARDIAN MOBILE', width: 18, required: false },
        { key: 'guardianRelation', header: 'GUARDIAN RELATION', width: 20, required: false },
        { key: 'currentAddressLine1', header: 'CURRENT ADDRESS LINE 1', width: 30, required: false },
        { key: 'currentAddressLine2', header: 'CURRENT ADDRESS LINE 2', width: 30, required: false },
        { key: 'currentCity', header: 'CURRENT CITY', width: 18, required: false },
        { key: 'currentState', header: 'CURRENT STATE', width: 18, required: false, dropdown: 'States' },
        { key: 'currentPincode', header: 'CURRENT PINCODE', width: 15, required: false },
        { key: 'currentCountry', header: 'CURRENT COUNTRY', width: 18, required: false, dropdown: 'Countries' },
        { key: 'previousSchoolName', header: 'PREVIOUS SCHOOL NAME', width: 30, required: false },
        { key: 'previousClass', header: 'PREVIOUS CLASS', width: 18, required: false },
        { key: 'previousPercentage', header: 'PREVIOUS PERCENTAGE', width: 20, required: false },
        { key: 'tcNumber', header: 'TC NUMBER', width: 20, required: false },
        { key: 'tcIssueDate', header: 'TC ISSUE DATE\\n(YYYY-MM-DD)', width: 18, required: false, type: 'date' },
        { key: 'admissionDate', header: 'ADMISSION DATE\\n(YYYY-MM-DD)', width: 18, required: false, type: 'date' },
        { key: 'notes', header: 'ADDITIONAL NOTES', width: 40, required: false }
      ];
      
      return [...basicColumns, ...extendedColumns];
    }

    return basicColumns;
  }

  private formatHeaderRow(columns: any[]): void {
    const headerRow = this.worksheet.getRow(4); // Header is at row 4 after our header section
    headerRow.height = 35;
    
    columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      
      // Header styling
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary.replace('#', '') } };
      cell.border = {
        top: { style: 'thick', color: { argb: 'FFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFF' } },
        bottom: { style: 'thick', color: { argb: 'FFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFF' } }
      };
      
      // Color coding for different sections
      if (col.key.includes('father') || col.key.includes('mother') || col.key.includes('guardian') || col.key === 'primaryContact') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.info.replace('#', '') } };
      } else if (col.key.includes('Address') || col.key.includes('City') || col.key.includes('State') || col.key.includes('Pincode') || col.key.includes('Country')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warning.replace('#', '') } };
      } else if (col.key.includes('Class') || col.key.includes('Section') || col.key.includes('Academic') || col.key.includes('Roll')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success.replace('#', '') } };
      }
      
      // Mark required fields
      if (col.required) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.danger.replace('#', '') } };
      }
    });

    // Merge header cells for the title
    this.worksheet.mergeCells(`A1:${this.getColumnLetter(columns.length)}1`);
    this.worksheet.mergeCells(`A2:${this.getColumnLetter(columns.length)}2`);
  }

  private addValidationAndFormatting(columns: any[]): void {
    columns.forEach((col, index) => {
      const colLetter = this.getColumnLetter(index + 1);
      
      // Add data validation for rows 5-1000 (data rows)
      for (let row = 5; row <= 1000; row++) {
        const cell = this.worksheet.getCell(`${colLetter}${row}`);
        
        // Dropdown validation
        if (col.dropdown) {
          cell.dataValidation = {
            type: 'list',
            allowBlank: !col.required,
            formulae: [col.dropdown],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Value',
            error: `Please select a value from the dropdown list`
          };
        }
        
        // Date formatting
        if (col.type === 'date') {
          cell.numFmt = 'yyyy-mm-dd';
        }
        
        // Number formatting
        if (col.type === 'number') {
          cell.numFmt = '0';
        }
        
        // Required field highlighting
        if (col.required) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5' } };
        }
        
        // Cell protection (unlock data cells)
        cell.protection = { locked: false };
      }
    });
  }

  private addExampleData(columns: any[]): void {
    const exampleData = {
      sno: 1,
      admissionNumber: 'STU-2025-00001',
      firstName: 'Riya',
      middleName: '',
      lastName: 'Sharma',
      gender: 'Female',
      dateOfBirth: '2013-03-29',
      bloodGroup: 'A+',
      category: 'General',
      religion: 'Hindu',
      nationality: 'Indian',
      motherTongue: 'Hindi',
      admissionClass: '7',
      section: 'B',
      rollNumber: '1',
      academicYear: '2025-26',
      fatherName: 'Rajesh Sharma',
      fatherMobile: '9876543210',
      fatherEmail: 'rajesh@example.com',
      fatherOccupation: 'Engineer',
      motherName: 'Priya Sharma',
      motherMobile: '9876543211',
      motherEmail: 'priya@example.com',
      motherOccupation: 'Teacher',
      primaryContact: 'father',
      permanentAddressLine1: '123 Main Street, Apt 4B',
      permanentAddressLine2: 'Near City Center',
      permanentCity: 'Mumbai',
      permanentState: 'Maharashtra',
      permanentPincode: '400001',
      permanentCountry: 'India',
      status: 'active'
    };

    const dataRow = this.worksheet.getRow(5);
    columns.forEach((col, index) => {
      const value = (exampleData as any)[col.key];
      if (value !== undefined) {
        dataRow.getCell(index + 1).value = value;
      }
    });
    
    // Style example row
    dataRow.eachCell((cell) => {
      cell.font = { color: { argb: COLORS.gray.replace('#', '') }, italic: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF7E0' } };
    });
  }

  private protectSheet(): void {
    this.worksheet.protect('smartschool2025', {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertRows: true,
      deleteRows: true,
      sort: false,
      autoFilter: false,
    });
  }

  private getColumnLetter(col: number): string {
    let letter = '';
    while (col > 0) {
      const remainder = (col - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      col = Math.floor((col - 1) / 26);
    }
    return letter;
  }
}

/**
 * Export enhanced template as buffer
 */
export async function generateEnhancedTemplate(options: TemplateOptions = {}): Promise<Buffer> {
  const generator = new EnhancedTemplateGenerator();
  const workbook = await generator.generateTemplate(options);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}