import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, TestTube, Check, X, Upload, School, Bell, Database, Palette, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  initializeGoogleDrive,
  signInToGoogle,
  isUserSignedIn,
  testDriveConnection,
} from "@/lib/googleDrive";

// Settings type
interface Settings {
  driveApiKey: string;
  driveFolderId: string;
  driveClientId: string;
  autoBackup: boolean;
  autosaveDraft: boolean;
}

import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  
  const [settings, setSettings] = useState<Settings>({
    driveApiKey: "",
    driveFolderId: "",
    driveClientId: "",
    autoBackup: false,
    autosaveDraft: true,
  });

  // School Info State
  const [schoolInfo, setSchoolInfo] = useState({
    name: localStorage.getItem("school_name") || "SmartSchool",
    address: localStorage.getItem("school_address") || "",
    contact: localStorage.getItem("school_contact") || "",
    email: localStorage.getItem("school_email") || "",
    academicYear: localStorage.getItem("academic_year") || "2025-26",
    motto: localStorage.getItem("school_motto") || "",
  });

  // UI Preferences State
  const [uiPreferences, setUiPreferences] = useState({
    theme: localStorage.getItem("theme") || "light",
    sidebarCollapsed: localStorage.getItem("sidebar_collapsed") === "true",
  });

  // Notifications State
  const [notifications, setNotifications] = useState({
    feeDueReminders: localStorage.getItem("fee_reminders") === "true",
    attendanceAlerts: localStorage.getItem("attendance_alerts") === "true",
    backupReports: localStorage.getItem("backup_reports") === "true",
  });

  const { currentUser } = useAuth();

  // Load settings on mount
  useEffect(() => {
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser]);

  async function loadSettings() {
    if (!currentUser) return;

    try {
      // Load from localStorage for now
      const savedSettings = localStorage.getItem('drive_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  async function handleSaveSettings() {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings",
        variant: "destructive",
      });
      return;
    }

    if (!settings.driveApiKey || !settings.driveClientId || !settings.driveFolderId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all Google Drive settings",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Initialize Google Drive
      await initializeGoogleDrive(settings.driveApiKey, settings.driveClientId);
      
      // Save to localStorage
      localStorage.setItem('drive_settings', JSON.stringify(settings));

      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please check your API credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    if (!settings.driveApiKey || !settings.driveClientId || !settings.driveFolderId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all Google Drive settings first",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Initialize if not already done
      await initializeGoogleDrive(settings.driveApiKey, settings.driveClientId);

      // Sign in if not signed in
      if (!isUserSignedIn()) {
        await signInToGoogle();
      }

      // Test connection
      const success = await testDriveConnection(settings.driveFolderId);

      if (success) {
        setTestResult("success");
        toast({
          title: "Connection Successful",
          description: "Google Drive connection test passed!",
        });
      } else {
        setTestResult("error");
        toast({
          title: "Connection Failed",
          description: "Could not connect to Google Drive. Check your settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setTestResult("error");
      toast({
        title: "Connection Failed",
        description: "An error occurred while testing the connection.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  }

  function handleSaveSchoolInfo() {
    Object.entries(schoolInfo).forEach(([key, value]) => {
      localStorage.setItem(`school_${key}`, value);
    });
    toast({
      title: "School Info Saved",
      description: "School information has been updated successfully",
    });
  }

  function handleSaveUIPreferences() {
    localStorage.setItem("theme", uiPreferences.theme);
    localStorage.setItem("sidebar_collapsed", String(uiPreferences.sidebarCollapsed));
    toast({
      title: "UI Preferences Saved",
      description: "Your preferences have been updated",
    });
  }

  function handleSaveNotifications() {
    localStorage.setItem("fee_reminders", String(notifications.feeDueReminders));
    localStorage.setItem("attendance_alerts", String(notifications.attendanceAlerts));
    localStorage.setItem("backup_reports", String(notifications.backupReports));
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated",
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your SmartSchool Admin preferences
        </p>
      </div>

      <Tabs defaultValue="school" className="w-full">
        <TabsList className="w-full rounded-xl flex overflow-x-auto sm:grid sm:grid-cols-6">

          <TabsTrigger value="school" className="gap-2">
            <School className="w-4 h-4" />
            <span className="hidden sm:inline">School Info</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="drive" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Drive</span>
          </TabsTrigger>
          <TabsTrigger value="firebase" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Firebase</span>
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">UI</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
        </TabsList>

        {/* School Info Tab */}
        <TabsContent value="school" className="space-y-4 mt-6">
          <Card className="p-6 rounded-xl shadow-level-2 border-0">
            <h2 className="text-xl font-semibold mb-4">School Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={schoolInfo.name}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                  placeholder="SmartSchool"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={schoolInfo.address}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
                  placeholder="School address"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input
                    id="contact"
                    value={schoolInfo.contact}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, contact: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={schoolInfo.email}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
                    placeholder="admin@smartschool.edu"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={schoolInfo.academicYear}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, academicYear: e.target.value })}
                    placeholder="2025-26"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="motto">School Motto</Label>
                  <Input
                    id="motto"
                    value={schoolInfo.motto}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, motto: e.target.value })}
                    placeholder="Excellence in Education"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveSchoolInfo} className="gap-2 bg-accent hover:bg-accent/90">
                  <Save className="w-4 h-4" />
                  Save School Info
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-6">
          <Card className="p-6 rounded-xl shadow-level-2 border-0">
            <h2 className="text-xl font-semibold mb-4">Document Requirements</h2>
            <p className="text-muted-foreground mb-6">
              Configure which documents are required for student admissions based on class levels.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Admission Document Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage required and optional documents for the admission process
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/settings/documents')}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Configure Documents
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Default Required Documents</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Birth Certificate (All Classes)</li>
                    <li>• Student Aadhar Card (All Classes)</li>
                    <li>• Transfer Certificate (Class 1st-12th)</li>
                    <li>• Previous Mark Sheet (Class 1st-12th)</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Optional Documents</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Caste Certificate</li>
                    <li>• Income Certificate</li>
                    <li>• Medical Certificate</li>
                    <li>• Domicile Certificate</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Google Drive Tab */}
        <TabsContent value="drive" className="space-y-4 mt-6">
          <Card className="p-6 rounded-xl shadow-level-2 border-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Google Drive Settings</h2>
              {testResult && (
                <div className="flex items-center gap-2">
                  {testResult === "success" ? (
                    <>
                      <Check className="w-5 h-5 text-success" />
                      <span className="text-sm text-success">Connected</span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-destructive" />
                      <span className="text-sm text-destructive">Failed</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">Drive API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={settings.driveApiKey || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, driveApiKey: e.target.value })
                  }
                  placeholder="AIzaSy..."
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your API key from Google Cloud Console
                </p>
              </div>

              <div>
                <Label htmlFor="clientId">OAuth Client ID</Label>
                <Input
                  id="clientId"
                  value={settings.driveClientId || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, driveClientId: e.target.value })
                  }
                  placeholder="123456789.apps.googleusercontent.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="folderId">Default Parent Folder ID</Label>
                <Input
                  id="folderId"
                  value={settings.driveFolderId || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, driveFolderId: e.target.value })
                  }
                  placeholder="1abcXYZ..."
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The folder ID where student folders will be created
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  disabled={testing}
                  className="gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testing ? "Testing..." : "Test Connection"}
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="gap-2 bg-accent hover:bg-accent/90"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Drive Settings"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Firebase Tab */}
        <TabsContent value="firebase" className="space-y-4 mt-6">
          <Card className="p-6 rounded-xl shadow-level-2 border-0">
            <h2 className="text-xl font-semibold mb-4">Firebase Information</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Project ID</Label>
                <p className="text-foreground font-medium mt-1">
                  {import.meta.env.VITE_FIREBASE_PROJECT_ID || "Not configured"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Authenticated User</Label>
                <p className="text-foreground font-medium mt-1">
                  {currentUser?.email || "Not logged in"}
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Firebase authentication and database are managed through environment variables. 
                  Contact your system administrator for authentication management.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* UI Preferences Tab */}
        <TabsContent value="ui" className="space-y-4 mt-6">
          <Card className="p-6 rounded-xl shadow-level-2 border-0">
            <h2 className="text-xl font-semibold mb-4">UI Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sidebar Collapsed by Default</Label>
                  <p className="text-xs text-muted-foreground">
                    Start with a collapsed sidebar on page load
                  </p>
                </div>
                <Switch
                  checked={uiPreferences.sidebarCollapsed}
                  onCheckedChange={(checked) =>
                    setUiPreferences({ ...uiPreferences, sidebarCollapsed: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Draft Autosave</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save admission drafts every 30 seconds
                  </p>
                </div>
                <Switch
                  checked={settings.autosaveDraft}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autosaveDraft: checked })
                  }
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveUIPreferences} className="gap-2 bg-accent hover:bg-accent/90">
                  <Save className="w-4 h-4" />
                  Save UI Preferences
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card className="p-6 rounded-xl shadow-level-2 border-0">
            <h2 className="text-xl font-semibold mb-4">Notifications & Alerts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Fee Due Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about upcoming fee due dates
                  </p>
                </div>
                <Switch
                  checked={notifications.feeDueReminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, feeDueReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Attendance Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts for low attendance or absences
                  </p>
                </div>
                <Switch
                  checked={notifications.attendanceAlerts}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, attendanceAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-backup to Drive</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically backup reports to Google Drive
                  </p>
                </div>
                <Switch
                  checked={notifications.backupReports}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, backupReports: checked })
                  }
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotifications} className="gap-2 bg-accent hover:bg-accent/90">
                  <Save className="w-4 h-4" />
                  Save Notification Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
