import { useState, useEffect } from "react";
import { Save, Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  forClasses: string[];
  category: 'identity' | 'academic' | 'address' | 'medical' | 'other';
}

const defaultDocuments: DocumentRequirement[] = [
  {
    id: "birth_certificate",
    name: "Birth Certificate",
    description: "Birth Certificate (Original + 2 copies)",
    required: true,
    forClasses: ["all"],
    category: "identity"
  },
  {
    id: "aadhar_card",
    name: "Aadhar Card",
    description: "Student Aadhar Card",
    required: true,
    forClasses: ["all"],
    category: "identity"
  },
  {
    id: "transfer_certificate",
    name: "Transfer Certificate",
    description: "Transfer Certificate from Previous School",
    required: true,
    forClasses: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"],
    category: "academic"
  },
  {
    id: "mark_sheet",
    name: "Mark Sheet",
    description: "Previous Year Mark Sheet/Report Card",
    required: true,
    forClasses: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"],
    category: "academic"
  },
  {
    id: "caste_certificate",
    name: "Caste Certificate",
    description: "Caste Certificate (if applicable)",
    required: false,
    forClasses: ["all"],
    category: "other"
  },
  {
    id: "income_certificate",
    name: "Income Certificate",
    description: "Income Certificate (for fee concession)",
    required: false,
    forClasses: ["all"],
    category: "other"
  },
  {
    id: "medical_certificate",
    name: "Medical Certificate",
    description: "Medical Fitness Certificate",
    required: false,
    forClasses: ["all"],
    category: "medical"
  },
  {
    id: "domicile_certificate",
    name: "Domicile Certificate",
    description: "Domicile Certificate (if applicable)",
    required: false,
    forClasses: ["all"],
    category: "address"
  }
];

export default function DocumentSettings() {
  const [documents, setDocuments] = useState<DocumentRequirement[]>(defaultDocuments);
  const [loading, setLoading] = useState(false);
  const [newDocument, setNewDocument] = useState<Partial<DocumentRequirement>>({
    name: "",
    description: "",
    required: false,
    forClasses: ["all"],
    category: "other"
  });

  useEffect(() => {
    loadDocumentSettings();
  }, []);

  const loadDocumentSettings = async () => {
    try {
      // Load from localStorage
      const saved = localStorage.getItem('document_requirements');
      if (saved) {
        setDocuments(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading document settings:", error);
    }
  };

  const saveDocumentSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('document_requirements', JSON.stringify(documents));
      
      toast.success("Document settings saved successfully");
    } catch (error) {
      console.error("Error saving document settings:", error);
      toast.error("Failed to save document settings");
    } finally {
      setLoading(false);
    }
  };

  const addDocument = () => {
    if (!newDocument.name || !newDocument.description) {
      toast.error("Please fill in document name and description");
      return;
    }

    const document: DocumentRequirement = {
      id: newDocument.name.toLowerCase().replace(/\s+/g, '_'),
      name: newDocument.name,
      description: newDocument.description,
      required: newDocument.required || false,
      forClasses: newDocument.forClasses || ["all"],
      category: newDocument.category || "other"
    };

    setDocuments(prev => [...prev, document]);
    setNewDocument({
      name: "",
      description: "",
      required: false,
      forClasses: ["all"],
      category: "other"
    });
    toast.success("Document added");
  };

  const removeDocument = (id: string) => {
    // Prevent removal of mandatory documents
    if (["birth_certificate", "aadhar_card"].includes(id)) {
      toast.error("This document cannot be removed as it's mandatory");
      return;
    }

    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.success("Document removed");
  };

  const updateDocument = (id: string, field: keyof DocumentRequirement, value: any) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const classOptions = [
    "Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", 
    "6th", "7th", "8th", "9th", "10th", "11th", "12th", "all"
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Document Requirements Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure which documents are required for admission based on class levels
        </p>
      </div>

      {/* Existing Documents */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <div>
                    <Label htmlFor={`name-${doc.id}`}>Document Name</Label>
                    <Input
                      id={`name-${doc.id}`}
                      value={doc.name}
                      onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`desc-${doc.id}`}>Description</Label>
                    <Textarea
                      id={`desc-${doc.id}`}
                      value={doc.description}
                      onChange={(e) => updateDocument(doc.id, 'description', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`required-${doc.id}`}
                        checked={doc.required}
                        onCheckedChange={(checked) => updateDocument(doc.id, 'required', checked)}
                        disabled={["birth_certificate", "aadhar_card"].includes(doc.id)}
                      />
                      <Label htmlFor={`required-${doc.id}`} className="text-sm">
                        Required
                      </Label>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Category</Label>
                      <select
                        value={doc.category}
                        onChange={(e) => updateDocument(doc.id, 'category', e.target.value)}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="identity">Identity</option>
                        <option value="academic">Academic</option>
                        <option value="address">Address</option>
                        <option value="medical">Medical</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between h-full">
                    <div className="text-xs text-muted-foreground">
                      For: {doc.forClasses.includes("all") ? "All Classes" : doc.forClasses.join(", ")}
                    </div>
                    {!["birth_certificate", "aadhar_card"].includes(doc.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Document */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Document Requirement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="newName">Document Name</Label>
              <Input
                id="newName"
                value={newDocument.name}
                onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Character Certificate"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="newDesc">Description</Label>
              <Input
                id="newDesc"
                value={newDocument.description}
                onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Character Certificate from Previous School"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={addDocument} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Document
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveDocumentSettings} 
          disabled={loading}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
