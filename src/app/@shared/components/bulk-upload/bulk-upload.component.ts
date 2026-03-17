import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { AlertService } from '@core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';


@Component({
    selector: 'app-bulk-upload',
    imports: [CommonModule, ModalComponent, ReactiveFormsModule, FormsModule],
    templateUrl: './bulk-upload.component.html',
    styleUrl: './bulk-upload.component.css'
})
export class BulkUploadComponent implements OnInit {
  isDialogOpen = false;
  selectedFile:any
  formData = new FormData();
  @Input() csvFileSelected: File | null = null;
  @Output() csvExcelFileFormData: EventEmitter<any> = new EventEmitter<[]>();
  uploadCsvForm!: FormGroup;
   
  allowedExtensions = ['csv', 'xlsx', 'xls'];
  constructor(private alertService: AlertService,private formBuilder:FormBuilder) {
    this.uploadForm();
  }

  ngOnInit() {}

  openDialog() {
    this.isDialogOpen = true;
  }
  uploadForm(){
    this.uploadCsvForm = this.formBuilder.group({
      csvFile: [null, Validators.required]
    });
  }
  closeDialog() {
    this.isDialogOpen = false;
  }
  onCsvFileSelected(event:any){
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.resetFileInput(input);
      return;
    }
    const file = input.files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(fileExtension || '')) {
      this.alertService.showAlert('Only CSV and Excel files are accepted.', 'error');
      this.resetFileInput(input);
      return;
    }
    this.selectedFile = file;
    this.uploadCsvForm.patchValue({
      fileName: file.name,
    });
  }
  resetFileInput(fileInput: HTMLInputElement): void {
    fileInput.value = ''; 
    this.selectedFile = null; 
    this.uploadCsvForm.patchValue({
      csvFile: null
    });
    this.uploadCsvForm.get('csvFile')?.updateValueAndValidity();
  }
  onSubmit(){
    if (this.uploadCsvForm.invalid || !this.selectedFile) {
      this.alertService.showAlert('Please select a valid file before uploading.', 'error');
      return;
    }
    this.formData.append('file', this.selectedFile);
    this.csvExcelFileFormData.emit(this.formData);
   }
  
}
