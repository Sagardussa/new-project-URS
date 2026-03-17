import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, API_ENDPOINTS } from '@core';
import type { Program, CreateProgramPayload } from '../models/program.model';

export interface ProgramListResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: {
    record: Program[];
    meta: { total: number; page: number; limit: number };
  };
  timestamp: string;
  path: string;
}

export interface ProgramSingleResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: Program;
}

@Injectable({
  providedIn: 'root',
})
export class ProgramsService {
  private readonly api = inject(ApiService);

  list(page = 1, limit = 10): Observable<ProgramListResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.api.get<ProgramListResponse>(API_ENDPOINTS.PROGRAMS.BASE, { params });
  }

  getById(uuid: string): Observable<ProgramSingleResponse> {
    return this.api.get<ProgramSingleResponse>(API_ENDPOINTS.PROGRAMS.BY_UUID(uuid));
  }

  create(payload: CreateProgramPayload): Observable<ProgramSingleResponse> {
    return this.api.post<ProgramSingleResponse>(API_ENDPOINTS.PROGRAMS.BASE, payload);
  }

  update(uuid: string, payload: CreateProgramPayload): Observable<ProgramSingleResponse> {
    return this.api.patch<ProgramSingleResponse>(API_ENDPOINTS.PROGRAMS.BY_UUID(uuid), payload);
  }

  delete(uuid: string): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.PROGRAMS.BY_UUID(uuid));
  }
}
