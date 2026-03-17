import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor() {}

  getClientCount(): Observable<any> {
    return of({ data: { count: 0 } });
  }

  getFreelancerCount(): Observable<any> {
    return of({ data: { count: 0 } });
  }

  getResumeUploadedFreelancersCount(): Observable<any> {
    return of({ data: { usersWithResume: 0, usersWithoutResume: 0, totalUsers: 0 } });
  }

  getJobCount(): Observable<any> {
    return of({ data: { count: 0 } });
  }

  getSubAdminCount(): Observable<any> {
    return of({ data: { count: 0 } });
  }

  getFreelancerGraphData(): Observable<any> {
    return of({ data: [] });
  }

  getClientGraphData(): Observable<any> {
    return of({ data: [] });
  }

  getJobGraphData(): Observable<any> {
    return of({ data: [] });
  }
}
