import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedCookieService {
  setDynamicTableColumn(columns: any[]): any {
    const serializedColumn = JSON.stringify(columns);
    const cookieName = 'dynamicTableColumn';
    document.cookie = `${cookieName}=${serializedColumn} expires=Thu, 01 Jan 2025 00:00:00 UTC;path=/`;
  }

  get getDynamicTableColumn() {
    const cookieName = 'dynamicTableColumn=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(cookieName)) {
        const value = cookie.substring(cookieName.length);
        return JSON.parse(value);
      }
    }
    return [];
  }

  get deleteAllCookies() {
    return (document.cookie =
      'dynamicTableColumn=; expires=Thu, 01 Jan 2025 00:00:00 UTC; path=/;');
  }
}
