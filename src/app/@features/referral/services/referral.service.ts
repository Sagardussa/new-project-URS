import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, API_ENDPOINTS } from '@core';

export interface ReferralListResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: {
    record: any[];
    meta: { total: number; page: number; limit: number };
  };
  timestamp: string;
  path: string;
}

/** Response from GET /referrals/admin/stats/{referralCode} */
export interface ReferralAdminStatsResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: {
    totalReferralCount: number;
    totalRewardPointsSum: number;
  };
  timestamp: string;
  path: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReferralService {
  private readonly api = inject(ApiService);

  fetchList(page = 1, limit = 10): Observable<ReferralListResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.api.get<ReferralListResponse>(API_ENDPOINTS.REFERRALS.BASE, { params });
  }

  /** Get referral journey by referral code (e.g. AHUG092P) with optional pagination. */
  getReferralJourneyByCode(code: string, page = 1, limit = 10): Observable<any> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.api.get<any>(`${API_ENDPOINTS.REFERRALS.BASE}/admin/code/${encodeURIComponent(code)}`, { params });
  }

  /** Get referral stats by code (totalReferralCount, totalRewardPointsSum). Sole source for journey tab summary. */
  getAdminStatsByCode(referralCode: string): Observable<ReferralAdminStatsResponse> {
    return this.api.get<ReferralAdminStatsResponse>(API_ENDPOINTS.REFERRALS.ADMIN_STATS(referralCode));
  }
}
