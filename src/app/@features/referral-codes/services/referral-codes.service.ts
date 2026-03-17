import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, API_ENDPOINTS } from '@core';
import type { ReferralCodeListResponse } from '../models/referral-code.model';

@Injectable({
  providedIn: 'root',
})
export class ReferralCodesService {
  private readonly api = inject(ApiService);

  getReferralCodes(page = 1, limit = 10, userId?: string): Observable<ReferralCodeListResponse> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (userId?.trim()) params = params.set('userId', userId.trim().toUpperCase());
    return this.api.get<ReferralCodeListResponse>(API_ENDPOINTS.REFERRAL_CODES.BASE, { params });
  }
}
