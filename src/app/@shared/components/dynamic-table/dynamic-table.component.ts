import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, GridReadyEvent, RowClickedEvent, RowSelectionOptions, SortChangedEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'dynamic-table',
    imports: [CommonModule, AgGridAngular, FormsModule],
    templateUrl: './dynamic-table.component.html',
    styleUrls: ['./dynamic-table.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicTableComponent implements OnInit, OnChanges {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  @Output() filterMethodReady = new EventEmitter<(text: string) => void>();
  @Output() rowClicked = new EventEmitter<any>();
  @Output() rowsSelected = new EventEmitter<any[]>();
  @Output() sortChanged = new EventEmitter<any>();
  @Output() gridReadyApi = new EventEmitter<GridReadyEvent>();
  @Output() paginationChanged = new EventEmitter<{ page: number; pageSize: number }>();
  @Output() noRowsToShow = new EventEmitter<boolean>();
  @Output() editClicked = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<any>();
  @Output() viewClicked = new EventEmitter<any>();

  @Input() colDefs: ColDef[] = [];
  @Input() rowData: any[] = [];
  @Input() showPagination: boolean = false;
  @Input() showColumnFilter: boolean = false;
  @Input() enableRowClick: boolean = false;
  @Input() rowSelection: string | undefined = undefined;
  @Input() rowSelectionOptions: RowSelectionOptions<any> | undefined = undefined;
  @Input() totalRows: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Input() showActionColumn: boolean = false;
  @Input() actionColumnWidth: number = 180;
  @Input() idField: string = 'uuid';
  /** Set to true in parent (e.g. programs) to show View action; default false so only parents that need it opt in. */
  @Input() showView: boolean = false;
  @Input() showEdit: boolean = true;
  @Input() showDelete: boolean = true;

  // Internal property to manage rowSelectionOptions
  // Only set when explicitly provided to avoid showing checkboxes unnecessarily
  _rowSelectionOptions: RowSelectionOptions<any> | undefined = undefined;

  current1Page: number = 1;
  perPage: number = 10;
  totalPages: number = 0;
  gridApi: GridApi | undefined;
  defaultColDef: any = {};
  selectedRows: any;
  paginationPageSizeSelector = [10, 20, 50, 100];
  gridOptions: GridOptions = {
    domLayout: 'normal',
    suppressHorizontalScroll: false,
    alwaysShowHorizontalScroll: true,
    suppressColumnVirtualisation: true,
    enableBrowserTooltips: true,
    onGridReady: function (params) {
      params.api.sizeColumnsToFit();
    },
    cellSelection: false,
    rowHeight: 50,
    defaultColDef: {
      sortable: false,
      resizable: true,
      comparator: () => 0,
      tooltipValueGetter: (params) => {
        // Return tooltip for cells if needed
        return null;
      },
    },
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totalRows']?.currentValue) {
      this.calculateTotalPages();
    }
    if (changes['pageSize']?.currentValue !== undefined) {
      this.perPage = changes['pageSize'].currentValue;
      this.calculateTotalPages();
    }
    if (changes['currentPage']?.currentValue !== undefined) {
      this.current1Page = changes['currentPage'].currentValue;
    }
    // Add tooltips to column headers when colDefs or action column options change
    if (changes['colDefs']?.currentValue || changes['showActionColumn']?.currentValue !== undefined ||
        changes['showView']?.currentValue !== undefined || changes['showEdit']?.currentValue !== undefined ||
        changes['showDelete']?.currentValue !== undefined) {
      this.processColumnDefs();
    }
    // Only set rowSelectionOptions when explicitly provided to avoid showing checkboxes
    // This uses the new API (replaces deprecated suppressRowClickSelection)
    if (changes['rowSelectionOptions']) {
      if (this.rowSelectionOptions && typeof this.rowSelectionOptions === 'object') {
        // Ensure enableClickSelection is set if rowSelectionOptions is provided
        this._rowSelectionOptions = {
          ...this.rowSelectionOptions,
          enableClickSelection: this.rowSelectionOptions.enableClickSelection ?? false,
        };
      } else {
        // Keep undefined to disable row selection checkboxes
        this._rowSelectionOptions = undefined;
      }
    }
  }

  /**
   * Processes column definitions: adds tooltips and action column if needed
   */
  private processColumnDefs(): void {
    if (!this.colDefs || this.colDefs.length === 0) {
      return;
    }

    // Create a new array to avoid mutating the input
    let updatedColDefs = this.colDefs.map(col => {
      // If headerTooltip already exists, keep it
      if (col.headerTooltip) {
        return col;
      }
      
      // Use headerName as tooltip, or field name if headerName doesn't exist
      const tooltipText = col.headerName || col.field || '';
      
      // Return new object with tooltip added
      return {
        ...col,
        headerTooltip: tooltipText
      };
    });

    // Add action column if enabled
    if (this.showActionColumn) {
      // Check if action column already exists
      const hasActionColumn = updatedColDefs.some(col => col.field === 'action');
      if (!hasActionColumn) {
        updatedColDefs.push(this.createActionColumn());
      }
    } else {
      // Remove action column if it exists and showActionColumn is false
      updatedColDefs = updatedColDefs.filter(col => col.field !== 'action');
    }
    
    // Update the colDefs array
    this.colDefs = updatedColDefs;
  }

  /**
   * Creates the action column definition with edit and delete buttons
   */
  private createActionColumn(): ColDef {
    return {
      headerName: 'Action',
      field: 'action',
      width: this.actionColumnWidth,
      sortable: false,
      filter: false,
      cellStyle: { textAlign: 'center', verticalAlign: 'middle' },
      cellRenderer: (params: { data: any }) => {
        return this.actionCellRenderer(params);
      },
    };
  }

  /**
   * Creates the action cell renderer with edit and delete buttons
   */
  private actionCellRenderer(params: { data: any }): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('flex', 'justify-center', 'items-center', 'gap-3');
    div.style.height = '100%';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';

    if (!params.data) return div;

    const id = params.data[this.idField] || params.data.id || params.data.uuid;
    if (!id) return div;

    // View button
    if (this.showView) {
      const viewLink = document.createElement('a');
      viewLink.href = 'javascript:void(0)';
      viewLink.title = 'View';
      viewLink.classList.add('cursor-pointer', 'flex', 'justify-center', 'items-center');
      const viewSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      viewSvg.setAttribute('class', 'w-4 h-4');
      viewSvg.setAttribute('fill', 'none');
      viewSvg.setAttribute('viewBox', '0 0 24 24');
      viewSvg.setAttribute('stroke', 'currentColor');
      const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p1.setAttribute('stroke-linecap', 'round');
      p1.setAttribute('stroke-linejoin', 'round');
      p1.setAttribute('stroke-width', '2');
      p1.setAttribute('d', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z');
      const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p2.setAttribute('stroke-linecap', 'round');
      p2.setAttribute('stroke-linejoin', 'round');
      p2.setAttribute('stroke-width', '2');
      p2.setAttribute('d', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z');
      viewSvg.appendChild(p1);
      viewSvg.appendChild(p2);
      viewLink.appendChild(viewSvg);
      viewLink.addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewClicked.emit(params.data);
      });
      div.appendChild(viewLink);
    }

    // Edit button
    if (this.showEdit) {
      const editLink = document.createElement('a');
      editLink.href = 'javascript:void(0)';
      editLink.classList.add('cursor-pointer', 'flex', 'justify-center', 'items-center');
      const editImg = document.createElement('img');
      editImg.src = 'assets/edit.svg';
      editImg.alt = 'Edit';
      editImg.classList.add('w-4', 'h-4');
      editLink.appendChild(editImg);
      editLink.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editClicked.emit(params.data);
      });
      div.appendChild(editLink);
    }

    // Delete button
    if (this.showDelete) {
      const deleteLink = document.createElement('a');
      deleteLink.href = 'javascript:void(0)';
      deleteLink.classList.add('cursor-pointer', 'flex', 'justify-center', 'items-center');
      const deleteImg = document.createElement('img');
      deleteImg.src = 'assets/trash.svg';
      deleteImg.alt = 'Delete';
      deleteImg.classList.add('w-5', 'h-5');
      deleteLink.appendChild(deleteImg);
      deleteLink.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteClicked.emit(params.data);
      });
      div.appendChild(deleteLink);
    }

    return div;
  }

  /**
   * Adds tooltips to column headers on initialization
   */
  private addColumnTooltips(): void {
    this.processColumnDefs();
  }

  ngOnInit() {
    // Process column definitions (adds tooltips and action column if needed)
    this.processColumnDefs();

    // Only set rowSelectionOptions when explicitly provided to avoid showing checkboxes
    // This uses the new API (replaces deprecated suppressRowClickSelection)
    if (this.rowSelectionOptions && typeof this.rowSelectionOptions === 'object') {
      this._rowSelectionOptions = {
        ...this.rowSelectionOptions,
        enableClickSelection: this.rowSelectionOptions.enableClickSelection ?? false,
      };
    } else {
      // Keep undefined to disable row selection checkboxes
      this._rowSelectionOptions = undefined;
    }

    this.gridOptions = {
      ...this.gridOptions,
      overlayNoRowsTemplate: `
        <div class="no-rows-overlay">
          <svg class="w-56 h-56" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="302.775" height="239.436" viewBox="0 0 302.775 239.436">
            <defs>
              <clipPath id="clip-path">
                <path id="Path_2673" data-name="Path 2673" d="M119.746,236.262a38.348,38.348,0,0,0,2.612-8.532q-.221-2.284-.639-4.433c-.239-1.252-.536-2.464-.862-3.656a15.546,15.546,0,0,1-3.191,4.06,37.742,37.742,0,0,0,2.3-6.973,46.5,46.5,0,0,0-3.517-7.779,14.909,14.909,0,0,1-1.828,4.091,39.071,39.071,0,0,0,.489-6.311c-.266-.417-.528-.836-.806-1.245a47.561,47.561,0,0,0-5.228-6.356,16.182,16.182,0,0,1-1.08,4.814,40.544,40.544,0,0,0-.687-6.526,46.353,46.353,0,0,0-6.505-4.986,16.191,16.191,0,0,1-.37,4.692,41.23,41.23,0,0,0-1.418-5.788,49.271,49.271,0,0,0-6.947-3.3,15.34,15.34,0,0,1,.4,3.9,40.606,40.606,0,0,0-2.038-4.507,51.666,51.666,0,0,0-5.817-1.632,40.473,40.473,0,0,0-6.913-.976,40.428,40.428,0,0,0-1.565,6.8,51.71,51.71,0,0,0-.559,6.016,40.659,40.659,0,0,0,3.478,3.517,15.32,15.32,0,0,1-3.5-1.775,49.262,49.262,0,0,0,.6,7.669,41.122,41.122,0,0,0,4.9,3.4,16.186,16.186,0,0,1-4.513-1.335,46.308,46.308,0,0,0,2.326,7.86,40.574,40.574,0,0,0,5.847,2.979,16.2,16.2,0,0,1-4.882-.716,47.613,47.613,0,0,0,4.062,7.157c.282.406.58.8.874,1.2a39.087,39.087,0,0,0,6.068,1.8,14.88,14.88,0,0,1-4.475.242,46.508,46.508,0,0,0,6,6.069,37.728,37.728,0,0,0,7.332.354,15.524,15.524,0,0,1-4.934,1.526c1,.732,2.021,1.443,3.1,2.114q1.856,1.161,3.911,2.183a38.365,38.365,0,0,0,8.9.617,14.461,14.461,0,0,1-4.283,1.411q.647.247,1.309.482a51.86,51.86,0,0,0,5.9,1.673,40.532,40.532,0,0,0,6.89.992,40.5,40.5,0,0,0,1.541-6.788,51.931,51.931,0,0,0,.55-6.107q.018-.7.018-1.4A14.453,14.453,0,0,1,119.746,236.262Z" transform="translate(-75.554 -184.819)"/>
              </clipPath>
              <clipPath id="clip-path-2">
                <path id="Path_2677" data-name="Path 2677" d="M408.342,320.2a38.379,38.379,0,0,0,8.9-.7q2.044-1.043,3.891-2.218c1.078-.681,2.1-1.4,3.086-2.142a15.541,15.541,0,0,1-4.947-1.482,37.714,37.714,0,0,0,7.329-.419,46.549,46.549,0,0,0,5.949-6.122,14.9,14.9,0,0,1-4.477-.2,39.1,39.1,0,0,0,6.051-1.857c.29-.4.585-.8.863-1.206a47.61,47.61,0,0,0,4-7.192,16.207,16.207,0,0,1-4.875.759,40.564,40.564,0,0,0,5.821-3.031,46.244,46.244,0,0,0,2.256-7.88,16.2,16.2,0,0,1-4.5,1.375,41.09,41.09,0,0,0,4.866-3.44,49.308,49.308,0,0,0,.53-7.674,15.346,15.346,0,0,1-3.485,1.806,40.536,40.536,0,0,0,3.446-3.548,51.635,51.635,0,0,0-.613-6.01,40.461,40.461,0,0,0-1.625-6.79,40.442,40.442,0,0,0-6.9,1.037,51.859,51.859,0,0,0-5.8,1.684,40.664,40.664,0,0,0-2,4.524,15.373,15.373,0,0,1,.368-3.907,49.279,49.279,0,0,0-6.917,3.366,41.178,41.178,0,0,0-1.366,5.8,16.214,16.214,0,0,1-.411-4.688,46.312,46.312,0,0,0-6.461,5.044,40.527,40.527,0,0,0-.629,6.532,16.2,16.2,0,0,1-1.123-4.8,47.527,47.527,0,0,0-5.17,6.4c-.275.411-.533.833-.795,1.252a39.053,39.053,0,0,0,.545,6.306,14.871,14.871,0,0,1-1.864-4.075,46.484,46.484,0,0,0-3.447,7.81,37.69,37.69,0,0,0,2.357,6.952,15.537,15.537,0,0,1-3.227-4.031c-.315,1.195-.6,2.409-.83,3.664q-.4,2.151-.6,4.439a38.364,38.364,0,0,0,2.688,8.508,14.454,14.454,0,0,1-2.882-3.469q.007.692.031,1.395a51.858,51.858,0,0,0,.6,6.1,40.5,40.5,0,0,0,1.6,6.774,40.548,40.548,0,0,0,6.88-1.053,51.9,51.9,0,0,0,5.883-1.725q.661-.241,1.3-.494A14.4,14.4,0,0,1,408.342,320.2Z" transform="translate(-396.334 -262.227)"/>
              </clipPath>
              <clipPath id="clip-path-3">
                <path id="Path_2689" data-name="Path 2689" d="M120.291,252.836h-28.1L70.612,353.647A192.224,192.224,0,0,0,106.24,357.5a192.22,192.22,0,0,0,35.627-3.857Z" transform="translate(-70.612 -252.836)"/>
              </clipPath>
            </defs>
            <g id="OBJECTS" transform="translate(-20.291 -70.366)">
              <g id="Group_7494" data-name="Group 7494" transform="translate(36.455 145.795)">
                <path id="Path_2669" data-name="Path 2669" d="M74.312,270.412c-.169-.227-.333-.457-.5-.683q-2.873-3.817-6.092-7.354c.053-4.741-.06-22.67-4.864-21.748-4.436.852,1.354,15.048,3.824,20.643q-1.4-1.494-2.867-2.93c-3.241-4.207-14.139-17.757-17.333-14.088-2.96,3.4,9.992,10.9,15.685,13.96,1.057,1.008,2.1,2.037,3.1,3.092-5.486-2.74-19.163-9.071-20.379-4.744-1.318,4.691,16.566,5.684,21.425,5.866a102.565,102.565,0,0,1,7.109,8.569c-4.913-3.113-18.512-11.237-20.185-6.948-1.793,4.6,16.383,7.346,20.932,7.958a112.362,112.362,0,0,1,6.613,10.278c-4.7-3.981-16.431-13.334-18.635-9.43-2.394,4.239,14.7,9.449,19.4,10.789.326.589.65,1.176.966,1.77q2.4,4.52,4.438,9.237c-4.257-4.172-15.625-14.712-18.137-10.911-2.7,4.079,14.161,10.513,18.663,12.142a123.339,123.339,0,0,1,5.12,14.685c-3.637-4.735-13.4-16.742-16.417-13.333-3.242,3.661,12.55,12.4,16.78,14.642.056.211.12.42.175.631.446,1.711.88,3.438,1.184,5.182a.527.527,0,0,0,1.04-.161c-.3-1.733-.691-3.459-1.132-5.173,2.158-4.339,9.769-20.376,5.065-21.632-4.28-1.143-5.3,13.547-5.538,19.88-.8-2.855-1.743-5.676-2.726-8.439q-1.057-2.969-2.258-5.888c1.484-4.454,6.881-21.635,2.014-22.224-4.443-.537-3.324,14.449-2.676,20.644q-2.335-5.482-5.179-10.731c1.169-4.546,5.352-22.064.455-22.311-4.517-.227-2.259,14.969-1.192,20.977A115.091,115.091,0,0,0,75.4,271.912c.534-4.943,2.087-22.405-2.731-21.962C68.288,250.35,72.335,264.326,74.312,270.412Z" transform="translate(-44.817 -203.835)" fill="#eb725f"/>
                <path id="Path_2670" data-name="Path 2670" d="M417.785,222.871c.119-.256.242-.511.36-.769q1.98-4.348,3.55-8.865c4.19-2.218,19.887-10.885,16.781-14.664-2.868-3.49-12.572,8.38-16.307,13.223q.642-1.947,1.2-3.919c2.147-4.857,8.844-20.9,4.095-21.958-4.4-.976-4.8,13.986-4.769,20.448-.381,1.411-.788,2.814-1.233,4.205-.214-6.128-1.188-21.168-5.569-20.169-4.751,1.083,2.922,17.268,5.084,21.624a102.366,102.366,0,0,1-4.131,10.339c.386-5.8,1.027-21.632-3.542-21.052-4.894.621,1.375,17.9,3.01,22.191a112.366,112.366,0,0,1-5.869,10.72c1.253-6.028,3.864-20.8-.62-20.876-4.868-.078-1.276,17.431-.208,22.2-.361.567-.723,1.134-1.093,1.694q-2.823,4.269-5.994,8.312c1.631-5.733,5.459-20.755.919-21.146-4.872-.42-2.469,17.463-1.75,22.2a123.187,123.187,0,0,1-10.454,11.514c2.422-5.458,8.305-19.769,3.869-20.792-4.765-1.1-4.894,16.948-4.845,21.737-.158.15-.312.306-.471.455-1.29,1.209-2.6,2.416-3.987,3.516-.531.421.107,1.258.639.836,1.379-1.093,2.708-2.259,4-3.467,4.843-.178,22.566-1.153,21.423-5.885-1.041-4.306-14.432,1.818-20.11,4.634,2.125-2.069,4.153-4.242,6.111-6.427q2.1-2.346,4.093-4.8c4.622-.824,22.293-4.292,20.485-8.849-1.651-4.159-14.282,3.984-19.413,7.513q3.7-4.67,6.952-9.676c4.552-1.145,21.94-5.84,19.817-10.26-1.958-4.077-14.229,5.168-19,8.975a115.217,115.217,0,0,0,6.172-11.084c4.6-1.892,20.679-8.872,17.988-12.892C432.53,207.994,422.187,218.227,417.785,222.871Z" transform="translate(-161.015 -185.178)" fill="#eb725f"/>
                <g id="Group_7489" data-name="Group 7489" transform="translate(20.257)">
                  <g id="Group_7488" data-name="Group 7488">
                    <path id="Path_2671" data-name="Path 2671" d="M119.746,236.262a38.348,38.348,0,0,0,2.612-8.532q-.221-2.284-.639-4.433c-.239-1.252-.536-2.464-.862-3.656a15.546,15.546,0,0,1-3.191,4.06,37.742,37.742,0,0,0,2.3-6.973,46.5,46.5,0,0,0-3.517-7.779,14.909,14.909,0,0,1-1.828,4.091,39.071,39.071,0,0,0,.489-6.311c-.266-.417-.528-.836-.806-1.245a47.561,47.561,0,0,0-5.228-6.356,16.182,16.182,0,0,1-1.08,4.814,40.544,40.544,0,0,0-.687-6.526,46.353,46.353,0,0,0-6.505-4.986,16.191,16.191,0,0,1-.37,4.692,41.23,41.23,0,0,0-1.418-5.788,49.271,49.271,0,0,0-6.947-3.3,15.34,15.34,0,0,1,.4,3.9,40.606,40.606,0,0,0-2.038-4.507,51.666,51.666,0,0,0-5.817-1.632,40.473,40.473,0,0,0-6.913-.976,40.428,40.428,0,0,0-1.565,6.8,51.71,51.71,0,0,0-.559,6.016,40.659,40.659,0,0,0,3.478,3.517,15.32,15.32,0,0,1-3.5-1.775,49.262,49.262,0,0,0,.6,7.669,41.122,41.122,0,0,0,4.9,3.4,16.186,16.186,0,0,1-4.513-1.335,46.308,46.308,0,0,0,2.326,7.86,40.574,40.574,0,0,0,5.847,2.979,16.2,16.2,0,0,1-4.882-.716,47.613,47.613,0,0,0,4.062,7.157c.282.406.58.8.874,1.2a39.087,39.087,0,0,0,6.068,1.8,14.88,14.88,0,0,1-4.475.242,46.508,46.508,0,0,0,6,6.069,37.728,37.728,0,0,0,7.332.354,15.524,15.524,0,0,1-4.934,1.526c1,.732,2.021,1.443,3.1,2.114q1.856,1.161,3.911,2.183a38.365,38.365,0,0,0,8.9.617,14.461,14.461,0,0,1-4.283,1.411q.647.247,1.309.482a51.86,51.86,0,0,0,5.9,1.673,40.532,40.532,0,0,0,6.89.992,40.5,40.5,0,0,0,1.541-6.788,51.931,51.931,0,0,0,.55-6.107q.018-.7.018-1.4A14.453,14.453,0,0,1,119.746,236.262Z" transform="translate(-75.554 -184.819)" fill="#6e7fdd"/>
                    <g id="Group_7487" data-name="Group 7487">
                      <g id="Group_7486" data-name="Group 7486" clip-path="url(#clip-path)">
                        <path id="Path_2672" data-name="Path 2672" d="M107.364,193.535l-.675-.077a46.877,46.877,0,0,1-8.361,22.7l-5.848-8.506c8.015-11.148,7.015-25.473,7-25.617l-.673.007c.011.142.98,14.062-6.756,24.991l-5.2-7.567c7.984-11.229.432-27.066.355-27.226l-.6.275c.075.156,7.353,15.439-.183,26.329l-5.578-8.113c2.933-11.152-4.677-25.215-4.755-25.357l-.583.308c.074.136,7.3,13.5,4.815,24.288l-11.49-16.713-.543.373,11.49,16.713c-10.962-1.543-20.852-13.074-20.953-13.193l-.5.434c.1.123,10.509,12.265,21.972,13.52l5.578,8.113c-12.866,3.136-24.53-9.132-24.649-9.258l-.471.461c.121.13,12.2,12.851,25.548,9.418l5.2,7.567c-12.966,3.308-25.625-2.58-25.753-2.641l-.248.626c.13.063,13.148,6.126,26.426,2.634l5.848,8.506a46.929,46.929,0,0,1-24.186-.32l-.169.658a47.609,47.609,0,0,0,24.781.281l4.4,6.4c-12.944,3.423-22.541,2.016-22.637,2l-.055.685c.1.015,9.926,1.462,23.117-2.07l4.8,6.979a51.894,51.894,0,0,1-18.963,1.671l-.055.686a52.608,52.608,0,0,0,19.442-1.739l4,5.815a33.275,33.275,0,0,1-11.867,1.141l-.047.687a33.292,33.292,0,0,0,12.338-1.211l7.791,11.331.543-.373-7.791-11.331a33.276,33.276,0,0,0,5.548-11.086l-.658-.2A33.286,33.286,0,0,1,112.8,237.2l-4-5.815a52.611,52.611,0,0,0,8.585-17.531l-.66-.194a51.912,51.912,0,0,1-8.351,17.107l-4.8-6.979c8.021-11.051,10.189-20.745,10.211-20.843l-.66-.194c-.021.095-2.144,9.559-9.975,20.42l-4.4-6.4A47.589,47.589,0,0,0,107.364,193.535Z" transform="translate(-69.681 -178.188)" fill="#b3c9f9"/>
                      </g>
                    </g>
                  </g>
                  <path id="Path_2674" data-name="Path 2674" d="M116.215,206.731c-.266-.417-.528-.836-.806-1.245a47.561,47.561,0,0,0-5.228-6.356,16.182,16.182,0,0,1-1.08,4.814,40.544,40.544,0,0,0-.687-6.526,46.353,46.353,0,0,0-6.505-4.986,16.191,16.191,0,0,1-.37,4.692,41.23,41.23,0,0,0-1.418-5.788,49.271,49.271,0,0,0-6.947-3.3,15.34,15.34,0,0,1,.4,3.9,40.606,40.606,0,0,0-2.038-4.507,51.669,51.669,0,0,0-5.817-1.632,40.471,40.471,0,0,0-6.913-.976L121.6,247.059a40.5,40.5,0,0,0,1.541-6.788,51.931,51.931,0,0,0,.55-6.107q.018-.7.018-1.4a14.474,14.474,0,0,1-2.851,3.494,38.348,38.348,0,0,0,2.612-8.532q-.221-2.284-.639-4.433c-.239-1.252-.536-2.464-.862-3.656a15.546,15.546,0,0,1-3.191,4.06,37.742,37.742,0,0,0,2.3-6.973,46.5,46.5,0,0,0-3.517-7.779,14.909,14.909,0,0,1-1.828,4.091A39.468,39.468,0,0,0,116.215,206.731Z" transform="translate(-76.664 -184.82)" fill="#0046a0" opacity="0.1"/>
                </g>
                <g id="Group_7493" data-name="Group 7493" transform="translate(231.664 51.015)">
                  <g id="Group_7492" data-name="Group 7492">
                    <path id="Path_2675" data-name="Path 2675" d="M408.342,320.2a38.379,38.379,0,0,0,8.9-.7q2.044-1.043,3.891-2.218c1.078-.681,2.1-1.4,3.086-2.142a15.541,15.541,0,0,1-4.947-1.482,37.714,37.714,0,0,0,7.329-.419,46.549,46.549,0,0,0,5.949-6.122,14.9,14.9,0,0,1-4.477-.2,39.1,39.1,0,0,0,6.051-1.857c.29-.4.585-.8.863-1.206a47.61,47.61,0,0,0,4-7.192,16.207,16.207,0,0,1-4.875.759,40.564,40.564,0,0,0,5.821-3.031,46.244,46.244,0,0,0,2.256-7.88,16.2,16.2,0,0,1-4.5,1.375,41.09,41.09,0,0,0,4.866-3.44,49.308,49.308,0,0,0,.53-7.674,15.346,15.346,0,0,1-3.485,1.806,40.536,40.536,0,0,0,3.446-3.548,51.635,51.635,0,0,0-.613-6.01,40.461,40.461,0,0,0-1.625-6.79,40.442,40.442,0,0,0-6.9,1.037,51.859,51.859,0,0,0-5.8,1.684,40.664,40.664,0,0,0-2,4.524,15.373,15.373,0,0,1,.368-3.907,49.279,49.279,0,0,0-6.917,3.366,41.178,41.178,0,0,0-1.366,5.8,16.214,16.214,0,0,1-.411-4.688,46.312,46.312,0,0,0-6.461,5.044,40.527,40.527,0,0,0-.629,6.532,16.2,16.2,0,0,1-1.123-4.8,47.527,47.527,0,0,0-5.17,6.4c-.275.411-.533.833-.795,1.252a39.053,39.053,0,0,0,.545,6.306,14.871,14.871,0,0,1-1.864-4.075,46.484,46.484,0,0,0-3.447,7.81,37.69,37.69,0,0,0,2.357,6.952,15.537,15.537,0,0,1-3.227-4.031c-.315,1.195-.6,2.409-.83,3.664q-.4,2.151-.6,4.439a38.364,38.364,0,0,0,2.688,8.508,14.454,14.454,0,0,1-2.882-3.469q.007.692.031,1.395a51.858,51.858,0,0,0,.6,6.1,40.5,40.5,0,0,0,1.6,6.774,40.548,40.548,0,0,0,6.88-1.053,51.9,51.9,0,0,0,5.883-1.725q.661-.241,1.3-.494A14.4,14.4,0,0,1,408.342,320.2Z" transform="translate(-396.334 -262.227)" fill="#6e7fdd"/>
                    <g id="Group_7491" data-name="Group 7491">
                      <g id="Group_7490" data-name="Group 7490" clip-path="url(#clip-path-2)">
                        <path id="Path_2676" data-name="Path 2676" d="M437.433,294.306l-.175-.656a46.88,46.88,0,0,1-24.182.536l5.772-8.557c13.309,3.374,26.272-2.806,26.4-2.869l-.253-.623c-.128.062-12.725,6.064-25.728,2.87l5.135-7.613c13.374,3.314,25.343-9.514,25.463-9.645l-.476-.457c-.117.127-11.672,12.5-24.565,9.477l5.506-8.163c11.451-1.357,21.748-13.59,21.851-13.715l-.5-.43c-.1.12-9.886,11.739-20.834,13.379l11.341-16.815-.546-.368L430.3,267.47c-2.581-10.765,4.525-24.192,4.6-24.329l-.586-.3c-.076.142-7.561,14.272-4.529,25.4l-5.506,8.163c-7.632-10.822-.49-26.171-.417-26.327l-.6-.27c-.076.16-7.486,16.063.6,27.222l-5.135,7.613c-7.828-10.853-6.988-24.789-6.979-24.93h-.673c-.01.144-.882,14.478,7.232,25.554l-5.772,8.557a46.932,46.932,0,0,1-8.564-22.622l-.674.083a47.6,47.6,0,0,0,8.818,23.16l-4.342,6.438c-7.928-10.79-10.134-20.235-10.156-20.33l-.658.2c.022.1,2.276,9.772,10.4,20.751l-4.735,7.021a51.914,51.914,0,0,1-8.5-17.032l-.658.2A52.612,52.612,0,0,0,402.2,309.14l-3.946,5.85a33.28,33.28,0,0,1-5.409-10.623l-.656.208a33.311,33.311,0,0,0,5.647,11.036l-7.689,11.4.546.368,7.689-11.4a33.292,33.292,0,0,0,12.348,1.1l-.053-.686a33.289,33.289,0,0,1-11.876-1.035l3.946-5.85a52.608,52.608,0,0,0,19.458,1.565l-.061-.685a51.9,51.9,0,0,1-18.976-1.5l4.735-7.021c13.222,3.415,23.036,1.88,23.134,1.864l-.061-.685c-.1.015-9.68,1.508-22.654-1.8l4.342-6.437A47.6,47.6,0,0,0,437.433,294.306Z" transform="translate(-394.223 -255.616)" fill="#b3c9f9"/>
                      </g>
                    </g>
                  </g>
                  <path id="Path_2678" data-name="Path 2678" d="M435.277,305.06c.29-.4.585-.8.863-1.206a47.607,47.607,0,0,0,4-7.192,16.207,16.207,0,0,1-4.875.759,40.564,40.564,0,0,0,5.821-3.031,46.246,46.246,0,0,0,2.256-7.88,16.2,16.2,0,0,1-4.5,1.375,41.092,41.092,0,0,0,4.866-3.44,49.315,49.315,0,0,0,.53-7.674,15.347,15.347,0,0,1-3.485,1.806,40.533,40.533,0,0,0,3.446-3.548,51.635,51.635,0,0,0-.613-6.01,40.46,40.46,0,0,0-1.625-6.79l-42.233,62.616a40.548,40.548,0,0,0,6.88-1.053,51.9,51.9,0,0,0,5.883-1.725q.661-.241,1.3-.494a14.437,14.437,0,0,1-4.3-1.373,38.378,38.378,0,0,0,8.9-.7q2.044-1.043,3.891-2.218c1.078-.681,2.1-1.4,3.086-2.142a15.542,15.542,0,0,1-4.947-1.482,37.715,37.715,0,0,0,7.329-.419,46.549,46.549,0,0,0,5.949-6.122,14.9,14.9,0,0,1-4.477-.2A38.991,38.991,0,0,0,435.277,305.06Z" transform="translate(-397.49 -262.227)" fill="#0046a0" opacity="0.1"/>
                </g>
              </g>
              <ellipse id="Ellipse_385" data-name="Ellipse 385" cx="151.388" cy="11.246" rx="151.388" ry="11.246" transform="translate(20.291 287.311)" fill="#edf0fc"/>
              <g id="Group_7497" data-name="Group 7497" transform="translate(91.889 120.271)">
                <g id="Group_7495" data-name="Group 7495">
                  <rect id="Rectangle_2917" data-name="Rectangle 2917" width="192.099" height="172.328" fill="#f5f9ff"/>
                  <rect id="Rectangle_2918" data-name="Rectangle 2918" width="192.099" height="20.379" fill="#d0dbf7"/>
                </g>
                <g id="Group_7496" data-name="Group 7496" transform="translate(7.67 6.275)">
                  <path id="Path_2679" data-name="Path 2679" d="M148.4,159.526a3.914,3.914,0,1,1-3.915-3.914A3.915,3.915,0,0,1,148.4,159.526Z" transform="translate(-140.568 -155.612)" fill="#eb725f"/>
                  <path id="Path_2680" data-name="Path 2680" d="M168.4,159.526a3.914,3.914,0,1,1-3.915-3.914A3.915,3.915,0,0,1,168.4,159.526Z" transform="translate(-147.387 -155.612)" fill="#f9ab43"/>
                  <path id="Path_2681" data-name="Path 2681" d="M188.4,159.526a3.914,3.914,0,1,1-3.915-3.914A3.915,3.915,0,0,1,188.4,159.526Z" transform="translate(-154.206 -155.612)" fill="#6e7fdd"/>
                </g>
              </g>
              <g id="Group_7500" data-name="Group 7500" transform="translate(127.649 165.5)">
                <g id="Group_7499" data-name="Group 7499">
                  <g id="Group_7498" data-name="Group 7498" transform="translate(5.81 29.741)">
                    <path id="Path_2682" data-name="Path 2682" d="M314.387,264.09c.921-2.334-.38-4.244-2.889-4.244H219.035a7.247,7.247,0,0,0-6.236,4.244l-20.5,51.977c-.921,2.334.38,4.244,2.889,4.244h92.464a7.247,7.247,0,0,0,6.236-4.244Z" transform="translate(-192.008 -259.846)" fill="#ffcf74"/>
                  </g>
                  <path id="Path_2683" data-name="Path 2683" d="M184.866,296.247l20.5-51.977a7.246,7.246,0,0,1,6.236-4.244h72.585V235.42a4.575,4.575,0,0,0-4.562-4.562H247.242a8.469,8.469,0,0,1-6.739-4.01l-4.409-8.121a8.468,8.468,0,0,0-6.739-4.01h-41.6a4.575,4.575,0,0,0-4.562,4.562v76.648a4.579,4.579,0,0,0,3.669,4.472C184.952,300,184.062,298.286,184.866,296.247Z" transform="translate(-183.192 -214.718)" fill="#ffcf74"/>
                </g>
                <path id="Path_2684" data-name="Path 2684" d="M278.75,281.671a17.239,17.239,0,1,0,17.239,17.239A17.239,17.239,0,0,0,278.75,281.671Zm8.435,23.19-2.484,2.484-5.951-5.95-5.951,5.95-2.484-2.484,5.951-5.95-5.951-5.951,2.484-2.484,5.951,5.951,5.951-5.951,2.484,2.484-5.951,5.951Z" transform="translate(-209.896 -237.546)" fill="#eb725f"/>
              </g>
              <g id="Group_7509" data-name="Group 7509" transform="translate(39.092 188.483)">
                <g id="Group_7507" data-name="Group 7507">
                  <g id="Group_7506" data-name="Group 7506">
                    <ellipse id="Ellipse_386" data-name="Ellipse 386" cx="49.99" cy="8.168" rx="49.99" ry="8.168" transform="translate(0 96.57)" fill="#eb725f"/>
                    <path id="Path_2685" data-name="Path 2685" d="M120.291,252.836h-28.1L70.612,353.647A192.224,192.224,0,0,0,106.24,357.5a192.22,192.22,0,0,0,35.627-3.857Z" transform="translate(-56.25 -250.697)" fill="#ffcf74"/>
                    <ellipse id="Ellipse_387" data-name="Ellipse 387" cx="14.051" cy="2.139" rx="14.051" ry="2.139" transform="translate(35.938)" fill="#eb725f"/>
                    <g id="Group_7505" data-name="Group 7505" transform="translate(14.362 2.139)">
                      <g id="Group_7504" data-name="Group 7504" clip-path="url(#clip-path-3)">
                        <g id="Group_7501" data-name="Group 7501" transform="translate(-14.656 75.301)">
                          <path id="Path_2686" data-name="Path 2686" d="M98.045,388.172c-28.925,0-48.459-4.835-49.672-5.142L52.4,367.181,50.385,375.1l2-7.926c.415.1,42.1,10.321,92.981-.084l3.277,16.02A253.263,253.263,0,0,1,98.045,388.172Z" transform="translate(-48.373 -367.095)" fill="#f9ab43"/>
                        </g>
                        <g id="Group_7502" data-name="Group 7502" transform="translate(-14.656 39.727)">
                          <path id="Path_2687" data-name="Path 2687" d="M98.045,334.193c-28.925,0-48.459-4.835-49.672-5.143L52.4,313.2l-2.012,7.924,2-7.926c.415.1,42.1,10.321,92.981-.084l3.277,16.02A253.265,253.265,0,0,1,98.045,334.193Z" transform="translate(-48.373 -313.116)" fill="#f9ab43"/>
                        </g>
                        <g id="Group_7503" data-name="Group 7503" transform="translate(-14.656 4.153)">
                          <path id="Path_2688" data-name="Path 2688" d="M98.045,280.214c-28.925,0-48.459-4.835-49.672-5.143L52.4,259.223l-2.012,7.924,2-7.926c.415.1,42.1,10.321,92.981-.084l3.277,16.02A253.267,253.267,0,0,1,98.045,280.214Z" transform="translate(-48.373 -259.137)" fill="#f9ab43"/>
                        </g>
                      </g>
                    </g>
                  </g>
                  <path id="Path_2690" data-name="Path 2690" d="M145.2,301.477c0,21.92-4.537,41.721-11.836,55.863a188.862,188.862,0,0,0,29.9-3.693L141.687,252.836h-5.034C142,266.159,145.2,283.07,145.2,301.477Z" transform="translate(-77.645 -250.697)" fill="#0046a0" opacity="0.1"/>
                </g>
                <g id="Group_7508" data-name="Group 7508" transform="translate(21.896 16.146)" opacity="0.3">
                  <path id="Path_2691" data-name="Path 2691" d="M97.612,275.637q-.77,3.716-1.541,7.431l-3.7,17.851q-2.25,10.85-4.5,21.7Q85.935,331.958,84,341.3c-.625,3.014-1.4,6.036-1.882,9.076-.007.043-.018.085-.026.128-.517,2.492,3.366,3.2,3.882.714s1.027-4.954,1.541-7.431l3.7-17.851q2.25-10.85,4.5-21.7l3.872-18.675c.625-3.014,1.4-6.036,1.882-9.076.007-.043.018-.086.026-.128.516-2.492-3.367-3.2-3.882-.714Z" transform="translate(-82.043 -274.091)" fill="#fff"/>
                </g>
              </g>
              <g id="Group_7516" data-name="Group 7516" transform="translate(180.425 236.129)">
                <g id="Group_7512" data-name="Group 7512" transform="translate(0 29.409)">
                  <g id="Group_7510" data-name="Group 7510" transform="translate(0 0)">
                    <rect id="Rectangle_2919" data-name="Rectangle 2919" width="96.906" height="5.952" transform="translate(0 26.601) rotate(-15.932)" fill="#6e7fdd"/>
                  </g>
                  <g id="Group_7511" data-name="Group 7511" transform="translate(50.69)">
                    <rect id="Rectangle_2920" data-name="Rectangle 2920" width="44.191" height="5.952" transform="translate(0 12.131) rotate(-15.932)" fill="#eb725f"/>
                  </g>
                </g>
                <g id="Group_7515" data-name="Group 7515" transform="translate(61.759)">
                  <g id="Group_7513" data-name="Group 7513">
                    <circle id="Ellipse_388" data-name="Ellipse 388" cx="29.83" cy="29.83" r="29.83" transform="translate(0 5.053) rotate(-4.859)" fill="#eb725f"/>
                    <circle id="Ellipse_389" data-name="Ellipse 389" cx="24.012" cy="24.012" r="24.012" transform="translate(0.552 44.408) rotate(-65.972)" fill="#d0dbf7"/>
                  </g>
                  <g id="Group_7514" data-name="Group 7514" transform="translate(27.09 13.488)">
                    <path id="Path_2692" data-name="Path 2692" d="M421.29,355.972l-2.862.817a15.812,15.812,0,0,0-19.523-10.851l-.817-2.862A18.792,18.792,0,0,1,421.29,355.972Z" transform="translate(-398.088 -342.353)" fill="#fff"/>
                  </g>
                </g>
              </g>
              <g id="Group_7519" data-name="Group 7519" transform="translate(147.446 80.411)">
                <g id="Group_7517" data-name="Group 7517" transform="translate(59.031 30.118)">
                  <path id="Path_2693" data-name="Path 2693" d="M348.52,139.964l-28.551-8.656L302.8,187.935l44.363,13.45,12.508-41.259Z" transform="translate(-302.802 -131.308)" fill="#e2e6ff"/>
                  <path id="Path_2694" data-name="Path 2694" d="M355.309,174.231l-2.04-3.816-9.141,4.887-4.888-9.14-3.815,2.04,4.888,9.14-9.141,4.887,2.04,3.816,9.141-4.888,4.888,9.141,3.816-2.04-4.888-9.14Z" transform="translate(-312.475 -143.192)" fill="#cad2f9"/>
                </g>
                <g id="Group_7518" data-name="Group 7518">
                  <path id="Path_2695" data-name="Path 2695" d="M242.218,85.608l-28.987,7.061,14,57.491,45.04-10.972L262.072,97.3Z" transform="translate(-213.231 -85.608)" fill="#e2e6ff"/>
                  <path id="Path_2696" data-name="Path 2696" d="M260.267,115.916l-3.7-2.248-5.387,8.856-8.856-5.386-2.248,3.7,8.856,5.386-5.387,8.856,3.7,2.248,5.387-8.856,8.856,5.386,2.248-3.7-8.856-5.386Z" transform="translate(-222.385 -95.175)" fill="#cad2f9"/>
                </g>
              </g>
              <g id="Group_7520" data-name="Group 7520" transform="translate(48.848 78.219)">
                <path id="Path_2697" data-name="Path 2697" d="M402.356,89.651h-7.369V82.282h-2.622v7.369H385v2.622h7.368v7.368h2.622V92.273h7.369Z" transform="translate(-173.198 -82.282)" fill="#e2e6ff"/>
                <path id="Path_2698" data-name="Path 2698" d="M431.486,129.857h-4.014v-4.014h-1.429v4.014h-4.013v1.428h4.013V135.3h1.429v-4.014h4.014Z" transform="translate(-185.825 -97.134)" fill="#e2e6ff"/>
                <path id="Path_2699" data-name="Path 2699" d="M363.247,118.793h-4.86v-4.86h-1.73v4.86H351.8v1.73h4.86v4.86h1.73v-4.86h4.86Z" transform="translate(-161.878 -93.074)" fill="#e2e6ff"/>
                <path id="Path_2700" data-name="Path 2700" d="M80.981,116.345H73.612v-7.368H70.99v7.368H63.622v2.623H70.99v7.368h2.622v-7.368h7.369Z" transform="translate(-63.622 -91.384)" fill="#e2e6ff"/>
                <path id="Path_2701" data-name="Path 2701" d="M133.871,111.408h-4.014v-4.014h-1.429v4.014h-4.014v1.428h4.014v4.014h1.429v-4.014h4.014Z" transform="translate(-84.35 -90.844)" fill="#e2e6ff"/>
                <path id="Path_2702" data-name="Path 2702" d="M95.761,160.632H90.9v-4.86h-1.73v4.86h-4.86v1.729h4.86v4.86H90.9v-4.86h4.86Z" transform="translate(-70.676 -107.339)" fill="#e2e6ff"/>
              </g>
              <g id="Group_7521" data-name="Group 7521" transform="translate(35.927 70.366)">
                <path id="Path_2703" data-name="Path 2703" d="M344.877,74.13a1.6,1.6,0,1,1-1.6-1.6A1.6,1.6,0,0,1,344.877,74.13Z" transform="translate(-145.508 -71.105)" fill="#cad2f9"/>
                <path id="Path_2704" data-name="Path 2704" d="M452.852,160.538a3.025,3.025,0,1,1-3.025-3.025A3.025,3.025,0,0,1,452.852,160.538Z" transform="translate(-181.35 -100.08)" fill="#cad2f9"/>
                <path id="Path_2705" data-name="Path 2705" d="M309.04,99.407a1.6,1.6,0,1,1-1.6-1.6A1.6,1.6,0,0,1,309.04,99.407Z" transform="translate(-133.29 -79.723)" fill="#cad2f9"/>
                <path id="Path_2706" data-name="Path 2706" d="M169.529,73.391a3.025,3.025,0,1,1-3.025-3.025A3.025,3.025,0,0,1,169.529,73.391Z" transform="translate(-84.749 -70.366)" fill="#cad2f9"/>
                <path id="Path_2707" data-name="Path 2707" d="M188.84,122.793a1.6,1.6,0,1,1-1.6-1.6A1.6,1.6,0,0,1,188.84,122.793Z" transform="translate(-92.306 -87.697)" fill="#cad2f9"/>
                <path id="Path_2708" data-name="Path 2708" d="M47.212,169.731a1.6,1.6,0,1,1-1.6-1.6A1.6,1.6,0,0,1,47.212,169.731Z" transform="translate(-44.017 -103.701)" fill="#cad2f9"/>
              </g>
            </g>
          </svg>
          <p class="text-[13px] text-[#192537] font-semibold">No Rows To Show</p>
        </div>
      `,
    };
    this.emitFilterMethod();
  }



  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.emitFilterMethod();
    
    // Ensure tooltips are added before sizing columns
    this.addColumnTooltips();
    
    // Update column definitions to apply tooltips
    if (this.colDefs && this.colDefs.length > 0) {
      params.api.setGridOption('columnDefs', this.colDefs);
    }
    
    params.api.sizeColumnsToFit();
    
    // Add animation class after grid is ready
    setTimeout(() => {
      const gridElement = document.querySelector('.ag-grid-container');
      if (gridElement) {
        gridElement.classList.add('ag-grid-loaded');
      }
    }, 100);
    
    params.api.refreshCells();
    this.gridReadyApi.emit(params);
  }

  private emitFilterMethod() {
    if (this.gridApi) {
      const filterMethod = (filterText: string) => {
        if (this.agGrid?.api && !this.agGrid.api.isDestroyed?.()) {
          this.agGrid.api.setGridOption('quickFilterText', filterText);
          const displayedRowCount = this.agGrid.api.getDisplayedRowCount();
          this.noRowsToShow.emit(displayedRowCount === 0);
        }
      };
      this.filterMethodReady.emit(filterMethod);
    }
  }

  onRowClicked(event: RowClickedEvent) {
    if (this.enableRowClick) {
      this.rowClicked.emit(event.data);
    }
  }

  onSelectionChanged(event: any) {
    this.selectedRows = event.api.getSelectedRows();
    this.rowsSelected.emit(this.selectedRows);
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortState = event.api.getColumnState();
    const sortModel = sortState.filter(column => column.sort).map(column => ({
      field: column.colId,
      direction: column.sort
    }));
    this.sortChanged.emit(sortModel.length > 0 ? sortModel : []);
  }

  private calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRows / this.perPage);
  }

  previousPage(): void {
    if (this.current1Page > 1) {
      this.current1Page--;
      this.emitPaginationChange();
    }
  }
  nextPage(): void {
    if (this.current1Page < this.totalPages) {
      this.current1Page++;
      this.emitPaginationChange();
    }
  }
  goToFirstPage(): void {
    if (this.current1Page > 1) {
      this.current1Page = 1;
      this.emitPaginationChange();
    }
  }
  goToLastPage(): void {
    if (this.current1Page < this.totalPages) {
      this.current1Page = this.totalPages;
      this.emitPaginationChange();
    }
  }
  onPageSizeChange(): void {
    this.current1Page = 1;
    this.calculateTotalPages();
    this.emitPaginationChange();
  }
  emitPaginationChange(): void {
    this.paginationChanged.emit({
      page: this.current1Page,
      pageSize: this.perPage,
    });    
  }
}
