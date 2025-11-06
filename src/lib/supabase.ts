import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Student {
  id: string;
  admission_number: string;
  scholar_number?: string;
  udise_student_id?: string;
  academic_year_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  place_of_birth?: string;
  aadhaar_number?: string;
  blood_group?: string;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  religion?: string;
  caste?: string;
  subcaste?: string;
  mother_tongue?: string;
  nationality: string;
  admission_date: string;
  admission_class: string;
  current_class: string;
  section: string;
  roll_number?: string;
  house?: string;
  rte_beneficiary: boolean;
  bpl_category: boolean;
  residential_address?: any;
  permanent_address?: any;
  previous_school_name?: string;
  previous_school_board?: string;
  previous_school_class?: string;
  tc_number?: string;
  tc_date?: string;
  medical_conditions?: string;
  allergies?: string;
  status: 'active' | 'inactive' | 'alumni' | 'transferred' | 'tc_issued';
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  teacher_id: string;
  udise_teacher_code?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  aadhaar_number?: string;
  pan_number?: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  blood_group?: string;
  marital_status?: string;
  nationality: string;
  residential_address?: any;
  permanent_address?: any;
  highest_qualification: string;
  additional_qualifications?: string[];
  years_of_experience: number;
  subject_expertise: string[];
  date_of_joining: string;
  employment_type: 'Permanent' | 'Contract' | 'Temporary' | 'Visiting';
  designation: string;
  department: string;
  basic_salary: number;
  hra: number;
  allowances: number;
  gross_salary: number;
  class_teacher_of?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  status: 'Active' | 'On Leave' | 'Resigned' | 'Retired';
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FeeTransaction {
  id: string;
  transaction_number: string;
  receipt_number: string;
  student_id: string;
  academic_year_id?: string;
  amount_paid: number;
  payment_mode: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer' | 'Card' | 'Online';
  payment_date: string;
  transaction_reference?: string;
  cheque_number?: string;
  bank_name?: string;
  fee_components?: any;
  remarks?: string;
  receipt_url?: string;
  created_by?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  academic_year_id?: string;
  attendance_date: string;
  class_name: string;
  section: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday';
  remarks?: string;
  marked_by?: string;
  created_at: string;
}

export const generateAdmissionNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  const nextNumber = (count || 0) + 1;
  return `STU-${year}-${String(nextNumber).padStart(5, '0')}`;
};

export const generateTeacherId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true });

  const nextNumber = (count || 0) + 1;
  return `TCH-${year}-${String(nextNumber).padStart(4, '0')}`;
};

export const generateTransactionNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('fee_transactions')
    .select('*', { count: 'exact', head: true });

  const nextNumber = (count || 0) + 1;
  return `TXN-${year}-${String(nextNumber).padStart(6, '0')}`;
};

export const generateReceiptNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('fee_transactions')
    .select('*', { count: 'exact', head: true });

  const nextNumber = (count || 0) + 1;
  return `RCP-${year}-${String(nextNumber).padStart(6, '0')}`;
};
