import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LoaderConfig {
  minDisplayTime?: number;
  hideDelay?: number;
  showSpinner?: boolean;
  showProgress?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly messageSubject = new BehaviorSubject<string>('Loading...');
  private readonly progressSubject = new BehaviorSubject<number>(0);
  private apiCount = 0;
  private showTime = 0;
  private hideTimeout: any;
  
  // Configuration options
  private config: LoaderConfig = {
    minDisplayTime: 200, // Minimum time to show spinner (ms)
    hideDelay: 100,      // Delay before hiding spinner (ms)
    showSpinner: true,
    showProgress: false,
    message: 'Loading...'
  };
  
  loading$ = this.loadingSubject.asObservable();
  message$ = this.messageSubject.asObservable();
  progress$ = this.progressSubject.asObservable();

  show(message?: string) {
    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.apiCount === 0) {
      this.showTime = Date.now();
      this.loadingSubject.next(true);
      if (message) {
        this.messageSubject.next(message);
      }
      this.progressSubject.next(0);
    }
    this.apiCount++;
  }

  hide() {
    this.apiCount--;
    if (this.apiCount === 0) {
      const elapsedTime = Date.now() - this.showTime;
      const remainingMinTime = Math.max(0, (this.config.minDisplayTime || 200) - elapsedTime);
      
      // Ensure minimum display time + hide delay
      const totalDelay = remainingMinTime + (this.config.hideDelay || 100);
      
      this.hideTimeout = setTimeout(() => {
        this.loadingSubject.next(false);
        this.messageSubject.next('Loading...');
        this.progressSubject.next(0);
        this.hideTimeout = null;
      }, totalDelay);
    }
  }

  updateProgress(progress: number) {
    this.progressSubject.next(Math.min(100, Math.max(0, progress)));
  }

  updateMessage(message: string) {
    this.messageSubject.next(message);
  }

  // Method to configure timing and behavior
  configure(options: LoaderConfig) {
    this.config = { ...this.config, ...options };
  }

  // Force hide loader (useful for error scenarios)
  forceHide() {
    this.apiCount = 0;
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.loadingSubject.next(false);
    this.messageSubject.next('Loading...');
    this.progressSubject.next(0);
  }

  // Get current configuration
  getConfig(): LoaderConfig {
    return { ...this.config };
  }
}
