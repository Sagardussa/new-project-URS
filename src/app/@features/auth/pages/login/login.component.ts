import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DynamicFormComponent, type FormField } from '@shared/components/dynamic-form';
import { AuthService, AlertService, PermissionService, IdleManagerService } from '@core';

@Component({
    selector: 'app-login',
    imports: [CommonModule, RouterLink, DynamicFormComponent],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
  readonly loginFields: FormField[] = [
    { type: 'inputField', inputType: 'email', slug: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
    { type: 'inputField', inputType: 'password', slug: 'password', label: 'Password', required: true, placeholder: '••••••••' },
  ];

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly alertService: AlertService,
    private readonly permissionService: PermissionService,
    private readonly idleManagerService: IdleManagerService,
  ) {
    // Reset idle service state when component loads (in case user is logging in after idle logout)
    this.idleManagerService.stopIdleService();
  }

  onFormSubmitted(payload: { values: Record<string, unknown>; isValid: boolean }): void {
    if (!payload.isValid) return;

    this.idleManagerService.stopIdleService();
    const values = { ...payload.values} as { email: string; password: string; };
    this.authService.adminLogin(values).subscribe({
          next: (res: any) => {
            this.handleLoginSuccess(res);
          },
          error: (err: any) => {
            this.alertService.showErrorToast(err.error.message, "error");
          }
        });
  }

    private handleLoginSuccess(res: any): void {
      const token = res.data?.token;
      if (!token) {
        this.alertService.showErrorToast(res.message || 'Login failed', 'error');
        return;
      }

      this.authService.setAccessToken(token);
      this.authService.setTokenExpiry(res.data.expiresIn);

      const userRole = res.data?.userType || res.data?.role || null;
      if (userRole && typeof userRole === 'string' && userRole.trim().length > 0) {
        this.permissionService.setUserRole(userRole);
        const normalizedRole = userRole.toUpperCase();
        if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN') {
          this.navigateToDashboard();
        } else {
          this.permissionService.fetchPermissionsAndRoles().subscribe({
            next: () => this.navigateToDashboard(),
            error: () => this.navigateToDashboard()
          });
        }
      } else {
        this.permissionService.fetchPermissionsAndRoles().subscribe({
          next: () => this.navigateToDashboard(),
          error: () => this.navigateToDashboard()
        });
      }
    }

    private navigateToDashboard(): void {
      // Navigate to dashboard - IdleManagerService will automatically start idle service on route change
      this.router.navigate(['/dashboard']).catch((err) => {
      });
    }

}
