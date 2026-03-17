import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiselectComponent } from '../multiselect/multiselect.component';

@Component({
  selector: 'app-email-selection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiselectComponent],
  template: `
    <div class="email-dialog-container">
      <div class="email-dialog-header">
        <h3 class="email-dialog-title">{{ dialogTitle }}</h3>
        <button 
          type="button" 
          class="close-button" 
          (click)="onCancel()"
          aria-label="Close dialog"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="email-dialog-body">
        <div class="email-dialog-content">
          <label class="email-label">
            Custom Email Recipients
          </label>
          
          <multiselect
            [(ngModel)]="selectedEmails"
            [options]="emailOptions"
            placeholder="Select or type email addresses..."
            [allowCustomText]="true"
            customTextPlaceholder="Type email address and press Enter..."
            [maxSelections]="5"
            [showChips]="true"
            [required]="false"
            (selectionChange)="onEmailChange($event)"
            (customTextAdded)="onCustomEmailAdded($event)"
          >
          </multiselect>
          
          <div *ngIf="errorMessage" class="error-message">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </div>
      </div>
      
      <div class="email-dialog-footer">
        <button 
          type="button" 
          class="cancel-button" 
          (click)="onCancel()"
        >
          Cancel
        </button>
        <button 
          type="button" 
          class="export-button" 
          (click)="onExport()"
          [disabled]="!isValid"
        >
          Export
        </button>
      </div>
    </div>
  `,
  styles: [`
    .email-dialog-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 540px;
      max-width: 90vw;
      font-family: 'Poppins', sans-serif;
      overflow: hidden;
    }

    .email-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      border-bottom: 1px solid #E5E7EB;
    }

    .email-dialog-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #192537;
      font-family: 'Poppins', sans-serif;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #7B7B7B;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
      border-radius: 4px;
    }

    .close-button:hover {
      color: #192537;
      background-color: #F5F5F5;
    }

    .email-dialog-body {
      padding: 32px;
    }

    .email-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .email-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 15px;
      font-weight: 600;
      color: #192537;
      font-family: 'Poppins', sans-serif;
    }

    .email-hint {
      font-size: 13px;
      font-weight: 400;
      color: #7B7B7B;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 8px 12px;
      background-color: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 6px;
      color: #DC2626;
      font-size: 12px;
      font-weight: 500;
      font-family: 'Poppins', sans-serif;
    }

    .error-message svg {
      flex-shrink: 0;
    }

    .email-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 24px 32px;
      border-top: 1px solid #E5E7EB;
      background-color: #FAFBFC;
    }

    .cancel-button,
    .export-button {
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 500;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .cancel-button {
      background-color: #F5F5F5;
      color: #7B7B7B;
      border: 1px solid #E5E7EB;
    }

    .cancel-button:hover {
      background-color: #E5E7EB;
      color: #192537;
    }

    .export-button {
      background: linear-gradient(to right, #00254A, #083F77);
      color: white;
      box-shadow: 0 2px 4px rgba(0, 37, 74, 0.15);
    }

    .export-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 37, 74, 0.25);
    }

    .export-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class EmailSelectionDialogComponent implements OnInit {
  @Input() dialogTitle: string = 'Export Data';
  @Output() emailConfirm = new EventEmitter<string[]>();
  @Output() emailCancel = new EventEmitter<void>();

  selectedEmails: string[] = [];
  emailOptions: string[] = [];
  errorMessage: string = '';
  isValid: boolean = false;

  ngOnInit(): void {
    // Initialize with empty options - users will add custom emails
    this.emailOptions = [];
  }

  validateEmail(email: string): boolean {
    if (!email?.trim()) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  onEmailChange(emails: string[]): void {
    // Filter out invalid emails immediately
    const validEmails = (emails ?? []).filter(email => this.validateEmail(email));
    const totalEmails = (emails ?? []).length;
    const allEmailsValid = validEmails.length === totalEmails;
    
    this.selectedEmails = validEmails;
    
    // If some emails were filtered out, show error message
    if (!allEmailsValid) {
      this.errorMessage = 'Invalid email addresses have been removed';
      setTimeout(() => {
        this.errorMessage = '';
      }, 2500);
    }
    
    this.validateEmails();
  }

  onCustomEmailAdded(email: string): void {
    // Validate the custom email before allowing it to be added
    if (!this.validateEmail(email)) {
      this.errorMessage = 'Please enter a valid email address';
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
      // Remove the invalid email from selection
      this.selectedEmails = this.selectedEmails.filter(e => e !== email);
      return;
    }
    
    // Check if email already exists
    if (this.selectedEmails.includes(email)) {
      this.errorMessage = 'This email is already added';
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
      return;
    }
    
    // Validate all emails after custom email is added
    setTimeout(() => {
      this.validateEmails();
    }, 0);
  }

  validateEmails(): void {
    // First, filter out any invalid emails that might have slipped through
    const validEmails = this.selectedEmails.filter(email => this.validateEmail(email));
    
    // Update selectedEmails to only include valid ones
    if (validEmails.length !== this.selectedEmails.length) {
      this.selectedEmails = validEmails;
    }
    
    if (this.selectedEmails.length === 0) {
      this.isValid = false;
      return;
    }

    if (this.selectedEmails.length > 5) {
      // Keep only first 5 valid emails
      this.selectedEmails = this.selectedEmails.slice(0, 5);
      this.errorMessage = 'Maximum 5 email addresses allowed. Only the first 5 valid emails are kept.';
      this.isValid = false;
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
      return;
    }

    // All emails are valid and within limit
    this.errorMessage = '';
    this.isValid = true;
  }

  onExport(): void {
    // Final validation - ensure only valid emails are exported
    const validEmails = this.selectedEmails
      .filter(email => this.validateEmail(email))
      .slice(0, 5); // Ensure max 5
    
    if (validEmails.length > 0) {
      this.emailConfirm.emit(validEmails);
    } else {
      this.errorMessage = 'Please enter at least one valid email address';
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
    }
  }

  onCancel(): void {
    this.emailCancel.emit();
  }
}
