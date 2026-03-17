import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared';
import { Router } from '@angular/router';
import { AuthService } from '@core';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  todayDate: Date = new Date();

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Get user's display name (no profile API)
   */
  getUserDisplayName(): string {
    return 'Admin';
  }

  todaysDateFormate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }
}
