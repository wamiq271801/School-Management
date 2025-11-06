import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdmissionProvider } from "@/contexts/AdmissionContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AdmissionLayout } from "./components/admission/AdmissionLayout";
import Dashboard from "./pages/DashboardNew";
import Students from "./pages/Students";
import StudentInfo from "./pages/admission/StudentInfo";
import ParentGuardianInfo from "./pages/admission/ParentGuardianInfo";
import Addresses from "./pages/admission/Addresses";
import TransferCertificate from "./pages/admission/TransferCertificate";
import AdditionalDocuments from "./pages/admission/AdditionalDocuments";
import Finish from "./pages/admission/Finish";
import Teachers from "./pages/Teachers";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import ManageTeacher from "./pages/teacher/ManageTeacher";
import AddTeacher from "./pages/teacher/AddTeacher";
import EditTeacher from "./pages/teacher/EditTeacher";
import StudentProfile from "./pages/student/StudentProfile";
import Settings from "./pages/Settings";
import DocumentSettings from "./pages/settings/DocumentSettings";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import FeesDashboard from "./pages/fees/FeesDashboard";
import FeeStructure from "./pages/fees/FeeStructure";
import ManageFees from "./pages/fees/ManageFees";
import CollectFees from "./pages/fees/CollectFees";
import FeesReports from "./pages/fees/FeesReports";
import AttendanceDashboard from "./pages/attendance/AttendanceDashboard";
import AddAttendance from "./pages/attendance/AddAttendance";
import AttendanceReports from "./pages/attendance/AttendanceReports";
import ExamsManagement from "./pages/exams/ExamsManagement";
import MarksEntry from "./pages/exams/MarksEntry";
import StudentPerformance from "./pages/exams/StudentPerformance";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import BulkImport from "./pages/import/BulkImport";
import BulkImportReview from "./pages/import/BulkImportReview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <AdmissionProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected Routes */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/students/:id" element={<StudentProfile />} />
                
                {/* Bulk Import Routes */}
                <Route path="/import" element={<BulkImport />} />
                <Route path="/import/review" element={<BulkImportReview />} />
                
                {/* Admission Routes with AdmissionLayout */}
                <Route path="/admission/student-info" element={<AdmissionLayout><StudentInfo /></AdmissionLayout>} />
                <Route path="/admission/parent-guardian-info" element={<AdmissionLayout><ParentGuardianInfo /></AdmissionLayout>} />
                <Route path="/admission/addresses" element={<AdmissionLayout><Addresses /></AdmissionLayout>} />
                <Route path="/admission/transfer-certificate" element={<AdmissionLayout><TransferCertificate /></AdmissionLayout>} />
                <Route path="/admission/additional-documents" element={<AdmissionLayout><AdditionalDocuments /></AdmissionLayout>} />
                <Route path="/admission/finish" element={<AdmissionLayout><Finish /></AdmissionLayout>} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/teachers/add" element={<AddTeacher />} />
              <Route path="/teachers/manage" element={<ManageTeacher />} />
              <Route path="/teachers/:id" element={<TeacherProfile />} />
              <Route path="/teachers/:id/edit" element={<EditTeacher />} />
              <Route path="/teachers/:id/manage" element={<ManageTeacher />} />
              <Route path="/fees" element={<FeesDashboard />} />
              <Route path="/fees/structure" element={<FeeStructure />} />
              <Route path="/fees/manage" element={<ManageFees />} />
              <Route path="/fees/collect" element={<CollectFees />} />
              <Route path="/fees/reports" element={<FeesReports />} />
              <Route path="/attendance" element={<AttendanceDashboard />} />
              <Route path="/attendance/add" element={<AddAttendance />} />
              <Route path="/attendance/reports" element={<AttendanceReports />} />
              <Route path="/exams" element={<ExamsManagement />} />
              <Route path="/exams/:examId/marks" element={<MarksEntry />} />
              <Route path="/students/:studentId/performance" element={<StudentPerformance />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/documents" element={<DocumentSettings />} />
            </Route>
            
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AdmissionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
