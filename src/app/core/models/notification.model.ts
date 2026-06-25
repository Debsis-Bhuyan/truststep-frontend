export type NotifType = 'NEW' | 'EMI' | 'INFO' | 'ALERT';

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  type: NotifType;
  isRead: boolean;
  createdAt: string;
}
export interface NotificationPage {
  content: NotificationResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}