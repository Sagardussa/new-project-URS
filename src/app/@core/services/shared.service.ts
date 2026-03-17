import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private classSubject = new Subject<{
    selector: string;
    className: string;
    action: 'add' | 'remove';
  }>();
  classChanged$ = this.classSubject.asObservable();

  toggleNavClass(
    selector: string,
    className: string,
    action: 'add' | 'remove'
  ) {
    this.classSubject.next({ selector, className, action });
  }
}
