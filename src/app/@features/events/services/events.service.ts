import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, API_ENDPOINTS } from '@core';
import type { CreateEventPayload } from '../models/event.model';

export interface EventListResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: EventItems;
  timestamp?: string;
  path?: string;
}

export interface EventItems {
  record: EventType[];
  meta: { total: number; page: number; limit: number };
}

export interface EventType {
  id?: number;
  uuid: string;
  eventName: string;
  displayName: string;
  description: string;
  category: string;
  isActive: boolean;
  allowDuplicates: boolean;
  expectedMetadata: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly api = inject(ApiService);

  getEvents(): Observable<EventListResponse> {
    const params = new HttpParams().set('page', '1').set('limit', '10');
    return this.api.get<EventListResponse>(API_ENDPOINTS.EVENTS.BASE, { params });
  }

  getById(id: string): Observable<any> {
    return this.api.get<any>(API_ENDPOINTS.EVENTS.BY_UUID(id));
  }

  create(payload: CreateEventPayload): Observable<any> {
    return this.api.post<any>(API_ENDPOINTS.EVENTS.BASE, payload);
  }

  update(id: string, payload: CreateEventPayload): Observable<any> {
    return this.api.patch<any>(API_ENDPOINTS.EVENTS.BY_UUID(id), payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.EVENTS.BY_UUID(id));
  }

  getEventsDropdown(): Observable<any> {
    return this.api.get<any>(API_ENDPOINTS.EVENTS.DROPDOWN);
  }

  updateEventStatus(id: string, isActive: boolean): Observable<any> {
    return this.api.patch<any>(API_ENDPOINTS.EVENTS.STATUS(id), { isActive });
  }
}
