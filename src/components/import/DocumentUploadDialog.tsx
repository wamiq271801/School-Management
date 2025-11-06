/**
 * Document Upload Dialog for Bulk Import Review
 * Allows uploading required documents for each student row
 */

import { useState } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CameraCapture } from '@/components/admission/CameraCapture';
import type { ParsedRow } from '@/lib/bulkImport/importParser';

type DocEntry = { name: string; file: File | null; required: boolean };
type PersonDocs = Record<string, DocEntry>;
export type RowDocs = {
  student: PersonDocs;
  father: PersonDocs;
  mother: PersonDocs;
  guardian?: PersonDocs;
  tcFile?: File | null;
};

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  row: ParsedRow | null;
  docs: RowDocs;
  onFileChange: (section: 'student' | 'father' | 'mother' | 'guardian', docKey: string, file: File | null) => void;
  onTcFileChange: (file: File | null) => void;
}

export default function DocumentUploadDialog({
  open,
  onClose,
  row,
  docs,
  onFileChange,
  onTcFileChange,
}: DocumentUploadDialogProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentCapture, setCurrentCapture] = useState<{
    section: 'student' | 'father' | 'mother' | 'guardian';
    docKey: string;
    docName: string;
  } | null>(null);

  if (!row) return null;

  const hasGuardian = !!(row.data?.guardianName || row.data?.includeGuardian === 'Yes');

  const sections: Array<{ key: 'student' | 'father' | 'mother' | 'guardian'; title: string }> = [
    { key: 'student', title: 'Student Documents' },
    { key: 'father', title: "Father's Documents" },
    { key: 'mother', title: "Mother's Documents" },
  ];

  if (hasGuardian) {
    sections.push({ key: 'guardian', title: "Guardian's Documents" });
  }

  const openCamera = (
    section: 'student' | 'father' | 'mother' | 'guardian',
    docKey: string,
    docName: string
  ) => {
    setCurrentCapture({ section, docKey, docName });
    setCameraOpen(true);
  };

  const handleCameraCapture = (file: File) => {
    if (!currentCapture) return;
    const { section, docKey } = currentCapture;
    onFileChange(section, docKey, file);
    setCameraOpen(false);
    setCurrentCapture(null);
  };

  const renderDocumentItem = (
    sectionKey: 'student' | 'father' | 'mother' | 'guardian',
    docKey: string,
    entry: DocEntry
  ) => {
    const inputId = `file-${row.rowNumber}-${sectionKey}-${docKey}`;

    return (
      <div key={`${sectionKey}-${docKey}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-background rounded-lg border">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">
            {entry.name}
            {entry.required && <span className="text-destructive ml-1">*</span>}
          </div>
          {entry.file && (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {entry.file.name} ({(entry.file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => onFileChange(sectionKey, docKey, e.target.files?.[0] || null)}
          />

          {entry.file ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive gap-2"
              onClick={() => onFileChange(sectionKey, docKey, null)}
            >
              <X className="w-4 h-4" />
              Remove
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(inputId)?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCamera(sectionKey, docKey, entry.name)}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                Capture
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <CameraCapture
        open={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setCurrentCapture(null);
        }}
        onCapture={handleCameraCapture}
        documentName={currentCapture?.docName || 'Document'}
      />

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl">Upload Documents</DialogTitle>
            <DialogDescription>
              Upload required documents for {row.data?.firstName} {row.data?.lastName}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-4">
              {sections.map((section) => (
                <div key={section.key} className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground border-b pb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-3">
                    {Object.entries((docs as any)[section.key] || {}).map(([docKey, entry]: any) =>
                      renderDocumentItem(section.key, docKey, entry)
                    )}
                  </div>
                </div>
              ))}

              {row.data?.hasPreviousSchool === 'Yes' && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground border-b pb-2">
                    Transfer Certificate (Optional)
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-background rounded-lg border">
                    <div className="flex-1">
                      <div className="text-sm font-medium">TC Document</div>
                      {docs.tcFile && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {docs.tcFile.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`file-${row.rowNumber}-tc`}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => onTcFileChange(e.target.files?.[0] || null)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-${row.rowNumber}-tc`)?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {docs.tcFile ? 'Replace' : 'Upload'}
                      </Button>
                      {docs.tcFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => onTcFileChange(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button onClick={onClose}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
