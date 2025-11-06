import { api } from '@/lib/api';

export interface FeeTransaction {
  id: string;
  student_id: string;
  transaction_number: string;
  receipt_number: string;
  amount_paid: number;
  payment_mode: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer' | 'Card' | 'Online';
  payment_date: string;
  cheque_number?: string;
  cheque_date?: string;
  bank_name?: string;
  transaction_id?: string;
  academic_year: string;
  remarks?: string;
  created_at: string;
}

export interface FeeSummary {
  total_fee: number;
  amount_paid: number;
  balance_due: number;
  payment_status: 'paid' | 'partial' | 'pending' | 'overdue';
}

class FeeService {
  async getTransactions(filters?: { student_id?: string; academic_year?: string; limit?: number; offset?: number }) {
    const response = await api.get('/fees', { params: filters });
    return response.data;
  }

  async getTransaction(id: string): Promise<FeeTransaction> {
    const response = await api.get(`/fees/${id}`);
    return response.data.transaction;
  }

  async createTransaction(data: Partial<FeeTransaction>): Promise<FeeTransaction> {
    const response = await api.post('/fees', data);
    return response.data.transaction;
  }

  async getStudentFeeSummary(studentId: string): Promise<{ summary: FeeSummary; transactions: FeeTransaction[] }> {
    const response = await api.get(`/fees/student/${studentId}/summary`);
    return response.data;
  }
}

export const feeService = new FeeService();
export default feeService;
