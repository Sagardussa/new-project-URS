import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import type { ColDef } from 'ag-grid-community';
import { AlertService } from '@core';
import { ProgramsService } from '../../services/programs.service';
import { PageHeadingComponent } from '@shared/components/page-heading/page-heading.component';
import { DynamicTableComponent } from '@shared/components/dynamic-table/dynamic-table.component';
import { TextTransformUtil } from '@shared/utils/text-transform.util';


@Component({
  selector: 'app-list-programs',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeadingComponent, DynamicTableComponent],
  templateUrl: './list-programs.component.html',
  styleUrl: './list-programs.component.css',
})
export class ListProgramsComponent implements OnInit {
  searchPlaceholder = 'Search programs...';
  columnDefs: ColDef[] = [];
  totalRows = 0;
  pageSize = 10;
  currentPage = 1;
  searchText = '';
  loading = true;
  error = '';
  rowData: any[] = [];

  constructor(
    private readonly programsService: ProgramsService,
    private readonly router: Router,
    private readonly alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadPrograms();
  }

  private loadPrograms(): void {
    this.loading = true;
    this.programsService.list(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response?.data?.record) {
          this.rowData = response.data.record;
          this.totalRows = response.data.meta?.total || 0;
          this.currentPage = response.data.meta?.page || 1;
          this.pageSize = response.data.meta?.limit || 10;
          this.buildColumnDefs(this.rowData);
        } else {
          this.rowData = [];
          this.buildColumnDefs([]);
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load programs';
        this.loading = false;
      }
    });
  }

  private buildColumnDefs(data: any[]): void {
    if (!data || data.length === 0) {
      this.columnDefs = this.getDefaultColumnDefs();
      return;
    }
  
    const firstItem = data[0];
    const fields = Object.keys(firstItem);
  
    const columnConfig: Record<string, { headerName: string; formatter?: (value: any) => string; width?: number }> = {
      name:         { headerName: 'Name',          width: 200 },
      description:  { headerName: 'Description',   width: 250 },
      slug:         { headerName: 'Slug',           width: 150 },
      referrerType: { headerName: 'Referrer Type',  width: 150, formatter: (value) => TextTransformUtil.toSentenceCase(value) },
      refereeType:  { headerName: 'Referee Type',   width: 150, formatter: (value) => TextTransformUtil.toSentenceCase(value) },
      status:       { headerName: 'Status',         width: 120 },
    };
  
    const dynamicColumns: ColDef[] = [];
  
    const columnOrder = ['name', 'description', 'slug', 'referrerType', 'refereeType', 'status'];
  
    columnOrder.forEach(field => {
      if (fields.includes(field) && columnConfig[field]) {
        const config = columnConfig[field];
        const colDef: ColDef = {
          headerName: config.headerName,
          field: field,
          width: config.width,
          cellStyle: { color: '#192537CC' },
          sortable: true,
          filter: false,
          resizable: true,
        };
    
        // Use cellRenderer for status to render HTML color
        if (field === 'status') {
          colDef.cellRenderer = (params: { value: string }) => {
            const value = params.value ?? '';
            const colorMap: Record<string, string> = {
              ACTIVE: '#22c55e',
              INACTIVE: '#ef4444',
              DRAFT: '#f59e0b',
              PENDING: '#f59e0b',
            };
            const color = colorMap[value.toUpperCase()] ?? '#6b7280';
            const displayValue = TextTransformUtil.toSentenceCase(value);
            return `<span style="color:${color};font-weight:600">${displayValue}</span>`;
          };
        } else if (config.formatter) {
          colDef.valueFormatter = (params) => config.formatter!(params.value);
        }
    
        dynamicColumns.push(colDef);
      }
    });

    this.columnDefs = dynamicColumns;
  }

  private generateHeaderName(fieldName: string): string {
    // Convert camelCase or snake_case to Title Case
    return fieldName
      .replaceAll(/([A-Z])/g, ' $1') // Add space before capital letters
      .replaceAll(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  private calculateColumnWidth(fieldName: string, sampleValue: any): number {
    // Base width calculation based on field name and content
    const baseWidth = Math.max(fieldName.length * 12, 120);
    
    if (typeof sampleValue === 'boolean') return 150;
    if (typeof sampleValue === 'number') return 120;
    if (typeof sampleValue === 'object' && sampleValue !== null) return 300;
    if (typeof sampleValue === 'string') {
      if (sampleValue.length > 50) return 300;
      if (sampleValue.length > 20) return 250;
      return Math.max(baseWidth, 180);
    }
    
    return baseWidth;
  }

  private getValueFormatter(fieldName: string, sampleValue: any): ((value: any) => string) | null {
    // Boolean formatting
    if (typeof sampleValue === 'boolean') {
      return (value: boolean) => {
        if (value === null || value === undefined) return 'N/A';
        return value ? 'Yes' : 'No';
      };
    }
    
    // Object formatting
    if (typeof sampleValue === 'object' && sampleValue !== null) {
      return (value: Record<string, any>) => {
        if (value === null || value === undefined) return 'N/A';
        if (!value || typeof value !== 'object') return 'N/A';
        const entries = Object.entries(value);
        if (entries.length === 0) return 'N/A';
        return entries.map(([key, val]) => `${key}: ${val}`).join(', ');
      };
    }
    
    // Date formatting
    if (typeof sampleValue === 'string' && this.isDateString(sampleValue)) {
      return (value: string) => {
        if (value === null || value === undefined) return 'N/A';
        if (!value) return 'N/A';
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      };
    }
    
    // Status formatting (if field name suggests it's a status)
    if (fieldName.toLowerCase().includes('status') && typeof sampleValue === 'string') {
      return (value: string = '') => {
        if (value === null || value === undefined) return 'N/A';
        const colorMap: Record<string, string> = {
          'ACTIVE': '#22c55e',
          'INACTIVE': '#ef4444',
          'DRAFT': '#f59e0b',
          'PENDING': '#f59e0b',
          'APPROVED': '#22c55e',
          'REJECTED': '#ef4444',
        };
        const color = colorMap[value.toUpperCase()] ?? '#6b7280';
        return `<span style="color:${color};font-weight:600">${value}</span>`;
      };
    }
    
    // Default formatter for all other fields to handle null values
    return (value: any) => {
      if (value === null || value === undefined) return 'N/A';
      return String(value);
    };
  }

  private isDateString(value: string): boolean {
    // Check if string looks like a date
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(value) && !Number.isNaN(Date.parse(value));
  }

  private getDefaultColumnDefs(): ColDef[] {
    return [
      {
        headerName: 'Name',
        field: 'name',
        width: 200,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Slug',
        field: 'slug',
        width: 150,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Referrer Type',
        field: 'referrerType',
        width: 150,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
        valueFormatter: (params) => TextTransformUtil.toSentenceCase(params.value),
      },
      {
        headerName: 'Referee Type',
        field: 'refereeType',
        width: 150,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
        valueFormatter: (params) => TextTransformUtil.toSentenceCase(params.value),
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        cellRenderer: (params: { value: string }) => {
          const status = params.value ?? '';
          const colorMap: Record<string, string> = {
            ACTIVE: '#22c55e',
            INACTIVE: '#ef4444',
            DRAFT: '#f59e0b',
          };
          const color = colorMap[status] ?? '#6b7280';
          const displayStatus = TextTransformUtil.toSentenceCase(status);
          return `<span style="color:${color};font-weight:600">${displayStatus}</span>`;
        },
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
    ];
  }

  onView(row: any): void {
    if (row?.uuid) {
      this.router.navigate(['/programs/view', row.uuid]);
    }
  }

  onEdit(row: any): void {
    if (row?.uuid) {
      this.router.navigate(['/programs/edit', row.uuid]);
    }
  }

  onDeleteClicked(row: any): void {
    if (row?.uuid) {
      this.onDelete(row.uuid);
    }
  }

  onPaginationChanged(event: { page: number; pageSize: number }): void {
  }

  onSearchChange(event: unknown): void {
  }

  onDelete(uuid: string): void {
    this.alertService.showConfirm('Are you sure you want to delete this program?').then(
      (confirmed) => {
        if (confirmed) {
          this.loading = true;
          this.programsService.delete(uuid).subscribe({
            next: (response: any) => {
              this.loadPrograms();
              this.alertService.showSuccess('Program deleted successfully');
              this.loading = false;
            },
            error: (error) => {
              console.error('Error deleting program:', error);
              this.alertService.showError('Failed to delete program');
              this.loading = false;
            }
          });
        }
      }
    );
  }
}
