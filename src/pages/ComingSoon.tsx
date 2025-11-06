import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Construction className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-heading font-bold text-foreground">Coming Soon</h1>
        <p className="text-muted-foreground text-lg">
          This feature is under development and will be available soon.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
