/**
 * Excel Template Generator for Student Bulk Import
 * Amazon Seller Central-style with colorful headers, dropdowns, and validation
 * 
 * ASSUMPTION: Uses ExcelJS for cross-platform XLSX generation without macros
 * ASSUMPTION: Template version v1.0.0 for compatibility tracking
 */

import ExcelJS from 'exceljs';
import enumsData from '@/schemas/enums.json';

// Color scheme (Amazon Seller Central inspired)
const COLORS = {
  identity: '1F6FEB',      // Blue
  academic: '2EA043',      // Green
  contact: 'A371F7',       // Purple
  parentGuardian: '0969DA', // Dark Blue
  tcPrior: 'D29922',       // Orange
  compliance: 'E5534B',    // Red
  system: '6E7781',        // Gray
  headerText: 'FFFFFF',    // White
  dataHeaderBg: 'F6F8FA',  // Light Gray
  requiredCell: 'FFF5F5',  // Pale Red
  errorCell: 'FED7D7',     // Light Red
  warningCell: 'FEF5E7',   // Light Orange
};

interface TemplateOptions {
  includeExamples?: boolean;
  withMacros?: boolean;
  classes?: string[];
  sections?: string[];
  houses?: string[];
  sessionYears?: string[];
}

/**
 * Generate Student Bulk Import Template
 */
export async function generateStudentImportTemplate(
  options: TemplateOptions = {}
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'SmartSchool Management System';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  
  // Use enums from JSON or provided options
  const enums = {
    classes: options.classes || enumsData.enums.classes,
    sections: options.sections || enumsData.enums.sections,
    houses: options.houses || enumsData.enums.houses,
    sessionYears: options.sessionYears || enumsData.enums.sessionYears,
    genders: enumsData.enums.genders,
    bloodGroups: enumsData.enums.bloodGroups,
    categories: enumsData.enums.categories,
    religions: enumsData.enums.religions,
    streams: enumsData.enums.streams,
    admissionType: enumsData.enums.admissionType,
    hasTc: enumsData.enums.hasTc,
    status: enumsData.enums.status,
    boards: enumsData.enums.boards,
    states: enumsData.enums.states,
    guardianRelations: enumsData.enums.guardianRelations,
    primaryContact: enumsData.enums.primaryContact,
    disabilityStatus: enumsData.enums.disabilityStatus,
  };

  // Create sheets
  createReadMeSheet(workbook);
  createDropdownsSheet(workbook, enums);
  createStudentsSheet(workbook, enums, options.includeExamples);

  return workbook;
}

/**
 * Create READ_ME sheet with instructions
 */
function createReadMeSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('READ_ME', {
    properties: { tabColor: { argb: 'FF0969DA' } }
  });

  // Lock the sheet
  sheet.protect('smartschool2025', {
    selectLockedCells: true,
    selectUnlockedCells: true,
  });

  // Title
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '📚 SmartSchool Student Bulk Import Template';
  titleCell.font = { size: 18, bold: true, color: { argb: 'FF1F6FEB' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 30;

  // Version info
  sheet.mergeCells('A2:F2');
  const versionCell = sheet.getCell('A2');
  versionCell.value = `Template Version: v1.0.0 | Generated: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} | Timezone: Asia/Kolkata`;
  versionCell.font = { size: 10, italic: true };
  versionCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Instructions
  const instructions = [
    ['📋 INSTRUCTIONS', ''],
    ['', ''],
    ['Purpose', 'Use this template to bulk import student records into SmartSchool Management System.'],
    ['', ''],
    ['Date Format', 'All dates MUST be in YYYY-MM-DD format (e.g., 2025-11-04). This is ISO 8601 standard.'],
    ['', ''],
    ['Required Fields', 'Fields marked with pale red background are REQUIRED. The import will fail if these are empty.'],
    ['', ''],
    ['Dropdowns', 'Many columns have dropdown lists. Click the cell to see available options. Do not type custom values.'],
    ['', ''],
    ['TC Logic', '⚠️ IMPORTANT: If Admission Type = "New", Has TC must be "No". If Admission Type = "Transfer", Has TC must be "Yes" and TC Number + TC Issue Date are required.'],
    ['', ''],
    ['Documents', 'Use the "Photo FileName" and "Birth Certificate FileName" columns to specify document names for ZIP auto-matching.'],
    ['Document Naming', 'Recommended pattern: {AdmissionNo}_DocumentType.ext (e.g., STU-2025-00001_Photo.jpg)'],
    ['', ''],
    ['File Size', 'Maximum file size: 10 MB for XLSX. For larger imports, split into multiple files.'],
    ['', ''],
    ['Storage Policy', 'Documents are stored securely. Supported formats: JPG, PNG, PDF. Max 5MB per document.'],
    ['', ''],
    ['Support', 'For help, contact your system administrator or refer to the user manual.'],
  ];

  let rowNum = 4;
  instructions.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    if (label && !value) {
      // Section header
      sheet.mergeCells(`A${rowNum}:F${rowNum}`);
      row.getCell(1).font = { size: 12, bold: true, color: { argb: 'FF2EA043' } };
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF6F8FA' }
      };
    } else if (label) {
      row.getCell(1).font = { bold: true };
      sheet.mergeCells(`B${rowNum}:F${rowNum}`);
    }
    rowNum++;
  });

  // Color key
  sheet.addRow([]);
  sheet.addRow(['🎨 COLOR KEY']);
  const colorKeyRow = sheet.lastRow!.number;
  sheet.mergeCells(`A${colorKeyRow}:F${colorKeyRow}`);
  sheet.getCell(`A${colorKeyRow}`).font = { size: 12, bold: true };

  const colorKeys = [
    ['Identity', COLORS.identity],
    ['Academic', COLORS.academic],
    ['Contact', COLORS.contact],
    ['Parent/Guardian', COLORS.parentGuardian],
    ['TC & Prior', COLORS.tcPrior],
    ['Compliance', COLORS.compliance],
    ['System', COLORS.system],
  ];

  colorKeys.forEach(([label, color]) => {
    const row = sheet.addRow([label, '']);
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${color}` }
    };
    row.getCell(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });

  // Set column widths
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 80;
}

/**
 * Create Dropdowns sheet (hidden) with source lists
 */
function createDropdownsSheet(workbook: ExcelJS.Workbook, enums: any): void {
  const sheet = workbook.addWorksheet('Dropdowns', {
    properties: { tabColor: { argb: 'FF6E7781' } },
    state: 'hidden'
  });

  // Create named ranges for each enum
  let col = 1;
  
  Object.entries(enums).forEach(([key, values]: [string, any]) => {
    const columnLetter = String.fromCharCode(64 + col);
    
    // Header
    sheet.getCell(`${columnLetter}1`).value = key;
    sheet.getCell(`${columnLetter}1`).font = { bold: true };
    
    // Values
    (values as string[]).forEach((value, index) => {
      sheet.getCell(`${columnLetter}${index + 2}`).value = value;
    });
    
    // Create named range (using correct ExcelJS API)
    const rangeName = key.charAt(0).toUpperCase() + key.slice(1);
    workbook.definedNames.add(
      `'Dropdowns'!$${columnLetter}$2:$${columnLetter}$${values.length + 1}`,
      rangeName
    );
    
    col++;
  });
}

/**
 * Create Students sheet with data entry columns
 */
function createStudentsSheet(
  workbook: ExcelJS.Workbook,
  enums: any,
  includeExamples: boolean = false
): void {
  const sheet = workbook.addWorksheet('Students', {
    properties: { tabColor: { argb: 'FF2EA043' } }
  });

  // Define column structure
  const columns = [
    // Name (First/Middle/Last)
    { key: 'firstName', header: 'First Name *', width: 15, required: true },
    { key: 'middleName', header: 'Middle Name', width: 15, required: false },
    { key: 'lastName', header: 'Last Name *', width: 15, required: true },
    // Basic Info
    { key: 'gender', header: 'Gender *', width: 12, required: true, dropdown: 'Genders' },
    { key: 'dob', header: 'Date of Birth *\n(YYYY-MM-DD)', width: 18, required: true },
    { key: 'bloodGroup', header: 'Blood Group', width: 12, required: false, dropdown: 'BloodGroups' },
    { key: 'category', header: 'Category *', width: 12, required: true, dropdown: 'Categories' },
    { key: 'nationality', header: 'Nationality *', width: 15, required: true },
    { key: 'religion', header: 'Religion', width: 15, required: false, dropdown: 'Religions' },
    { key: 'motherTongue', header: 'Mother Tongue', width: 18, required: false },
    { key: 'caste', header: 'Caste', width: 15, required: false },
    { key: 'placeOfBirth', header: 'Place of Birth', width: 20, required: false },
    { key: 'aadharNo', header: 'Aadhaar Number', width: 18, required: false },
    // Academic (align with UI: admissionClass/currentYear/section)
    { key: 'admissionClass', header: 'Admission Class *', width: 16, required: true, dropdown: 'Classes' },
    { key: 'section', header: 'Section *', width: 10, required: true, dropdown: 'Sections' },
    { key: 'rollNo', header: 'Roll Number', width: 12, required: false },
    { key: 'currentYear', header: 'Academic Year *', width: 15, required: true, dropdown: 'SessionYears' },
    // Parent/Guardian (extended)
    { key: 'fatherName', header: "Father Name *", width: 22, required: true },
    { key: 'fatherMobile', header: "Father Mobile *", width: 16, required: true },
    { key: 'fatherEmail', header: 'Father Email', width: 24, required: false },
    { key: 'fatherOccupation', header: 'Father Occupation', width: 20, required: false },
    { key: 'fatherAadhar', header: 'Father Aadhaar *', width: 18, required: true },
    { key: 'fatherOfficeAddress', header: 'Father Office Address', width: 28, required: false },
    { key: 'motherName', header: "Mother Name *", width: 22, required: true },
    { key: 'motherMobile', header: "Mother Mobile *", width: 16, required: true },
    { key: 'motherEmail', header: 'Mother Email', width: 24, required: false },
    { key: 'motherOccupation', header: 'Mother Occupation', width: 20, required: false },
    { key: 'motherAadhar', header: 'Mother Aadhaar *', width: 18, required: true },
    { key: 'motherOfficeAddress', header: 'Mother Office Address', width: 28, required: false },
    { key: 'includeGuardian', header: 'Include Guardian (Yes/No)', width: 22, required: false, dropdown: 'HasTc' },
    { key: 'guardianName', header: 'Guardian Name', width: 22, required: false },
    { key: 'guardianMobile', header: 'Guardian Mobile', width: 16, required: false },
    { key: 'guardianEmail', header: 'Guardian Email', width: 24, required: false },
    { key: 'guardianOccupation', header: 'Guardian Occupation', width: 20, required: false },
    { key: 'guardianAadhar', header: 'Guardian Aadhaar', width: 18, required: false },
    { key: 'guardianOfficeAddress', header: 'Guardian Office Address', width: 28, required: false },
    { key: 'primaryContact', header: 'Primary Contact *', width: 18, required: true, dropdown: 'PrimaryContact' },
    // Addresses (permanent & current)
    { key: 'permStreet', header: 'Permanent Street *', width: 40, required: true },
    { key: 'permCity', header: 'Permanent City *', width: 18, required: true },
    { key: 'permState', header: 'Permanent State *', width: 18, required: true, dropdown: 'States' },
    { key: 'permPincode', header: 'Permanent Pincode *', width: 14, required: true },
    { key: 'permCountry', header: 'Permanent Country *', width: 18, required: true },
    { key: 'sameAsPermanent', header: 'Current same as Permanent (Yes/No)', width: 28, required: false, dropdown: 'HasTc' },
    { key: 'currStreet', header: 'Current Street', width: 40, required: false },
    { key: 'currCity', header: 'Current City', width: 18, required: false },
    { key: 'currState', header: 'Current State', width: 18, required: false, dropdown: 'States' },
    { key: 'currPincode', header: 'Current Pincode', width: 14, required: false },
    { key: 'currCountry', header: 'Current Country', width: 18, required: false },
    // Previous School & TC (align with UI)
    { key: 'hasPreviousSchool', header: 'Has Previous School (Yes/No)', width: 26, required: false, dropdown: 'HasTc' },
    { key: 'previousSchoolName', header: 'Previous School Name', width: 30, required: false },
    { key: 'previousSchoolAddress', header: 'Previous School Address', width: 30, required: false },
    { key: 'lastClassAttended', header: 'Last Class Attended', width: 20, required: false },
    { key: 'tcNumber', header: 'TC Number', width: 18, required: false },
    { key: 'tcIssueDate', header: 'TC Issue Date (YYYY-MM-DD)', width: 22, required: false },
    { key: 'reasonForLeaving', header: 'Reason For Leaving', width: 28, required: false },
    // Notes
    { key: 'notes', header: 'Additional Notes', width: 40, required: false },
  ];

  // Add columns to sheet using the columns property - this creates the header automatically
  sheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  // Style the header row (row 1)
  const headerRow = sheet.getRow(1);
  headerRow.height = 35;
  headerRow.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F4FD' }
  };
  headerRow.border = {
    top: { style: 'thin', color: { argb: 'FFD0D7DE' } },
    left: { style: 'thin', color: { argb: 'FFD0D7DE' } },
    bottom: { style: 'thin', color: { argb: 'FFD0D7DE' } },
    right: { style: 'thin', color: { argb: 'FFD0D7DE' } }
  };

  // Apply border to each header cell individually
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD0D7DE' } },
      left: { style: 'thin', color: { argb: 'FFD0D7DE' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D7DE' } },
      right: { style: 'thin', color: { argb: 'FFD0D7DE' } }
    };
    // Make sure header has no validation (no dropdowns on header)
    cell.dataValidation = undefined as any;
    cell.protection = { locked: true };
  });

  // Do not add example data rows; keep template clean for user entry

  // If includeExamples is true, add a single example data row (Row 2)
  if (includeExamples) {
    const example: Record<string, any> = {
      // Name & Basic
      firstName: 'Riya',
      middleName: '',
      lastName: 'Sharma',
      gender: 'Female',
      dob: '2013-03-29',
      bloodGroup: 'A+',
      category: 'General',
      nationality: 'Indian',
      religion: 'Hindu',
      motherTongue: 'Hindi',
      caste: '',
      placeOfBirth: 'Mumbai',
      aadharNo: '123456789012',
      // Academic
      admissionClass: '7',
      section: 'B',
      rollNo: '1',
      currentYear: '2025-2026',
      // Parents
      fatherName: 'Rajesh Sharma',
      fatherMobile: '9876543210',
      fatherEmail: 'rajesh@example.com',
      fatherOccupation: 'Engineer',
      fatherAadhar: '111122223333',
      fatherOfficeAddress: 'ABC Corp, BKC, Mumbai',
      motherName: 'Priya Sharma',
      motherMobile: '9876543211',
      motherEmail: 'priya@example.com',
      motherOccupation: 'Teacher',
      motherAadhar: '444455556666',
      motherOfficeAddress: 'XYZ School, Mumbai',
      includeGuardian: 'No',
      guardianName: '',
      guardianMobile: '',
      guardianEmail: '',
      guardianOccupation: '',
      guardianAadhar: '',
      guardianOfficeAddress: '',
      primaryContact: 'father',
      // Addresses
      permStreet: '123 Main Street, Apt 4B',
      permCity: 'Mumbai',
      permState: 'Maharashtra',
      permPincode: '400001',
      permCountry: 'India',
      sameAsPermanent: 'Yes',
      currStreet: '',
      currCity: '',
      currState: '',
      currPincode: '',
      currCountry: '',
      // Previous school & TC
      hasPreviousSchool: 'No',
      previousSchoolName: '',
      previousSchoolAddress: '',
      lastClassAttended: '',
      tcNumber: '',
      tcIssueDate: '',
      reasonForLeaving: '',
      // Notes
      notes: 'Sample row — delete before import',
    };

    const dataRow = sheet.getRow(2);
    columns.forEach((col, idx) => {
      const value = example[col.key as keyof typeof example];
      if (value !== undefined) {
        dataRow.getCell(idx + 1).value = value;
      }
    });
    dataRow.eachCell((cell) => {
      // ensure readable text
      cell.font = { color: { argb: 'FF000000' } };
    });
  }

  // Unlock data cells (rows 2..1000) so users can edit them even when sheet is protected
  for (let row = 2; row <= 1000; row++) {
    for (let colIndex = 1; colIndex <= columns.length; colIndex++) {
      const dataCell = sheet.getCell(row, colIndex);
      dataCell.protection = { locked: false };
    }
  }

  // Protect the sheet so header stays non-editable
  sheet.protect('smartschool2025', {
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

  // Do not freeze panes to prevent header appearing twice visually
  sheet.views = [];

  // Add data validation (dropdowns) - apply to data rows only (starting from row 2)
  columns.forEach((col, index) => {
    const colLetter = getColumnLetter(index + 1);
    
    // Add dropdown validation to first 1000 data rows (starting from row 2)
    if (col.dropdown) {
      for (let row = 2; row <= 1000; row++) {
        const cell = sheet.getCell(`${colLetter}${row}`);
        cell.dataValidation = {
          type: 'list',
          allowBlank: !col.required,
          formulae: [col.dropdown],
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid Value',
          error: `Please select from dropdown`
        };
      }
    }
    
    // Date format for date columns (starting from row 2)
    if (col.key.includes('Date') || col.key === 'dob') {
      for (let row = 2; row <= 1000; row++) {
        const cell = sheet.getCell(`${colLetter}${row}`);
        cell.numFmt = 'yyyy-mm-dd';
      }
    }
  });


}

/**
 * Helper function to convert column index to letter
 */
function getColumnLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Export template as buffer for download
 */
export async function exportTemplateAsBuffer(
  options: TemplateOptions = {}
): Promise<Buffer> {
  const workbook = await generateStudentImportTemplate(options);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as any;
}

/**
 * Save template to file (for testing/development)
 */
export async function saveTemplateToFile(
  filePath: string,
  options: TemplateOptions = {}
): Promise<void> {
  const workbook = await generateStudentImportTemplate(options);
  await workbook.xlsx.writeFile(filePath);
}