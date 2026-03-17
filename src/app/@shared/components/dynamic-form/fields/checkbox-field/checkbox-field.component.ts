import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, FormFieldOption } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-checkbox-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldWrapperComponent],
  template: `
    <app-form-field-wrapper
      [label]="field.label"
      [fieldSlug]="field.slug"
      [required]="field.required"
      [description]="field.description || ''"
      [showError]="isInvalidAndTouched">
      <!-- Multiple checkboxes when options exist -->
      <div
        *ngIf="field.options && field.options.length > 0"
        [ngClass]="getOptionLayoutClass()">
        <div
          *ngFor="let option of normalizeOptions()"
          class="flex items-center space-x-2">
          <input
            type="checkbox"
            [id]="field.slug + '-' + option.value"
            [value]="option.value"
            [checked]="isCheckboxSelected(option.value.toString())"
            (change)="onCheckboxChange($event, option.value.toString())"
            [attr.disabled]="control.disabled ? true : null"
            [ngClass]="{
              'cursor-not-allowed opacity-60': control.disabled,
              'cursor-pointer': !control.disabled
            }"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label
            [for]="field.slug + '-' + option.value"
            class="text-gray-700 text-xs md:text-sm cursor-pointer">
            {{ option.label }}
          </label>
        </div>
      </div>

      <!-- Single checkbox when no options -->
      <div
        *ngIf="!field.options || field.options.length === 0"
        class="flex items-center space-x-2">
        <!-- Toggle Switch Style (default) -->
        <label
          *ngIf="shouldUseToggleStyle()"
          class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            [id]="field.slug"
            [formControl]="control"
            [disabled]="disabled"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"
               [ngClass]="{
                 'opacity-60 cursor-not-allowed': disabled
               }"></div>
        </label>
        <!-- Regular Checkbox Style (when toggleStyle is explicitly false) -->
        <input
          *ngIf="!shouldUseToggleStyle()"
          type="checkbox"
          [id]="field.slug"
          [formControl]="control"
          [ngClass]="{
            'cursor-not-allowed opacity-60': control.disabled,
            'cursor-pointer': !control.disabled
          }"
          class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
      </div>

      <ng-container error-messages>
        <span>This field is required</span>
      </ng-container>
    </app-form-field-wrapper>
  `,
})
export class CheckboxFieldComponent {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;

  @Output() checkboxChanged = new EventEmitter<{
    fieldSlug: string;
    optionValue: string;
    checked: boolean;
  }>();

  get isInvalidAndTouched(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  shouldUseToggleStyle(): boolean {
    // Only apply toggle style for single checkbox (no options)
    // If options exist, always use regular checkbox style
    if (this.field.options && this.field.options.length > 0) {
      return false;
    }
    // For single checkbox, default to toggle style unless explicitly set to false
    return this.field.toggleStyle !== false;
  }

  getOptionLayoutClass(): string {
    const layout = this.field.optionLayout || 'vertical';
    return layout === 'horizontal'
      ? 'flex flex-wrap items-center gap-4'
      : 'space-y-2';
  }

  isCheckboxSelected(optionValue: string): boolean {
    const value = this.control.value;
    return Array.isArray(value) ? value.includes(optionValue) : value === optionValue;
  }

  onCheckboxChange(event: any, optionValue: string): void {
    const allowMultiple = this.field.allowMultipleSelection !== false;
    const isChecked = event.target.checked;
    let currentValue = this.control.value || [];

    if (!Array.isArray(currentValue)) {
      currentValue = currentValue ? [currentValue] : [];
    }

    if (isChecked) {
      if (allowMultiple) {
        if (!currentValue.includes(optionValue)) {
          this.control.setValue([...currentValue, optionValue]);
        }
      } else {
        this.control.setValue([optionValue]);
      }
    } else {
      this.control.setValue(
        currentValue.filter((v: string) => v !== optionValue)
      );
    }

    this.checkboxChanged.emit({
      fieldSlug: this.field.slug,
      optionValue,
      checked: isChecked,
    });
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
