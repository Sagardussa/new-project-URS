import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input() appHasRole!: string | string[];
  @Input() appHasRoleMode: 'any' | 'all' = 'any'; // 'any' = OR, 'all' = AND

  private hasView = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly templateRef: TemplateRef<any>,
    private readonly viewContainer: ViewContainerRef,
    private readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.permissionService.roles$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateView();
    });
    this.updateView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasRole = this.checkRole();

    if (hasRole && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkRole(): boolean {
    if (!this.appHasRole) {
      return false;
    }

    const roles = Array.isArray(this.appHasRole)
      ? this.appHasRole
      : [this.appHasRole];

    if (roles.length === 0) {
      return false;
    }

    // Check if SUPER_ADMIN role is required and user is super admin
    if (roles.includes('SUPER_ADMIN') && this.permissionService.isUserSuperAdmin()) {
      return true;
    }

    if (this.appHasRoleMode === 'all') {
      return this.permissionService.hasAllRoles(roles);
    } else {
      return this.permissionService.hasAnyRole(roles);
    }
  }
}

