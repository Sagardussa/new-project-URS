import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

// Import types
import {
  FormField,
  FormFieldOption,
  DynamicFormSubmitResult,
} from './dynamic-form.types';

// Import field components
import {
  TextFieldComponent,
  TextareaFieldComponent,
  DropdownFieldComponent,
  RadioFieldComponent,
  CheckboxFieldComponent,
  FileFieldComponent,
  PhoneFieldComponent,
  MultiselectFieldComponent,
} from './fields';

// Re-export types for backward compatibility
export type { FormField, FormFieldOption, FormFieldValidation, DynamicFormSubmitResult } from './dynamic-form.types';

/**
 * DynamicFormComponent
 * ─────────────────────────────────────────────────────────────────────────────
 * A globally reusable, layout-configurable form renderer.
 *
 * ## Layout control
 * | Input          | Type          | Description                               |
 * |----------------|---------------|-------------------------------------------|
 * | columnsCount   | 1 | 2 | 3    | Grid columns for field layout             |
 * | field.colSpan  | 1 | 2 |'full'| How many columns a specific field spans   |
 * | field.inline   | boolean       | Render radio/checkbox options horizontally|
 * | field.rows     | number        | Textarea rows (default 4)                 |
 * | field.helperText| string       | Small helper text below the field         |
 *
 * ## Usage example
 * ```html
 * <app-dynamic-form
 *   [sectionName]="'Program Details'"
 *   [sectionFields]="fields"
 *   [columnsCount]="2"
 *   [showResetButton]="true"
 *   submitButtonText="Save Program"
 *   (formSubmitted)="handleSubmit($event)">
 * </app-dynamic-form>
 * ```
 */
@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  templateUrl: './dynamic-form.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    TextFieldComponent,
    TextareaFieldComponent,
    DropdownFieldComponent,
    RadioFieldComponent,
    CheckboxFieldComponent,
    FileFieldComponent,
    PhoneFieldComponent,
    MultiselectFieldComponent,
  ],
  styleUrls: ['./dynamic-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormComponent implements OnInit, OnChanges {
  // ─── Layout ─────────────────────────────────────────────────────────────────
  /** Number of columns in the field grid. Supports 1, 2, or 3. */
  @Input() columnsCount: 1 | 2 | 3 | 6 = 2;

  // ─── Section metadata ────────────────────────────────────────────────────────
  @Input() sectionSlug: string = '';
  @Input() sectionName: string = '';
  @Input() sectionDescription: string = '';

  // ─── Fields & data ───────────────────────────────────────────────────────────
  @Input() sectionFields: FormField[] = [];
  @Input() initialData: Record<string, any> = {};
  @Input() formValueCache: Map<string, any> = new Map();
  /** When set, use this FormGroup instead of building one from sectionFields (e.g. for form array rows). */
  @Input() boundFormGroup?: FormGroup | null;
  /** Override options per field slug (e.g. triggerEvent dropdown from API). */
  @Input() optionsOverrides?: Record<string, FormFieldOption[]>;

  // ─── Status ──────────────────────────────────────────────────────────────────
  /** 'APPROVED' | 'COMPLETED' will disable the entire form. */
  @Input() status: string = '';

  // ─── UI controls ─────────────────────────────────────────────────────────────
  @Input() showButtons: boolean = true;
  @Input() showResetButton: boolean = true;
  @Input() submitButtonText: string = 'Save';
  @Input() resetButtonText: string = 'Reset';
  @Input() submitting: boolean = false;

  // ─── File settings ───────────────────────────────────────────────────────────
  @Input() allowedFileTypes: string[] = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10 MB

  // ─── Outputs ─────────────────────────────────────────────────────────────────
  @Output() formSubmitted = new EventEmitter<DynamicFormSubmitResult>();
  @Output() formReset = new EventEmitter<void>();
  @Output() formValueChanged = new EventEmitter<Record<string, any>>();
  @Output() fileSelected = new EventEmitter<{ fieldSlug: string; file: File }>();

  // ─── Internal state ──────────────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder);

  sectionForm: FormGroup;
  submitted = false;
  fileUploadMap: Map<string, File> = new Map();
  phoneDialCodes: Map<string, string> = new Map();
  isModalOpen: boolean = false;
  previewFileName: string = '';
  previewFileUrl: string = '';

  constructor() {
    this.sectionForm = this.fb.group({});
  }

  ngOnInit(): void {
    if (this.boundFormGroup) {
      this.sectionForm = this.boundFormGroup;
    } else {
      this.buildForm();
      this.patchInitialData();
    }
    this.setupFormStatusHandling();
    this.setupValueChangeListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['boundFormGroup']) {
      const bound = changes['boundFormGroup'].currentValue;
      if (bound) this.sectionForm = bound;
    }
    if (changes['sectionFields'] && !changes['sectionFields'].firstChange && !this.boundFormGroup) {
      this.cacheFormValues();
      this.buildForm();
      this.restoreFromCache();
    }

    if (changes['initialData'] && !changes['initialData'].firstChange) {
      this.patchInitialData();
    }

    if (changes['status']) {
      this.handleStatusChange();
    }
  }

  // ─── Form building ───────────────────────────────────────────────────────────

  private buildForm(): void {
    this.sectionForm = this.fb.group({});

    this.sectionFields.forEach((field) => {
      if (this.isDropdownField(field) && field.options && Array.isArray(field.options)) {
        field.options = this.normalizeOptions(field);
      }

      this.sectionForm.addControl(field.slug, this.createFormControl(field));

      if (this.isPhoneField(field)) {
        this.phoneDialCodes.set(field.slug, '+91');
      }
    });

    this.restoreFromCache();
  }

  private createFormControl(field: FormField): FormControl {
    const validators: any[] = [];

    if (field.required) {
      if (field.inputType === 'checkbox' && field.options && field.options.length > 0) {
        validators.push((control: FormControl) => {
          const value = control.value;
          if (!value || !Array.isArray(value) || value.length === 0) return { required: true };
          return null;
        });
      } else {
        validators.push(Validators.required);
      }
    }

    if (field.inputType === 'email') {
      validators.push(Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/));
    }

    if (field.inputType === 'url') {
      validators.push(Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[\w .-]*)*$/i));
    }

    if (field.validation?.regex) {
      validators.push(Validators.pattern(field.validation.regex));
    }

    if (field.inputType === 'number') {
      this.addRangeValidators(field, validators);
    }

    if (field.validation?.minLength !== undefined) {
      validators.push(Validators.minLength(field.validation.minLength));
    }

    if (field.validation?.maxLength !== undefined) {
      validators.push(Validators.maxLength(field.validation.maxLength));
    }

    const isCheckbox = field.inputType === 'checkbox' || field.type === 'checkboxField';
    const initialValue = isCheckbox && field.options?.length ? [] : (field.defaultValue ?? null);

    return new FormControl({ value: initialValue, disabled: field.disabled || false }, validators);
  }

  private addRangeValidators(field: FormField, validators: any[]): void {
    if (field.validation?.min !== undefined) validators.push(Validators.min(field.validation.min));
    if (field.validation?.max !== undefined) validators.push(Validators.max(field.validation.max));
  }

  // ─── Data patching ───────────────────────────────────────────────────────────

  private patchInitialData(): void {
    if (this.boundFormGroup || !this.initialData || Object.keys(this.initialData).length === 0) return;

    setTimeout(() => {
      const patchedValues = { ...this.initialData };
      this.sectionFields.forEach((field) => this.patchFieldValue(field, patchedValues));
      this.sectionForm.patchValue(patchedValues);
      this.cacheFormValues();
    }, 0);
  }

  private patchFieldValue(field: FormField, patchedValues: Record<string, any>): void {
    if (this.isDropdownField(field) && field.options) {
      this.patchDropdownValue(field, patchedValues);
    } else if (this.isPhoneField(field)) {
      this.patchPhoneValue(field, patchedValues);
    } else if (this.isCheckboxField(field) && field.options?.length) {
      const v = patchedValues[field.slug];
      patchedValues[field.slug] = Array.isArray(v) ? v : (v ?? []);
    } else if (this.isRadioField(field) && field.options?.length) {
      const v = patchedValues[field.slug];
      if (Array.isArray(v) && v.length > 0) patchedValues[field.slug] = v[0];
    }
  }

  private patchDropdownValue(field: FormField, patchedValues: Record<string, any>): void {
    const fieldValue = patchedValues[field.slug];
    if (fieldValue === null || fieldValue === undefined) return;

    const matchingOption = this.normalizeOptions(field).find((opt: any) =>
      opt.value === fieldValue || opt.label === fieldValue || opt.value === String(fieldValue)
    );
    if (matchingOption) patchedValues[field.slug] = matchingOption.value;
  }

  private patchPhoneValue(field: FormField, patchedValues: Record<string, any>): void {
    const phoneValue = patchedValues[field.slug];
    if (phoneValue && typeof phoneValue === 'string') {
      const parsed = this.parsePhoneNumber(phoneValue);
      if (parsed) {
        this.phoneDialCodes.set(field.slug, parsed.dialCode);
        patchedValues[field.slug] = parsed.phoneNumber;
      }
    }
  }

  // ─── Form status ─────────────────────────────────────────────────────────────

  private setupFormStatusHandling(): void {
    if (this.isFormDisabled()) this.sectionForm.disable();
  }

  private setupValueChangeListener(): void {
    this.sectionForm.valueChanges.subscribe(() => {
      this.cacheFormValues();
      this.formValueChanged.emit(this.sectionForm.value);
    });
  }

  private handleStatusChange(): void {
    if (this.isFormDisabled()) {
      this.sectionForm.disable();
    } else {
      this.sectionForm.enable();
    }
  }

  // ─── Cache ───────────────────────────────────────────────────────────────────

  private cacheFormValues(): void {
    if (!this.formValueCache) return;
    const cacheKey = this.getCacheKey();
    const formValues = { ...this.sectionForm.value };
    const fileUploads: Record<string, File> = {};
    this.fileUploadMap.forEach((file, key) => { fileUploads[key] = file; });
    this.formValueCache.set(cacheKey, { formValues, fileUploads });
  }

  private restoreFromCache(): void {
    const cacheKey = this.getCacheKey();
    if (!this.formValueCache?.has(cacheKey)) return;

    setTimeout(() => {
      const cachedData = this.formValueCache.get(cacheKey);
      if (cachedData?.formValues) {
        this.processArrayFields(cachedData.formValues);
        this.sectionForm.patchValue(cachedData.formValues);
      }
      if (cachedData?.fileUploads) {
        Object.keys(cachedData.fileUploads).forEach((key) => {
          this.fileUploadMap.set(key, cachedData.fileUploads[key]);
        });
      }
    }, 0);
  }

  private processArrayFields(values: Record<string, any>): void {
    this.sectionFields.forEach((field) => {
      if (this.isCheckboxField(field) && field.options?.length) {
        const v = values[field.slug];
        values[field.slug] = Array.isArray(v) ? v : (v ?? []);
      } else if (this.isRadioField(field) && field.options?.length) {
        const v = values[field.slug];
        if (Array.isArray(v) && v.length > 0) values[field.slug] = v[0];
      }
    });
  }

  private getCacheKey(): string {
    return `${this.sectionSlug}_${this.sectionName}`;
  }

  // ─── Submit / Reset ──────────────────────────────────────────────────────────

  onSubmit(): void {
    this.submitted = true;

    if (this.sectionForm.valid) {
      const processedValues = this.processFormValues();
      this.formSubmitted.emit({
        name: this.sectionName,
        slug: this.sectionSlug,
        values: processedValues,
        files: this.getFileData(),
        isValid: true,
      });
    } else {
      this.markFormGroupTouched(this.sectionForm);
    }
  }

  private processFormValues(): Record<string, any> {
    const formValue = this.sectionForm.value;
    const processedValues: Record<string, any> = {};
    Object.keys(formValue).forEach((key) => {
      const field = this.sectionFields.find(f => f.slug === key);
      processedValues[key] = this.processFieldValue(key, formValue[key], field);
    });
    return processedValues;
  }

  private processFieldValue(key: string, value: any, field: FormField | undefined): any {
    if (!field) return value;
    
    if (this.isDropdownField(field)) {
      return this.processDropdownValue(value, field);
    }
    
    if (this.isPhoneField(field)) {
      return this.processPhoneValue(key, value);
    }
    
    if (this.isCheckboxField(field)) {
      return this.processCheckboxValue(value, field);
    }
    
    if (this.isRadioField(field)) {
      return this.processRadioValue(value, field);
    }
    
    return value;
  }

  private processDropdownValue(value: any, field: FormField): any {
    if (value && typeof value === 'object' && Object.hasOwn(value, 'value')) {
      return value.value;
    }
    
    if (value && typeof value === 'object') {
      const match = this.normalizeOptions(field).find((opt: any) =>
        opt === value || (opt.value === value.value && opt.label === value.label)
      );
      if (match) return match.value;
    }
    
    return value;
  }

  private processCheckboxValue(value: any, field: FormField): any {
    if (field.options?.length) {
      return Array.isArray(value) ? value : (value ?? []);
    }
    return value;
  }

  private processRadioValue(value: any, field: FormField): any {
    if (field.options?.length) {
      return Array.isArray(value) ? value[0] : value;
    }
    return value;
  }

  private processPhoneValue(key: string, value: any): string {
    const phoneValue = value ? value.toString().trim() : '';
    if (phoneValue && !phoneValue.startsWith('+')) {
      const dialCode = this.phoneDialCodes.get(key) || '+91';
      return dialCode + phoneValue;
    }
    return phoneValue;
  }

  resetForm(): void {
    this.sectionForm.reset();
    this.fileUploadMap.clear();
    this.submitted = false;
    this.formValueCache?.delete(this.getCacheKey());
    this.formReset.emit();
  }

  // ─── Child event handlers ────────────────────────────────────────────────────

  onFileSelected(event: { fieldSlug: string; file: File }): void {
    this.fileUploadMap.set(event.fieldSlug, event.file);
    this.fileSelected.emit(event);
  }

  onPhoneDialCodeChange(event: { fieldSlug: string; dialCode: string }): void {
    this.phoneDialCodes.set(event.fieldSlug, event.dialCode);
  }

  onSeparatePhoneChange(event: { fieldSlug: string; phoneData: { dialCode: string; phoneNumber: string } }): void {
    if (event.phoneData?.dialCode) this.phoneDialCodes.set(event.fieldSlug, event.phoneData.dialCode);
  }

  onPhoneCountryChange(event: { fieldSlug: string; country: any }): void {
    if (event.country?.dialCode) {
      this.phoneDialCodes.set(event.fieldSlug, event.country.dialCode);
      const phoneControl = this.sectionForm.get(event.fieldSlug);
      if (phoneControl) setTimeout(() => phoneControl.updateValueAndValidity({ emitEvent: true }), 10);
    }
  }

  // ─── Template helpers ────────────────────────────────────────────────────────

  getFormControl(controlName: string): FormControl {
    return this.sectionForm.get(controlName) as FormControl;
  }

  isFormDisabled(): boolean {
    return this.status === 'APPROVED' || this.status === 'COMPLETED';
  }

  isPhoneField(field: FormField): boolean {
    if (!field) return false;
    if (field.inputType === 'phone' || field.inputType === 'tel') return true;
    const slug = (field.slug || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    return slug.includes('phone') || slug.includes('mobile') || slug.includes('tel') ||
           label.includes('phone') || label.includes('mobile') || label.includes('tel');
  }

  isDropdownField(field: FormField): boolean {
    return field.type === 'DropDownField' || field.type === 'dropdownField';
  }

  isTextField(field: FormField): boolean {
    if (field.type !== 'inputField') return false;
    const inputType = field.inputType || 'text';
    const textTypes = ['text', 'email', 'date', 'datetime', 'url', 'number', 'address', 'password'];
    return textTypes.includes(inputType) && !this.isPhoneField(field) && inputType !== 'file';
  }

  isTextareaField(field: FormField): boolean {
    return field.type === 'textareaField';
  }

  isRadioField(field: FormField): boolean {
    return field.inputType === 'radio' || field.type === 'radioField';
  }

  isCheckboxField(field: FormField): boolean {
    return field.inputType === 'checkbox' || field.type === 'checkboxField';
  }

  isFileField(field: FormField): boolean {
    return field.inputType === 'file' || field.type === 'fileField';
  }

  isMultiselectField(field: FormField): boolean {
    return field.type === 'multiselectField';
  }

  normalizeOptions(field: FormField): FormFieldOption[] {
    const opts = this.getEffectiveOptions(field);
    if (!opts || !Array.isArray(opts)) return [];
    return opts.map((opt: any) => {
      // String option
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }

      // Object option - handle case-insensitive properties
      if (typeof opt === 'object' && opt !== null) {
        const optObj = opt as Record<string, any>;
        
        // Extract label (case-insensitive)
        const labelValue = 
          optObj['label'] || 
          optObj['Label'] || 
          optObj['LABEL'] || 
          optObj['display'] || 
          optObj['Display'] || 
          optObj['text'] || 
          optObj['Text'] || 
          optObj['name'] || 
          optObj['Name'] || 
          '';
        
        // Extract value (case-insensitive)
        const valueValue = 
          optObj['value'] ?? optObj['Value'] ?? optObj['VALUE'] ?? optObj['id'] ?? optObj['Id'] ?? (labelValue || '');

        return {
          label: String(labelValue || ''),
          value: valueValue || labelValue || '',
        };
      }

      // Fallback
      return {
        label: String(opt || ''),
        value: opt || '',
      };
    }).filter(opt => opt.label && opt.value !== undefined && opt.value !== null && opt.value !== '');
  }

  /** Options for a field: optionsOverrides take precedence over field.options */
  getEffectiveOptions(field: FormField): FormFieldOption[] {
    if (this.optionsOverrides && Object.hasOwn(this.optionsOverrides, field.slug)) {
      return this.optionsOverrides[field.slug] ?? [];
    }
    return field.options ?? [];
  }

  /** Field with options merged from optionsOverrides (for dropdown binding) */
  getFieldWithOptions(field: FormField): FormField {
    const normalizedOpts = this.normalizeOptions(field);
    return normalizedOpts.length > 0 ? { ...field, options: normalizedOpts } : field;
  }

  /** When true, render dropdown as text input (e.g. trigger event when API options empty) */
  useTextFallback(field: FormField): boolean {
    if (!this.isDropdownField(field)) return false;
    return this.getEffectiveOptions(field).length === 0;
  }

  getDefaultCountryForPhoneField(field: FormField): string {
    const stored = this.phoneDialCodes.get(field.slug);
    if (stored) {
      const cc = this.getCountryCodeFromDialCode(stored);
      if (cc) return cc;
    }
    return 'IN';
  }

  // ─── File preview ────────────────────────────────────────────────────────────

  viewFile(data: any): void {
    this.previewFileName = data?.savedFileName || data?.name;

    if (data?.file) {
      window.open(URL.createObjectURL(data.file), '_blank');
    } else if (data?.uploadedFileName || data?.url) {
      const url = data.url || data.uploadedFileName;
      const ext = this.getFileExtension(url);
      if (ext === 'pdf') {
        window.open(`https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`, '_blank');
      } else {
        this.previewFileUrl = url;
        this.openModal();
      }
    }
  }

  openModal(): void { this.isModalOpen = true; }
  closeModal(): void { this.isModalOpen = false; }

  downloadDocument(url: string, name: string): void {
    if (this.getFileExtension(url) !== 'pdf') {
      const link = document.createElement('a');
      link.href = url;
      link.download = name || 'download';
      link.click();
    }
  }

  noDocumentPreview(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) img.src = 'assets/images/no-document.png';
  }

  // ─── Private utilities ───────────────────────────────────────────────────────

  private getFileData(): Record<string, File> {
    const fileData: Record<string, File> = {};
    this.fileUploadMap.forEach((file, key) => { fileData[key] = file; });
    return fileData;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as FormGroup).controls) this.markFormGroupTouched(control as FormGroup);
    });
  }

  private getFileExtension(url: string): string {
    return ((url.split('/').pop() || '').split('.').pop() || '').toLowerCase();
  }

  private parsePhoneNumber(fullNumber: string): { dialCode: string; phoneNumber: string } | null {
    if (!fullNumber.startsWith('+')) return null;
    const dialCodes = [
      '+91', '+1', '+44', '+86', '+81', '+82', '+33', '+49', '+39', '+34',
      '+61', '+55', '+52', '+65', '+60', '+63', '+62', '+971', '+966', '+92',
      '+880', '+94', '+66', '+84', '+20', '+27', '+234', '+254',
    ].sort((a, b) => b.length - a.length);

    for (const dialCode of dialCodes) {
      if (fullNumber.startsWith(dialCode)) {
        return { dialCode, phoneNumber: fullNumber.substring(dialCode.length) };
      }
    }
    return null;
  }

  private getCountryCodeFromDialCode(dialCode: string): string | null {
    const map: Record<string, string> = {
      '+91': 'IN', '+1': 'US', '+44': 'GB', '+86': 'CN', '+81': 'JP',
      '+82': 'KR', '+33': 'FR', '+49': 'DE', '+39': 'IT', '+34': 'ES',
      '+61': 'AU', '+55': 'BR', '+52': 'MX', '+65': 'SG', '+60': 'MY',
      '+63': 'PH', '+62': 'ID', '+971': 'AE', '+966': 'SA', '+92': 'PK',
      '+880': 'BD', '+94': 'LK', '+66': 'TH', '+84': 'VN', '+20': 'EG',
      '+27': 'ZA', '+234': 'NG', '+254': 'KE',
    };
    return map[dialCode] || null;
  }
}