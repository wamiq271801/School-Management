import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Save, Upload, Camera, FileText, X, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdmission } from "@/contexts/AdmissionContext";
import { CameraCapture } from "@/components/admission/CameraCapture";
import { updateAdmissionStep, getAdmissionStep } from "@/lib/firestore";

interface DocumentFile {
  name: string;
  file: File | null;
  required: boolean;
}

interface PersonDocuments {
  photo: DocumentFile;
  aadhar: DocumentFile;
  [key: string]: DocumentFile;
}

export default function AdditionalDocuments() {
  const navigate = useNavigate();
  const { admissionId, setCurrentStep, includeTC } = useAdmission();
  const [loading, setLoading] = useState(false);
  const [hasGuardian, setHasGuardian] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentCapture, setCurrentCapture] = useState<{
    section: "student" | "father" | "mother" | "guardian";
    docKey: string;
    docName: string;
  } | null>(null);

  const [studentDocs, setStudentDocs] = useState<PersonDocuments>({
    photo: { name: "Student Photo", file: null, required: true },
    aadhar: { name: "Student Aadhar Card", file: null, required: true },
    birthCertificate: { name: "Birth Certificate", file: null, required: false },
  });

  const [fatherDocs, setFatherDocs] = useState<PersonDocuments>({
    photo: { name: "Father's Photo", file: null, required: true },
    aadhar: { name: "Father's Aadhar Card", file: null, required: true },
  });

  const [motherDocs, setMotherDocs] = useState<PersonDocuments>({
    photo: { name: "Mother's Photo", file: null, required: true },
    aadhar: { name: "Mother's Aadhar Card", file: null, required: true },
  });

  const [guardianDocs, setGuardianDocs] = useState<PersonDocuments>({
    photo: { name: "Guardian's Photo", file: null, required: true },
    aadhar: { name: "Guardian's Aadhar Card", file: null, required: true },
  });

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentStep(5);

    const loadData = async () => {
      if (!admissionId) {
        toast.error("No admission process found");
        navigate("/admission/student-info");
        return;
      }

      try {
        // Check if guardian info exists in step 2
        const step2Data = await getAdmissionStep(admissionId, 2);
        if (step2Data?.data?.guardian) {
          setHasGuardian(true);
        }

        // Load existing documents if any
        const stepData = await getAdmissionStep(admissionId, 5);
        if (stepData?.data) {
          if (stepData.data.studentDocs) setStudentDocs(prev => ({ ...prev, ...stepData.data.studentDocs }));
          if (stepData.data.fatherDocs) setFatherDocs(prev => ({ ...prev, ...stepData.data.fatherDocs }));
          if (stepData.data.motherDocs) setMotherDocs(prev => ({ ...prev, ...stepData.data.motherDocs }));
          if (stepData.data.guardianDocs) setGuardianDocs(prev => ({ ...prev, ...stepData.data.guardianDocs }));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const handleFileUpload = (
    section: "student" | "father" | "mother" | "guardian",
    docKey: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should not exceed 10MB");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and PDF files are allowed");
      return;
    }

    const setter = section === "student" ? setStudentDocs :
      section === "father" ? setFatherDocs :
        section === "mother" ? setMotherDocs : setGuardianDocs;

    setter(prev => ({
      ...prev,
      [docKey]: { ...prev[docKey], file }
    }));

    toast.success("Document uploaded successfully");
  };

  const removeFile = (
    section: "student" | "father" | "mother" | "guardian",
    docKey: string
  ) => {
    const setter = section === "student" ? setStudentDocs :
      section === "father" ? setFatherDocs :
        section === "mother" ? setMotherDocs : setGuardianDocs;

    setter(prev => ({
      ...prev,
      [docKey]: { ...prev[docKey], file: null }
    }));

    toast.success("Document removed");
  };

  const openCamera = (
    section: "student" | "father" | "mother" | "guardian",
    docKey: string,
    docName: string
  ) => {
    setCurrentCapture({ section, docKey, docName });
    setCameraOpen(true);
  };

  const handleCameraCapture = (file: File) => {
    if (currentCapture) {
      const { section, docKey } = currentCapture;
      const setter = section === "student" ? setStudentDocs :
        section === "father" ? setFatherDocs :
          section === "mother" ? setMotherDocs : setGuardianDocs;

      setter(prev => ({
        ...prev,
        [docKey]: { ...prev[docKey], file }
      }));

      toast.success("Photo captured successfully");
    }
    setCameraOpen(false);
    setCurrentCapture(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const prepareFilesForStorage = async (docs: PersonDocuments) => {
    const processedDocs: any = {};
    for (const [key, doc] of Object.entries(docs)) {
      if (doc.file) {
        processedDocs[key] = {
          ...doc,
          file: await fileToBase64(doc.file),
        };
      } else {
        processedDocs[key] = doc;
      }
    }
    return processedDocs;
  };

  const validateDocuments = () => {
    // Check student required docs
    if (!studentDocs.photo.file) {
      toast.error("Student photo is required");
      return false;
    }
    if (!studentDocs.aadhar.file) {
      toast.error("Student Aadhar card is required");
      return false;
    }

    // Check father required docs
    if (!fatherDocs.photo.file) {
      toast.error("Father's photo is required");
      return false;
    }
    if (!fatherDocs.aadhar.file) {
      toast.error("Father's Aadhar card is required");
      return false;
    }

    // Check mother required docs
    if (!motherDocs.photo.file) {
      toast.error("Mother's photo is required");
      return false;
    }
    if (!motherDocs.aadhar.file) {
      toast.error("Mother's Aadhar card is required");
      return false;
    }

    // Check guardian required docs if guardian exists
    if (hasGuardian) {
      if (!guardianDocs.photo.file) {
        toast.error("Guardian's photo is required");
        return false;
      }
      if (!guardianDocs.aadhar.file) {
        toast.error("Guardian's Aadhar card is required");
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateDocuments()) return;
    if (!admissionId) {
      toast.error("Admission process not found");
      return;
    }

    setLoading(true);
    try {
      const stepData: any = {
        studentDocs: await prepareFilesForStorage(studentDocs),
        fatherDocs: await prepareFilesForStorage(fatherDocs),
        motherDocs: await prepareFilesForStorage(motherDocs),
      };

      if (hasGuardian) {
        stepData.guardianDocs = await prepareFilesForStorage(guardianDocs);
      }

      await updateAdmissionStep(admissionId, 5, stepData, true);
      toast.success("Documents saved successfully");
      navigate("/admission/finish");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save documents");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/admission/transfer-certificate");

  const handleSaveExit = async () => {
    if (!admissionId) return;
    setLoading(true);
    try {
      const stepData: any = {
        studentDocs: await prepareFilesForStorage(studentDocs),
        fatherDocs: await prepareFilesForStorage(fatherDocs),
        motherDocs: await prepareFilesForStorage(motherDocs),
      };

      if (hasGuardian) {
        stepData.guardianDocs = await prepareFilesForStorage(guardianDocs);
      }

      await updateAdmissionStep(admissionId, 5, stepData, false);
      toast.success("Draft saved successfully");
      navigate("/students");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentSection = (
    title: string,
    icon: React.ReactNode,
    docs: PersonDocuments,
    section: "student" | "father" | "mother" | "guardian"
  ) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b-2 border-primary/20">
        {icon}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>

      <div className="space-y-3 pl-7">
        {Object.entries(docs).map(([key, doc]) => (
          <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3 flex-1">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {doc.name}
                  {doc.required && <span className="text-destructive ml-1">*</span>}
                </p>
                {doc.file && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {doc.file.name} ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {doc.file ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(section, key)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <input
                    type="file"
                    id={`${section}-${key}`}
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload(section, key, e)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`${section}-${key}`)?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCamera(section, key, doc.name)}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Capture
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <CameraCapture
        open={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setCurrentCapture(null);
        }}
        onCapture={handleCameraCapture}
        documentName={currentCapture?.docName || "Document"}
      />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Upload Documents</h1>
            <p className="text-muted-foreground mt-2">Upload required documents for student and parents/guardian</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="gap-2" disabled={loading}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleNext} className="gap-2" disabled={loading}>
              Next: Review & Finish
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Info Card */}
          <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200">
            <div className="flex gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Required Documents</p>
                <p className="text-sm text-blue-700 mt-1">
                  Please upload photos and Aadhar cards for all family members. Birth certificate is optional.
                </p>
              </div>
            </div>
          </div>

          {/* Student Documents */}
          {renderDocumentSection(
            "Student Documents",
            <User className="w-5 h-5 text-blue-600" />,
            studentDocs,
            "student"
          )}

          {/* Father Documents */}
          {renderDocumentSection(
            "Father's Documents",
            <User className="w-5 h-5 text-green-600" />,
            fatherDocs,
            "father"
          )}

          {/* Mother Documents */}
          {renderDocumentSection(
            "Mother's Documents",
            <User className="w-5 h-5 text-pink-600" />,
            motherDocs,
            "mother"
          )}

          {/* Guardian Documents (Conditional) */}
          {hasGuardian && renderDocumentSection(
            "Guardian's Documents",
            <UserPlus className="w-5 h-5 text-purple-600" />,
            guardianDocs,
            "guardian"
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={handleBack} className="gap-2" disabled={loading}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveExit} className="gap-2" disabled={loading}>
              <Save className="w-4 h-4" />
              Save & Exit
            </Button>
            <Button onClick={handleNext} className="gap-2" disabled={loading}>
              Next: Review & Finish
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
