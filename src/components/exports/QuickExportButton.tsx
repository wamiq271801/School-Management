import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Student } from "@/lib/firestore";
import { exportStudentsToExcel, exportStudentsToCSV } from "@/lib/exportUtils";
import ExportDialog from "./ExportDialog";
import { useToast } from "@/hooks/use-toast";

interface QuickExportButtonProps {
  students: Student[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showText?: boolean;
}

export default function QuickExportButton({ 
  students, 
  variant = "outline", 
  size = "sm", 
  className = "",
  showText = true 
}: QuickExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async (format: 'excel' | 'csv') => {
    if (students.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No student data available for export.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const defaultOptions = {
        includePersonalInfo: true,
        includeAcademicInfo: true,
        includeContactInfo: true,
        includeFeeInfo: true,
        includeDocuments: false
      };

      if (format === 'excel') {
        await exportStudentsToExcel(students, defaultOptions);
        toast({
          title: "Excel Export Successful",
          description: `Exported ${students.length} student records to Excel.`
        });
      } else {
        await exportStudentsToCSV(students);
        toast({
          title: "CSV Export Successful", 
          description: `Exported ${students.length} student records to CSV.`
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`gap-2 ${className}`}
          disabled={isExporting}
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {showText && <span className="hidden sm:inline">Export</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-lg">
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleQuickExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Quick Excel Export
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => handleQuickExport('csv')}
          disabled={isExporting}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          Quick CSV Export
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <ExportDialog 
            students={students}
            trigger={
              <div className="flex items-center gap-2 w-full cursor-pointer">
                <Settings className="w-4 h-4" />
                Advanced Options
              </div>
            }
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}