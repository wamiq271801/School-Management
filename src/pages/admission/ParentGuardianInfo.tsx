import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Save, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAdmission } from "@/contexts/AdmissionContext";
import { updateAdmissionStep, getAdmissionStep } from "@/lib/firestore";

interface PersonInfo {
    name: string;
    occupation: string;
    mobile: string;
    email: string;
    aadharNumber: string;
    officeAddress: string;
}

export default function ParentGuardianInfo() {
    const navigate = useNavigate();
    const { admissionId, setCurrentStep, includeTC } = useAdmission();
    const [loading, setLoading] = useState(false);
    const [includeGuardian, setIncludeGuardian] = useState(false);
    const [primaryContact, setPrimaryContact] = useState<"father" | "mother" | "guardian">("father");

    const [father, setFather] = useState<PersonInfo>({
        name: "", occupation: "", mobile: "", email: "",
        aadharNumber: "", officeAddress: "",
    });

    const [mother, setMother] = useState<PersonInfo>({
        name: "", occupation: "", mobile: "", email: "",
        aadharNumber: "", officeAddress: "",
    });

    const [guardian, setGuardian] = useState<PersonInfo>({
        name: "", occupation: "", mobile: "", email: "",
        aadharNumber: "", officeAddress: "",
    });

    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setCurrentStep(2);

        const loadData = async () => {
            if (!admissionId) {
                toast.error("No admission process found");
                navigate("/admission/student-info");
                return;
            }

            try {
                const stepData = await getAdmissionStep(admissionId, 2);
                if (stepData?.data) {
                    if (stepData.data.father) setFather(prev => ({ ...prev, ...stepData.data.father }));
                    if (stepData.data.mother) setMother(prev => ({ ...prev, ...stepData.data.mother }));
                    if (stepData.data.guardian) {
                        setGuardian(prev => ({ ...prev, ...stepData.data.guardian }));
                        setIncludeGuardian(true);
                    }
                    if (stepData.data.primaryContact) setPrimaryContact(stepData.data.primaryContact);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        loadData();
    }, []);

    const validatePerson = (person: PersonInfo, label: string) => {
        if (!person.name.trim()) {
            toast.error(`${label}'s name is required`);
            return false;
        }
        if (!person.mobile.trim()) {
            toast.error(`${label}'s mobile number is required`);
            return false;
        }
        if (!person.aadharNumber.trim()) {
            toast.error(`${label}'s Aadhar number is required`);
            return false;
        }
        return true;
    };

    const validateForm = () => {
        if (!validatePerson(father, "Father")) return false;
        if (!validatePerson(mother, "Mother")) return false;
        if (includeGuardian && !validatePerson(guardian, "Guardian")) return false;
        return true;
    };



    const handleNext = async () => {
        if (!validateForm()) return;
        if (!admissionId) {
            toast.error("Admission process not found");
            return;
        }

        setLoading(true);
        try {
            const stepData: any = {
                father,
                mother,
                primaryContact,
            };

            if (includeGuardian) {
                stepData.guardian = guardian;
            }

            await updateAdmissionStep(admissionId, 2, stepData, true);
            toast.success("Parent/Guardian information saved");
            navigate("/admission/addresses");
        } catch (error) {
            console.error("Error saving:", error);
            toast.error("Failed to save information");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => navigate("/admission/student-info");

    const handleSaveExit = async () => {
        if (!admissionId) return;
        setLoading(true);
        try {
            const stepData: any = {
                father,
                mother,
                primaryContact,
            };

            if (includeGuardian) {
                stepData.guardian = guardian;
            }

            await updateAdmissionStep(admissionId, 2, stepData, false);
            toast.success("Draft saved successfully");
            navigate("/students");
        } catch (error) {
            console.error("Error saving draft:", error);
            toast.error("Failed to save draft");
        } finally {
            setLoading(false);
        }
    };

    const renderPersonForm = (
        person: PersonInfo,
        setPerson: React.Dispatch<React.SetStateAction<PersonInfo>>,
        personType: "father" | "mother" | "guardian",
        title: string,
        icon: React.ReactNode
    ) => (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2 pb-2 border-b-2 border-primary/20">
                {icon}
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 pl-7">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Full Name <span className="text-destructive">*</span></Label>
                        <Input
                            value={person.name}
                            onChange={(e) => setPerson({ ...person, name: e.target.value })}
                            placeholder="Enter full name"
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label>Occupation</Label>
                        <Input
                            value={person.occupation}
                            onChange={(e) => setPerson({ ...person, occupation: e.target.value })}
                            placeholder="Enter occupation"
                            className="mt-2"
                        />
                    </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Mobile Number <span className="text-destructive">*</span></Label>
                        <Input
                            value={person.mobile}
                            onChange={(e) => setPerson({ ...person, mobile: e.target.value })}
                            placeholder="+91-XXXXX-XXXXX"
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label>Email Address</Label>
                        <Input
                            type="email"
                            value={person.email}
                            onChange={(e) => setPerson({ ...person, email: e.target.value })}
                            placeholder="email@example.com"
                            className="mt-2"
                        />
                    </div>
                </div>

                {/* Aadhar and Office Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Aadhar Number <span className="text-destructive">*</span></Label>
                        <Input
                            value={person.aadharNumber}
                            onChange={(e) => setPerson({ ...person, aadharNumber: e.target.value })}
                            placeholder="XXXX-XXXX-XXXX"
                            maxLength={12}
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label>Office Address</Label>
                        <Input
                            value={person.officeAddress}
                            onChange={(e) => setPerson({ ...person, officeAddress: e.target.value })}
                            placeholder="Office address"
                            className="mt-2"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground">Parent & Guardian Information</h1>
                        <p className="text-muted-foreground mt-2">Enter parent and guardian details</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleBack} className="gap-2" disabled={loading}>
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <Button onClick={handleNext} className="gap-2" disabled={loading}>
                            Next: Address Information
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Father's Information */}
                    {renderPersonForm(father, setFather, "father", "Father's Information", <User className="w-5 h-5 text-blue-600" />)}

                    {/* Mother's Information */}
                    {renderPersonForm(mother, setMother, "mother", "Mother's Information", <User className="w-5 h-5 text-pink-600" />)}

                    {/* Guardian Toggle */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeGuardian"
                                checked={includeGuardian}
                                onCheckedChange={(checked) => setIncludeGuardian(checked as boolean)}
                            />
                            <Label htmlFor="includeGuardian" className="text-base font-medium cursor-pointer">
                                Add Guardian Information (Optional)
                            </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 ml-6">
                            Check this if the student has a legal guardian other than parents
                        </p>
                    </div>

                    {/* Guardian's Information (Conditional) */}
                    {includeGuardian && renderPersonForm(
                        guardian,
                        setGuardian,
                        "guardian",
                        "Guardian's Information",
                        <UserPlus className="w-5 h-5 text-purple-600" />
                    )}

                    {/* Primary Contact Selection */}
                    <div className="bg-blue-50/50 rounded-lg p-6 border border-blue-200">
                        <Label className="text-base font-semibold mb-4 block">
                            Primary Contact Person <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                            Who should be the primary contact for school communications?
                        </p>
                        <RadioGroup value={primaryContact} onValueChange={(value: any) => setPrimaryContact(value)} className="flex flex-wrap gap-3">
                            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white border-2 border-border hover:border-primary transition-colors flex-1 min-w-[150px]">
                                <RadioGroupItem value="father" id="contact-father" />
                                <Label htmlFor="contact-father" className="cursor-pointer font-medium">Father</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white border-2 border-border hover:border-primary transition-colors flex-1 min-w-[150px]">
                                <RadioGroupItem value="mother" id="contact-mother" />
                                <Label htmlFor="contact-mother" className="cursor-pointer font-medium">Mother</Label>
                            </div>
                            {includeGuardian && (
                                <div className="flex items-center space-x-3 p-4 rounded-lg bg-white border-2 border-border hover:border-primary transition-colors flex-1 min-w-[150px]">
                                    <RadioGroupItem value="guardian" id="contact-guardian" />
                                    <Label htmlFor="contact-guardian" className="cursor-pointer font-medium">Guardian</Label>
                                </div>
                            )}
                        </RadioGroup>
                    </div>
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
                            Next: Address Information
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
