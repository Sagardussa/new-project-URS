import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { IdleService } from './idle.service';
import { AuthService } from '@features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class IdleManagerService {
  private readonly publicRoutes = ['/auth/login', '/auth/signup', '/auth/register', '/public', '/auth'];

  constructor(
    private readonly idleService: IdleService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.setupRouterListener();
  }

  private setupRouterListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.handleRouteChange(event.url);
    });
  }

  private handleRouteChange(url: string): void {
    const isPublicRoute = this.publicRoutes.some(route => url.includes(route));
    const isAuthenticated = this.authService.isAuthenticated();

    if (!isPublicRoute && isAuthenticated) {
      // User is on a protected route and authenticated
      if (!this.idleService.isRunning()) {
        this.startIdleService();
      }
      return;
    }
    
    // User is on public route or not authenticated
    if (this.idleService.isRunning()) {
      this.stopIdleService();
    }
  }

  startIdleService(): void {
    // Reset logout flag before starting
    this.idleService.resetLogoutFlag();
    
    const config = {
      idleTime: 20 * 60, // 20 minutes
      warningTime: 30, // 30 seconds warning
      autoLogoutTime: 30, // 30 seconds to auto logout
      refreshTokenTime: 10 * 60 // 10 minutes
    };

    this.idleService.initialize(config);
  }

  stopIdleService(): void {
    this.idleService.stop();
  }

  resetIdleTimer(): void {
    if (this.idleService.isRunning()) {
      this.idleService.manualReset();
    }
  }
}
