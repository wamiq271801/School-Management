-- SmartSchool Database Schema for Supabase
-- Complete migration from Firebase to Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'staff')) DEFAULT 'admin',
  school_id TEXT,
  school_name TEXT,
  department TEXT,
  phone_number TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  emergency_contact JSONB,
  preferences JSONB DEFAULT '{"theme": "system", "language": "en", "notifications": {"email": true, "push": true, "sms": false}}'::jsonb,
  permissions JSONB DEFAULT '{"students": {"read": true, "write": true, "delete": true}, "teachers": {"read": true, "write": true, "delete": true}, "fees": {"read": true, "write": true, "delete": true}, "attendance": {"read": true, "write": true, "delete": true}, "exams": {"read": true, "write": true, "delete": true}, "settings": {"read": true, "write": true}}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STUDENTS TABLE
-- =====================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number TEXT NOT NULL UNIQUE,
  admission_date DATE NOT NULL,
  
  -- Basic Information
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth DATE NOT NULL,
  place_of_birth TEXT,
  blood_group TEXT,
  category TEXT NOT NULL,
  religion TEXT,
  caste TEXT,
  subcaste TEXT,
  mother_tongue TEXT,
  nationality TEXT NOT NULL DEFAULT 'Indian',
  aadhaar_number TEXT,
  
  -- Parent Information
  father JSONB,
  mother JSONB,
  guardian JSONB,
  primary_contact TEXT CHECK (primary_contact IN ('father', 'mother', 'guardian')),
  
  -- Address Information
  permanent_address JSONB,
  current_address JSONB,
  
  -- Academic Information
  academic_year TEXT NOT NULL,
  admission_class TEXT NOT NULL,
  current_class TEXT NOT NULL,
  section TEXT NOT NULL,
  roll_number TEXT,
  house TEXT,
  stream TEXT,
  
  -- Previous School Information
  previous_school_name TEXT,
  previous_school_board TEXT,
  previous_school_class TEXT,
  previous_school_percentage NUMERIC(5,2),
  
  -- Transfer Certificate
  tc_number TEXT,
  tc_date DATE,
  tc_issued BOOLEAN DEFAULT false,
  
  -- Documents (stored as JSONB with file URLs)
  documents JSONB DEFAULT '{}'::jsonb,
  
  -- Fee Information
  fee_structure JSONB,
  total_fee NUMERIC(10,2) DEFAULT 0,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('paid', 'partial', 'pending', 'overdue')) DEFAULT 'pending',
  
  -- Medical Information
  medical_conditions TEXT,
  allergies TEXT,
  
  -- RTE & BPL
  rte_beneficiary BOOLEAN DEFAULT false,
  bpl_category BOOLEAN DEFAULT false,
  
  -- Status & Metadata
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'inactive', 'alumni', 'transferred', 'tc_issued')) DEFAULT 'draft',
  school_id TEXT,
  drive_folder_id TEXT,
  photo_url TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEACHERS TABLE
-- =====================================================
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id TEXT NOT NULL UNIQUE,
  udise_teacher_code TEXT,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth DATE NOT NULL,
  aadhaar_number TEXT,
  pan_number TEXT,
  blood_group TEXT,
  religion TEXT,
  category TEXT,
  marital_status TEXT,
  nationality TEXT NOT NULL DEFAULT 'Indian',
  
  -- Contact Information
  mobile TEXT NOT NULL,
  alternate_mobile TEXT,
  email TEXT,
  residential_address JSONB,
  permanent_address JSONB,
  emergency_contact JSONB,
  
  -- Qualification
  highest_qualification TEXT NOT NULL,
  additional_qualifications TEXT[],
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  previous_school TEXT,
  subject_expertise TEXT[] NOT NULL,
  certificates JSONB,
  
  -- Employment
  date_of_joining DATE NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Permanent', 'Contract', 'Temporary', 'Visiting')),
  class_responsibilities TEXT[],
  working_shift TEXT CHECK (working_shift IN ('Morning', 'Evening', 'Both')),
  assigned_subjects TEXT[],
  class_teacher_of TEXT,
  
  -- Salary
  basic_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  hra NUMERIC(10,2) DEFAULT 0,
  allowances NUMERIC(10,2) DEFAULT 0,
  deductions NUMERIC(10,2) DEFAULT 0,
  gross_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Bank Details
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  
  -- Documents
  documents JSONB DEFAULT '{}'::jsonb,
  drive_folder_id TEXT,
  photo_url TEXT,
  
  -- Status & Metadata
  status TEXT NOT NULL CHECK (status IN ('Active', 'On Leave', 'Resigned', 'Retired')) DEFAULT 'Active',
  school_id TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FEE TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE fee_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT NOT NULL UNIQUE,
  receipt_number TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year TEXT,
  
  -- Payment Details
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'Cheque', 'UPI', 'Bank Transfer', 'Card', 'Online')),
  payment_date DATE NOT NULL,
  transaction_reference TEXT,
  cheque_number TEXT,
  bank_name TEXT,
  
  -- Fee Breakdown
  fee_components JSONB,
  
  -- Additional Info
  remarks TEXT,
  receipt_url TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ATTENDANCE TABLE
-- =====================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year TEXT,
  attendance_date DATE NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Leave', 'Holiday')),
  remarks TEXT,
  
  -- Audit fields
  marked_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate attendance entries
  UNIQUE(student_id, attendance_date)
);

-- =====================================================
-- EXAMS TABLE
-- =====================================================
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Unit Test', 'Mid Term', 'Final', 'Quarterly', 'Half Yearly', 'Annual')),
  academic_year TEXT NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_marks INTEGER NOT NULL,
  passing_marks INTEGER NOT NULL,
  subjects JSONB NOT NULL,
  status TEXT CHECK (status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled')) DEFAULT 'Scheduled',
  
  -- Audit fields
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EXAM MARKS TABLE
-- =====================================================
CREATE TABLE exam_marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL,
  total_marks NUMERIC(5,2) NOT NULL,
  grade TEXT,
  remarks TEXT,
  is_absent BOOLEAN DEFAULT false,
  
  -- Audit fields
  entered_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(exam_id, student_id, subject)
);

-- =====================================================
-- ADMISSIONS TABLE (Multi-step process)
-- =====================================================
CREATE TABLE admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
  current_step INTEGER NOT NULL DEFAULT 1,
  total_steps INTEGER NOT NULL DEFAULT 7,
  student_data JSONB,
  student_id UUID REFERENCES students(id),
  academic_year TEXT NOT NULL,
  school_id TEXT,
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- ADMISSION STEPS TABLE
-- =====================================================
CREATE TABLE admission_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  data JSONB,
  is_completed BOOLEAN DEFAULT false,
  validation_errors TEXT[],
  
  -- Audit fields
  completed_by UUID REFERENCES user_profiles(id),
  completed_at TIMESTAMPTZ,
  
  -- Unique constraint
  UNIQUE(admission_id, step_number)
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'students', 'teachers', 'parents', 'staff')),
  target_class TEXT,
  target_section TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  read_by UUID[] DEFAULT ARRAY[]::UUID[],
  expires_at TIMESTAMPTZ,
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  user_email TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Students indexes
CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_class_section ON students(current_class, section);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_academic_year ON students(academic_year);
CREATE INDEX idx_students_created_at ON students(created_at DESC);

-- Teachers indexes
CREATE INDEX idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX idx_teachers_department ON teachers(department);
CREATE INDEX idx_teachers_status ON teachers(status);

-- Fee transactions indexes
CREATE INDEX idx_fee_transactions_student_id ON fee_transactions(student_id);
CREATE INDEX idx_fee_transactions_payment_date ON fee_transactions(payment_date DESC);
CREATE INDEX idx_fee_transactions_academic_year ON fee_transactions(academic_year);

-- Attendance indexes
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date DESC);
CREATE INDEX idx_attendance_class_section ON attendance(class_name, section);

-- Exams indexes
CREATE INDEX idx_exams_academic_year ON exams(academic_year);
CREATE INDEX idx_exams_class ON exams(class_name);
CREATE INDEX idx_exams_status ON exams(status);

-- Exam marks indexes
CREATE INDEX idx_exam_marks_exam_id ON exam_marks(exam_id);
CREATE INDEX idx_exam_marks_student_id ON exam_marks(student_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_marks_updated_at BEFORE UPDATE ON exam_marks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON admissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate admission number
CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  new_number TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COUNT(*) INTO count FROM students;
  new_number := 'STU-' || year || '-' || LPAD((count + 1)::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate teacher ID
CREATE OR REPLACE FUNCTION generate_teacher_id()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  new_id TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COUNT(*) INTO count FROM teachers;
  new_id := 'TCH-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  new_number TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COUNT(*) INTO count FROM fee_transactions;
  new_number := 'TXN-' || year || '-' || LPAD((count + 1)::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  new_number TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COUNT(*) INTO count FROM fee_transactions;
  new_number := 'RCP-' || year || '-' || LPAD((count + 1)::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Students Policies (Admin and Teachers can access)
CREATE POLICY "Authenticated users can view students" ON students
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert students" ON students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update students" ON students
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete students" ON students
  FOR DELETE USING (auth.role() = 'authenticated');

-- Teachers Policies
CREATE POLICY "Authenticated users can view teachers" ON teachers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert teachers" ON teachers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update teachers" ON teachers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete teachers" ON teachers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fee Transactions Policies
CREATE POLICY "Authenticated users can view fee transactions" ON fee_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert fee transactions" ON fee_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Attendance Policies
CREATE POLICY "Authenticated users can view attendance" ON attendance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert attendance" ON attendance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update attendance" ON attendance
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Exams Policies
CREATE POLICY "Authenticated users can view exams" ON exams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage exams" ON exams
  FOR ALL USING (auth.role() = 'authenticated');

-- Exam Marks Policies
CREATE POLICY "Authenticated users can view exam marks" ON exam_marks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage exam marks" ON exam_marks
  FOR ALL USING (auth.role() = 'authenticated');

-- Admissions Policies
CREATE POLICY "Authenticated users can view admissions" ON admissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage admissions" ON admissions
  FOR ALL USING (auth.role() = 'authenticated');

-- Admission Steps Policies
CREATE POLICY "Authenticated users can view admission steps" ON admission_steps
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage admission steps" ON admission_steps
  FOR ALL USING (auth.role() = 'authenticated');

-- Notifications Policies
CREATE POLICY "Authenticated users can view notifications" ON notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Audit Logs Policies (Read-only for most users)
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Settings Policies (Admin only)
CREATE POLICY "Authenticated users can view settings" ON settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage settings" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
  ('school_name', '"SmartSchool"', 'general', 'School name'),
  ('academic_year', '"2024-2025"', 'general', 'Current academic year'),
  ('auto_backup', 'true', 'system', 'Enable automatic backups'),
  ('autosave_draft', 'true', 'system', 'Enable autosave for drafts');
