import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageResponse } from '../models/admin.model';
import { NotificationResponse } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiUrl}/api/notifications`;

  constructor(private http: HttpClient) {}

  getMyNotifications(page = 0, size = 20): Observable<ApiResponse<PageResponse<NotificationResponse>>> {
    return this.http.get<ApiResponse<PageResponse<NotificationResponse>>>(
      `${this.base}?page=${page}&size=${size}`);
  }

  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.base}/unread`);
  }

  markRead(id: number): Observable<ApiResponse<NotificationResponse>> {
    return this.http.patch<ApiResponse<NotificationResponse>>(`${this.base}/${id}/read`, {});
  }

  markAllRead(): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/read-all`, {});
  }
}
