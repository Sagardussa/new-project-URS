import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { IdleService, IdleState } from '@core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-idle-dialog',
  templateUrl: './idle-dialog.component.html',
  styleUrls: ['./idle-dialog.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class IdleDialogComponent implements OnInit, OnDestroy {
  @Output() stayLoggedIn = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  showDialog = false;
  idleState: IdleState = {
    isIdle: false,
    isWarning: false,
    timeRemaining: 0,
    totalWarningTime: 0
  };

  progressPercentage = 100;
  isExtending = false;
  private subscription?: Subscription;

  constructor(private idleService: IdleService) {}

  ngOnInit(): void {
    this.subscription = this.idleService.getIdleState().subscribe(state => {
      this.idleState = state;
      this.showDialog = state.isWarning;
      this.updateProgress();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onStayLoggedIn(): void {
    if (this.isExtending) {
      return; // Prevent double-clicks
    }
    
    this.isExtending = true;
    this.idleService.extendSession().subscribe({
      next: (success) => {
        this.isExtending = false;
        if (success) {
          this.idleService.manualReset();
          this.stayLoggedIn.emit();
        } else {
          this.onLogout();
        }
      },
      error: () => {
        this.isExtending = false;
        this.onLogout();
      }
    });
  }

  onLogout(): void {
    this.idleService.forceLogout();
    this.logout.emit();
  }

  private updateProgress(): void {
    if (this.idleState.totalWarningTime > 0) {
      this.progressPercentage = (this.idleState.timeRemaining / this.idleState.totalWarningTime) * 100;
    }
  }

  getTimeDisplay(): string {
    const minutes = Math.floor(this.idleState.timeRemaining / 60);
    const seconds = this.idleState.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getProgressColor(): string {
    if (this.progressPercentage > 60) return '#10b981'; // Green
    if (this.progressPercentage > 30) return '#f59e0b'; // Yellow
    return '#dc2626'; // Red
  }
}
