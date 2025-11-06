/**
 * ZIP Auto-Matcher for Document Intake
 * Matches files from ZIP to student records by filename patterns
 * 
 * ASSUMPTION: Supports patterns like {AdmissionNo}_DocumentType.ext
 */

import JSZip from 'jszip';

export interface FileMatch {
  file: File;
  originalName: string;
  matchedStudentId?: string;
  matchedAdmissionNo?: string;
  matchedRollNo?: string;
  documentType?: string;
  confidence: 'exact' | 'fuzzy' | 'ambiguous' | 'none';
  candidates?: Array<{
    studentId: string;
    admissionNo: string;
    score: number;
  }>;
}

export interface MatchResult {
  matches: FileMatch[];
  unmatchedFiles: string[];
  totalFiles: number;
  matchedFiles: number;
  ambiguousFiles: number;
}

/**
 * Document type patterns
 */
const DOCUMENT_PATTERNS: Record<string, RegExp[]> = {
  photo: [
    /photo/i,
    /pic/i,
    /image/i,
    /img/i,
  ],
  birthCertificate: [
    /birth/i,
    /birth[-_]?cert/i,
    /bc/i,
  ],
  aadharStudent: [
    /aadhar[-_]?student/i,
    /student[-_]?aadhar/i,
    /aadhar/i,
  ],
  transferCertificate: [
    /tc/i,
    /transfer[-_]?cert/i,
    /transfer/i,
  ],
  previousMarksheet: [
    /marksheet/i,
    /mark[-_]?sheet/i,
    /marks/i,
  ],
  casteCertificate: [
    /caste/i,
    /caste[-_]?cert/i,
  ],
  medicalCertificate: [
    /medical/i,
    /medical[-_]?cert/i,
  ],
};

/**
 * Extract ZIP file and return File objects
 */
export async function extractZipFiles(zipFile: File): Promise<File[]> {
  const zip = new JSZip();
  const zipData = await zip.loadAsync(zipFile);
  
  const files: File[] = [];
  
  for (const [filename, fileData] of Object.entries(zipData.files)) {
    if (!fileData.dir && !filename.startsWith('__MACOSX') && !filename.startsWith('.')) {
      const blob = await fileData.async('blob');
      const file = new File([blob], filename.split('/').pop() || filename, {
        type: getContentType(filename),
      });
      files.push(file);
    }
  }
  
  return files;
}

/**
 * Match files to students
 */
export function matchFilesToStudents(
  files: File[],
  students: Array<{
    id: string;
    admissionNumber: string;
    rollNumber?: string;
    firstName: string;
    lastName: string;
  }>
): MatchResult {
  const matches: FileMatch[] = [];
  const unmatchedFiles: string[] = [];
  let matchedCount = 0;
  let ambiguousCount = 0;

  files.forEach((file) => {
    const match = matchSingleFile(file, students);
    
    if (match.confidence === 'exact' || match.confidence === 'fuzzy') {
      matches.push(match);
      matchedCount++;
    } else if (match.confidence === 'ambiguous') {
      matches.push(match);
      ambiguousCount++;
    } else {
      unmatchedFiles.push(file.name);
    }
  });

  return {
    matches,
    unmatchedFiles,
    totalFiles: files.length,
    matchedFiles: matchedCount,
    ambiguousFiles: ambiguousCount,
  };
}

/**
 * Match a single file to a student
 */
function matchSingleFile(
  file: File,
  students: Array<{
    id: string;
    admissionNumber: string;
    rollNumber?: string;
    firstName: string;
    lastName: string;
  }>
): FileMatch {
  const filename = file.name;
  const baseMatch: FileMatch = {
    file,
    originalName: filename,
    confidence: 'none',
  };

  // Extract document type from filename
  const documentType = detectDocumentType(filename);
  if (documentType) {
    baseMatch.documentType = documentType;
  }

  // Try exact admission number match
  const admissionNoMatch = filename.match(/STU[-_]?\d{4}[-_]?\d{5}/i);
  if (admissionNoMatch) {
    const admissionNo = admissionNoMatch[0].toUpperCase().replace(/[-_]/g, '-');
    const student = students.find((s) => 
      s.admissionNumber.toUpperCase().replace(/[-_]/g, '-') === admissionNo
    );
    
    if (student) {
      return {
        ...baseMatch,
        matchedStudentId: student.id,
        matchedAdmissionNo: student.admissionNumber,
        confidence: 'exact',
      };
    }
  }

  // Try roll number match
  const rollNoMatch = filename.match(/^(\d{1,4})[-_]/);
  if (rollNoMatch) {
    const rollNo = rollNoMatch[1];
    const matchingStudents = students.filter((s) => 
      s.rollNumber && s.rollNumber === rollNo
    );
    
    if (matchingStudents.length === 1) {
      return {
        ...baseMatch,
        matchedStudentId: matchingStudents[0].id,
        matchedAdmissionNo: matchingStudents[0].admissionNumber,
        matchedRollNo: matchingStudents[0].rollNumber,
        confidence: 'exact',
      };
    } else if (matchingStudents.length > 1) {
      return {
        ...baseMatch,
        confidence: 'ambiguous',
        candidates: matchingStudents.map((s) => ({
          studentId: s.id,
          admissionNo: s.admissionNumber,
          score: 0.8,
        })),
      };
    }
  }

  // Try name-based fuzzy matching
  const nameMatch = matchByName(filename, students);
  if (nameMatch) {
    return {
      ...baseMatch,
      ...nameMatch,
    };
  }

  return baseMatch;
}

/**
 * Detect document type from filename
 */
function detectDocumentType(filename: string): string | undefined {
  const lowerFilename = filename.toLowerCase();
  
  for (const [docType, patterns] of Object.entries(DOCUMENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerFilename)) {
        return docType;
      }
    }
  }
  
  return undefined;
}

/**
 * Match by student name (fuzzy)
 */
function matchByName(
  filename: string,
  students: Array<{
    id: string;
    admissionNumber: string;
    rollNumber?: string;
    firstName: string;
    lastName: string;
  }>
): Partial<FileMatch> | null {
  const cleanFilename = filename
    .toLowerCase()
    .replace(/\.[^.]+$/, '') // Remove extension
    .replace(/[-_]/g, ' ')
    .replace(/\d+/g, '') // Remove numbers
    .trim();

  const candidates: Array<{
    student: typeof students[0];
    score: number;
  }> = [];

  students.forEach((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const reverseName = `${student.lastName} ${student.firstName}`.toLowerCase();
    
    let score = 0;
    
    // Check if filename contains full name
    if (cleanFilename.includes(fullName)) {
      score = 0.9;
    } else if (cleanFilename.includes(reverseName)) {
      score = 0.85;
    } else {
      // Check individual name parts
      const firstNameMatch = cleanFilename.includes(student.firstName.toLowerCase());
      const lastNameMatch = cleanFilename.includes(student.lastName.toLowerCase());
      
      if (firstNameMatch && lastNameMatch) {
        score = 0.75;
      } else if (firstNameMatch || lastNameMatch) {
        score = 0.5;
      }
    }
    
    if (score > 0) {
      candidates.push({ student, score });
    }
  });

  // Sort by score
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return null;
  }

  // If top candidate has high confidence and is significantly better than others
  if (candidates[0].score >= 0.75 && 
      (candidates.length === 1 || candidates[0].score - candidates[1].score > 0.2)) {
    return {
      matchedStudentId: candidates[0].student.id,
      matchedAdmissionNo: candidates[0].student.admissionNumber,
      confidence: 'fuzzy',
    };
  }

  // Multiple similar candidates - ambiguous
  if (candidates.length > 1 && candidates[0].score >= 0.5) {
    return {
      confidence: 'ambiguous',
      candidates: candidates.slice(0, 5).map((c) => ({
        studentId: c.student.id,
        admissionNo: c.student.admissionNumber,
        score: c.score,
      })),
    };
  }

  return null;
}

/**
 * Get content type from filename
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Group matches by student
 */
export function groupMatchesByStudent(matches: FileMatch[]): Map<string, FileMatch[]> {
  const grouped = new Map<string, FileMatch[]>();
  
  matches.forEach((match) => {
    if (match.matchedStudentId) {
      const existing = grouped.get(match.matchedStudentId) || [];
      existing.push(match);
      grouped.set(match.matchedStudentId, existing);
    }
  });
  
  return grouped;
}

/**
 * Validate file size and type
 */
export function validateFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }
  
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Supported: JPG, PNG, GIF, PDF, DOC, DOCX',
    };
  }
  
  return { valid: true };
}
