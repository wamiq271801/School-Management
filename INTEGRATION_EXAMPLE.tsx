/**
 * INTEGRATION EXAMPLE
 * Copy these snippets into your existing files
 */

// ============================================
// 1. App.tsx - Add Import Routes
// ============================================

// Add these imports at the top:
import BulkImport from '@/pages/import/BulkImport';
import BulkImportReview from '@/pages/import/BulkImportReview';

// Add these routes inside your <Routes> component:
<Route path="/import" element={<BulkImport />} />
<Route path="/import/review" element={<BulkImportReview />} />

// ============================================
// 2. Students.tsx - Add Bulk Import Button
// ============================================

// Add this import:
import { Upload } from 'lucide-react';

// Add this button in your header/toolbar section:
<Button onClick={() => navigate('/import')} variant="outline">
  <Upload className="mr-2 h-4 w-4" />
  Bulk Import
</Button>

// ============================================
// 3. Sidebar/Navigation - Add Menu Item
// ============================================

// If you have a sidebar navigation, add:
<NavLink to="/import" className="nav-link">
  <Upload className="mr-2 h-4 w-4" />
  <span>Bulk Import</span>
</NavLink>

// ============================================
// 4. Example: Generate Template Programmatically
// ============================================

import { exportTemplateAsBuffer } from '@/lib/bulkImport/templateGenerator';

async function downloadTemplate() {
  try {
    const buffer = await exportTemplateAsBuffer({ 
      includeExamples: true 
    });
    
    const blob = new Blob([buffer as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Import_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Template generation failed:', error);
  }
}

// ============================================
// 5. Example: Parse and Validate File
// ============================================

import { parseImportFile } from '@/lib/bulkImport/importParser';

async function handleFileUpload(file: File) {
  try {
    const result = await parseImportFile(file);
    
    console.log('Total rows:', result.totalRows);
    console.log('Valid rows:', result.validRows);
    console.log('Invalid rows:', result.invalidRows);
    
    // Show results to user
    if (result.invalidRows > 0) {
      alert(`Found ${result.invalidRows} invalid records. Please review.`);
    } else {
      alert(`All ${result.validRows} records are valid!`);
    }
    
    return result;
  } catch (error) {
    console.error('Parse failed:', error);
    alert('Failed to parse file. Please check the format.');
  }
}

// ============================================
// 6. Example: Match ZIP Files to Students
// ============================================

import { extractZipFiles, matchFilesToStudents } from '@/lib/bulkImport/zipMatcher';

async function handleZipUpload(zipFile: File, students: any[]) {
  try {
    // Extract files from ZIP
    const files = await extractZipFiles(zipFile);
    console.log(`Extracted ${files.length} files from ZIP`);
    
    // Match to students
    const matchResult = matchFilesToStudents(files, students);
    
    console.log(`Matched: ${matchResult.matchedFiles}`);
    console.log(`Unmatched: ${matchResult.unmatchedFiles.length}`);
    console.log(`Ambiguous: ${matchResult.ambiguousFiles}`);
    
    // Show unmatched files
    if (matchResult.unmatchedFiles.length > 0) {
      console.log('Unmatched files:', matchResult.unmatchedFiles);
    }
    
    return matchResult;
  } catch (error) {
    console.error('ZIP processing failed:', error);
  }
}

// ============================================
// 7. Example: Complete Import Workflow
// ============================================

import { commitImport } from '@/lib/bulkImport/importService';
import { parseImportFile } from '@/lib/bulkImport/importParser';
import { extractZipFiles, matchFilesToStudents } from '@/lib/bulkImport/zipMatcher';

async function completeImportWorkflow(
  excelFile: File,
  zipFile: File | null,
  onProgress: (current: number, total: number) => void
) {
  try {
    // Step 1: Parse Excel
    console.log('Parsing Excel file...');
    const parseResult = await parseImportFile(excelFile);
    
    if (parseResult.invalidRows > 0) {
      throw new Error(`Cannot import: ${parseResult.invalidRows} invalid records found`);
    }
    
    // Step 2: Extract and match documents (if ZIP provided)
    let fileMatches = undefined;
    if (zipFile) {
      console.log('Processing ZIP file...');
      const files = await extractZipFiles(zipFile);
      
      // Create student list from parsed rows
      const students = parseResult.rows.map((row, idx) => ({
        id: `temp_${idx}`,
        admissionNumber: row.data.admissionNo || `TEMP-${idx}`,
        rollNumber: row.data.rollNo,
        firstName: row.data.firstName,
        lastName: row.data.lastName,
      }));
      
      const matchResult = matchFilesToStudents(files, students);
      fileMatches = matchResult.matches;
      
      console.log(`Matched ${matchResult.matchedFiles} documents`);
    }
    
    // Step 3: Commit import
    console.log('Importing students...');
    const result = await commitImport(
      'batch_' + Date.now(),
      parseResult.rows,
      fileMatches,
      onProgress
    );
    
    console.log(`Import complete: ${result.imported} imported, ${result.failed} failed`);
    
    if (result.failed > 0) {
      console.error('Import errors:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('Import workflow failed:', error);
    throw error;
  }
}

// ============================================
// 8. Example: Custom Storage Configuration
// ============================================

import { createStorageAdapter } from '@/lib/bulkImport/storageAdapter';

// Use Firebase Storage (default)
const firebaseStorage = createStorageAdapter('firebase');

// Use Google Drive
const driveStorage = createStorageAdapter('googledrive');

// Upload a file
async function uploadDocument(file: File, studentId: string) {
  const storage = createStorageAdapter();
  
  const result = await storage.put(
    file,
    `students/${studentId}/${file.name}`,
    {
      contentType: file.type,
      customMetadata: {
        studentId,
        uploadedBy: 'admin',
      },
    }
  );
  
  console.log('Uploaded to:', result.url);
  return result;
}

// ============================================
// 9. Example: Error Handling and Validation
// ============================================

import { parseImportFile, generateErrorsExcel } from '@/lib/bulkImport/importParser';

async function validateAndDownloadErrors(file: File) {
  try {
    const result = await parseImportFile(file);
    
    if (result.invalidRows > 0 || result.warningRows > 0) {
      // Generate errors Excel
      const errorsBlob = await generateErrorsExcel(result);
      
      // Download errors file
      const url = URL.createObjectURL(errorsBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Import_Errors_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Downloaded errors file with ${result.invalidRows} errors and ${result.warningRows} warnings`);
    } else {
      alert('All records are valid! Ready to import.');
    }
    
    return result;
  } catch (error) {
    console.error('Validation failed:', error);
    alert('Failed to validate file. Please check the format.');
  }
}

// ============================================
// 10. Example: React Component with Full Flow
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exportTemplateAsBuffer } from '@/lib/bulkImport/templateGenerator';
import { parseImportFile } from '@/lib/bulkImport/importParser';
import { commitImport } from '@/lib/bulkImport/importService';

function BulkImportExample() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownloadTemplate = async () => {
    try {
      const buffer = await exportTemplateAsBuffer({ includeExamples: true });
      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Student_Import_Template.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Template Downloaded' });
    } catch (error) {
      toast({ title: 'Download Failed', variant: 'destructive' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleParse = async () => {
    if (!file) return;
    
    try {
      const result = await parseImportFile(file);
      setParseResult(result);
      
      toast({
        title: 'Parse Complete',
        description: `${result.validRows} valid, ${result.invalidRows} invalid`,
      });
    } catch (error) {
      toast({ title: 'Parse Failed', variant: 'destructive' });
    }
  };

  const handleImport = async () => {
    if (!parseResult) return;
    
    setImporting(true);
    setProgress(0);
    
    try {
      const result = await commitImport(
        'batch_' + Date.now(),
        parseResult.rows,
        undefined,
        (current, total) => {
          setProgress((current / total) * 100);
        }
      );
      
      toast({
        title: 'Import Complete',
        description: `${result.imported} students imported successfully`,
      });
    } catch (error) {
      toast({ title: 'Import Failed', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleDownloadTemplate}>
        Download Template
      </Button>
      
      <input type="file" accept=".xlsx" onChange={handleFileChange} />
      
      {file && (
        <Button onClick={handleParse}>
          Parse File
        </Button>
      )}
      
      {parseResult && (
        <div>
          <p>Valid: {parseResult.validRows}</p>
          <p>Invalid: {parseResult.invalidRows}</p>
          
          <Button onClick={handleImport} disabled={importing}>
            {importing ? `Importing... ${progress.toFixed(0)}%` : 'Import'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default BulkImportExample;
