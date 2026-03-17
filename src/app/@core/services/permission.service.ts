import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface Permission {
  id: number;
  permissions_name: string;
  slug: string;
  description: string;
  module: string;
  is_active: boolean;
}

export interface Role {
  id: string;
  roleSlug: string;
  roleName: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly PERMISSIONS_KEY = 'user_permissions';
  private readonly ROLES_KEY = 'user_roles';
  private readonly PERMISSIONS_CACHE_KEY = 'permissions_cache_time';
  private readonly USER_ROLE_KEY = 'user_role';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private readonly permissionsSubject = new BehaviorSubject<string[]>([]);
  private readonly rolesSubject = new BehaviorSubject<string[]>([]);
  private isSuperAdmin = false; // Flag to track if user is Super Admin (has full access)
  
  public permissions$ = this.permissionsSubject.asObservable();
  public roles$ = this.rolesSubject.asObservable();

  constructor() {
    this.loadPermissionsFromCache();
    const isSuperAdmin = sessionStorage.getItem('isSuperAdmin');
    if (isSuperAdmin === 'true') {
      this.isSuperAdmin = true;
    }
  }

  /**
   * No API call – return empty permissions/roles.
   */
  fetchPermissionsAndRoles(): Observable<{ permissions: string[]; roles: string[] }> {
    return of({ permissions: [], roles: [] });
  }

  /**
   * Check if user has a specific permission
   * Super Admin has all permissions, Admin and Sub Admin need explicit permissions
   */
  hasPermission(permission: string): boolean {
    if (!permission) return false;
    
    // Super Admin has all permissions
    if (this.isSuperAdmin) {
      return true;
    }
    
    const permissions = this.permissionsSubject.value;
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * Super Admin has all permissions, Admin and Sub Admin need explicit permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return false;
    
    // Super Admin has all permissions
    if (this.isSuperAdmin) {
      return true;
    }
    
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   * Super Admin has all permissions, Admin and Sub Admin need explicit permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return false;
    
    // Super Admin has all permissions
    if (this.isSuperAdmin) {
      return true;
    }
    
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    if (!role) return false;
    const roles = this.rolesSubject.value;
    return roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) return false;
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roles: string[]): boolean {
    if (!roles || roles.length === 0) return false;
    return roles.every(role => this.hasRole(role));
  }

  /**
   * Get all user permissions
   */
  getPermissions(): string[] {
    return [...this.permissionsSubject.value];
  }

  /**
   * Get all user roles
   */
  getRoles(): string[] {
    return [...this.rolesSubject.value];
  }

  /**
   * Grant all permissions for Super Admin only
   * This bypasses permission checks - all modules will be visible
   */
  grantAllPermissionsForSuperAdmin(): void {
    this.isSuperAdmin = true;
    // Set a special flag in sessionStorage
    sessionStorage.setItem('isSuperAdmin', 'true');
    // Set empty permissions array but flag will override checks
    this.permissionsSubject.next([]);
    this.rolesSubject.next([]);
  }

  /**
   * Set user role and determine if they are Super Admin
   * Admin and Sub Admin need to fetch permissions from API
   */
  setUserRole(role: string): void {
    if (role) {
      sessionStorage.setItem(this.USER_ROLE_KEY, role);
      const normalizedRole = role.toUpperCase();
      
      // Only Super Admin gets unrestricted access
      if (normalizedRole === 'SUPER_ADMIN') {
        this.grantAllPermissionsForSuperAdmin();
      } else {
        // Admin and Sub Admin need explicit permissions
        this.isSuperAdmin = false;
        sessionStorage.removeItem('isSuperAdmin');
      }
    }
  }

  /**
   * Get current user role
   */
  getUserRole(): string | null {
    return sessionStorage.getItem(this.USER_ROLE_KEY);
  }

  /**
   * Check if current user is Super Admin
   */
  isUserSuperAdmin(): boolean {
    return this.isSuperAdmin;
  }

  /**
   * Clear permissions and roles (on logout)
   */
  clearPermissions(): void {
    sessionStorage.removeItem(this.PERMISSIONS_KEY);
    sessionStorage.removeItem(this.ROLES_KEY);
    sessionStorage.removeItem(this.PERMISSIONS_CACHE_KEY);
    sessionStorage.removeItem(this.USER_ROLE_KEY);
    sessionStorage.removeItem('isSuperAdmin');
    this.permissionsSubject.next([]);
    this.rolesSubject.next([]);
    this.isSuperAdmin = false;
  }

  /**
   * Cache permissions and roles in sessionStorage
   */
  private cachePermissionsAndRoles(permissions: string[], roles: string[]): void {
    try {
      sessionStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
      sessionStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
      sessionStorage.setItem(this.PERMISSIONS_CACHE_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error caching permissions and roles',error);
    }
  }

  /**
   * Load permissions and roles from cache
   */
  private loadPermissionsFromCache(): void {
    try {
      const cacheTime = sessionStorage.getItem(this.PERMISSIONS_CACHE_KEY);
      if (cacheTime) {
        const cacheAge = Date.now() - Number.parseInt(cacheTime, 10);
        if (cacheAge > this.CACHE_DURATION) {
          // Cache expired, clear it
          this.clearPermissions();
          return;
        }
      }

      const cachedPermissions = sessionStorage.getItem(this.PERMISSIONS_KEY);
      const cachedRoles = sessionStorage.getItem(this.ROLES_KEY);

      if (cachedPermissions) {
        const permissions = JSON.parse(cachedPermissions);
        this.permissionsSubject.next(permissions);
      }

      if (cachedRoles) {
        const roles = JSON.parse(cachedRoles);
        this.rolesSubject.next(roles);
      }
    } catch (error) {
      console.error('Error loading permissions from cache',error);
      this.clearPermissions();
    }
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(): boolean {
    const cacheTime = sessionStorage.getItem(this.PERMISSIONS_CACHE_KEY);
    if (!cacheTime) return false;
    const cacheAge = Date.now() - Number.parseInt(cacheTime, 10);
    return cacheAge < this.CACHE_DURATION;
  }

  /**
   * Check if user has any permission for a specific module
   * Super Admin has access to all modules
   * @param module The module name (e.g., 'freelancer', 'client')
   */
  hasModuleAccess(module: string): boolean {
    // Super Admin has access to all modules
    if (this.isSuperAdmin) {
      return true;
    }
    
    // Since we only store slugs, we check if any permission starts with or contains the module name
    // This is a heuristic approach - ideally we'd store module info separately
    const permissions = this.permissionsSubject.value;
    return permissions.some(slug => {
      // Check if slug contains module name (e.g., 'list_freelancers' contains 'freelancer')
      return slug.toLowerCase().includes(module.toLowerCase());
    });
  }

  /**
   * Get all permission slugs for a specific module
   * @param module The module name (e.g., 'freelancer', 'client')
   */
  getModulePermissions(module: string): string[] {
    const permissions = this.permissionsSubject.value;
    return permissions.filter(slug => 
      slug.toLowerCase().includes(module.toLowerCase())
    );
  }
}

