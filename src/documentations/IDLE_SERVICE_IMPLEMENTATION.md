# Idle Service Implementation Guide

## Overview

The Idle Service has been successfully implemented in your Angular project with the following features:

- **Activity monitoring** (mouse, keyboard, touch, scroll events)
- **Configurable timeouts** and warning periods
- **Visual warning dialog** with countdown timer
- **Automatic token refresh** before logout
- **Browser notifications** and attention-grabbing features
- **Smart route-based management**

## Files Created

### Core Services
- `src/app/core/services/idle.service.ts` - Main idle monitoring service
- `src/app/core/services/idle-manager.service.ts` - Route-aware idle service manager

### UI Components
- `src/app/shared/idle-dialog/idle-dialog.component.ts` - Dialog component
- `src/app/shared/idle-dialog/idle-dialog.component.html` - Dialog template
- `src/app/shared/idle-dialog/idle-dialog.component.css` - Dialog styles

### Integration
- Updated `src/app/app.component.ts` - Main app integration
- Updated `src/app/app.component.html` - Added dialog component

## Configuration

The idle service is configured with the following default settings:

```typescript
const config = {
  idleTime: 20 * 60,        // 20 minutes - time before user is considered idle
  warningTime: 30,          // 30 seconds - warning dialog display time
  autoLogoutTime: 30,       // 30 seconds - countdown before auto logout
  refreshTokenTime: 10 * 60 // 10 minutes - token refresh interval
};
```

## Features

### 1. Activity Monitoring
- Tracks: `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click`
- Throttled to prevent excessive processing
- Runs outside Angular zone for performance

### 2. Warning Dialog
- Modern, responsive design
- Countdown timer with progress bar
- Color-coded progress (green → yellow → red)
- PrimeNG icons integration
- Accessibility support
- Dark mode support

### 3. Attention Grabbing
- Browser title blinking
- Browser notifications (with permission)
- High contrast and reduced motion support

### 4. Smart Management
- Automatically starts/stops based on authentication state
- Route-aware (only active on protected routes)
- Proper cleanup on component destruction

## Usage

### Basic Usage

The service is automatically initialized when the app starts if the user is authenticated. No additional setup is required.

### Manual Control

```typescript
// In any component
constructor(private idleManagerService: IdleManagerService) {}

// Start idle monitoring
this.idleManagerService.startIdleService();

// Stop idle monitoring
this.idleManagerService.stopIdleService();

// Reset idle timer (useful for API calls)
this.idleManagerService.resetIdleTimer();
```

### Custom Configuration

To customize the idle service settings, modify the config in `idle-manager.service.ts`:

```typescript
const config = {
  idleTime: 30 * 60,        // 30 minutes for longer sessions
  warningTime: 60,          // 1 minute warning
  autoLogoutTime: 60,       // 1 minute to respond
  refreshTokenTime: 15 * 60 // 15 minutes token refresh
};
```

### Different Configurations for User Types

```typescript
// In idle-manager.service.ts
private getConfigForUser(): IdleConfig {
  const userRole = this.authService.getCurrentUserRole(); // Implement this method
  
  if (userRole === 'admin') {
    return {
      idleTime: 30 * 60,      // 30 minutes for admins
      warningTime: 60,
      autoLogoutTime: 60,
      refreshTokenTime: 15 * 60
    };
  }
  
  return {
    idleTime: 15 * 60,        // 15 minutes for regular users
    warningTime: 30,
    autoLogoutTime: 30,
    refreshTokenTime: 5 * 60
  };
}
```

## Integration with Existing Services

### With HTTP Interceptors

Add this to your HTTP interceptor to reset idle timer on API calls:

```typescript
// In your auth.interceptor.ts
import { IdleManagerService } from '../services/idle-manager.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const idleManager = inject(IdleManagerService);
  
  // Reset idle timer on API calls
  idleManager.resetIdleTimer();
  
  // ... rest of your interceptor logic
};
```

### With Route Guards

```typescript
// In your auth.guard.ts
constructor(private idleManagerService: IdleManagerService) {}

canActivate(): boolean {
  const isAuthenticated = this.authService.isAuthenticated();
  
  if (isAuthenticated) {
    // Start idle service when accessing protected routes
    this.idleManagerService.startIdleService();
  }
  
  return isAuthenticated;
}
```

## Testing

### Manual Testing

1. **Start the application** and log in
2. **Wait for idle time** (20 minutes by default, or reduce for testing)
3. **Verify warning dialog** appears with countdown
4. **Test "Stay Logged In"** button functionality
5. **Test automatic logout** when countdown reaches zero
6. **Verify browser notifications** (if permissions granted)
7. **Test activity detection** by moving mouse or typing

### Reduce Timeout for Testing

Temporarily modify the config in `idle-manager.service.ts`:

```typescript
const config = {
  idleTime: 30,           // 30 seconds for testing
  warningTime: 10,        // 10 seconds warning
  autoLogoutTime: 10,     // 10 seconds to respond
  refreshTokenTime: 60    // 1 minute token refresh
};
```

### Console Testing

Open browser console and run:

```javascript
// Get the idle service
const idleService = window.ng.getComponent(document.querySelector('app-root')).idleManagerService;

// Start service
idleService.startIdleService();

// Stop service
idleService.stopIdleService();

// Reset timer
idleService.resetIdleTimer();
```

## Browser Compatibility

- **Chrome/Edge**: Full support including notifications
- **Firefox**: Full support including notifications
- **Safari**: Full support, notifications require user interaction
- **Mobile**: Touch events supported, notifications limited

## Performance Considerations

- Event listeners run outside Angular zone
- Activity detection is throttled to 1 event per second
- Timers are properly cleaned up to prevent memory leaks
- Service automatically stops on public routes

## Security Features

- Automatic logout on token expiration
- Session extension with token validation
- Secure token storage using sessionStorage
- Protection against multiple simultaneous logouts
- Prevention of repeated logout attempts and toast messages
- Coordinated cleanup between idle service and auth interceptor
- Route-aware service management (stops on public routes)

## Customization Options

### Dialog Styling

Modify `idle-dialog.component.css` to match your theme:

```css
.idle-dialog-container {
  /* Add your custom styles */
  border: 2px solid var(--primary-color);
}

.btn-primary {
  background: var(--primary-gradient);
}
```

### Custom Messages

Update messages in `idle-dialog.component.html`:

```html
<p class="idle-message">
  Your custom idle message here...
</p>
```

### Additional Event Types

Add more events to monitor in `idle.service.ts`:

```typescript
private activityEvents = [
  'mousedown', 'mousemove', 'keypress', 'scroll', 
  'touchstart', 'click', 'wheel', 'contextmenu'
];
```

## Troubleshooting

### Service Not Starting
- Check if user is authenticated
- Verify route is not in `publicRoutes` array
- Check browser console for errors

### Dialog Not Appearing
- Verify component is imported in app.component.ts
- Check if dialog is behind other elements (z-index)
- Ensure PrimeNG icons are loaded

### Repeated Toast Messages on Login Page
- **Fixed**: The service now prevents repeated logout attempts
- **Fixed**: Toast messages are suppressed when already on login page
- **Fixed**: Service properly stops when navigating to public routes
- **Fixed**: Auth interceptor coordinates with idle service to prevent conflicts

### Notifications Not Working
- Check browser notification permissions
- Verify HTTPS (required for notifications)
- Test in different browsers

### Performance Issues
- Reduce activity event types if needed
- Increase throttling delay
- Check for memory leaks in browser dev tools

### Session Issues
- If session appears to expire immediately, check token expiry logic
- Ensure auth service `isAuthenticated()` method works correctly
- Verify sessionStorage is not being cleared unexpectedly

## Best Practices

1. **Test thoroughly** with different user scenarios
2. **Monitor performance** impact on your application
3. **Customize timeouts** based on your security requirements
4. **Handle edge cases** like network interruptions
5. **Provide clear user feedback** about session status
6. **Consider accessibility** requirements
7. **Test on mobile devices** for touch interactions

## Next Steps

1. **Test the implementation** with different scenarios
2. **Customize styling** to match your application theme
3. **Add user role-based configurations** if needed
4. **Integrate with your analytics** to track idle events
5. **Add unit tests** for the service components
6. **Consider server-side session management** integration

The idle service is now fully implemented and ready for production use!
