import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '@features/auth/services/auth.service';

export const PermissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const authService = inject(AuthService);

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const routeData = route.data;
  const requiredPermission = routeData['permission'];
  const requiredRoles = routeData['roles'];
  const redirectTo = routeData['redirectTo'] || '/dashboard';

  // If no permission or role requirement, allow access
  if (!requiredPermission && !requiredRoles) {
    return true;
  }

  // Check permissions
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasPermission = permissions.some(perm => permissionService.hasPermission(perm));
    
    if (!hasPermission) {
      // Silent redirect - don't show error message, just redirect
      router.navigate([redirectTo]);
      return false;
    }
  }

  // Check roles
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    // Check if SUPER_ADMIN role is required and user is super admin
    if (roles.includes('SUPER_ADMIN') && permissionService.isUserSuperAdmin()) {
      return true;
    }
    const hasRole = roles.some(role => permissionService.hasRole(role));
    
    if (!hasRole) {
      // Silent redirect - don't show error message, just redirect
      router.navigate([redirectTo]);
      return false;
    }
  }

  return true;
};

