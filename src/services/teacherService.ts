import { api } from '@/lib/api';

export interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  blood_group?: string;
  email: string;
  phone_number: string;
  alternate_phone?: string;
  aadhaar_number?: string;
  pan_number?: string;
  address?: any;
  qualification?: string;
  specialization?: string;
  experience_years?: number;
  date_of_joining: string;
  employee_type: 'Permanent' | 'Contract' | 'Part-time' | 'Guest';
  designation: string;
  department?: string;
  subjects?: string[];
  classes_assigned?: string[];
  salary?: number;
  bank_details?: any;
  emergency_contact?: any;
  documents?: any;
  status: 'active' | 'inactive' | 'on_leave' | 'resigned';
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherFilters {
  department?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TeacherListResponse {
  teachers: Teacher[];
  total: number;
  limit: number;
  offset: number;
}

class TeacherService {
  async getTeachers(filters?: TeacherFilters): Promise<TeacherListResponse> {
    const response = await api.get('/teachers', { params: filters });
    return response.data;
  }

  async getTeacher(id: string): Promise<Teacher> {
    const response = await api.get(`/teachers/${id}`);
    return response.data.teacher;
  }

  async createTeacher(teacherData: Partial<Teacher>): Promise<Teacher> {
    const response = await api.post('/teachers', teacherData);
    return response.data.teacher;
  }

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher> {
    const response = await api.put(`/teachers/${id}`, updates);
    return response.data.teacher;
  }

  async deleteTeacher(id: string): Promise<void> {
    await api.delete(`/teachers/${id}`);
  }
}

export const teacherService = new TeacherService();
export default teacherService;
