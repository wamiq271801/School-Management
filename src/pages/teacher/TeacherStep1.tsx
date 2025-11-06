import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Teacher } from "@/lib/firestore";
import { Upload, X } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

interface TeacherStep1Props {
  data: Partial<Teacher>;
  onUpdate: (data: Partial<Teacher>) => void;
  onNext: () => void;
}

const TeacherStep1 = ({ data, onUpdate, onNext }: TeacherStep1Props) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    data.personal?.profilePhotoUrl || null
  );

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      firstName: data.personal?.firstName || "",
      middleName: data.personal?.middleName || "",
      lastName: data.personal?.lastName || "",
      gender: data.personal?.gender || "Male",
      dateOfBirth: data.personal?.dateOfBirth || "",
      aadharNumber: data.personal?.aadharNumber || "",
      panNumber: data.personal?.panNumber || "",
      bloodGroup: data.personal?.bloodGroup || "",
      religion: data.personal?.religion || "",
      category: data.personal?.category || "General",
      maritalStatus: data.personal?.maritalStatus || "",
      nationality: data.personal?.nationality || "Indian",
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const storage = getStorage();
      const storageRef = ref(storage, `teachers/photos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setPhotoPreview(url);
      onUpdate({
        ...data,
        personal: {
          ...data.personal!,
          profilePhotoUrl: url,
        },
      });

      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (formData: any) => {
    onUpdate({
      ...data,
      personal: {
        ...formData,
        profilePhotoUrl: photoPreview || undefined,
      },
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Personal Details
        </h2>

        {/* Profile Photo Upload */}
        <div className="mb-6">
          <Label>Profile Photo</Label>
          <div className="mt-2 flex items-center gap-4">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null);
                    onUpdate({
                      ...data,
                      personal: {
                        ...data.personal!,
                        profilePhotoUrl: undefined,
                      },
                    });
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max size: 5MB. Supported: JPG, PNG
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              {...register("firstName", { required: true })}
              placeholder="Enter first name"
            />
          </div>
          <div>
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              {...register("middleName")}
              placeholder="Enter middle name"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              {...register("lastName", { required: true })}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Gender *</Label>
            <Select
              defaultValue={watch("gender")}
              onValueChange={(value) => setValue("gender", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register("dateOfBirth", { required: true })}
            />
          </div>
          <div>
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Input
              id="bloodGroup"
              {...register("bloodGroup")}
              placeholder="e.g., O+"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="aadharNumber">Aadhar Number</Label>
            <Input
              id="aadharNumber"
              {...register("aadharNumber")}
              placeholder="XXXX-XXXX-XXXX"
              maxLength={12}
            />
          </div>
          <div>
            <Label htmlFor="panNumber">PAN Number</Label>
            <Input
              id="panNumber"
              {...register("panNumber")}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Category *</Label>
            <Select
              defaultValue={watch("category")}
              onValueChange={(value) => setValue("category", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="OBC">OBC</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
                <SelectItem value="ST">ST</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="religion">Religion</Label>
            <Input
              id="religion"
              {...register("religion")}
              placeholder="Enter religion"
            />
          </div>
          <div>
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <Select
              defaultValue={watch("maritalStatus")}
              onValueChange={(value) => setValue("maritalStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="nationality">Nationality *</Label>
          <Input
            id="nationality"
            {...register("nationality", { required: true })}
            placeholder="Enter nationality"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Next: Contact Details
        </Button>
      </div>
    </form>
  );
};

export default TeacherStep1;
