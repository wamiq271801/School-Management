/**
 * Import Parser and Validator for Student Bulk Import
 * Parses XLSX/CSV files and validates against schema
 * 
 * ASSUMPTION: Uses XLSX library for parsing, validates against enums.json
 */

import * as XLSX from 'xlsx';
import enumsData from '@/schemas/enums.json';

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  status: 'valid' | 'invalid' | 'warning';
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}

export interface ParseResult {
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  templateVersion?: string;
}

/**
 * Column mapping from Excel headers to internal field names
 * Matches headers in templateGenerator.ts
 */
const COLUMN_MAPPING: Record<string, string> = {
  'First Name *': 'firstName',
  'Middle Name': 'middleName',
  'Last Name *': 'lastName',
  'Gender *': 'gender',
  'Date of Birth *(YYYY-MM-DD)': 'dob', // fallback (if exported without newline)
  'Date of Birth *\n(YYYY-MM-DD)': 'dob', // exact template header with newline
  'Blood Group': 'bloodGroup',
  'Category *': 'category',
  'Nationality *': 'nationality',
  'Religion': 'religion',
  'Mother Tongue': 'motherTongue',
  'Caste': 'caste',
  'Place of Birth': 'placeOfBirth',
  'Aadhaar Number': 'aadharNo',
  'Admission Class *': 'admissionClass',
  'Section *': 'section',
  'Roll Number': 'rollNo',
  'Academic Year *': 'currentYear',
  'Father Name *': 'fatherName',
  'Father Mobile *': 'fatherMobile',
  'Father Email': 'fatherEmail',
  'Father Occupation': 'fatherOccupation',
  'Father Aadhaar *': 'fatherAadhar',
  'Father Office Address': 'fatherOfficeAddress',
  'Mother Name *': 'motherName',
  'Mother Mobile *': 'motherMobile',
  'Mother Email': 'motherEmail',
  'Mother Occupation': 'motherOccupation',
  'Mother Aadhaar *': 'motherAadhar',
  'Mother Office Address': 'motherOfficeAddress',
  'Include Guardian (Yes/No)': 'includeGuardian',
  'Guardian Name': 'guardianName',
  'Guardian Mobile': 'guardianMobile',
  'Guardian Email': 'guardianEmail',
  'Guardian Occupation': 'guardianOccupation',
  'Guardian Aadhaar': 'guardianAadhar',
  'Guardian Office Address': 'guardianOfficeAddress',
  'Primary Contact *': 'primaryContact',
  'Permanent Street *': 'permStreet',
  'Permanent City *': 'permCity',
  'Permanent State *': 'permState',
  'Permanent Pincode *': 'permPincode',
  'Permanent Country *': 'permCountry',
  'Current same as Permanent (Yes/No)': 'sameAsPermanent',
  'Current Street': 'currStreet',
  'Current City': 'currCity',
  'Current State': 'currState',
  'Current Pincode': 'currPincode',
  'Current Country': 'currCountry',
  'Has Previous School (Yes/No)': 'hasPreviousSchool',
  'Previous School Name': 'previousSchoolName',
  'Previous School Address': 'previousSchoolAddress',
  'Last Class Attended': 'lastClassAttended',
  'TC Number': 'tcNumber',
  'TC Issue Date (YYYY-MM-DD)': 'tcIssueDate',
  'Reason For Leaving': 'reasonForLeaving',
  'Additional Notes': 'notes',
};

/**
 * Required fields that must not be empty
 */
const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'gender',
  'dob',
  'admissionClass',
  'section',
  'currentYear',
  'primaryContact',
  'category',
  'nationality',
  'permStreet',
  'permCity',
  'permState',
  'permPincode',
  'permCountry',
  'fatherName',
  'fatherMobile',
  'fatherAadhar',
  'motherName',
  'motherMobile',
  'motherAadhar',
];

/**
 * Parse Excel or CSV file
 */
export async function parseImportFile(file: File): Promise<ParseResult> {
  let buffer: ArrayBuffer;
  try {
    // Read file into memory. Some browsers can throw NotReadableError if the file handle became invalid.
    buffer = await file.arrayBuffer();
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : '';
    // Normalize FileReader NotReadableError into a helpful message
    throw new Error(
      msg && msg.toLowerCase().includes('notreadable')
        ? 'The selected file could not be read. Please re-select the file from local storage (avoid cloud placeholders), then try again.'
        : 'Unable to read the selected file. Please re-select the file and try again.'
    );
  }

  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  // Find the Students sheet
  const studentsSheet = workbook.Sheets['Students'];
  if (!studentsSheet) {
    throw new Error('Invalid template: "Students" sheet not found');
  }

  // Convert to JSON (header in row 1)
  const rawData = XLSX.utils.sheet_to_json(studentsSheet, {
    raw: false,
    defval: '',
  });

  if (rawData.length === 0) {
    throw new Error('No data found in Students sheet');
  }

  // Parse and validate each row
  const rows: ParsedRow[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let warningCount = 0;

  rawData.forEach((rawRow: any, index) => {
    const rowNumber = index + 2; // Header is row 1; first data row is 2
    const parsedRow = parseRow(rawRow, rowNumber);

    // Skip rows that are completely empty across all mapped fields
    const isCompletelyEmpty = Object.values(parsedRow.data).every((v) => v === '' || v === undefined || v === null);
    if (isCompletelyEmpty) {
      return;
    }

    rows.push(parsedRow);

    if (parsedRow.status === 'valid') {
      validCount++;
    } else if (parsedRow.status === 'invalid') {
      invalidCount++;
    } else if (parsedRow.status === 'warning') {
      warningCount++;
    }
  });

  return {
    rows,
    totalRows: rows.length,
    validRows: validCount,
    invalidRows: invalidCount,
    warningRows: warningCount,
  };
}

/**
 * Parse a single row and map columns
 */
function parseRow(rawRow: any, rowNumber: number): ParsedRow {
  const data: Record<string, any> = {};
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Map columns
  Object.entries(COLUMN_MAPPING).forEach(([excelHeader, fieldName]) => {
    const value = rawRow[excelHeader];
    data[fieldName] = value !== undefined && value !== '' ? String(value).trim() : '';
  });

  // Validate the row
  validateRow(data, errors, warnings);

  // Determine status
  let status: 'valid' | 'invalid' | 'warning' = 'valid';
  if (errors.length > 0) {
    status = 'invalid';
  } else if (warnings.length > 0) {
    status = 'warning';
  }

  return {
    rowNumber,
    data,
    errors,
    warnings,
    status,
  };
}

/**
 * Validate a parsed row
 */
function validateRow(
  data: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Check required fields
  REQUIRED_FIELDS.forEach((field) => {
    if (!data[field] || data[field] === '') {
      errors.push({
        field,
        message: `${field} is required`,
        severity: 'error',
      });
    }
  });

  // Validate gender
  if (data.gender && !enumsData.enums.genders.includes(data.gender)) {
    errors.push({
      field: 'gender',
      message: `Invalid gender. Must be one of: ${enumsData.enums.genders.join(', ')}`,
      severity: 'error',
    });
  }

  // Validate admission class
  if (data.admissionClass && !enumsData.enums.classes.includes(data.admissionClass)) {
    errors.push({
      field: 'admissionClass',
      message: `Invalid class. Must be one of: ${enumsData.enums.classes.join(', ')}`,
      severity: 'error',
    });
  }

  // Validate section
  if (data.section && !enumsData.enums.sections.includes(data.section)) {
    errors.push({
      field: 'section',
      message: `Invalid section. Must be one of: ${enumsData.enums.sections.join(', ')}`,
      severity: 'error',
    });
  }

  // No status in simplified template

  // Previous school / TC validation based on hasPreviousSchool
  if (data.hasPreviousSchool === 'Yes') {
    if (!data.previousSchoolName) {
      errors.push({ field: 'previousSchoolName', message: 'Previous school name is required when Has Previous School is Yes', severity: 'error' });
    }
    if (!data.lastClassAttended) {
      errors.push({ field: 'lastClassAttended', message: 'Last class attended is required when Has Previous School is Yes', severity: 'error' });
    }
  }

  // Validate date format (YYYY-MM-DD)
  const dateFields = ['dob', 'tcIssueDate'];
  dateFields.forEach((field) => {
    if (data[field] && data[field] !== '') {
      if (!isValidDate(data[field])) {
        errors.push({
          field,
          message: `Invalid date format. Must be YYYY-MM-DD (e.g., 2013-03-29)`,
          severity: 'error',
        });
      }
    }
  });

  // Validate academic year format
  if (data.currentYear && !isValidSessionYear(data.currentYear)) {
    errors.push({
      field: 'currentYear',
      message: 'Invalid session year format. Must be YYYY-YYYY (e.g., 2025-2026)',
      severity: 'error',
    });
  }

  // Validate phone numbers (fields present in template)
  const phoneFields = ['fatherMobile', 'motherMobile', 'guardianMobile'];
  phoneFields.forEach((field) => {
    if (data[field] && data[field] !== '' && !isValidPhone(data[field])) {
      warnings.push({
        field,
        message: 'Phone number should be 10-15 digits',
        severity: 'warning',
      });
    }
  });

  // Validate Aadhaar number
  if (data.aadharNo && data.aadharNo !== '' && !isValidAadhar(data.aadharNo)) {
    warnings.push({
      field: 'aadharNo',
      message: 'Aadhaar number should be 12 digits',
      severity: 'warning',
    });
  }

  // Validate pincodes (permanent/current)
  const pincodeFields = ['permPincode', 'currPincode'];
  pincodeFields.forEach((pf) => {
    if (data[pf] && data[pf] !== '' && !isValidPincode(data[pf])) {
      warnings.push({ field: pf, message: 'Pincode should be 6 digits', severity: 'warning' });
    }
  });

  // Validate emails (father/mother/guardian)
  const emailFields = ['fatherEmail', 'motherEmail', 'guardianEmail'];
  emailFields.forEach((ef) => {
    if (data[ef] && data[ef] !== '' && !isValidEmail(data[ef])) {
      errors.push({ field: ef, message: 'Invalid email format', severity: 'error' });
    }
  });

  // Validate primary contact
  if (data.primaryContact) {
    if (!enumsData.enums.primaryContact.includes(data.primaryContact)) {
      errors.push({
        field: 'primaryContact',
        message: `Invalid primary contact. Must be one of: ${enumsData.enums.primaryContact.join(', ')}`,
        severity: 'error',
      });
    }

    // Check if corresponding contact info exists
    if (data.primaryContact === 'father' && (!data.fatherName || !data.fatherMobile)) {
      warnings.push({
        field: 'primaryContact',
        message: 'Father is set as primary contact but father details are incomplete',
        severity: 'warning',
      });
    }
    if (data.primaryContact === 'mother' && (!data.motherName || !data.motherMobile)) {
      warnings.push({
        field: 'primaryContact',
        message: 'Mother is set as primary contact but mother details are incomplete',
        severity: 'warning',
      });
    }
    if (data.primaryContact === 'guardian' && (!data.guardianName || !data.guardianMobile)) {
      warnings.push({
        field: 'primaryContact',
        message: 'Guardian is set as primary contact but guardian details are incomplete',
        severity: 'warning',
      });
    }
  }

  // Validate stream for classes 11-12
  if ((data.class === '11' || data.class === '12') && !data.stream) {
    warnings.push({
      field: 'stream',
      message: 'Stream is recommended for classes 11 and 12',
      severity: 'warning',
    });
  }

  // Validate category
  if (data.category && !enumsData.enums.categories.includes(data.category)) {
    errors.push({
      field: 'category',
      message: `Invalid category. Must be one of: ${enumsData.enums.categories.join(', ')}`,
      severity: 'error',
    });
  }

  // Validate blood group
  if (data.bloodGroup && data.bloodGroup !== '' && !enumsData.enums.bloodGroups.includes(data.bloodGroup)) {
    warnings.push({
      field: 'bloodGroup',
      message: `Invalid blood group. Must be one of: ${enumsData.enums.bloodGroups.join(', ')}`,
      severity: 'warning',
    });
  }

  // Validate state
  const stateFields = ['permState', 'currState'];
  stateFields.forEach((sf) => {
    if (data[sf] && data[sf] !== '' && !enumsData.enums.states.includes(data[sf])) {
      warnings.push({ field: sf, message: 'State not in standard list. Please verify.', severity: 'warning' });
    }
  });
}

/**
 * Validation helper functions
 */
function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidSessionYear(year: string): boolean {
  const regex = /^\d{4}-\d{4}$/;
  return regex.test(year);
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)+]/g, '');
  return /^\d{10,15}$/.test(cleaned);
}

function isValidAadhar(aadhar: string): boolean {
  const cleaned = aadhar.replace(/[\s\-]/g, '');
  return /^\d{12}$/.test(cleaned);
}

function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Generate errors Excel file for download
 */
export async function generateErrorsExcel(parseResult: ParseResult): Promise<Blob> {
  const workbook = XLSX.utils.book_new();

  // Prepare data with errors
  const errorRows = parseResult.rows
    .filter((row) => row.status === 'invalid' || row.status === 'warning')
    .map((row) => {
      const errorMessages = row.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      const warningMessages = row.warnings.map((w) => `${w.field}: ${w.message}`).join('; ');

      return {
        'Row Number': row.rowNumber,
        'Status': row.status.toUpperCase(),
        'Errors': errorMessages,
        'Warnings': warningMessages,
        ...row.data,
      };
    });

  const worksheet = XLSX.utils.json_to_sheet(errorRows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Normalize parsed data to Student interface format
 */
export function normalizeToStudentFormat(data: Record<string, any>): any {
  return {
    basic: {
      firstName: data.firstName,
      middleName: data.middleName || undefined,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dob,
      bloodGroup: data.bloodGroup || undefined,
      category: data.category,
      nationality: data.nationality || 'Indian',
      religion: data.religion || undefined,
      motherTongue: data.motherTongue || undefined,
      caste: data.caste || undefined,
      placeOfBirth: data.placeOfBirth || undefined,
      aadharNumber: data.aadharNo || undefined,
    },
    academic: {
      currentYear: data.currentYear,
      admissionClass: data.admissionClass,
      section: data.section,
      rollNumber: data.rollNo || undefined,
      previousSchool: data.hasPreviousSchool === 'Yes' ? {
        name: data.previousSchoolName || '',
        lastClass: data.lastClassAttended || '',
        address: data.previousSchoolAddress || undefined,
        transferCertificate: (data.tcNumber || data.tcIssueDate) ? {
          number: data.tcNumber || '',
          issueDate: data.tcIssueDate || '',
        } : undefined,
      } : undefined,
    },
    father: data.fatherName ? {
      name: data.fatherName,
      mobile: data.fatherMobile || '',
      email: data.fatherEmail || undefined,
      occupation: data.fatherOccupation || undefined,
      aadharNumber: data.fatherAadhar || undefined,
      officeAddress: data.fatherOfficeAddress || undefined,
    } : undefined,
    mother: data.motherName ? {
      name: data.motherName,
      mobile: data.motherMobile || '',
      email: data.motherEmail || undefined,
      occupation: data.motherOccupation || undefined,
      aadharNumber: data.motherAadhar || undefined,
      officeAddress: data.motherOfficeAddress || undefined,
    } : undefined,
    guardian: data.guardianName ? {
      name: data.guardianName,
      relation: undefined,
      mobile: data.guardianMobile || '',
      address: data.guardianOfficeAddress || undefined,
    } : undefined,
    primaryContact: data.primaryContact,
    permanentAddress: {
      line1: data.permStreet,
      city: data.permCity,
      state: data.permState,
      pincode: data.permPincode,
      country: data.permCountry,
    },
    currentAddress: data.sameAsPermanent === 'Yes' ? undefined : {
      line1: data.currStreet || '',
      city: data.currCity || '',
      state: data.currState || '',
      pincode: data.currPincode || '',
      country: data.currCountry || '',
    },
    medicalInfo: {
      disabilityStatus: data.disabilityStatus || 'No',
      medicalNotes: data.medicalNotes || undefined,
    },
    status: 'active',
    notes: data.notes || undefined,
  };
}
