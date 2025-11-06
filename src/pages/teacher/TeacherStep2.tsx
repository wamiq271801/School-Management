import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Teacher } from "@/lib/firestore";
import { ArrowLeft } from "lucide-react";

interface TeacherStep2Props {
  data: Partial<Teacher>;
  onUpdate: (data: Partial<Teacher>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TeacherStep2 = ({ data, onUpdate, onNext, onPrevious }: TeacherStep2Props) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      mobile: data.contact?.mobile || "",
      alternateMobile: data.contact?.alternateMobile || "",
      email: data.contact?.email || "",
      resLine1: data.contact?.residentialAddress?.line1 || "",
      resLine2: data.contact?.residentialAddress?.line2 || "",
      resCity: data.contact?.residentialAddress?.city || "",
      resState: data.contact?.residentialAddress?.state || "",
      resPincode: data.contact?.residentialAddress?.pincode || "",
      permLine1: data.contact?.permanentAddress?.line1 || "",
      permLine2: data.contact?.permanentAddress?.line2 || "",
      permCity: data.contact?.permanentAddress?.city || "",
      permState: data.contact?.permanentAddress?.state || "",
      permPincode: data.contact?.permanentAddress?.pincode || "",
      emergencyName: data.contact?.emergencyContact?.name || "",
      emergencyRelation: data.contact?.emergencyContact?.relation || "",
      emergencyMobile: data.contact?.emergencyContact?.mobile || "",
    },
  });

  const onSubmit = (formData: any) => {
    onUpdate({
      ...data,
      contact: {
        mobile: formData.mobile,
        alternateMobile: formData.alternateMobile,
        email: formData.email,
        residentialAddress: {
          line1: formData.resLine1,
          line2: formData.resLine2,
          city: formData.resCity,
          state: formData.resState,
          pincode: formData.resPincode,
        },
        permanentAddress: formData.permLine1
          ? {
              line1: formData.permLine1,
              line2: formData.permLine2,
              city: formData.permCity,
              state: formData.permState,
              pincode: formData.permPincode,
            }
          : undefined,
        emergencyContact: formData.emergencyName
          ? {
              name: formData.emergencyName,
              relation: formData.emergencyRelation,
              mobile: formData.emergencyMobile,
            }
          : undefined,
      },
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Contact Details
        </h2>

        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  {...register("mobile", { required: true })}
                  placeholder="Enter mobile number"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="alternateMobile">Alternate Number</Label>
                <Input
                  id="alternateMobile"
                  {...register("alternateMobile")}
                  placeholder="Enter alternate number"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>

          {/* Residential Address */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Residential Address
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resLine1">Address Line 1 *</Label>
                <Input
                  id="resLine1"
                  {...register("resLine1", { required: true })}
                  placeholder="House/Flat number, Building name"
                />
              </div>
              <div>
                <Label htmlFor="resLine2">Address Line 2</Label>
                <Input
                  id="resLine2"
                  {...register("resLine2")}
                  placeholder="Area, Street, Locality"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="resCity">City *</Label>
                  <Input
                    id="resCity"
                    {...register("resCity", { required: true })}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="resState">State *</Label>
                  <Input
                    id="resState"
                    {...register("resState", { required: true })}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label htmlFor="resPincode">Pincode *</Label>
                  <Input
                    id="resPincode"
                    {...register("resPincode", { required: true })}
                    placeholder="Enter pincode"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Permanent Address (if different)
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="permLine1">Address Line 1</Label>
                <Input
                  id="permLine1"
                  {...register("permLine1")}
                  placeholder="House/Flat number, Building name"
                />
              </div>
              <div>
                <Label htmlFor="permLine2">Address Line 2</Label>
                <Input
                  id="permLine2"
                  {...register("permLine2")}
                  placeholder="Area, Street, Locality"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="permCity">City</Label>
                  <Input
                    id="permCity"
                    {...register("permCity")}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="permState">State</Label>
                  <Input
                    id="permState"
                    {...register("permState")}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label htmlFor="permPincode">Pincode</Label>
                  <Input
                    id="permPincode"
                    {...register("permPincode")}
                    placeholder="Enter pincode"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emergencyName">Contact Name</Label>
                <Input
                  id="emergencyName"
                  {...register("emergencyName")}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="emergencyRelation">Relation</Label>
                <Input
                  id="emergencyRelation"
                  {...register("emergencyRelation")}
                  placeholder="e.g., Spouse, Parent"
                />
              </div>
              <div>
                <Label htmlFor="emergencyMobile">Mobile Number</Label>
                <Input
                  id="emergencyMobile"
                  {...register("emergencyMobile")}
                  placeholder="Enter mobile number"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="submit" size="lg">
          Next: Qualification
        </Button>
      </div>
    </form>
  );
};

export default TeacherStep2;
