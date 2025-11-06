/**
 * Bulk Import Landing Page
 * Upload XLSX/CSV and optional ZIP for document intake
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, FileArchive, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { parseImportFile, type ParseResult } from '@/lib/bulkImport/importParser';
import { exportTemplateAsBuffer } from '@/lib/bulkImport/templateGenerator';

export default function BulkImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [includeExamples, setIncludeExamples] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const buffer = await exportTemplateAsBuffer({ includeExamples });
      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Student_Bulk_Import_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Template Downloaded',
        description: 'Excel template has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setParseResult(null);
    }
  };

  const handleZipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setZipFile(file);
    }
  };

  const handleParseFile = async () => {
    if (!excelFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to import.',
        variant: 'destructive',
      });
      return;
    }

    setParsing(true);
    setParseProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setParseProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await parseImportFile(excelFile);
      
      clearInterval(progressInterval);
      setParseProgress(100);
      setParseResult(result);

      toast({
        title: 'File Parsed Successfully',
        description: `Found ${result.totalRows} records. ${result.validRows} valid, ${result.invalidRows} invalid.`,
      });
    } catch (error: any) {
      console.error('Parse error:', error);
      // Reset input and state so user can re-select the same file and avoid stale handles
      setExcelFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({
        title: 'Parse Failed',
        description:
          error?.message ||
          'Failed to parse file. Close the file if it is open elsewhere, ensure it is fully downloaded from cloud storage, then re-select and try again.',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleProceedToReview = () => {
    if (!parseResult) return;
    // Persist rows so review can load even after refresh
    try {
      sessionStorage.setItem('bulkImportRows', JSON.stringify(parseResult.rows));
      if (excelFile?.name) sessionStorage.setItem('bulkImportFileName', excelFile.name);
    } catch {}
    // Pass rows to review page using route state
    navigate('/import/review', { state: { rows: parseResult.rows } });
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bulk Student Import</h1>
        <p className="text-muted-foreground">
          Import multiple students at once using our Excel template
        </p>
      </div>

      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>How to Import</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Download the Excel template below</li>
            <li>Fill in student details following the instructions in the template</li>
            <li>Optionally, prepare a ZIP file with student documents (photos, certificates)</li>
            <li>Upload both files and review before importing</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Download Template</CardTitle>
          <CardDescription>
            Get the latest Excel template with all required fields and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeExamples}
                onChange={(e) => setIncludeExamples(e.target.checked)}
              />
              Include example row
            </label>
          </div>
          <Button onClick={handleDownloadTemplate} disabled={downloadingTemplate}>
            {downloadingTemplate ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Excel Template
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Template includes: Instructions, dropdown lists, data validation, and example row
          </p>
        </CardContent>
      </Card>

      {/* Upload Files */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Upload Files</CardTitle>
          <CardDescription>
            Upload the completed Excel file and optionally a ZIP with documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Excel File */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Excel File (Required) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {excelFile ? excelFile.name : 'Choose Excel File'}
              </Button>
            </div>
            {excelFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Size: {(excelFile.size / 1024).toFixed(2)} KB
              </p>
            )}
          </div>

          {/* ZIP File */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Documents ZIP (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                onChange={handleZipFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => zipInputRef.current?.click()}
                className="w-full"
              >
                <FileArchive className="mr-2 h-4 w-4" />
                {zipFile ? zipFile.name : 'Choose ZIP File (Optional)'}
              </Button>
            </div>
            {zipFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Size: {(zipFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              ZIP should contain files named like: STU-2025-00001_Photo.jpg, STU-2025-00001_Birth.pdf
            </p>
          </div>

          {/* Parse Button */}
          <Button
            onClick={handleParseFile}
            disabled={!excelFile || parsing}
            className="w-full"
            size="lg"
          >
            {parsing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Parsing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Parse and Validate
              </>
            )}
          </Button>

          {/* Progress */}
          {parsing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Parsing file...</span>
                <span>{parseProgress}%</span>
              </div>
              <Progress value={parseProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parse Results */}
      {parseResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Parse Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Records</div>
                <div className="text-2xl font-bold">{parseResult.totalRows}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Valid</div>
                <div className="text-2xl font-bold text-green-600">{parseResult.validRows}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Warnings</div>
                <div className="text-2xl font-bold text-yellow-600">{parseResult.warningRows}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Invalid</div>
                <div className="text-2xl font-bold text-red-600">{parseResult.invalidRows}</div>
              </div>
            </div>

            {parseResult.invalidRows > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors Found</AlertTitle>
                <AlertDescription>
                  {parseResult.invalidRows} records have errors. You can review and fix them in the next step.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={handleProceedToReview} className="flex-1">
                Proceed to Review
              </Button>
              <Button variant="outline" onClick={() => setParseResult(null)}>
                Upload Different File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Successful Import</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Use the provided template - don't modify column headers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Dates must be in YYYY-MM-DD format (e.g., 2013-03-29)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span>For Transfer students, Has TC must be "Yes" and TC details are required</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Document filenames should match: {'{AdmissionNo}_DocumentType.ext'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Maximum file size: 10 MB for Excel, 50 MB for ZIP</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
