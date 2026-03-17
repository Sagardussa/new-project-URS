import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, FormFieldOption } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';
import { MultiselectComponent } from '../../../multiselect/multiselect.component';

@Component({
  selector: 'app-multiselect-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
    MultiselectComponent,
  ],
  template: `
    <app-form-field-wrapper
      [label]="field.label"
      [fieldSlug]="field.slug"
      [required]="field.required"
      [description]="field.description || ''"
      [showError]="isInvalidAndTouched">
      <multiselect
        [options]="normalizeOptions()"
        [placeholder]="getPlaceholder()"
        [formControl]="control"
        [required]="field.required"
        class="w-full">
      </multiselect>

      <ng-container error-messages>
        <span>This field is required</span>
      </ng-container>
    </app-form-field-wrapper>
  `,
})
export class MultiselectFieldComponent {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;

  get isInvalidAndTouched(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  getPlaceholder(): string {
    if (this.field?.placeholder) {
      const placeholder = String(this.field.placeholder).trim();
      if (placeholder && placeholder !== 'undefined' && placeholder !== 'null') {
        return placeholder;
      }
    }
    return 'Select options...';
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
