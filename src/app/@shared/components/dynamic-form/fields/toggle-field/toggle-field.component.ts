import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-toggle-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldWrapperComponent],
  template: `
    <app-form-field-wrapper
      [label]="field.label"
      [fieldSlug]="field.slug"
      [required]="field.required"
      [description]="field.description || ''"
      [showError]="isInvalidAndTouched">
      <div class="flex items-center space-x-3">
        <label
          [for]="field.slug"
          class="relative inline-flex items-center"
          [ngClass]="{
            'cursor-pointer': !control.disabled,
            'cursor-not-allowed': control.disabled
          }">
          <input
            type="checkbox"
            [id]="field.slug"
            [formControl]="control"
            class="sr-only peer"
            (change)="onToggleChange($event)"
          />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
            [ngClass]="{
              'opacity-50': control.disabled
            }">
          </div>
        </label>
        <span
          class="text-sm font-medium"
          [ngClass]="{
            'text-gray-700': !control.disabled,
            'text-gray-400': control.disabled
          }">
          {{ control.value ? 'Enabled' : 'Disabled' }}
        </span>
      </div>

      <ng-container error-messages>
        <span>This field is required</span>
      </ng-container>
    </app-form-field-wrapper>
  `
})
export class ToggleFieldComponent {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;

  get isInvalidAndTouched(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  onToggleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    this.control.setValue(checked);
    this.control.markAsTouched();
  }
}

