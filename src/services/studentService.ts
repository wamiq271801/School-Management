import { api } from '@/lib/api';

export interface Student {
  id: string;
  admission_number: string;
  admission_date: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  place_of_birth?: string;
  blood_group?: string;
  category: string;
  religion?: string;
  caste?: string;
  mother_tongue?: string;
  nationality: string;
  aadhaar_number?: string;
  father?: any;
  mother?: any;
  guardian?: any;
  primary_contact?: 'father' | 'mother' | 'guardian';
  permanent_address?: any;
  current_address?: any;
  academic_year: string;
  admission_class: string;
  current_class: string;
  section: string;
  roll_number?: string;
  house?: string;
  stream?: string;
  previous_school_name?: string;
  previous_school_board?: string;
  previous_school_class?: string;
  tc_number?: string;
  tc_date?: string;
  documents?: any;
  fee_structure?: any;
  total_fee?: number;
  amount_paid?: number;
  balance_due?: number;
  payment_status?: 'paid' | 'partial' | 'pending' | 'overdue';
  medical_conditions?: string;
  allergies?: string;
  rte_beneficiary?: boolean;
  bpl_category?: boolean;
  status: 'draft' | 'active' | 'inactive' | 'alumni' | 'transferred' | 'tc_issued';
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentFilters {
  class?: string;
  section?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface StudentListResponse {
  students: Student[];
  total: number;
  limit: number;
  offset: number;
}

export interface StudentStats {
  total: number;
  active: number;
  by_class: Record<string, number>;
}

class StudentService {
  /**
   * Get all students with optional filters
   */
  async getStudents(filters?: StudentFilters): Promise<StudentListResponse> {
    const response = await api.get('/students', { params: filters });
    return response.data;
  }

  /**
   * Get single student by ID
   */
  async getStudent(id: string): Promise<Student> {
    const response = await api.get(`/students/${id}`);
    return response.data.student;
  }

  /**
   * Create a new student
   */
  async createStudent(studentData: Partial<Student>): Promise<Student> {
    const response = await api.post('/students', studentData);
    return response.data.student;
  }

  /**
   * Update student
   */
  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const response = await api.put(`/students/${id}`, updates);
    return response.data.student;
  }

  /**
   * Delete student
   */
  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  }

  /**
   * Bulk create students
   */
  async bulkCreateStudents(students: Partial<Student>[]): Promise<Student[]> {
    const response = await api.post('/students/bulk', { students });
    return response.data.students;
  }

  /**
   * Bulk update students
   */
  async bulkUpdateStudents(studentIds: string[], updates: Partial<Student>): Promise<Student[]> {
    const response = await api.put('/students/bulk', { student_ids: studentIds, updates });
    return response.data.students;
  }

  /**
   * Bulk delete students
   */
  async bulkDeleteStudents(studentIds: string[]): Promise<void> {
    await api.delete('/students/bulk', { data: { student_ids: studentIds } });
  }

  /**
   * Get student statistics
   */
  async getStudentStats(): Promise<StudentStats> {
    const response = await api.get('/students/stats/summary');
    return response.data;
  }

  /**
   * Search students
   */
  async searchStudents(searchTerm: string, filters?: Omit<StudentFilters, 'search'>): Promise<StudentListResponse> {
    return this.getStudents({ ...filters, search: searchTerm });
  }
}

export const studentService = new StudentService();
export default studentService;
