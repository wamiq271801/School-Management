/**
 * Bulk Import Review UI
 * Amazon Seller Central-style review interface for bulk student import
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Download,
  FileText,
  Image,
  Trash2,
  Check,
  X,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createImportBatch, commitImport } from '@/lib/bulkImport/importService';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import DocumentUploadDialog, { type RowDocs } from '@/components/import/DocumentUploadDialog';
import type { ParsedRow } from '@/lib/bulkImport/importParser';
import type { FileMatch } from '@/lib/bulkImport/zipMatcher';

interface BulkImportReviewProps {
  batchId?: string;
}

export default function BulkImportReview({ batchId }: BulkImportReviewProps) {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileMatches, setFileMatches] = useState<FileMatch[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid' | 'warning'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDocUploadDialog, setShowDocUploadDialog] = useState(false);
  const [selectedRowForUpload, setSelectedRowForUpload] = useState<ParsedRow | null>(null);
  const [docsByRow, setDocsByRow] = useState<Record<number, RowDocs>>({});

  const hasGuardianForRow = (row: ParsedRow) => {
    const d = row.data || {};
    return !!(d.guardianName || d.includeGuardian === 'Yes');
  };

  const initDocsForRow = (row: ParsedRow): RowDocs => ({
    student: {
      photo: { name: 'Student Photo', file: null, required: true },
      aadhar: { name: 'Student Aadhar Card', file: null, required: true },
      birthCertificate: { name: 'Birth Certificate', file: null, required: false },
    },
    father: {
      photo: { name: "Father's Photo", file: null, required: true },
      aadhar: { name: "Father's Aadhar Card", file: null, required: true },
    },
    mother: {
      photo: { name: "Mother's Photo", file: null, required: true },
      aadhar: { name: "Mother's Aadhar Card", file: null, required: true },
    },
    guardian: hasGuardianForRow(row)
      ? {
          photo: { name: "Guardian's Photo", file: null, required: true },
          aadhar: { name: "Guardian's Aadhar Card", file: null, required: true },
        }
      : undefined,
    tcFile: null,
  });

  const getRowDocs = (row: ParsedRow): RowDocs => {
    const existing = docsByRow[row.rowNumber];
    if (existing) return existing;
    const initial = initDocsForRow(row);
    setDocsByRow((prev) => ({ ...prev, [row.rowNumber]: initial }));
    return initial;
  };

  const onFilePicked = (
    section: 'student' | 'father' | 'mother' | 'guardian',
    docKey: string,
    file: File | null
  ) => {
    if (!selectedRowForUpload) return;
    const rowNumber = selectedRowForUpload.rowNumber;
    setDocsByRow((prev) => {
      const current = prev[rowNumber];
      if (!current) return prev;
      const next: RowDocs = { ...current, [section]: { ...(current as any)[section] } } as RowDocs;
      if ((next as any)[section] && (next as any)[section][docKey]) {
        (next as any)[section][docKey] = { ...(next as any)[section][docKey], file };
      }
      return { ...prev, [rowNumber]: next };
    });
  };

  const onTcFilePicked = (file: File | null) => {
    if (!selectedRowForUpload) return;
    const rowNumber = selectedRowForUpload.rowNumber;
    setDocsByRow((prev) => {
      const cur = prev[rowNumber] || initDocsForRow(selectedRowForUpload);
      return { ...prev, [rowNumber]: { ...cur, tcFile: file } };
    });
  };

  const validateRequiredDocs = (rowsToImport: ParsedRow[]): { ok: boolean; message?: string } => {
    for (const row of rowsToImport) {
      const cfg = docsByRow[row.rowNumber] || initDocsForRow(row);
      // Student required
      if (!cfg.student.photo.file) return { ok: false, message: `Row ${row.rowNumber}: Student photo is required` };
      if (!cfg.student.aadhar.file) return { ok: false, message: `Row ${row.rowNumber}: Student Aadhar is required` };
      // Father required
      if (!cfg.father.photo.file) return { ok: false, message: `Row ${row.rowNumber}: Father's photo is required` };
      if (!cfg.father.aadhar.file) return { ok: false, message: `Row ${row.rowNumber}: Father's Aadhar is required` };
      // Mother required
      if (!cfg.mother.photo.file) return { ok: false, message: `Row ${row.rowNumber}: Mother's photo is required` };
      if (!cfg.mother.aadhar.file) return { ok: false, message: `Row ${row.rowNumber}: Mother's Aadhar is required` };
      // Guardian if present in data
      if (hasGuardianForRow(row)) {
        if (!cfg.guardian?.photo.file) return { ok: false, message: `Row ${row.rowNumber}: Guardian's photo is required` };
        if (!cfg.guardian?.aadhar.file) return { ok: false, message: `Row ${row.rowNumber}: Guardian's Aadhar is required` };
      }
      // TC doc is optional even when hasPreviousSchool === 'Yes'
    }
    return { ok: true };
  };

  // Load rows passed via router state (from BulkImport). In real app, fetch by batchId.
  useEffect(() => {
    const incomingRows: ParsedRow[] | undefined = location?.state?.rows;
    if (incomingRows && Array.isArray(incomingRows)) {
      setRows(incomingRows);
    } else {
      // Fallback: sessionStorage (allows reloads)
      try {
        const stored = sessionStorage.getItem('bulkImportRows');
        if (stored) {
          const parsed: ParsedRow[] = JSON.parse(stored);
          if (Array.isArray(parsed)) setRows(parsed);
        } else {
          setRows([]);
        }
      } catch {
        setRows([]);
      }
    }
    setLoading(false);
  }, [batchId, location?.state]);

  const filteredRows = rows.filter((row) => {
    if (filter === 'all') return true;
    return row.status === filter;
  });

  const validCount = rows.filter((r) => r.status === 'valid').length;
  const invalidCount = rows.filter((r) => r.status === 'invalid').length;
  const warningCount = rows.filter((r) => r.status === 'warning').length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredRows.map((r) => r.rowNumber));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (rowNumber: number, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowNumber]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r !== rowNumber));
    }
  };

  const handleDownloadErrors = () => {
    // ASSUMPTION: Generate and download errors Excel
    toast({
      title: 'Downloading Errors',
      description: 'Errors file will be downloaded shortly.',
    });
  };

  const handleUploadDocuments = (row: ParsedRow) => {
    getRowDocs(row);
    setSelectedRowForUpload(row);
    setShowDocUploadDialog(true);
  };

  const handleCommitImport = async () => {
    if (validCount === 0) {
      toast({
        title: 'No Valid Records',
        description: 'There are no valid records to import.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Import ${validCount} valid student records?`)) {
      return;
    }

    // Validate required documents like single-student AdditionalDocuments step
    const rowsToImport = rows.filter((r) => r.status === 'valid' || r.status === 'warning');
    const docCheck = validateRequiredDocs(rowsToImport);
    if (!docCheck.ok) {
      toast({ title: 'Documents Required', description: docCheck.message, variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create import batch
      const fileName = sessionStorage.getItem('bulkImportFileName') || 'students.xlsx';
      const batchId = await createImportBatch(fileName, rows);

      // Commit import (valid + warning rows)
      const result = await commitImport(
        batchId,
        rows,
        undefined,
        (current, total) => setUploadProgress(Math.round((current / total) * 100))
      );

      // Update rows status locally based on result
      const failedByRow = new Map(result.errors.map(e => [e.rowNumber, e.error]));
      setRows(prev => prev.map(r => {
        if (failedByRow.has(r.rowNumber)) {
          return { ...r, status: 'invalid', errors: [...r.errors, { field: 'import', message: failedByRow.get(r.rowNumber)!, severity: 'error' as const }] };
        }
        if (r.status === 'valid' || r.status === 'warning') {
          return { ...r, status: 'valid' };
        }
        return r;
      }));

      toast({
        title: 'Import Completed',
        description: `Imported: ${result.imported}, Failed: ${result.failed}`,
      });

      navigate('/students');
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error?.message || 'An error occurred during import. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading import data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Import Review</h1>
          <p className="text-muted-foreground">
            Review and validate student records before importing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/students')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleDownloadErrors}>
            <Download className="mr-2 h-4 w-4" />
            Download Errors
          </Button>
          <Button onClick={handleCommitImport} disabled={validCount === 0 || uploading}>
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Import {validCount} Records
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing students...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Valid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{validCount}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Invalid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Records</CardTitle>
            <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
              <TabsList>
                <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
                <TabsTrigger value="valid">Valid ({validCount})</TabsTrigger>
                <TabsTrigger value="warning">Warnings ({warningCount})</TabsTrigger>
                <TabsTrigger value="invalid">Invalid ({invalidCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredRows.length && filteredRows.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead>Row</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Admission Type</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.rowNumber}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.rowNumber)}
                        onChange={(e) => handleSelectRow(row.rowNumber, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>
                      {row.status === 'valid' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Valid
                        </Badge>
                      )}
                      {row.status === 'warning' && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Warning
                        </Badge>
                      )}
                      {row.status === 'invalid' && (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="mr-1 h-3 w-3" />
                          Invalid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.data.firstName} {row.data.lastName}
                    </TableCell>
                    <TableCell>
                      {row.data.admissionClass || row.data.class}-{row.data.section}
                    </TableCell>
                    <TableCell>{row.data.hasPreviousSchool === 'Yes' ? 'Transfer' : 'New'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {row.errors.map((error, idx) => (
                          <div key={idx} className="text-xs text-red-600">
                            • {error.field}: {error.message}
                          </div>
                        ))}
                        {row.warnings.map((warning, idx) => (
                          <div key={idx} className="text-xs text-yellow-600">
                            • {warning.field}: {warning.message}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {row.data.photoFileName && (
                          <Badge variant="outline" className="text-xs">
                            <Image className="mr-1 h-3 w-3" />
                            Photo
                          </Badge>
                        )}
                        {row.data.birthCertFileName && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="mr-1 h-3 w-3" />
                            Birth Cert
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUploadDocuments(row)}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        open={showDocUploadDialog}
        onClose={() => setShowDocUploadDialog(false)}
        row={selectedRowForUpload}
        docs={selectedRowForUpload ? getRowDocs(selectedRowForUpload) : {} as RowDocs}
        onFileChange={onFilePicked}
        onTcFileChange={onTcFilePicked}
      />
    </div>
  );
}
