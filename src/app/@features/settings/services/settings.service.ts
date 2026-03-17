import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService, API_ENDPOINTS } from '@core';
import type { Settings, CreateSettingsPayload } from '../models/settings.model';

export interface ApiResponse<T> {
  statusCode: number;
  status: boolean;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
}

export interface SettingsListResponse extends ApiResponse<Settings> {}
export interface SettingsSingleResponse extends ApiResponse<Settings> {}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly api = inject(ApiService);

  list(): Observable<SettingsListResponse> {
    return this.api.get<SettingsListResponse>(API_ENDPOINTS.SETTINGS.BASE).pipe(
      catchError((error) => {
        console.error('Error loading settings:', error);
        return of({
          statusCode: 200,
          status: false,
          message: 'Failed to load settings',
          data: {} as Settings,
        });
      })
    );
  }

  update(id: string, payload: CreateSettingsPayload): Observable<SettingsSingleResponse> {
    return this.api.patch<SettingsSingleResponse>(API_ENDPOINTS.SETTINGS.BY_ID(id), payload);
  }
}
