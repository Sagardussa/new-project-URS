import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http';
import { API_ENDPOINTS } from '@core/constants';

export interface EventDropdownItem {
  uuid?: string;
  eventName?: string;
  displayName?: string;
  [key: string]: unknown;
}

export interface EventDropdownResponse {
  statusCode?: number;
  data?: EventDropdownItem[] | { record?: EventDropdownItem[] };
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class EventDropdownService {
  private readonly api = inject(ApiService);

  getEventsDropdown(): Observable<EventDropdownResponse> {
    return this.api.get<EventDropdownResponse>(API_ENDPOINTS.EVENTS.DROPDOWN);
  }
}
