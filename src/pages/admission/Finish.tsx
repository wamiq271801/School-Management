import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, FileText, User, MapPin, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAdmission } from "@/contexts/AdmissionContext";
import {
    getAdmissionProcess,
    getAdmissionStep,
    createStudent,
    updateAdmissionProcess
} from "@/lib/firestore";

export default function Finish() {
    const navigate = useNavigate();
    const { admissionId, setCurrentStep, resetAdmission, includeTC } = useAdmission();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [admissionData, setAdmissionData] = useState<any>(null);

    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setCurrentStep(6);

        const loadAllData = async () => {
            if (!admissionId) {
                toast.error("No admission process found");
                navigate("/admission/student-info");
                return;
            }

            setLoading(true);
            try {
                const admission = await getAdmissionProcess(admissionId);
                const step1 = await getAdmissionStep(admissionId, 1);
                const step2 = await getAdmissionStep(admissionId, 2);
                const step3 = await getAdmissionStep(admissionId, 3);
                const step4 = await getAdmissionStep(admissionId, 4);
                const step5 = await getAdmissionStep(admissionId, 5);

                setAdmissionData({
                    admission,
                    studentInfo: step1?.data,
                    parentInfo: step2?.data,
                    addressInfo: step3?.data,
                    tcInfo: step4?.data,
                    documentsInfo: step5?.data,
                });
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load admission data");
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, []);

    const handleSubmit = async () => {
        if (!admissionId || !admissionData) {
            toast.error("Admission data not found");
            return;
        }

        setSubmitting(true);
        try {
            // Create the student record with proper structure
            const studentData: any = {
                admissionNumber: admissionData.studentInfo.admissionNumber,
                admissionDate: admissionData.studentInfo.admissionDate,
                basic: {
                    firstName: admissionData.studentInfo.basic.firstName,
                    lastName: admissionData.studentInfo.basic.lastName,
                    middleName: admissionData.studentInfo.basic.middleName,
                    gender: admissionData.studentInfo.basic.gender,
                    dateOfBirth: admissionData.studentInfo.basic.dateOfBirth,
                    category: admissionData.studentInfo.basic.category,
                    nationality: admissionData.studentInfo.basic.nationality,
                    motherTongue: admissionData.studentInfo.basic.motherTongue,
                    bloodGroup: admissionData.studentInfo.basic.bloodGroup,
                    religion: admissionData.studentInfo.basic.religion,
                    caste: admissionData.studentInfo.basic.caste,
                    placeOfBirth: admissionData.studentInfo.basic.placeOfBirth,
                },
                academic: {
                    currentYear: admissionData.studentInfo.academic.currentYear,
                    admissionClass: admissionData.studentInfo.academic.admissionClass,
                    section: admissionData.studentInfo.academic.section,
                },
                contact: {
                    father: admissionData.parentInfo.father,
                    mother: admissionData.parentInfo.mother,
                    guardian: admissionData.parentInfo.guardian || undefined,
                    primaryContact: admissionData.parentInfo.primaryContact,
                },
                address: {
                    permanent: admissionData.addressInfo.permanentAddress,
                    current: admissionData.addressInfo.currentAddress,
                },
                status: "active",
            };

            // Add TC info if available
            if (admissionData.tcInfo?.hasPreviousSchool && admissionData.tcInfo?.tcInfo) {
                studentData.previousSchool = admissionData.tcInfo.tcInfo;
            }

            // Add additional documents if available
            if (admissionData.documentsInfo?.documents && admissionData.documentsInfo.documents.length > 0) {
                studentData.additionalDocuments = admissionData.documentsInfo.documents;
            }

            await createStudent(studentData);

            // Update admission process status
            await updateAdmissionProcess(admissionId, { status: "completed" as any });

            toast.success("Admission completed successfully!");
            resetAdmission();
            navigate("/students");
        } catch (error) {
            console.error("Error submitting admission:", error);
            toast.error("Failed to complete admission");
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => navigate("/admission/additional-documents");

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading admission data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground">Review & Finish</h1>
                        <p className="text-muted-foreground mt-2">Review all the information and submit the admission</p>
                    </div>
                    <Button variant="outline" onClick={handleBack} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Student Information Summary */}
                    <Card className="rounded-xl shadow-sm border">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Student Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {admissionData?.studentInfo && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Admission Number</p>
                                        <p className="font-medium">{admissionData.studentInfo.admissionNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Full Name</p>
                                        <p className="font-medium">
                                            {admissionData.studentInfo.basic.firstName} {admissionData.studentInfo.basic.middleName} {admissionData.studentInfo.basic.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Gender</p>
                                        <p className="font-medium">{admissionData.studentInfo.basic.gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Date of Birth</p>
                                        <p className="font-medium">{admissionData.studentInfo.basic.dateOfBirth}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Class & Section</p>
                                        <p className="font-medium">
                                            {admissionData.studentInfo.academic.admissionClass} - {admissionData.studentInfo.academic.section}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Category</p>
                                        <p className="font-medium">{admissionData.studentInfo.basic.category}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Parent Information Summary */}
                    <Card className="rounded-xl shadow-sm border">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-green-600" />
                                Parent & Guardian Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {admissionData?.parentInfo && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Father's Name</p>
                                            <p className="font-medium">{admissionData.parentInfo.father.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Father's Mobile</p>
                                            <p className="font-medium">{admissionData.parentInfo.father.mobile}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Mother's Name</p>
                                            <p className="font-medium">{admissionData.parentInfo.mother.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Mother's Mobile</p>
                                            <p className="font-medium">{admissionData.parentInfo.mother.mobile}</p>
                                        </div>
                                        {admissionData.parentInfo.guardian && (
                                            <>
                                                <div>
                                                    <p className="text-muted-foreground">Guardian's Name</p>
                                                    <p className="font-medium">{admissionData.parentInfo.guardian.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Guardian's Mobile</p>
                                                    <p className="font-medium">{admissionData.parentInfo.guardian.mobile}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t">
                                        <p className="text-muted-foreground text-sm">Primary Contact</p>
                                        <p className="font-medium capitalize">{admissionData.parentInfo.primaryContact}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Address Information Summary */}
                    <Card className="rounded-xl shadow-sm border">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-orange-600" />
                                Address Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {admissionData?.addressInfo && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                    <div>
                                        <p className="text-muted-foreground font-medium mb-2">Permanent Address</p>
                                        <p className="text-foreground">
                                            {admissionData.addressInfo.permanentAddress.street}, {admissionData.addressInfo.permanentAddress.city}, {admissionData.addressInfo.permanentAddress.state} - {admissionData.addressInfo.permanentAddress.pincode}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-medium mb-2">Current Address</p>
                                        <p className="text-foreground">
                                            {admissionData.addressInfo.currentAddress.street}, {admissionData.addressInfo.currentAddress.city}, {admissionData.addressInfo.currentAddress.state} - {admissionData.addressInfo.currentAddress.pincode}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents Summary */}
                    {(admissionData?.tcInfo?.hasPreviousSchool || admissionData?.documentsInfo?.documents?.length > 0) && (
                        <Card className="rounded-xl shadow-sm border">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm">
                                    {admissionData?.tcInfo?.hasPreviousSchool && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            <span>Transfer Certificate</span>
                                        </div>
                                    )}
                                    {admissionData?.documentsInfo?.documents?.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            <span>{admissionData.documentsInfo.documents.length} Additional Document(s)</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Success Message */}
                    <Card className="rounded-xl shadow-sm border border-green-200 bg-green-50/50">
                        <CardContent className="p-6">
                            <div className="flex gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-base font-semibold text-green-900">Ready to Submit</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        All required information has been collected. Click "Complete Admission" to finalize the student's admission.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8">
                    <Button variant="outline" onClick={handleBack} className="gap-2" disabled={submitting}>
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        disabled={submitting}
                        size="lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Complete Admission
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
