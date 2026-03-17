import { Injectable } from '@angular/core';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getSize(): number {
    return this.cache.size;
  }

  // Cache with automatic key generation
  setWithKey<T>(prefix: string, params: Record<string, any>, data: T, ttl?: number): string {
    const key = this.generateKey(prefix, params);
    this.set(key, data, ttl);
    return key;
  }

  getWithKey<T>(prefix: string, params: Record<string, any>): T | null {
    const key = this.generateKey(prefix, params);
    return this.get<T>(key);
  }

  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }

  // Cache for API responses
  cacheApiResponse<T>(url: string, params: any, data: T, ttl?: number): void {
    const key = `api:${url}:${JSON.stringify(params)}`;
    this.set(key, data, ttl);
  }

  getCachedApiResponse<T>(url: string, params: any): T | null {
    const key = `api:${url}:${JSON.stringify(params)}`;
    return this.get<T>(key);
  }

  // Cache for user-specific data
  setUserData<T>(userId: string, key: string, data: T, ttl?: number): void {
    const cacheKey = `user:${userId}:${key}`;
    this.set(cacheKey, data, ttl);
  }

  getUserData<T>(userId: string, key: string): T | null {
    const cacheKey = `user:${userId}:${key}`;
    return this.get<T>(cacheKey);
  }

  // Cache for form data
  setFormData<T>(formId: string, data: T): void {
    const key = `form:${formId}`;
    this.set(key, data, 30 * 60 * 1000); // 30 minutes
  }

  getFormData<T>(formId: string): T | null {
    const key = `form:${formId}`;
    return this.get<T>(key);
  }

  clearFormData(formId: string): void {
    const key = `form:${formId}`;
    this.delete(key);
  }
} 