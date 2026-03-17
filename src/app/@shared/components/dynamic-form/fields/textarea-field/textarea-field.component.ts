import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldWrapperComponent],
  template: `
    <app-form-field-wrapper
      [label]="field.label"
      [fieldSlug]="field.slug"
      [required]="field.required"
      [description]="field.description || ''"
      [showError]="isInvalidAndTouched">
      <textarea
        [id]="field.slug"
        [formControl]="control"
        [placeholder]="getPlaceholder()"
        [rows]="field.rows || 4"
        [ngClass]="{
          'bg-gray-100 cursor-not-allowed': control.disabled,
          'border-red-500': isInvalidAndTouched
        }"
        class="p-2.5 border border-gray-300 rounded-lg placeholder:text-gray-400 placeholder:text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-y">
      </textarea>

      <ng-container error-messages>
        <span *ngIf="control.hasError('required')">This field is required</span>
        <span *ngIf="control.hasError('pattern')">
          {{ field.validation?.message || 'Invalid format' }}
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
export class TextareaFieldComponent {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;

  get isInvalidAndTouched(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  getPlaceholder(): string {
    if (!this.field?.placeholder) return '';
    const placeholder = String(this.field.placeholder).trim();
    return placeholder && placeholder !== 'undefined' && placeholder !== 'null'
      ? placeholder
      : '';
  }
}
