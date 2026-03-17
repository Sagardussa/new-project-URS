import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormField, FormFieldOption } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-dropdown-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
    FormFieldWrapperComponent,
  ],
  template: `
    <app-form-field-wrapper
      [label]="field.label"
      [fieldSlug]="field.slug"
      [required]="field.required"
      [description]="field.description || ''"
      [showError]="isInvalidAndTouched">
      <ng-select
        [items]="normalizedOptions"
        bindLabel="label"
        bindValue="value"
        [placeholder]="getPlaceholder()"
        [formControl]="control"
        [clearable]="!field.required"
        [searchable]="true"
        [disabled]="isDisabled()"
        [closeOnSelect]="true"
        class="w-full custom-ng-select"
        [ngClass]="{ 'ng-invalid-touched': isInvalidAndTouched }"
        (change)="onChange($event)"
        (select)="onSelect($event)"
       >
      </ng-select>

      <ng-container error-messages>
        <span>This field is required</span>
      </ng-container>
    </app-form-field-wrapper>
  `,
})
export class DropdownFieldComponent implements OnInit, OnChanges {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;

  normalizedOptions: FormFieldOption[] = [];
  placeholderText = 'Select an option';

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.field) {
      this.updateOptions();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only update options if field actually changed, not on every change detection
    if (changes['field'] && this.field) {
      this.updateOptions();
    }
  }

  private updateOptions(): void {
    if (!this.field?.options || !Array.isArray(this.field.options)) {
      this.normalizedOptions = [];
      this.placeholderText = this.getPlaceholder();
      this.cdr.markForCheck();
      return;
    }

    // Options should already be normalized by dynamic-form.component.ts via getFieldWithOptions
    // Create new objects to ensure proper structure, but only update if options actually changed
    const newOptions = this.field.options
      .map((opt: any) => {
        // Handle already-normalized FormFieldOption objects - use direct property access
        if (opt && typeof opt === 'object' && opt !== null) {
          // Try direct property access first (most common case)
          if (opt.label !== undefined || opt.value !== undefined) {
            return {
              label: String(opt.label || opt.value || ''),
              value: opt.value ?? (opt.label || '')
            };
          }
          
          // Try case-insensitive access
          const optObj = opt as Record<string, any>;
          const label = optObj['label'] || optObj['Label'] || optObj['LABEL'] || optObj['display'] || optObj['Display'] || '';
          const value = optObj['value'] ?? (optObj['Value'] ?? (optObj['id'] || label));
          
          if (label || value) {
            return {
              label: String(label || value || ''),
              value: value || label || ''
            };
          }
        }
        
        // String option
        if (typeof opt === 'string') {
          return { label: opt, value: opt };
        }
        
        // Fallback
        return { label: String(opt || ''), value: opt || '' };
      })
      .filter(opt => {
        // Only keep valid options
        return opt?.label && 
          opt.label !== '' &&
          opt.value !== undefined && 
          opt.value !== null && 
          opt.value !== '';
      });
    
    // Only update if options actually changed to prevent unnecessary re-renders
    const optionsChanged = JSON.stringify(this.normalizedOptions) !== JSON.stringify(newOptions);
    if (optionsChanged) {
      this.normalizedOptions = newOptions;
    }
    
    this.placeholderText = this.getPlaceholder();
    this.cdr.markForCheck();
  }

  get isInvalidAndTouched(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  isDisabled(): boolean {
    return this.disabled || this.field?.disabled || this.control?.disabled || false;
  }

  getPlaceholder(): string {
    const ph = this.field?.placeholder;
    if (ph != null && ph !== '') {
      const placeholder = String(ph).trim();
      if (placeholder !== '' && placeholder !== 'undefined' && placeholder !== 'null') {
        return placeholder;
      }
    }
    const label = this.field?.label;
    if (label) {
      return `Select ${label.toLowerCase()}`;
    }
    return 'Select an option';
  }

  onChange(value: any): void {
    // ng-select automatically updates the form control via bindValue
    // This event fires when the value changes (including via click)
    this.control.markAsTouched();
    this.cdr.markForCheck();
  }

  onSelect(item: any): void {
    // This fires when an option is selected via click
    // Form control is already updated by ng-select via bindValue
    this.control.markAsTouched();
    this.cdr.markForCheck();
  }


}
