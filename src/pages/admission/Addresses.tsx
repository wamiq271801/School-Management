import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAdmission } from "@/contexts/AdmissionContext";
import { updateAdmissionStep, getAdmissionStep } from "@/lib/firestore";

interface AddressInfo {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
}

export default function Addresses() {
    const navigate = useNavigate();
    const { admissionId, setCurrentStep, includeTC } = useAdmission();
    const [loading, setLoading] = useState(false);
    const [sameAsPermanent, setSameAsPermanent] = useState(false);

    const [permanentAddress, setPermanentAddress] = useState<AddressInfo>({
        street: "", city: "", state: "", pincode: "", country: "India",
    });

    const [currentAddress, setCurrentAddress] = useState<AddressInfo>({
        street: "", city: "", state: "", pincode: "", country: "India",
    });

    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setCurrentStep(3);

        const loadData = async () => {
            if (!admissionId) {
                toast.error("No admission process found");
                navigate("/admission/student-info");
                return;
            }

            try {
                const stepData = await getAdmissionStep(admissionId, 3);
                if (stepData?.data) {
                    if (stepData.data.permanentAddress) setPermanentAddress(stepData.data.permanentAddress);
                    if (stepData.data.currentAddress) setCurrentAddress(stepData.data.currentAddress);
                    if (stepData.data.sameAsPermanent) setSameAsPermanent(stepData.data.sameAsPermanent);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (sameAsPermanent) {
            setCurrentAddress({ ...permanentAddress });
        }
    }, [sameAsPermanent, permanentAddress]);

    const validateAddress = (address: AddressInfo, label: string) => {
        if (!address.street.trim()) {
            toast.error(`${label} street address is required`);
            return false;
        }
        if (!address.city.trim()) {
            toast.error(`${label} city is required`);
            return false;
        }
        if (!address.state.trim()) {
            toast.error(`${label} state is required`);
            return false;
        }
        if (!address.pincode.trim()) {
            toast.error(`${label} pincode is required`);
            return false;
        }
        return true;
    };

    const validateForm = () => {
        if (!validateAddress(permanentAddress, "Permanent address")) return false;
        if (!sameAsPermanent && !validateAddress(currentAddress, "Current address")) return false;
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
            const stepData = {
                permanentAddress,
                currentAddress: sameAsPermanent ? permanentAddress : currentAddress,
                sameAsPermanent,
            };

            await updateAdmissionStep(admissionId, 3, stepData, true);
            toast.success("Address information saved");
            
            // Check if student is in nursery/first admission - skip TC
            const step1Data = await getAdmissionStep(admissionId, 1);
            const admissionClass = step1Data?.data?.academic?.admissionClass?.toLowerCase();
            const isNurseryOrFirst = admissionClass === 'nursery' || admissionClass === 'lkg' || admissionClass === 'ukg';
            
            if (isNurseryOrFirst) {
                navigate("/admission/additional-documents");
            } else {
                navigate("/admission/transfer-certificate");
            }
        } catch (error) {
            console.error("Error saving:", error);
            toast.error("Failed to save information");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => navigate("/admission/parent-guardian-info");

    const handleSaveExit = async () => {
        if (!admissionId) return;
        setLoading(true);
        try {
            const stepData = {
                permanentAddress,
                currentAddress: sameAsPermanent ? permanentAddress : currentAddress,
                sameAsPermanent,
            };

            await updateAdmissionStep(admissionId, 3, stepData, false);
            toast.success("Draft saved successfully");
            navigate("/students");
        } catch (error) {
            console.error("Error saving draft:", error);
            toast.error("Failed to save draft");
        } finally {
            setLoading(false);
        }
    };

    const renderAddressForm = (
        address: AddressInfo,
        setAddress: React.Dispatch<React.SetStateAction<AddressInfo>>,
        title: string,
        disabled: boolean = false
    ) => (
        <Card className="rounded-xl shadow-sm border">
            <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div>
                    <Label>Street Address <span className="text-destructive">*</span></Label>
                    <Textarea
                        value={address.street}
                        onChange={(e) => !disabled && setAddress({ ...address, street: e.target.value })}
                        placeholder="Enter street address, house/flat number"
                        className="mt-2 min-h-[80px]"
                        disabled={disabled}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>City <span className="text-destructive">*</span></Label>
                        <Input
                            value={address.city}
                            onChange={(e) => !disabled && setAddress({ ...address, city: e.target.value })}
                            placeholder="Enter city"
                            className="mt-2"
                            disabled={disabled}
                        />
                    </div>
                    <div>
                        <Label>State <span className="text-destructive">*</span></Label>
                        <Input
                            value={address.state}
                            onChange={(e) => !disabled && setAddress({ ...address, state: e.target.value })}
                            placeholder="Enter state"
                            className="mt-2"
                            disabled={disabled}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Pincode <span className="text-destructive">*</span></Label>
                        <Input
                            value={address.pincode}
                            onChange={(e) => !disabled && setAddress({ ...address, pincode: e.target.value })}
                            placeholder="Enter pincode"
                            maxLength={6}
                            className="mt-2"
                            disabled={disabled}
                        />
                    </div>
                    <div>
                        <Label>Country <span className="text-destructive">*</span></Label>
                        <Input
                            value={address.country}
                            onChange={(e) => !disabled && setAddress({ ...address, country: e.target.value })}
                            className="mt-2"
                            disabled={disabled}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground">Address Information</h1>
                        <p className="text-muted-foreground mt-2">Enter permanent and current residential addresses</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleBack} className="gap-2" disabled={loading}>
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <Button onClick={handleNext} className="gap-2" disabled={loading}>
                            Next: {includeTC ? "TC" : "Documents"}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Permanent Address */}
                    {renderAddressForm(permanentAddress, setPermanentAddress, "Permanent Address")}

                    {/* Same as Permanent Checkbox */}
                    <Card className="rounded-xl shadow-sm border">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sameAsPermanent"
                                    checked={sameAsPermanent}
                                    onCheckedChange={(checked) => setSameAsPermanent(checked as boolean)}
                                />
                                <Label htmlFor="sameAsPermanent" className="text-base font-medium cursor-pointer">
                                    Current address is same as permanent address
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Current Address */}
                    {renderAddressForm(currentAddress, setCurrentAddress, "Current Address", sameAsPermanent)}
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
                            Next: TC & Documents
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
