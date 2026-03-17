import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, FormFieldOption } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-radio-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldWrapperComponent],
  template: `
    <app-form-field-wrapper
      [label]="field.label"
      [fieldSlug]="field.slug"
      [required]="field.required"
      [description]="field.description || ''"
      [showError]="isInvalidAndTouched">
      <div
        *ngIf="field.options && field.options.length > 0"
        [ngClass]="getOptionLayoutClass()">
        <div
          *ngFor="let option of normalizeOptions()"
          class="flex items-center space-x-2">
          <input
            type="radio"
            [name]="field.slug"
            [id]="field.slug + '-' + option.value"
            [value]="option.value"
            [formControl]="control"
            [ngClass]="{
              'cursor-not-allowed opacity-60': disabled,
              'cursor-pointer': !disabled
            }"
            class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
          <label
            [for]="field.slug + '-' + option.value"
            class="text-gray-700 text-xs md:text-sm cursor-pointer">
            {{ option.label }}
          </label>
        </div>
      </div>

      <ng-container error-messages>
        <span>This field is required</span>
      </ng-container>
    </app-form-field-wrapper>
  `,
})
export class RadioFieldComponent {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;

  get isInvalidAndTouched(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  getOptionLayoutClass(): string {
    const layout = this.field.optionLayout || 'horizontal';
    return layout === 'horizontal'
      ? 'flex flex-wrap items-center gap-4'
      : 'space-y-2';
  }

  normalizeOptions(): FormFieldOption[] {
    if (!this.field.options || !Array.isArray(this.field.options)) return [];

    return this.field.options.map((opt: any) => {
      if (
        typeof opt === 'object' &&
        opt.hasOwnProperty('label') &&
        opt.hasOwnProperty('value')
      ) {
        return opt;
      }
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return {
        label: opt.display || opt.label || opt.value || '',
        value: opt.value || opt.display || opt.label || '',
      };
    });
  }
}
