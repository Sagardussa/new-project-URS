import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-search',
    imports: [CommonModule, FormsModule],
    templateUrl: './search.component.html',
    styleUrl: './search.component.css'
})
export class SearchComponent  implements OnInit{
  @Output() searchChange = new EventEmitter<string>();
  @Input() gridApi:any;
  @Input() placeholder:string='';
  isExpanded = false;
  searchText:string= '';
  constructor(
     private readonly cdr: ChangeDetectorRef,
  ){ }
  ngOnInit() {
  }
  toggleSearch() {
    this.isExpanded = !this.isExpanded;  
    this.cdr.detectChanges();
    this.searchText = '';
    this.gridApi?.api?.setGridOption('quickFilterText', this.searchText);
    const filteredRowCount = this.gridApi?.api?.getDisplayedRowCount();
    if (filteredRowCount === 0) {
      this.gridApi?.api?.showNoRowsOverlay(); 
    } else {
      this.gridApi?.api?.hideOverlay(); 
    }
    this.gridApi?.api?.sizeColumnsToFit();
    this.gridApi?.api?.refreshCells({ force: true });
  }
  onSearchChange(event:any) {
    if (event) {
      this.searchChange.emit(event);
      this.searchText = event.target.value;
    }
  }

  /**
   * Clears the search input and resets the search state.
   * Does NOT emit searchChange event to avoid duplicate API calls
   * when called programmatically during tab switches.
   */
  clear(): void {
    this.searchText = '';
    if (this.gridApi?.api) {
      this.gridApi.api.setGridOption('quickFilterText', '');
      this.gridApi.api.hideOverlay();
    }
  }
}
