import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { SearchComponent } from '../search/search.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedCookieService } from '@core';
import { FilterPipe } from '../pipes/filter.pipe';

@Component({
    selector: 'app-custom-column-dropdown',
    imports: [CommonModule, FormsModule, FilterPipe],
    templateUrl: './custom-column-dropdown.component.html',
    styleUrl: './custom-column-dropdown.component.css'
})
export class CustomColumnDropdownComponent implements OnInit {
  constructor(
    private cookieService: SharedCookieService,
    private cdr: ChangeDetectorRef,
  ) { }
  searchTerm: any;
  dropdownOpen = false;
  isDropdownOpen = false;
  isRefreshButton: boolean = false;
  currentLanguage: any;
  @Input() options: any[] = [];
  @Input() rowData: any[] = [];
  @Input() colDefs: any[] = [];
  @Input() gridApi: any = {};
  @Input() insertBeforeColumnName: string = '';
  @Output() applyChangesColumn = new EventEmitter<any[]>();
  @Output() refreshColumn = new EventEmitter<any[]>();
  ngOnInit() {
    this.currentLanguage = localStorage.getItem('language');
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  handleCloseDropdown() {
    this.isDropdownOpen = false;
  }
  onOptionChange(event: boolean, option: any) {
    option.selected = event;
  }

  compareAndFilterArrays(array1: any[], array2: any[]): any[] {
    return array1.filter(item1 => {
      const item2 = array2.find(item => item.field === item1.field);
      return item1.selected !== false && (item2 ? item2.selected !== false : true);
    });
  }


  apply() {
    this.dropdownOpen = false;
    // this.isRefreshButton=true;
    const insertBeforeColumn = this.insertBeforeColumnName;
    const allColumns = [...this.colDefs];
    const insertIndex = allColumns.findIndex(col => col.field === insertBeforeColumn);
    let beforeColumns = insertIndex > -1 ? allColumns.slice(0, insertIndex) : allColumns;
    const afterColumns = insertIndex > -1 ? allColumns.slice(insertIndex) : [];
    beforeColumns = this.compareAndFilterArrays(beforeColumns, this.options);
    const selectedOptions = this.options.filter(option => option.selected !== false);
    const combinedColumns = [
      ...beforeColumns,
      ...selectedOptions,
      ...afterColumns,
    ];
    combinedColumns.forEach(col => {
      if (col.field === 'action') {
        col.sortable = false;
        col.filter = false;
      }
    });
    const filteredData = combinedColumns.filter((item, index, self) => {
      return (
        item.selected !== false &&
        self.findIndex(col => col.field === item.field) === index
      );
    });
    this.colDefs = filteredData;
    this.gridApi.api.sizeColumnsToFit();
    this.gridApi.api.refreshCells({ force: true });
    this.colDefs.forEach(option => {
      this.gridApi.api.sizeColumnsToFit();
      this.cdr.detectChanges();
    });
    this.applyChangesColumn.emit(filteredData);
  }

  cancel() {
    this.dropdownOpen = false;
    this.isRefreshButton = false;
  }

  refreshCustomColumn() {
    this.refreshColumn.emit(this.options);
    this.dropdownOpen = false;
    this.colDefs.forEach(option => {
      this.gridApi.api.sizeColumnsToFit();
      this.cdr.detectChanges();
    });
    this.isRefreshButton = false;
  }
}
