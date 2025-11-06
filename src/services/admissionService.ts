import { api } from '@/lib/api';

export interface Admission {
  id: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  current_step: number;
  total_steps: number;
  academic_year: string;
  student_id?: string;
  student_data?: any;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdmissionStep {
  id: string;
  admission_id: string;
  step_number: number;
  step_name: string;
  data: any;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

class AdmissionService {
  async getAdmissions(filters?: {
    status?: string;
    academic_year?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/admissions', { params: filters });
    return response.data;
  }

  async getAdmission(id: string): Promise<{ admission: Admission; steps: AdmissionStep[] }> {
    const response = await api.get(`/admissions/${id}`);
    return response.data;
  }

  async createAdmission(academicYear: string): Promise<Admission> {
    const response = await api.post('/admissions', { academic_year: academicYear });
    return response.data.admission;
  }

  async updateStep(admissionId: string, stepNumber: number, data: any, isCompleted: boolean = false): Promise<AdmissionStep> {
    const response = await api.put(`/admissions/${admissionId}/steps/${stepNumber}`, {
      data,
      is_completed: isCompleted
    });
    return response.data.step;
  }

  async completeAdmission(admissionId: string): Promise<any> {
    const response = await api.post(`/admissions/${admissionId}/complete`);
    return response.data.student;
  }

  async deleteAdmission(id: string): Promise<void> {
    await api.delete(`/admissions/${id}`);
  }
}

export const admissionService = new AdmissionService();
export default admissionService;
