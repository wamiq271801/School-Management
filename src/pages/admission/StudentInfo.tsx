import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAdmission } from "@/contexts/AdmissionContext";
import {
    createAdmissionProcess,
    updateAdmissionStep,
    getAdmissionStep,
    generateAdmissionNumber,
} from "@/lib/firestore";

export default function StudentInfo() {
    const navigate = useNavigate();
    const { admissionId, setAdmissionId, setCurrentStep, setIncludeTC, includeTC } = useAdmission();
    const [loading, setLoading] = useState(false);
    const [admissionNumber, setAdmissionNumber] = useState("");
    const [formData, setFormData] = useState({
        admissionDate: new Date().toISOString().split("T")[0],
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "",
        dob: "",
        bloodGroup: "",
        category: "",
        nationality: "Indian",
        religion: "",
        motherTongue: "",
        caste: "",
        placeOfBirth: "",
        currentYear: "2024-25",
        admissionClass: "",
        section: "",

    });

    useEffect(() => {
        // Scroll to top when component mounts
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setCurrentStep(1);

        const initializeAdmission = async () => {
            try {
                if (admissionId) {
                    const stepData = await getAdmissionStep(admissionId, 1);
                    if (stepData?.data) {
                        setFormData(prev => ({ ...prev, ...stepData.data }));
                    }
                } else {
                    const newAdmissionId = await createAdmissionProcess();
                    setAdmissionId(newAdmissionId);
                }

                const number = await generateAdmissionNumber();
                setAdmissionNumber(number);
            } catch (error) {
                console.error("Error initializing admission:", error);
                toast.error("Failed to initialize admission process");
            }
        };

        initializeAdmission();
    }, []);

    const validateForm = () => {
        if (!formData.firstName.trim()) {
            toast.error("First name is required");
            return false;
        }
        if (!formData.lastName.trim()) {
            toast.error("Last name is required");
            return false;
        }
        if (!formData.gender) {
            toast.error("Gender is required");
            return false;
        }
        if (!formData.dob) {
            toast.error("Date of birth is required");
            return false;
        }
        if (!formData.category) {
            toast.error("Category is required");
            return false;
        }
        if (!formData.admissionClass) {
            toast.error("Admission class is required");
            return false;
        }
        if (!formData.section) {
            toast.error("Section is required");
            return false;
        }
        return true;
    };



    const handleNext = async () => {
        if (!validateForm()) return;
        if (!admissionId) {
            toast.error("Admission process not initialized");
            return;
        }

        setLoading(true);
        try {
            const stepData = {
                admissionNumber,
                admissionDate: formData.admissionDate,
                basic: {
                    firstName: formData.firstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    dateOfBirth: formData.dob,
                    category: formData.category,
                    nationality: formData.nationality,
                    motherTongue: formData.motherTongue,
                    bloodGroup: formData.bloodGroup,
                    religion: formData.religion,
                    caste: formData.caste,
                    placeOfBirth: formData.placeOfBirth,
                },
                academic: {
                    currentYear: formData.currentYear,
                    admissionClass: formData.admissionClass,
                    section: formData.section,
                },
            };

            await updateAdmissionStep(admissionId, 1, stepData, true);

            // Determine if TC is needed based on class
            const admissionClass = formData.admissionClass.toLowerCase();
            const isNurseryOrFirst = admissionClass === 'nursery' || admissionClass === 'lkg' || admissionClass === 'ukg';
            setIncludeTC(!isNurseryOrFirst);

            toast.success("Student information saved");
            navigate("/admission/parent-guardian-info");
        } catch (error) {
            console.error("Error saving admission step:", error);
            toast.error("Failed to save student information");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExit = async () => {
        if (!admissionId) {
            toast.error("Admission process not initialized");
            return;
        }

        setLoading(true);
        try {
            const stepData = {
                admissionNumber,
                admissionDate: formData.admissionDate,
                basic: {
                    firstName: formData.firstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    dateOfBirth: formData.dob,
                    category: formData.category,
                    nationality: formData.nationality,
                    motherTongue: formData.motherTongue,
                    bloodGroup: formData.bloodGroup,
                    religion: formData.religion,
                    caste: formData.caste,
                    placeOfBirth: formData.placeOfBirth,
                },
                academic: {
                    currentYear: formData.currentYear,
                    admissionClass: formData.admissionClass,
                    section: formData.section,
                },
            };

            await updateAdmissionStep(admissionId, 1, stepData, false);

            toast.success("Draft saved successfully");
            navigate("/students");
        } catch (error) {
            console.error("Error saving draft:", error);
            toast.error("Failed to save draft");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground">Student Information</h1>
                        <p className="text-muted-foreground mt-2">Enter the student's basic details</p>
                    </div>
                    <Button onClick={handleNext} className="gap-2" disabled={loading}>
                        Next: Parent Information
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div>
                        <Card className="rounded-xl shadow-sm border">
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="admissionNumber">Admission Number <span className="text-destructive">*</span></Label>
                                        <Input id="admissionNumber" value={admissionNumber} disabled className="bg-muted mt-2" />
                                        <p className="text-xs text-muted-foreground mt-1">Auto-generated</p>
                                    </div>
                                    <div>
                                        <Label htmlFor="admissionDate">Admission Date <span className="text-destructive">*</span></Label>
                                        <Input id="admissionDate" type="date" value={formData.admissionDate} onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })} className="mt-2" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                                        <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Enter first name" className="mt-2" />
                                    </div>
                                    <div>
                                        <Label htmlFor="middleName">Middle Name</Label>
                                        <Input id="middleName" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} placeholder="Enter middle name" className="mt-2" />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                                        <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Enter last name" className="mt-2" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                                        <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                                            <SelectTrigger className="mt-2"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
                                        <Input id="dob" type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="mt-2" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="bloodGroup">Blood Group</Label>
                                        <Select value={formData.bloodGroup} onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}>
                                            <SelectTrigger className="mt-2"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A+">A+</SelectItem>
                                                <SelectItem value="A-">A-</SelectItem>
                                                <SelectItem value="B+">B+</SelectItem>
                                                <SelectItem value="B-">B-</SelectItem>
                                                <SelectItem value="AB+">AB+</SelectItem>
                                                <SelectItem value="AB-">AB-</SelectItem>
                                                <SelectItem value="O+">O+</SelectItem>
                                                <SelectItem value="O-">O-</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                            <SelectTrigger className="mt-2"><SelectValue placeholder="Select category" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="General">General</SelectItem>
                                                <SelectItem value="OBC">OBC</SelectItem>
                                                <SelectItem value="SC">SC</SelectItem>
                                                <SelectItem value="ST">ST</SelectItem>
                                                <SelectItem value="EWS">EWS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="nationality">Nationality</Label>
                                        <Input id="nationality" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className="mt-2" />
                                    </div>
                                    <div>
                                        <Label htmlFor="religion">Religion</Label>
                                        <Input id="religion" value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} placeholder="Optional" className="mt-2" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="motherTongue">Mother Tongue</Label>
                                        <Input id="motherTongue" value={formData.motherTongue} onChange={(e) => setFormData({ ...formData, motherTongue: e.target.value })} placeholder="e.g., Hindi, English" className="mt-2" />
                                    </div>
                                    <div>
                                        <Label htmlFor="placeOfBirth">Place of Birth</Label>
                                        <Input id="placeOfBirth" value={formData.placeOfBirth} onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })} placeholder="City, State" className="mt-2" />
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Academic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <Label htmlFor="currentYear">Academic Year <span className="text-destructive">*</span></Label>
                                            <Select value={formData.currentYear} onValueChange={(value) => setFormData({ ...formData, currentYear: value })}>
                                                <SelectTrigger className="mt-2"><SelectValue placeholder="Select year" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="2024-25">2024-25</SelectItem>
                                                    <SelectItem value="2025-26">2025-26</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="admissionClass">Admission Class <span className="text-destructive">*</span></Label>
                                            <Select value={formData.admissionClass} onValueChange={(value) => setFormData({ ...formData, admissionClass: value })}>
                                                <SelectTrigger className="mt-2"><SelectValue placeholder="Select class" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Nursery">Nursery</SelectItem>
                                                    <SelectItem value="LKG">LKG</SelectItem>
                                                    <SelectItem value="UKG">UKG</SelectItem>
                                                    {[...Array(12)].map((_, i) => (
                                                        <SelectItem key={i + 1} value={`${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`}>
                                                            {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="section">Section <span className="text-destructive">*</span></Label>
                                            <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
                                                <SelectTrigger className="mt-2"><SelectValue placeholder="Select section" /></SelectTrigger>
                                                <SelectContent>
                                                    {['A', 'B', 'C', 'D', 'E'].map(sec => (
                                                        <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-8">
                    <Button variant="outline" onClick={handleSaveExit} className="gap-2" disabled={loading}>
                        <Save className="w-4 h-4" />
                        Save & Exit
                    </Button>
                    <Button onClick={handleNext} className="gap-2" disabled={loading}>
                        Next: Father Information
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
