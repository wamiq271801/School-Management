import { api } from '@/lib/api';

export interface Exam {
  id: string;
  exam_name: string;
  exam_type: 'Unit Test' | 'Mid Term' | 'Final' | 'Quarterly' | 'Half Yearly' | 'Annual';
  academic_year: string;
  class_name: string;
  section?: string;
  start_date: string;
  end_date: string;
  total_marks: number;
  passing_marks: number;
  subjects: string[];
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface ExamMark {
  id: string;
  exam_id: string;
  student_id: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  grade?: string;
  remarks?: string;
  entered_by: string;
  created_at: string;
}

class ExamService {
  async getExams(filters?: {
    academic_year?: string;
    class_name?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/exams', { params: filters });
    return response.data;
  }

  async getExam(id: string): Promise<Exam> {
    const response = await api.get(`/exams/${id}`);
    return response.data.exam;
  }

  async createExam(examData: Partial<Exam>): Promise<Exam> {
    const response = await api.post('/exams', examData);
    return response.data.exam;
  }

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam> {
    const response = await api.put(`/exams/${id}`, updates);
    return response.data.exam;
  }

  async deleteExam(id: string): Promise<void> {
    await api.delete(`/exams/${id}`);
  }

  async getExamMarks(examId: string): Promise<ExamMark[]> {
    const response = await api.get(`/exams/${examId}/marks`);
    return response.data.marks;
  }

  async enterMarks(examId: string, marks: Array<Partial<ExamMark>>): Promise<ExamMark[]> {
    const response = await api.post(`/exams/${examId}/marks`, { marks });
    return response.data.marks;
  }

  async getStudentPerformance(studentId: string, academicYear?: string) {
    const response = await api.get(`/exams/student/${studentId}/performance`, {
      params: { academic_year: academicYear }
    });
    return response.data.performance;
  }
}

export const examService = new ExamService();
export default examService;
