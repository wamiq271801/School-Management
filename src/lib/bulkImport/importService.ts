/**
 * Import Service - Connects bulk import to Supabase
 * Handles batch creation, document upload, and student creation
 */

import { studentService } from '@/services/studentService';
import { authService } from '@/services/authService';
import { createStorageAdapter, batchUploadDocuments } from './storageAdapter';
import { normalizeToStudentFormat, type ParsedRow } from './importParser';
import { groupMatchesByStudent, type FileMatch } from './zipMatcher';

export interface ImportBatch {
  id: string;
  userId: string;
  userEmail: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  status: 'pending' | 'reviewing' | 'importing' | 'completed' | 'failed';
  createdAt: any;
  updatedAt: any;
}

export interface ImportRow {
  batchId: string;
  rowNumber: number;
  data: Record<string, any>;
  errors: any[];
  warnings: any[];
  status: 'valid' | 'invalid' | 'warning' | 'imported' | 'failed';
  studentId?: string;
  importedAt?: any;
  errorMessage?: string;
}

/**
 * Create import batch - stored in localStorage for now
 * TODO: Move to backend API if batch tracking needed
 */
export async function createImportBatch(
  fileName: string,
  rows: ParsedRow[]
): Promise<string> {
  const userData = authService.getStoredUser();
  if (!userData) {
    throw new Error('User must be authenticated');
  }

  const validRows = rows.filter((r) => r.status === 'valid').length;
  const invalidRows = rows.filter((r) => r.status === 'invalid').length;
  const warningRows = rows.filter((r) => r.status === 'warning').length;

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const batch: ImportBatch = {
    id: batchId,
    userId: userData.user.id,
    userEmail: userData.user.email,
    fileName,
    totalRows: rows.length,
    validRows,
    invalidRows,
    warningRows,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Store batch in localStorage
  localStorage.setItem(`import_batch_${batchId}`, JSON.stringify(batch));
  
  // Store rows
  localStorage.setItem(`import_batch_${batchId}_rows`, JSON.stringify(rows));

  return batchId;
}

/**
 * Commit import - create students from valid rows
 */
export async function commitImport(
  batchId: string,
  rows: ParsedRow[],
  fileMatches?: FileMatch[],
  onProgress?: (current: number, total: number) => void
): Promise<{
  imported: number;
  failed: number;
  errors: Array<{ rowNumber: number; error: string }>;
}> {
  const userData = authService.getStoredUser();
  if (!userData) {
    throw new Error('User must be authenticated');
  }

  const validRows = rows.filter((r) => r.status === 'valid' || r.status === 'warning');
  const storage = createStorageAdapter();
  const errors: Array<{ rowNumber: number; error: string }> = [];
  let imported = 0;
  let failed = 0;

  // Group file matches by student (by admission number or name)
  const filesByStudent = fileMatches ? groupMatchesByStudent(fileMatches) : new Map();

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    
    try {
      // Normalize data to Student format
      const studentData = normalizeToStudentFormat(row.data);
      studentData.admission_date = new Date().toISOString().split('T')[0];

      // Upload documents if available
      const studentFiles = filesByStudent.get(row.rowNumber.toString()) || [];
      if (studentFiles.length > 0) {
        const uploadTasks = studentFiles.map((match) => ({
          file: match.file,
          key: `students/${studentData.admission_number || Date.now()}/${match.documentType || 'document'}_${match.file.name}`,
          metadata: {
            contentType: match.file.type,
            customMetadata: {
              studentId: studentData.admission_number || '',
              documentType: match.documentType || 'unknown',
              uploadedBy: userData.user.id,
            },
          },
        }));

        const uploadResults = await batchUploadDocuments(uploadTasks, storage);

        // Update document references in student data
        uploadResults.forEach((result, idx) => {
          const docType = studentFiles[idx].documentType;
          if (docType && studentData.documents) {
            (studentData.documents as any)[docType] = {
              fileName: studentFiles[idx].file.name,
              url: result.url,
              driveId: result.key,
              size: result.size,
              uploadedAt: result.uploadedAt,
            };
          }
        });
      }

      // Create student via API
      const createdStudent = await studentService.createStudent(studentData);

      // Note: Audit logging is handled by backend API

      imported++;
    } catch (error: any) {
      console.error(`Failed to import row ${row.rowNumber}:`, error);
      errors.push({
        rowNumber: row.rowNumber,
        error: error.message || 'Unknown error',
      });
      failed++;
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, validRows.length);
    }
  }

  // Update batch status in localStorage
  const batchData = localStorage.getItem(`import_batch_${batchId}`);
  if (batchData) {
    const batch = JSON.parse(batchData);
    batch.status = failed === 0 ? 'completed' : 'failed';
    batch.updatedAt = new Date().toISOString();
    localStorage.setItem(`import_batch_${batchId}`, JSON.stringify(batch));
  }

  // Note: Audit logging is handled by backend API for each student creation

  return { imported, failed, errors };
}

/**
 * Get import batch by ID
 */
export async function getImportBatch(batchId: string): Promise<ImportBatch | null> {
  const batchData = localStorage.getItem(`import_batch_${batchId}`);
  if (!batchData) return null;
  
  return JSON.parse(batchData) as ImportBatch;
}

/**
 * Delete import batch
 */
export async function deleteImportBatch(batchId: string): Promise<void> {
  const userData = authService.getStoredUser();
  if (!userData) {
    throw new Error('User must be authenticated');
  }

  // Delete batch and rows from localStorage
  localStorage.removeItem(`import_batch_${batchId}`);
  localStorage.removeItem(`import_batch_${batchId}_rows`);
  
  // Note: Audit logging handled by backend if needed
}

/**
 * Generate import summary report
 */
export function generateImportSummary(
  imported: number,
  failed: number,
  errors: Array<{ rowNumber: number; error: string }>
): string {
  const total = imported + failed;
  const successRate = total > 0 ? ((imported / total) * 100).toFixed(1) : '0';

  let summary = `Import Summary\n`;
  summary += `==============\n\n`;
  summary += `Total Processed: ${total}\n`;
  summary += `Successfully Imported: ${imported}\n`;
  summary += `Failed: ${failed}\n`;
  summary += `Success Rate: ${successRate}%\n\n`;

  if (errors.length > 0) {
    summary += `Errors:\n`;
    summary += `-------\n`;
    errors.forEach((err) => {
      summary += `Row ${err.rowNumber}: ${err.error}\n`;
    });
  }

  summary += `\nImport completed at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;

  return summary;
}
