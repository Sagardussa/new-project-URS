import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeographicService {
  constructor() {}

  getCountries(
    _page: number = 1,
    _pageSize: number = 10,
    _search = ''
  ): Observable<any> {
    return of({ data: [], totalCount: 0 });
  }

  getCountryByName(_name: string): Observable<any> {
    return of({ data: [], totalCount: 0 });
  }

  getStatesByCountryId(
    _countryId: number,
    _page: number = 1,
    _pageSize: number = 10,
    _search = ''
  ): Observable<any> {
    return of({ data: [], totalCount: 0 });
  }

  getStateById(_countryId: number, _stateName: string): Observable<any> {
    return of({ data: [], totalCount: 0 });
  }

  getCitiesByStateId(
    _stateId: number,
    _page: number = 1,
    _pageSize: number = 10,
    _search = ''
  ): Observable<any> {
    return of({ data: [], totalCount: 0 });
  }

  getCityById(_stateId: number, _cityName: string): Observable<any> {
    return of({ data: [], totalCount: 0 });
  }

  getMobileCode(): Observable<any> {
    return of({ data: [] });
  }
}
