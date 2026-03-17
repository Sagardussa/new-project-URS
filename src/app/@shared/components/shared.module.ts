import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ModalComponent } from './modal/modal.component';
import { SearchComponent } from './search/search.component';
import { SuccessComponent } from './success/success.component';
import { ChartHeadingComponent } from './chart-heading/chart-heading.component';
import { ExportReportComponent } from './export-report/export-report.component';
import { ChartDropdownComponent } from './chart-dropdown/chart-dropdown.component';
import { ChartTabsComponent } from './chart-tabs/chart-tabs.component';
import { PageHeadingComponent } from './page-heading/page-heading.component';
import { FormsModule } from '@angular/forms';
import { CustomColumnDropdownComponent } from './custom-column-dropdown/custom-column-dropdown.component';
import { ExportBtnComponent } from './export-btn/export-btn.component';
import { BulkUploadComponent } from './bulk-upload/bulk-upload.component';
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { LoaderComponent } from './loader/loader.component';
import { DynamicTableComponent } from './dynamic-table/dynamic-table.component';
import { SubHeadingComponent } from './sub-heading/sub-heading.component';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { DateTimePickerComponent } from './date-time-picker/date-time-picker.component';
import { ClickOutsideDirective } from '@core';
import { PageSpinnerComponent } from './page-spinner/page-spinner.component';
import { MultiselectComponent } from './multiselect/multiselect.component';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';

@NgModule({
  declarations: [
    // FilterPipe
  ],
  imports: [
    FormsModule,
    NgSelectModule,
    CommonModule,
    RouterModule,
    ModalComponent,
    SearchComponent,
    SuccessComponent,
    ChartHeadingComponent,
    ExportReportComponent,
    ChartDropdownComponent,
    ChartTabsComponent,
    PageHeadingComponent,
    CustomColumnDropdownComponent,
    ExportBtnComponent,
    BulkUploadComponent,
    AlertDialogComponent,
    LoaderComponent,
    DynamicTableComponent,
    SubHeadingComponent,
    DatePickerComponent,
    DateTimePickerComponent,
    ClickOutsideDirective,
    PageSpinnerComponent,
    MultiselectComponent,
    DynamicFormComponent,
    // NgxEditor removed - will be lazy loaded when needed
  ],
  exports: [
    RouterModule,
    NgSelectModule,
    ModalComponent,
    SearchComponent,
    SuccessComponent,
    ChartHeadingComponent,
    ExportReportComponent,
    ChartDropdownComponent,
    ChartTabsComponent,
    PageHeadingComponent,
    CustomColumnDropdownComponent,
    ExportBtnComponent,
    BulkUploadComponent,
    AlertDialogComponent,
    LoaderComponent,
    DynamicTableComponent,
    DatePickerComponent,
    DateTimePickerComponent,
    SubHeadingComponent,
    ClickOutsideDirective,
    PageSpinnerComponent,
    MultiselectComponent,
    DynamicFormComponent,
    // NgxEditor removed from exports
    // FilterPipe
  ],

})
export class SharedModule { }
