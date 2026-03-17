import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input() appHasPermission!: string | string[];
  @Input() appHasPermissionMode: 'any' | 'all' = 'any'; // 'any' = OR, 'all' = AND

  private hasView = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly templateRef: TemplateRef<any>,
    private readonly viewContainer: ViewContainerRef,
    private readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.permissionService.permissions$.pipe(
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
    const hasPermission = this.checkPermission();

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkPermission(): boolean {
    if (!this.appHasPermission) {
      return false;
    }

    const permissions = Array.isArray(this.appHasPermission)
      ? this.appHasPermission
      : [this.appHasPermission];

    if (permissions.length === 0) {
      return false;
    }

    if (this.appHasPermissionMode === 'all') {
      return this.permissionService.hasAllPermissions(permissions);
    } else {
      return this.permissionService.hasAnyPermission(permissions);
    }
  }
}

