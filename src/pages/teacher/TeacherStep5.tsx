import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Teacher } from "@/lib/firestore";
import { ArrowLeft, Upload, FileText, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface TeacherStep5Props {
  data: Partial<Teacher>;
  onUpdate: (data: Partial<Teacher>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface DocumentUpload {
  label: string;
  key: keyof NonNullable<Teacher["documents"]>;
  uploaded: boolean;
}

const TeacherStep5 = ({ data, onUpdate, onNext, onPrevious }: TeacherStep5Props) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const documents: DocumentUpload[] = [
    { label: "Aadhar Card", key: "aadharCard", uploaded: !!data.documents?.aadharCard },
    { label: "PAN Card", key: "panCard", uploaded: !!data.documents?.panCard },
    { label: "Joining Letter", key: "joiningLetter", uploaded: !!data.documents?.joiningLetter },
    { label: "Address Proof", key: "addressProof", uploaded: !!data.documents?.addressProof },
    { label: "Bank Passbook", key: "bankPassbook", uploaded: !!data.documents?.bankPassbook },
  ];

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof NonNullable<Teacher["documents"]>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(key);
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `teachers/documents/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const documentInfo = {
        driveId: storageRef.fullPath,
        url,
        fileName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      onUpdate({
        ...data,
        documents: {
          ...data.documents,
          [key]: documentInfo,
        },
      });

      toast({
        title: "Success",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Upload Documents
        </h2>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.key}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-smooth"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    doc.uploaded
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {doc.uploaded ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground">{doc.label}</div>
                  {data.documents?.[doc.key] && !Array.isArray(data.documents[doc.key]) && (
                    <div className="text-sm text-muted-foreground">
                      {(data.documents[doc.key] as any)?.fileName}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, doc.key)}
                  className="hidden"
                  id={doc.key}
                  disabled={uploading === doc.key}
                />
                <Button
                  type="button"
                  variant={doc.uploaded ? "outline" : "default"}
                  size="sm"
                  onClick={() => document.getElementById(doc.key)?.click()}
                  disabled={uploading === doc.key}
                  className="gap-2"
                >
                  {uploading === doc.key ? (
                    <>Uploading...</>
                  ) : doc.uploaded ? (
                    <>Re-upload</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">Guidelines</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Supported formats: PDF, JPG, PNG</li>
            <li>• Maximum file size: 10MB per document</li>
            <li>• Ensure all documents are clear and readable</li>
            <li>• Documents can be re-uploaded if needed</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="button" onClick={onNext} size="lg">
          Next: Review & Submit
        </Button>
      </div>
    </div>
  );
};

export default TeacherStep5;
