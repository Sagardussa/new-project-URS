import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SkillsService {
  constructor() {}

  getSkills(): Observable<any> {
    return of([]);
  }
}
