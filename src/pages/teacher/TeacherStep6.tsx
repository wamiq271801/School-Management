import { Button } from "@/components/ui/button";
import { Teacher } from "@/lib/firestore";
import { ArrowLeft, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeacherStep6Props {
  data: Partial<Teacher>;
  onSubmit: () => void;
  onPrevious: () => void;
  submitting: boolean;
}

const TeacherStep6 = ({ data, onSubmit, onPrevious, submitting }: TeacherStep6Props) => {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Review & Submit
        </h2>

        {/* Personal Details */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            Personal Details
          </h3>
          <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="text-foreground font-medium">
                {data.personal?.firstName} {data.personal?.middleName} {data.personal?.lastName}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span>{" "}
              <span className="text-foreground">{data.personal?.gender}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date of Birth:</span>{" "}
              <span className="text-foreground">{data.personal?.dateOfBirth}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Nationality:</span>{" "}
              <span className="text-foreground">{data.personal?.nationality}</span>
            </div>
            {data.personal?.aadharNumber && (
              <div>
                <span className="text-muted-foreground">Aadhar:</span>{" "}
                <span className="text-foreground">{data.personal.aadharNumber}</span>
              </div>
            )}
            {data.personal?.panNumber && (
              <div>
                <span className="text-muted-foreground">PAN:</span>{" "}
                <span className="text-foreground">{data.personal.panNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            Contact Details
          </h3>
          <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Mobile:</span>{" "}
              <span className="text-foreground">{data.contact?.mobile}</span>
            </div>
            {data.contact?.email && (
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="text-foreground">{data.contact.email}</span>
              </div>
            )}
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Address:</span>{" "}
              <span className="text-foreground">
                {data.contact?.residentialAddress?.line1},{" "}
                {data.contact?.residentialAddress?.city},{" "}
                {data.contact?.residentialAddress?.state} -{" "}
                {data.contact?.residentialAddress?.pincode}
              </span>
            </div>
          </div>
        </div>

        {/* Qualification */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            Qualification & Experience
          </h3>
          <div className="ml-10 space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Highest Qualification:</span>{" "}
              <span className="text-foreground font-medium">
                {data.qualification?.highestQualification}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Experience:</span>{" "}
              <span className="text-foreground">
                {data.qualification?.yearsOfExperience} years
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Subject Expertise:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.qualification?.subjectExpertise.map((subject) => (
                  <Badge key={subject} variant="default">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            Employment Details
          </h3>
          <div className="ml-10 space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Department:</span>{" "}
                <span className="text-foreground font-medium">
                  {data.employment?.department}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Designation:</span>{" "}
                <span className="text-foreground">{data.employment?.designation}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date of Joining:</span>{" "}
                <span className="text-foreground">{data.employment?.dateOfJoining}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Employee Type:</span>{" "}
                <span className="text-foreground">{data.employment?.employeeType}</span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned Subjects:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.employment?.assignedSubjects.map((subject) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Basic Pay:</span>{" "}
                  <span className="text-foreground">
                    ₹{data.employment?.salary.basic.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">HRA:</span>{" "}
                  <span className="text-foreground">
                    ₹{data.employment?.salary.hra.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Allowances:</span>{" "}
                  <span className="text-foreground">
                    ₹{data.employment?.salary.allowances.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Deductions:</span>{" "}
                  <span className="text-foreground">
                    ₹{data.employment?.salary.deductions.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                <span className="font-semibold text-foreground">Net Salary:</span>
                <span className="text-xl font-bold text-primary">
                  ₹{data.employment?.salary.netSalary.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            Documents
          </h3>
          <div className="ml-10 text-sm">
            <div className="flex flex-wrap gap-2">
              {data.documents?.aadharCard && (
                <Badge variant="outline">Aadhar Card ✓</Badge>
              )}
              {data.documents?.panCard && <Badge variant="outline">PAN Card ✓</Badge>}
              {data.documents?.joiningLetter && (
                <Badge variant="outline">Joining Letter ✓</Badge>
              )}
              {data.documents?.addressProof && (
                <Badge variant="outline">Address Proof ✓</Badge>
              )}
              {data.documents?.bankPassbook && (
                <Badge variant="outline">Bank Passbook ✓</Badge>
              )}
            </div>
            {!data.documents ||
              (Object.keys(data.documents).length === 0 && (
                <p className="text-muted-foreground">No documents uploaded</p>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-2">Confirmation</h3>
        <p className="text-sm text-muted-foreground">
          By clicking Submit, you confirm that all the information provided is accurate and
          complete. The teacher profile will be created in the system.
        </p>
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="gap-2"
          disabled={submitting}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="button" onClick={onSubmit} size="lg" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit & Create Teacher"}
        </Button>
      </div>
    </div>
  );
};

export default TeacherStep6;
