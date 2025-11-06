import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Save, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAdmission } from "@/contexts/AdmissionContext";
import { updateAdmissionStep, getAdmissionStep } from "@/lib/firestore";

export default function TransferCertificate() {
  const navigate = useNavigate();
  const { admissionId, setCurrentStep, includeTC } = useAdmission();
  const [loading, setLoading] = useState(false);
  const [hasPreviousSchool, setHasPreviousSchool] = useState(false);
  
  const [formData, setFormData] = useState({
    previousSchoolName: "",
    previousSchoolAddress: "",
    lastClassAttended: "",
    tcNumber: "",
    tcIssueDate: "",
    reasonForLeaving: "",
    tcFile: null as File | null,
  });

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentStep(4);
    
    const loadData = async () => {
      if (!admissionId) {
        toast.error("No admission process found");
        navigate("/admission/student-info");
        return;
      }

      try {
        const stepData = await getAdmissionStep(admissionId, 4);
        if (stepData?.data) {
          if (stepData.data.hasPreviousSchool !== undefined) {
            setHasPreviousSchool(stepData.data.hasPreviousSchool);
          }
          if (stepData.data.tcInfo) {
            setFormData(prev => ({ ...prev, ...stepData.data.tcInfo }));
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const validateForm = () => {
    if (hasPreviousSchool) {
      if (!formData.previousSchoolName.trim()) {
        toast.error("Previous school name is required");
        return false;
      }
      if (!formData.lastClassAttended.trim()) {
        toast.error("Last class attended is required");
        return false;
      }
    }
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setFormData(prev => ({ ...prev, tcFile: file }));
    toast.success("TC document uploaded successfully");
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, tcFile: null }));
    toast.success("TC document removed");
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const prepareFilesForStorage = async (data: any) => {
    const processedData = { ...data };
    if (processedData.tcFile) {
      processedData.tcFile = await fileToBase64(processedData.tcFile);
    }
    return processedData;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    if (!admissionId) {
      toast.error("Admission process not found");
      return;
    }

    setLoading(true);
    try {
      const stepData = {
        hasPreviousSchool,
        tcInfo: hasPreviousSchool ? await prepareFilesForStorage(formData) : null,
      };

      await updateAdmissionStep(admissionId, 4, stepData, true);
      toast.success("TC information saved");
      navigate("/admission/additional-documents");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save information");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/admission/addresses");

  const handleSaveExit = async () => {
    if (!admissionId) return;
    setLoading(true);
    try {
      const stepData = {
        hasPreviousSchool,
        tcInfo: hasPreviousSchool ? await prepareFilesForStorage(formData) : null,
      };

      await updateAdmissionStep(admissionId, 4, stepData, false);
      toast.success("Draft saved successfully");
      navigate("/students");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/admission/additional-documents");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Transfer Certificate (TC)</h1>
            <p className="text-muted-foreground mt-2">Upload TC from previous school (Optional)</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="gap-2" disabled={loading}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleNext} className="gap-2" disabled={loading}>
              Next: Documents
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Previous School Toggle */}
          <Card className="rounded-xl shadow-sm border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPreviousSchool"
                  checked={hasPreviousSchool}
                  onCheckedChange={(checked) => setHasPreviousSchool(checked as boolean)}
                />
                <Label htmlFor="hasPreviousSchool" className="text-base font-medium cursor-pointer">
                  Student has attended a previous school
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-2 ml-6">
                Check this if the student is transferring from another school
              </p>
            </CardContent>
          </Card>

          {/* TC Information Form (Conditional) */}
          {hasPreviousSchool && (
            <Card className="rounded-xl shadow-sm border">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Previous School Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* TC Document Upload */}
                <div>
                  <Label>Transfer Certificate (TC) Document</Label>
                  <div className="mt-2">
                    {formData.tcFile ? (
                      <div className="border-2 border-border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{formData.tcFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(formData.tcFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-sm font-medium text-foreground">Upload TC Document</p>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (Max 10MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* School Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Previous School Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={formData.previousSchoolName}
                      onChange={(e) => setFormData({ ...formData, previousSchoolName: e.target.value })}
                      placeholder="Enter school name"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Last Class Attended <span className="text-destructive">*</span></Label>
                    <Input
                      value={formData.lastClassAttended}
                      onChange={(e) => setFormData({ ...formData, lastClassAttended: e.target.value })}
                      placeholder="e.g., 5th, 10th"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Previous School Address</Label>
                  <Input
                    value={formData.previousSchoolAddress}
                    onChange={(e) => setFormData({ ...formData, previousSchoolAddress: e.target.value })}
                    placeholder="Enter school address"
                    className="mt-2"
                  />
                </div>

                {/* TC Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>TC Number</Label>
                    <Input
                      value={formData.tcNumber}
                      onChange={(e) => setFormData({ ...formData, tcNumber: e.target.value })}
                      placeholder="Enter TC number"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>TC Issue Date</Label>
                    <Input
                      type="date"
                      value={formData.tcIssueDate}
                      onChange={(e) => setFormData({ ...formData, tcIssueDate: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Reason for Leaving</Label>
                  <Input
                    value={formData.reasonForLeaving}
                    onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })}
                    placeholder="e.g., Parent transfer, Better opportunities"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          {!hasPreviousSchool && (
            <Card className="rounded-xl shadow-sm border border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">First Time Admission</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Since this is the student's first school admission, you can skip this step and proceed to the next section.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            {!hasPreviousSchool && (
              <Button variant="outline" onClick={handleSkip} className="gap-2" disabled={loading}>
                Skip this Step
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={handleNext} className="gap-2" disabled={loading}>
              Next: Additional Documents
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
