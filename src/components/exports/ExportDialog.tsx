import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Settings, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Student } from "@/lib/firestore";
import { exportStudentsToExcel, exportStudentsToCSV } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  students: Student[];
  trigger?: React.ReactNode;
}

interface ExportOptions {
  includePersonalInfo: boolean;
  includeAcademicInfo: boolean;
  includeContactInfo: boolean;
  includeFeeInfo: boolean;
  includeDocuments: boolean;
  filterByClass: string;
  filterBySection: string;
  filterByFeeStatus: string;
}

export default function ExportDialog({ students, trigger }: ExportDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  
  const [options, setOptions] = useState<ExportOptions>({
    includePersonalInfo: true,
    includeAcademicInfo: true,
    includeContactInfo: true,
    includeFeeInfo: true,
    includeDocuments: false,
    filterByClass: 'all',
    filterBySection: 'all',
    filterByFeeStatus: 'all'
  });

  // Get unique values for filters
  const classes = Array.from(new Set(students.map(s => s.academic.admissionClass).filter(Boolean)));
  const sections = Array.from(new Set(students.map(s => s.academic.section).filter(Boolean)));
  const feeStatuses = ['paid', 'partial', 'pending', 'overdue'];

  // Filter students based on selected options
  const filteredStudents = students.filter(student => {
    const matchesClass = options.filterByClass === 'all' || student.academic.admissionClass === options.filterByClass;
    const matchesSection = options.filterBySection === 'all' || student.academic.section === options.filterBySection;
    const matchesFeeStatus = options.filterByFeeStatus === 'all' || student.fees?.paymentStatus === options.filterByFeeStatus;
    
    return matchesClass && matchesSection && matchesFeeStatus;
  });

  const handleExport = async () => {
    if (filteredStudents.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No students match the selected filters.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      if (exportFormat === 'excel') {
        await exportStudentsToExcel(filteredStudents, options);
        toast({
          title: "Excel Export Successful",
          description: `Exported ${filteredStudents.length} student records to Excel with advanced formatting.`
        });
      } else {
        await exportStudentsToCSV(filteredStudents);
        toast({
          title: "CSV Export Successful",
          description: `Exported ${filteredStudents.length} student records to CSV format.`
        });
      }
      
      setIsOpen(false);
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

  const updateOption = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const getPreviewStats = () => {
    const stats = {
      total: filteredStudents.length,
      active: filteredStudents.filter(s => s.status === 'active').length,
      feesPaid: filteredStudents.filter(s => s.fees?.paymentStatus === 'paid').length,
      feesPending: filteredStudents.filter(s => s.fees?.paymentStatus === 'pending').length,
    };
    return stats;
  };

  const stats = getPreviewStats();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Student Data
          </DialogTitle>
          <DialogDescription>
            Configure export settings and download student data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Format Selection */}
          <TabsContent value="format" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Format</CardTitle>
                <CardDescription>Choose your preferred export format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${exportFormat === 'excel' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                    onClick={() => setExportFormat('excel')}
                  >
                    <CardContent className="p-6 text-center">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-green-600" />
                      <h3 className="font-semibold mb-2">Excel (.xlsx)</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Advanced formatting, multiple sheets, charts, and conditional formatting
                      </p>
                      <div className="space-y-1 text-xs">
                        <Badge variant="secondary">✓ Multiple Sheets</Badge>
                        <Badge variant="secondary">✓ Color Coding</Badge>
                        <Badge variant="secondary">✓ Summary Statistics</Badge>
                        <Badge variant="secondary">✓ Charts Ready</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${exportFormat === 'csv' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                    onClick={() => setExportFormat('csv')}
                  >
                    <CardContent className="p-6 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                      <h3 className="font-semibold mb-2">CSV (.csv)</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Simple comma-separated format for basic data export
                      </p>
                      <div className="space-y-1 text-xs">
                        <Badge variant="secondary">✓ Universal Format</Badge>
                        <Badge variant="secondary">✓ Quick Export</Badge>
                        <Badge variant="secondary">✓ Small File Size</Badge>
                        <Badge variant="secondary">✓ Easy Import</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Selection */}
          <TabsContent value="fields" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Field Selection
                </CardTitle>
                <CardDescription>Choose which information to include in the export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="personalInfo"
                        checked={options.includePersonalInfo}
                        onCheckedChange={(checked) => updateOption('includePersonalInfo', checked)}
                      />
                      <Label htmlFor="personalInfo" className="text-sm font-medium">
                        Personal Information
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Gender, Date of Birth, Blood Group, Category, Religion
                    </p>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="academicInfo"
                        checked={options.includeAcademicInfo}
                        onCheckedChange={(checked) => updateOption('includeAcademicInfo', checked)}
                      />
                      <Label htmlFor="academicInfo" className="text-sm font-medium">
                        Academic Information
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Academic Year, Admission Date, Previous School Details
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Additional Details</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="contactInfo"
                        checked={options.includeContactInfo}
                        onCheckedChange={(checked) => updateOption('includeContactInfo', checked)}
                      />
                      <Label htmlFor="contactInfo" className="text-sm font-medium">
                        Contact Information
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Parent Names, Mobile Numbers, Addresses
                    </p>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="feeInfo"
                        checked={options.includeFeeInfo}
                        onCheckedChange={(checked) => updateOption('includeFeeInfo', checked)}
                      />
                      <Label htmlFor="feeInfo" className="text-sm font-medium">
                        Fee Information
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Total Fee, Amount Paid, Balance Due, Payment Status
                    </p>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="documents"
                        checked={options.includeDocuments}
                        onCheckedChange={(checked) => updateOption('includeDocuments', checked)}
                      />
                      <Label htmlFor="documents" className="text-sm font-medium">
                        Document Status
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Document Upload Status and Links
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filters */}
          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Data Filters
                </CardTitle>
                <CardDescription>Filter students to include in the export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classFilter">Filter by Class</Label>
                    <Select value={options.filterByClass} onValueChange={(value) => updateOption('filterByClass', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map(className => (
                          <SelectItem key={className} value={className}>{className}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sectionFilter">Filter by Section</Label>
                    <Select value={options.filterBySection} onValueChange={(value) => updateOption('filterBySection', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {sections.map(section => (
                          <SelectItem key={section} value={section}>{section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feeStatusFilter">Filter by Fee Status</Label>
                    <Select value={options.filterByFeeStatus} onValueChange={(value) => updateOption('filterByFeeStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {feeStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Active Filters</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.filterByClass !== 'all' && (
                      <Badge variant="secondary">Class: {options.filterByClass}</Badge>
                    )}
                    {options.filterBySection !== 'all' && (
                      <Badge variant="secondary">Section: {options.filterBySection}</Badge>
                    )}
                    {options.filterByFeeStatus !== 'all' && (
                      <Badge variant="secondary">Fee Status: {options.filterByFeeStatus}</Badge>
                    )}
                    {options.filterByClass === 'all' && options.filterBySection === 'all' && options.filterByFeeStatus === 'all' && (
                      <Badge variant="outline">No filters applied</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Preview</CardTitle>
                <CardDescription>Review your export configuration before downloading</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold text-primary">{stats.total}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Active Students</p>
                      <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Fees Paid</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.feesPaid}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Fees Pending</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.feesPending}</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Export Configuration</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Format:</p>
                      <p className="capitalize">{exportFormat} ({exportFormat === 'excel' ? '.xlsx' : '.csv'})</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Records:</p>
                      <p>{filteredStudents.length} students</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Included Fields:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">Basic Info</Badge>
                        {options.includePersonalInfo && <Badge variant="outline" className="text-xs">Personal</Badge>}
                        {options.includeAcademicInfo && <Badge variant="outline" className="text-xs">Academic</Badge>}
                        {options.includeContactInfo && <Badge variant="outline" className="text-xs">Contact</Badge>}
                        {options.includeFeeInfo && <Badge variant="outline" className="text-xs">Fees</Badge>}
                        {options.includeDocuments && <Badge variant="outline" className="text-xs">Documents</Badge>}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Filters Applied:</p>
                      <p>{[
                        options.filterByClass !== 'all' ? `Class: ${options.filterByClass}` : null,
                        options.filterBySection !== 'all' ? `Section: ${options.filterBySection}` : null,
                        options.filterByFeeStatus !== 'all' ? `Fee: ${options.filterByFeeStatus}` : null
                      ].filter(Boolean).join(', ') || 'None'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Ready to export {filteredStudents.length} student records
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || filteredStudents.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {exportFormat === 'excel' ? 'EXCEL' : 'CSV'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}