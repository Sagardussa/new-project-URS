import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-field-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col">
      <label
        *ngIf="label"
        [for]="fieldSlug"
        class="text-gray-800 text-xs md:text-sm pb-1 font-medium">
        {{ label }}
        <span *ngIf="required" class="text-red-600 font-bold">*</span>
      </label>
      <p *ngIf="description" class="text-xs text-gray-500 pb-1">
        {{ description }}
      </p>

      <!-- Field input content goes here -->
      <ng-content></ng-content>

      <!-- Error messages -->
      <div *ngIf="showError" class="text-red-600 text-xs mt-1">
        <ng-content select="[error-messages]"></ng-content>
      </div>
    </div>
  `,
})
export class FormFieldWrapperComponent {
  @Input() label: string = '';
  @Input() fieldSlug: string = '';
  @Input() required: boolean = false;
  @Input() description: string = '';
  @Input() showError: boolean = false;
}
