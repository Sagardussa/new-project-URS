import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '@core/http';
import { API_ENDPOINTS, STORAGE_KEYS } from '@core/constants';
import { PermissionService } from '@core/services/permission.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly permissionService = inject(PermissionService);

  adminLogin(payload: { email: string; password: string }): Observable<any> {
    return this.api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
  }

  validateEmail(payload: { email: string; scope: string }): Observable<any> {
    return this.api.post(API_ENDPOINTS.AUTH.VALIDATE_EMAIL, payload);
  }

  logout(): Observable<null> {
    this.removeTokens();
    return of(null);
  }

  setAccessToken(token: string): void {
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  setRefreshToken(token: string): void {
    sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  removeTokens(): void {
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    this.permissionService.clearPermissions();
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    const expiry = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (expiry) {
      const expiryTime = new Date(expiry);
      if (new Date() >= expiryTime) {
        this.removeTokens();
        return false;
      }
    }
    return true;
  }

  setTokenExpiry(expiresInSeconds: number | string | undefined | null): void {
    const DEFAULT_EXPIRY_SECONDS = 3600;
    let expiresIn: number;
    if (expiresInSeconds == null || expiresInSeconds === '') {
      expiresIn = DEFAULT_EXPIRY_SECONDS;
    } else {
      expiresIn = typeof expiresInSeconds === 'string' ? Number.parseInt(expiresInSeconds, 10) : expiresInSeconds;
      if (Number.isNaN(expiresIn) || expiresIn <= 0) expiresIn = DEFAULT_EXPIRY_SECONDS;
    }
    try {
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + expiresIn);
      sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toISOString());
    } catch {
      const defaultExpiry = new Date();
      defaultExpiry.setSeconds(defaultExpiry.getSeconds() + DEFAULT_EXPIRY_SECONDS);
      sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, defaultExpiry.toISOString());
    }
  }
}
