import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, timer, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { AlertService } from './alert.service';

export interface IdleConfig {
  idleTime: number; // Time in seconds before user is considered idle
  warningTime: number; // Time in seconds before session expires to show warning
  autoLogoutTime: number; // Time in seconds after warning to auto logout
  refreshTokenTime: number; // Time in seconds before session expires to refresh token
}

export interface IdleState {
  isIdle: boolean;
  isWarning: boolean;
  timeRemaining: number;
  totalWarningTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class IdleService {
  private config: IdleConfig = {
    idleTime: 15 * 60, // 15 minutes
    warningTime: 30, // 30 seconds warning
    autoLogoutTime: 30, // 30 seconds to auto logout
    refreshTokenTime: 5 * 60 // 5 minutes before expiry
  };

  private readonly idleState$ = new BehaviorSubject<IdleState>({
    isIdle: false,
    isWarning: false,
    timeRemaining: 0,
    totalWarningTime: 0
  });

  private readonly activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  private idleTimer?: Subscription;
  private warningTimer?: Subscription;
  private refreshTimer?: Subscription;
  private lastActivity = Date.now();
  private isInitialized = false;
  private attentionInterval?: any;
  private originalTitle = '';
  private hasLoggedOut = false; // Flag to prevent repeated logout attempts
  
  // Store bound event handlers to properly remove them
  private readonly activityHandlers: Map<string, EventListener> = new Map();
  
  // Debounce timer for activity detection
  private activityDebounceTimer?: any;
  private readonly ACTIVITY_DEBOUNCE_MS = 1000; // 1 second debounce
  
  // Flag to prevent multiple simultaneous resets
  private isResetting = false;

  constructor(
    private readonly ngZone: NgZone,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly alertService: AlertService
  ) {}

  /**
   * Initialize the idle service with custom configuration
   */
  initialize(config?: Partial<IdleConfig>): void {
    // Reset logout flag before initializing
    this.hasLoggedOut = false;
    
    // If already initialized, update config if provided and reset timer without stopping
    // This prevents race conditions and maintains continuous monitoring
    if (this.isInitialized) {
      if (config) {
        // Update config if provided
        this.config = { ...this.config, ...config };
      }
      // Reset timer to give user a fresh start without stopping listeners
      this.resetIdleTimer();
      return;
    }

    // First-time initialization
    this.config = { ...this.config, ...config };
    this.setupActivityListeners();
    this.startIdleTimer();
    this.setupTokenRefresh();
    this.requestNotificationPermission();
    this.isInitialized = true;
  }

  /**
   * Get the current idle state as an observable
   */
  getIdleState(): Observable<IdleState> {
    return this.idleState$.asObservable();
  }

  /**
   * Reset the idle timer and clear warning state
   * Uses debouncing to prevent excessive resets
   */
  resetIdleTimer(): void {
    // Don't reset if we've already logged out
    if (this.hasLoggedOut) {
      return;
    }
    
    // Prevent multiple simultaneous resets
    if (this.isResetting) {
      return;
    }
    
    // Clear any pending debounce timer
    if (this.activityDebounceTimer) {
      clearTimeout(this.activityDebounceTimer);
      this.activityDebounceTimer = undefined;
    }
    
    // Debounce the reset to prevent excessive timer restarts
    this.activityDebounceTimer = setTimeout(() => {
      this.performReset();
    }, this.ACTIVITY_DEBOUNCE_MS);
  }

  /**
   * Perform the actual reset operation
   */
  private performReset(): void {
    if (this.isResetting || this.hasLoggedOut) {
      return;
    }
    
    this.isResetting = true;
    
    try {
      this.lastActivity = Date.now();
      this.clearTimers();
      this.stopAttentionGrabbers();
      
      // Immediately clear warning state if active
      const currentState = this.idleState$.value;
      if (currentState.isWarning) {
        this.idleState$.next({
          isIdle: false,
          isWarning: false,
          timeRemaining: 0,
          totalWarningTime: 0
        });
      }
      
      this.startIdleTimer();
    } finally {
      this.isResetting = false;
    }
  }

  /**
   * Extend the session by refreshing the token
   */
  extendSession(): Observable<boolean> {
    return new Observable(observer => {
      // For now, we'll just reset the timer
      // In a real implementation, you'd call a refresh token API
      try {
        this.performReset();
        this.alertService.showSuccessToast('Session extended successfully');
        observer.next(true);
        observer.complete();
      } catch (error) {
        console.error('Failed to extend session:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  /**
   * Force logout and clean up
   */
  forceLogout(): void {
    // Prevent multiple logout attempts
    if (this.hasLoggedOut) {
      return;
    }
    
    this.hasLoggedOut = true;
    this.clearTokens();
    this.stop();
    
    // Only show toast if not already on login page
    const currentUrl = this.router.url;
    if (currentUrl.includes('/auth/login')) {
      // Already on login page, just reset the flag
      setTimeout(() => {
        this.hasLoggedOut = false;
      }, 100);
    } else {
      this.alertService.showErrorToast('Session expired due to inactivity');
      // Navigate to login page
      this.router.navigate(['/auth/login']).then(() => {
        // Reset logout flag after navigation to allow re-login
        setTimeout(() => {
          this.hasLoggedOut = false;
        }, 500);
      });
    }
  }

  /**
   * Stop monitoring and clean up resources
   */
  stop(): void {
    // Clear debounce timer
    if (this.activityDebounceTimer) {
      clearTimeout(this.activityDebounceTimer);
      this.activityDebounceTimer = undefined;
    }
    
    this.clearTimers();
    this.removeActivityListeners();
    this.stopAttentionGrabbers();
    this.isInitialized = false;
    this.isResetting = false;
    // Don't reset hasLoggedOut here - let forceLogout handle it
    this.idleState$.next({
      isIdle: false,
      isWarning: false,
      timeRemaining: 0,
      totalWarningTime: 0
    });
  }

  /**
   * Reset logout flag - call this when user successfully logs in
   */
  resetLogoutFlag(): void {
    this.hasLoggedOut = false;
  }

  /**
   * Manual reset for external triggers
   */
  manualReset(): void {
    this.resetIdleTimer();
  }

  /**
   * Check if service is running
   */
  isRunning(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): IdleConfig {
    return { ...this.config };
  }

  // Private methods
  private setupActivityListeners(): void {
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach(event => {
        // Create and store bound event handler
        const handler = (e: Event) => this.onActivity(e);
        this.activityHandlers.set(event, handler);
        document.addEventListener(event, handler, { passive: true, capture: true });
      });
    });
  }

  private removeActivityListeners(): void {
    this.activityHandlers.forEach((handler, event) => {
      document.removeEventListener(event, handler, { capture: true });
    });
    this.activityHandlers.clear();
  }

  private onActivity(event: Event): void {
    // Ignore events from the idle dialog itself to prevent feedback loops
    const target = event.target;
    if (target && target instanceof HTMLElement && target.closest('.idle-dialog-container')) {
      return;
    }
    
    const now = Date.now();
    // Only process if enough time has passed since last activity
    if (now - this.lastActivity >= this.ACTIVITY_DEBOUNCE_MS) {
      this.ngZone.run(() => {
        this.resetIdleTimer();
      });
    }
  }

  private startIdleTimer(): void {
    // Clear any existing timer first
    if (this.idleTimer) {
      this.idleTimer.unsubscribe();
    }
    
    this.idleTimer = timer(this.config.idleTime * 1000).subscribe(() => {
      // Only start warning if not already in warning state and not logged out
      if (!this.hasLoggedOut && !this.idleState$.value.isWarning) {
        this.startWarningTimer();
      }
    });
  }

  private startWarningTimer(): void {
    // Clear any existing warning timer
    if (this.warningTimer) {
      this.warningTimer.unsubscribe();
    }
    
    this.idleState$.next({
      isIdle: true,
      isWarning: true,
      timeRemaining: this.config.autoLogoutTime,
      totalWarningTime: this.config.autoLogoutTime
    });

    // Start attention-grabbing features
    this.startAttentionGrabbers();

    this.warningTimer = timer(0, 1000).subscribe(() => {
      // Check if we should still be in warning state
      if (this.hasLoggedOut || !this.isInitialized) {
        this.clearTimers();
        return;
      }
      
      const currentState = this.idleState$.value;
      const newTimeRemaining = currentState.timeRemaining - 1;

      if (newTimeRemaining <= 0) {
        this.stopAttentionGrabbers();
        this.forceLogout();
      } else {
        this.idleState$.next({
          ...currentState,
          timeRemaining: newTimeRemaining
        });
      }
    });
  }

  private setupTokenRefresh(): void {
    // Clear any existing refresh timer
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
    }
    
    // Check token expiry periodically and refresh if needed
    this.refreshTimer = timer(this.config.refreshTokenTime * 1000, this.config.refreshTokenTime * 1000)
      .subscribe(() => {
        if (!this.isInitialized || this.hasLoggedOut) {
          return;
        }
        
        if (this.authService.isAuthenticated()) {
          // Token is still valid, continue monitoring
        } else {
          // Token expired, force logout
          this.forceLogout();
        }
      });
  }

  private clearTimers(): void {
    if (this.idleTimer) {
      this.idleTimer.unsubscribe();
      this.idleTimer = undefined;
    }
    if (this.warningTimer) {
      this.warningTimer.unsubscribe();
      this.warningTimer = undefined;
    }
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
      this.refreshTimer = undefined;
    }
  }

  private startAttentionGrabbers(): void {
    // Store original title
    this.originalTitle = document.title;

    // Blinking title
    let isOriginalTitle = true;
    this.attentionInterval = setInterval(() => {
      if (!this.isInitialized || this.hasLoggedOut) {
        this.stopAttentionGrabbers();
        return;
      }
      document.title = isOriginalTitle ? '⚠️ Session Expiring!' : this.originalTitle;
      isOriginalTitle = !isOriginalTitle;
    }, 1000);

    // Browser notification
    this.showNotification();
  }

  private stopAttentionGrabbers(): void {
    // Restore original title
    if (this.originalTitle) {
      document.title = this.originalTitle;
    }

    // Clear blinking interval
    if (this.attentionInterval) {
      clearInterval(this.attentionInterval);
      this.attentionInterval = undefined;
    }
  }

  private requestNotificationPermission(): void {
    if ('Notification' in globalThis && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private showNotification(): void {
    if ('Notification' in globalThis && Notification.permission === 'granted') {
      try {
        const notification = new Notification('Session Timeout Warning', {
          body: 'Your session is about to expire. Click to stay logged in.',
          icon: '/favicon.ico',
          requireInteraction: true
        });

        notification.onclick = () => {
          globalThis.focus();
          notification.close();
        };
        
        // Auto-close notification after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      } catch (error) {
        console.warn('Failed to show notification:', error);
      }
    }
  }

  private clearTokens(): void {
    this.authService.removeTokens();
  }
}
