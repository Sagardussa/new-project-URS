import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, API_ENDPOINTS } from '@core';

export interface BalanceResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: BalanceData;
  timestamp?: string;
  path?: string;
}

export interface BalanceData {
  record: BalanceRecord[];
  meta: { total: number; page: number; limit: number };
  totalBalance: number;
}

export interface BalanceRecord {
  id: number;
  uuid: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userType: string;
  totalPointsEarned: string;
  currentBalance: string;
  pointsPending: string;
  pointsRedeemed: string;
  pointsExpired: string;
  pointsAdjusted: string;
  lastTransactionAt: string;
}

export interface TransactionsResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: TransactionsData;
  timestamp?: string;
  path?: string;
}

export interface TransactionsData {
  record: TransactionRecord[];
  meta: { total: number; page: number; limit: number };
}

export interface TransactionRecord {
  id: number;
  uuid: string;
  createdAt: string;
  walletId: number;
  userId: string;
  transactionType: string;
  pointsAmount: string;
  balanceBefore: string;
  balanceAfter: string;
  sourceType: string;
  sourceId: number;
  description: string;
  metadata?: Record<string, unknown>;
  expiresAt: string | null;
  expired: boolean;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class RewardsService {
  private readonly api = inject(ApiService);

  getBalances(): Observable<BalanceResponse> {
    return this.api.get<BalanceResponse>(API_ENDPOINTS.POINT_WALLETS.BALANCES);
  }

  getTransactions(page = 1, limit = 10): Observable<TransactionsResponse> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.api.get<TransactionsResponse>(API_ENDPOINTS.POINT_WALLETS.TRANSACTIONS, { params });
  }
}
