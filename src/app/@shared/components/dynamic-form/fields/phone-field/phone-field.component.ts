import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';
import { IntlPhoneInputComponent } from '../../../intl-phone-input/intl-phone-input.component';

@Component({
  selector: 'app-phone-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
    IntlPhoneInputComponent,
  ],
  template: `
    <app-form-field-wrapper
      [label]="field.label"
      [fieldSlug]="field.slug"
      [required]="field.required"
      [description]="field.description || ''"
      [showError]="isInvalidAndTouched">
      <intl-phone-input
        [formControl]="control"
        [required]="field.required"
        [placeholder]="getPlaceholder()"
        [preferredCountries]="['IN', 'US', 'GB', 'CA', 'AU']"
        [separateDialCode]="true"
        [enableIPDetection]="false"
        [defaultCountry]="defaultCountry"
        (dialCodeChange)="onDialCodeChange($event)"
        (separatePhoneChange)="onSeparatePhoneChange($event)"
        (countryChange)="onCountryChange($event)">
      </intl-phone-input>

      <ng-container error-messages>
        <span *ngIf="control.hasError('required')">This field is required</span>
      </ng-container>
    </app-form-field-wrapper>
  `,
})
export class PhoneFieldComponent {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;
  @Input() defaultCountry: string = 'IN';

  @Output() dialCodeChanged = new EventEmitter<{
    fieldSlug: string;
    dialCode: string;
  }>();
  @Output() separatePhoneChanged = new EventEmitter<{
    fieldSlug: string;
    phoneData: { dialCode: string; phoneNumber: string };
  }>();
  @Output() countryChanged = new EventEmitter<{
    fieldSlug: string;
    country: any;
  }>();

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
    return 'Enter phone number';
  }

  onDialCodeChange(dialCode: string): void {
    this.dialCodeChanged.emit({ fieldSlug: this.field.slug, dialCode });
  }

  onSeparatePhoneChange(phoneData: {
    dialCode: string;
    phoneNumber: string;
  }): void {
    this.separatePhoneChanged.emit({ fieldSlug: this.field.slug, phoneData });
  }

  onCountryChange(country: any): void {
    this.countryChanged.emit({ fieldSlug: this.field.slug, country });
  }
}
