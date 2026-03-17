# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This document describes the comprehensive RBAC system implemented for the Referral panel. The system provides **multi-layered security** at the route, component, and template levels to ensure unauthorized access is prevented.

## Architecture

### Core Components

1. **PermissionService** (`src/app/core/services/permission.service.ts`)
   - Central service for managing user permissions and roles
   - Fetches permissions from API endpoint: `/admin-user/permissions-roles`
   - Caches permissions in sessionStorage (5-minute TTL)
   - Provides reactive observables for real-time permission updates

2. **HasPermissionDirective** (`src/app/core/directives/has-permission.directive.ts`)
   - Structural directive for conditional rendering based on permissions
   - Supports single permission or array of permissions
   - Modes: `any` (OR) or `all` (AND)

3. **HasRoleDirective** (`src/app/core/directives/has-role.directive.ts`)
   - Structural directive for conditional rendering based on roles
   - Supports single role or array of roles
   - Modes: `any` (OR) or `all` (AND)

4. **PermissionGuard** (`src/app/core/guards/permission.guard.ts`)
   - Route guard for protecting routes
   - Checks permissions/roles before route activation
   - Redirects unauthorized users with error messages

## Implementation Approach

### 1. **Multi-Layer Security**

The system implements security at three levels:

```
┌─────────────────────────────────────────┐
│  Route Level (PermissionGuard)          │  ← First line of defense
├─────────────────────────────────────────┤
│  Component Level (Service Checks)        │  ← Second line of defense
├─────────────────────────────────────────┤
│  Template Level (Directives)             │  ← UI-level protection
└─────────────────────────────────────────┘
```

### 2. **Permission Flow**

```
User Login
    ↓
Fetch Permissions & Roles from API
    ↓
Cache in sessionStorage (5 min TTL)
    ↓
Update BehaviorSubjects
    ↓
Components/Directives subscribe to updates
    ↓
Real-time permission checks
```

### 3. **Caching Strategy**

- **Storage**: sessionStorage (cleared on browser close)
- **TTL**: 5 minutes
- **Invalidation**: On logout, cache expiry, or manual clear
- **Fallback**: Loads from cache if API fails

## Usage Examples

### Route Protection

```typescript
// In pages.routes.ts
{
  path: 'add-role',
  loadComponent: () => import('./add-role/add-role.component').then(m => m.AddRoleComponent),
  canActivate: [PermissionGuard],
  data: {
    permission: 'add_role',              // Required permission
    redirectTo: '/roles-permissions',    // Redirect if unauthorized
    moduleAccess: 'Add Role'             // User-friendly module name
  }
}
```

### Template-Level (Directive)

```html
<!-- Single permission -->
<ng-container *appHasPermission="'add_role'">
  <button (click)="addRole()">Add Role</button>
</ng-container>

<!-- Multiple permissions (OR) -->
<ng-container *appHasPermission="['add_role', 'update_role']" appHasPermissionMode="any">
  <button>Edit Role</button>
</ng-container>

<!-- Multiple permissions (AND) -->
<ng-container *appHasPermission="['add_role', 'manage_permissions']" appHasPermissionMode="all">
  <button>Advanced Actions</button>
</ng-container>

<!-- Role-based -->
<ng-container *appHasRole="'super_admin'">
  <button>Admin Only</button>
</ng-container>
```

### Component-Level (Service)

```typescript
import { PermissionService } from 'src/app/core/services/permission.service';

export class RoleComponent {
  constructor(private readonly permissionService: PermissionService) {}

  ngOnInit() {
    // Check permission
    if (this.permissionService.hasPermission('delete_role')) {
      // Show delete button
    }

    // Check multiple permissions (OR)
    if (this.permissionService.hasAnyPermission(['add_role', 'update_role'])) {
      // Show edit options
    }

    // Check multiple permissions (AND)
    if (this.permissionService.hasAllPermissions(['add_role', 'manage_permissions'])) {
      // Show advanced features
    }

    // Subscribe to permission changes
    this.permissionService.permissions$.subscribe(permissions => {
      // React to permission updates
    });
  }
}
```

### Conditional Column Rendering

```typescript
// In role.component.ts
columnDefinition() {
  const columns = [
    // ... other columns
  ];

  // Conditionally add column based on permission
  if (this.permissionService.hasPermission('toggle_role_status')) {
    columns.push({
      headerName: 'Status',
      field: 'isActive',
      cellRenderer: (params: any) => this.cellRendererForStatus(params),
    });
  }

  return columns;
}
```

## Permission Naming Convention

Follow this convention for consistency:

- **List**: `list_{resource}` (e.g., `list_roles`, `list_clients`)
- **View**: `view_{resource}` (e.g., `view_role`, `view_client`)
- **Add**: `add_{resource}` (e.g., `add_role`, `add_client`)
- **Update**: `update_{resource}` (e.g., `update_role`, `update_client`)
- **Delete**: `delete_{resource}` (e.g., `delete_role`, `delete_client`)
- **Status Toggle**: `toggle_{resource}_status` (e.g., `toggle_role_status`)
- **Manage**: `manage_{resource}` (e.g., `manage_role_permissions`)

## API Endpoint Requirements

The system expects the following API endpoint:

**GET** `/admin-user/permissions-roles`

**Response Format:**
```json
{
  "status": true,
  "data": {
    "permissions": [
      {
        "id": "uuid",
        "permissionSlug": "add_role",
        "permissionName": "Add Role",
        "module": "Roles & Permissions",
        "description": "Permission to add new roles"
      }
    ],
    "roles": [
      {
        "id": "uuid",
        "roleSlug": "super_admin",
        "roleName": "Super Admin",
        "description": "Full system access"
      }
    ]
  }
}
```

## Security Best Practices

### ✅ DO:

1. **Always use PermissionGuard for routes** - Prevents unauthorized route access
2. **Use directives for UI elements** - Hides unauthorized buttons/features
3. **Use service checks in components** - For programmatic logic
4. **Clear permissions on logout** - Prevents stale permission data
5. **Handle API failures gracefully** - Fallback to cache or deny access
6. **Provide clear error messages** - User-friendly permission denial messages

### ❌ DON'T:

1. **Don't rely on UI-only checks** - Always protect routes
2. **Don't hardcode permissions** - Use constants or enums
3. **Don't cache sensitive data** - Use sessionStorage, not localStorage
4. **Don't expose permission logic to client** - Keep business logic server-side
5. **Don't skip permission checks** - Check at multiple levels

## Integration Checklist

- [x] Create PermissionService
- [x] Create HasPermissionDirective
- [x] Create HasRoleDirective
- [x] Create PermissionGuard
- [x] Update login component to fetch permissions
- [x] Update routes with PermissionGuard
- [x] Update AuthService to clear permissions on logout
- [x] Update all role-related components with permission checks
- [x] Update menu items with permission directives
- [ ] Test permission scenarios
- [x] Document permission slugs for backend team

## Testing Scenarios

1. **User without permission** tries to access protected route → Redirected with error
2. **User with permission** accesses route → Success
3. **Permissions updated** → UI updates reactively
4. **Cache expired** → Permissions refetched automatically
5. **API failure** → Falls back to cache or denies access
6. **Logout** → Permissions cleared

## Troubleshooting

### Permissions not loading
- Check API endpoint is correct
- Verify token is valid
- Check browser console for errors
- Verify sessionStorage is accessible

### Directive not working
- Ensure directive is imported in component
- Check permission slug matches API response
- Verify permission is in user's permission list

### Guard not protecting route
- Verify `canActivate: [PermissionGuard]` is set
- Check route `data` has `permission` property
- Ensure PermissionService has permissions loaded

## Future Enhancements

1. **Permission Groups** - Group related permissions
2. **Dynamic Permissions** - Update without refresh
3. **Permission Inheritance** - Role-based permission inheritance
4. **Audit Logging** - Track permission checks
5. **Permission Analytics** - Usage statistics

