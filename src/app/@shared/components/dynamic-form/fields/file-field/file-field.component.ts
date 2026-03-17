import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../dynamic-form.types';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-file-field',
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
        class="bg-white border border-gray-300 p-2.5 rounded-lg flex flex-row justify-between items-center cursor-pointer hover:border-primary-500 transition-all"
        [ngClass]="{ 'bg-gray-100 cursor-not-allowed': disabled }">
        <label [for]="field.slug" class="cursor-pointer flex-1">
          <span class="text-sm text-gray-600">
            {{ getDisplayFileName() }}
          </span>
        </label>
        <button
          type="button"
          *ngIf="hasFileValue()"
          (click)="onViewFile()"
          class="p-1 hover:bg-gray-100 rounded">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
            <path
              fill-rule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clip-rule="evenodd"></path>
          </svg>
        </button>
        <input
          type="file"
          [id]="field.slug"
          class="hidden"
          [accept]="getFileAcceptTypes()"
          (change)="onFileChange($event)"
          [attr.disabled]="control.disabled ? true : null"
        />
      </div>

      <ng-container error-messages>
        <span *ngIf="control.hasError('required')">This field is required</span>
      </ng-container>
    </app-form-field-wrapper>
  `,
})
export class FileFieldComponent {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() disabled: boolean = false;
  @Input() submitted: boolean = false;
  @Input() allowedFileTypes: string[] = [
    'pdf',
    'jpg',
    'jpeg',
    'png',
    'doc',
    'docx',
  ];
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB default

  @Output() fileSelected = new EventEmitter<{ fieldSlug: string; file: File }>();
  @Output() viewFile = new EventEmitter<any>();

  get isInvalidAndTouched(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  getDisplayFileName(): string {
    const value = this.control.value;
    if (value?.file?.name) {
      return value.file.name;
    }
    if (value?.savedFileName) {
      return value.savedFileName;
    }
    return 'Choose File';
  }

  hasFileValue(): boolean {
    const value = this.control.value;
    return value && Object.keys(value).length > 0;
  }

  getFileAcceptTypes(): string {
    if (this.field.accept) {
      return this.field.accept;
    }
    return this.allowedFileTypes.map((t) => '.' + t).join(',');
  }

  onFileChange(event: any): void {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!extension || !this.allowedFileTypes.includes(extension)) {
        event.target.value = '';
        this.control.reset();
        console.error(
          `Only ${this.allowedFileTypes.join(', ')} files are allowed.`
        );
        return;
      }

      if (file.size > this.maxFileSize) {
        event.target.value = '';
        this.control.reset();
        console.error(
          `File size must be less than ${this.maxFileSize / (1024 * 1024)}MB.`
        );
        return;
      }

      this.control.setValue({ file });
      this.fileSelected.emit({ fieldSlug: this.field.slug, file });
    }
  }

  onViewFile(): void {
    this.viewFile.emit(this.control.value);
  }
}
