import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FooterService {
  showFooter = new BehaviorSubject<boolean>(true);

  constructor(private readonly router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Hide footer for specific routes
        if (event.url === '/login') {
          this.hide();
        } else {
          this.display();
        }
      }
    });
  }

  hide(): void {
    this.showFooter.next(false);
  }

  display(): void {
    this.showFooter.next(true);
  }
}
