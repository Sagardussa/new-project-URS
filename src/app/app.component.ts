import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { IdleDialogComponent } from '@shared/components/idle-dialog/idle-dialog.component';
import { IdleManagerService } from '@core';
import { AuthService } from '@core';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, LoaderComponent, IdleDialogComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly idleSubscription?: Subscription;

  constructor(
    private readonly idleManagerService: IdleManagerService,
    private readonly authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize idle manager service - it will handle route changes automatically
    if (this.isUserLoggedIn()) {
      this.idleManagerService.startIdleService();
    }
  }

  ngOnDestroy() {
    if (this.idleSubscription) {
      this.idleSubscription.unsubscribe();
    }
    this.idleManagerService.stopIdleService();
  }

  onStayLoggedIn(): void {
    // Reset the idle timer when user chooses to stay logged in
    this.idleManagerService.resetIdleTimer();
  }

  onLogout(): void {
    // Handle any additional logout logic here
    // The idle service will handle the actual logout process
  }

  private isUserLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
}
