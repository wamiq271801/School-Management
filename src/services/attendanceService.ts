import { api } from '@/lib/api';

export interface Attendance {
  id: string;
  student_id: string;
  attendance_date: string;
  class_name: string;
  section: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday';
  academic_year: string;
  remarks?: string;
  marked_by: string;
  created_at: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  holiday: number;
  percentage: string;
}

class AttendanceService {
  async getAttendance(filters?: {
    student_id?: string;
    class_name?: string;
    section?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/attendance', { params: filters });
    return response.data;
  }

  async markAttendance(records: Array<Partial<Attendance>>): Promise<Attendance[]> {
    const response = await api.post('/attendance', { records });
    return response.data.attendance;
  }

  async getStudentSummary(studentId: string, academicYear?: string): Promise<AttendanceSummary> {
    const response = await api.get(`/attendance/student/${studentId}/summary`, {
      params: { academic_year: academicYear }
    });
    return response.data.summary;
  }

  async getClassReport(className: string, section: string, date: string): Promise<Attendance[]> {
    const response = await api.get(`/attendance/class/${className}/report`, {
      params: { section, date }
    });
    return response.data.attendance;
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
