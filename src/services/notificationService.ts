import { api } from '@/lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target_audience: 'all' | 'students' | 'teachers' | 'parents' | 'staff';
  is_read: boolean;
  read_by?: string[];
  created_at: string;
}

class NotificationService {
  async getNotifications(filters?: {
    target_audience?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/notifications', { params: filters });
    return response.data;
  }

  async createNotification(data: Partial<Notification>): Promise<Notification> {
    const response = await api.post('/notifications', data);
    return response.data.notification;
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data.notification;
  }

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
