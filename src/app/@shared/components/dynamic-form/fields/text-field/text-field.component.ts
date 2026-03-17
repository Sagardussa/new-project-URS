import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldWrapperComponent],
  template: `
    <app-form-field-wrapper
      [label]="field.label"
      [fieldSlug]="field.slug"
      [required]="field.required"
      [description]="field.description || ''"
      [showError]="isInvalidAndTouched">
      <div class="relative">
        <input
          [type]="getInputType()"
          [id]="field.slug"
          [ngClass]="{
            'no-spinner': getInputType() === 'number',
            'bg-gray-100 cursor-not-allowed': control.disabled,
            'border-red-500': isInvalidAndTouched,
            'pr-10': field.inputType === 'password'
          }"
          [formControl]="control"
          [placeholder]="getPlaceholder()"
          class="p-2.5 border border-gray-300 rounded-lg placeholder:text-gray-400 placeholder:text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all w-full"
        />
        
        <!-- Password visibility toggle button -->
        <button
          *ngIf="field.inputType === 'password'"
          type="button"
          (click)="togglePasswordVisibility()"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
          [attr.aria-label]="passwordVisible ? 'Hide password' : 'Show password'">
          <!-- Eye icon for show password -->
          <svg
            *ngIf="!passwordVisible"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z">
            </path>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z">
            </path>
          </svg>
          
          <!-- Lock icon for hide password -->
          <svg
            *ngIf="passwordVisible"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
            </path>
          </svg>
        </button>
      </div>

      <ng-container error-messages>
        <span *ngIf="control.hasError('required')">This field is required</span>
        <span *ngIf="control.hasError('email')">Please enter a valid email address</span>
        <span *ngIf="control.hasError('pattern') && field.inputType === 'url'">
          Please enter a valid URL
        </span>
        <span *ngIf="control.hasError('pattern') && field.inputType !== 'url' && field.inputType !== 'email'">
          {{ field.validation?.message || 'Invalid format' }}
        </span>
        <span *ngIf="control.hasError('min')">
          Minimum value is {{ field.validation?.min }}
        </span>
        <span *ngIf="control.hasError('max')">
          Maximum value is {{ field.validation?.max }}
        </span>
        <span *ngIf="control.hasError('minlength')">
          Minimum length is {{ field.validation?.minLength }} characters
        </span>
        <span *ngIf="control.hasError('maxlength')">
          Maximum length is {{ field.validation?.maxLength }} characters
        </span>
      </ng-container>
    </app-form-field-wrapper>
  `,
})
export class TextFieldComponent {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;

  passwordVisible: boolean = false;

  get isInvalidAndTouched(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  getInputType(): string {
    const inputType = this.field.inputType || 'text';

    // Handle password visibility toggle
    if (inputType === 'password') {
      return this.passwordVisible ? 'text' : 'password';
    }

    // Check if regex requires text input even for number type
    if (this.field.validation?.regex && inputType === 'number') {
      const regexPattern = this.field.validation.regex;
      if (/\[A-Z\]|\[a-z\]|\[A-Za-z\]|\\w/.test(regexPattern)) {
        return 'text';
      }
    }

    const typeMap: Record<string, string> = {
      text: 'text',
      email: 'email',
      url: 'url',
      number: 'number',
      date: 'date',
      datetime: 'date',
      address: 'text',
      password: 'password',
    };

    return typeMap[inputType] || 'text';
  }

  getPlaceholder(): string {
    if (!this.field?.placeholder) return '';
    const placeholder = String(this.field.placeholder).trim();
    return placeholder && placeholder !== 'undefined' && placeholder !== 'null'
      ? placeholder
      : '';
  }
}
