import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import type { ColDef } from 'ag-grid-community';
import { SharedModule } from '@shared';
import { ReferralCodesService } from '../../services/referral-codes.service';
import { AlertService } from '@core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TextTransformUtil } from '@shared/utils/text-transform.util';

@Component({
  selector: 'app-list-referral-codes',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule],
  templateUrl: './list-referral-codes.component.html',
  styleUrl: './list-referral-codes.component.css',
})
export class ListReferralCodesComponent implements OnInit, OnDestroy {
  searchPlaceholder = 'Search by User ID...';
  columnDefs: ColDef[] = [];
  totalRows = 0;
  pageSize = 10;
  currentPage = 1;
  searchText = '';
  loading = true;
  error = '';
  rowData: any[] = [];
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly referralCodesService: ReferralCodesService,
    private readonly alertService: AlertService,
    private readonly router: Router
  ) {
    // Setup debounced search
    this.searchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.currentPage = 1; // Reset to first page on search
        this.loadReferralCodes(searchTerm);
      });
  }

  ngOnInit(): void {
    this.loadReferralCodes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReferralCodes(userId?: string): void {
    this.loading = true;
    this.referralCodesService.getReferralCodes(this.currentPage, this.pageSize, userId).subscribe({
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
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load referral codes';
        this.loading = false;
      },
    });
  }

  private buildColumnDefs(data: any[]): void {
    if (!data || data.length === 0) {
      this.columnDefs = this.getDefaultColumnDefs();
      return;
    }

    const firstItem = data[0];
    const fields = Object.keys(firstItem);
    
    const columnConfig: Record<string, { headerName: string; formatter?: (value: any) => string; width?: number; specialRenderer?: string }> = {
      code: { headerName: 'Code', width: 160, specialRenderer: 'code' },
      userId: { headerName: 'User ID', width: 130 },
      userType: { headerName: 'User Type', width: 140, formatter: (value) => TextTransformUtil.toSentenceCase(value) },
      usageCount: { headerName: 'Usage Count', width: 130, formatter: (value) => value ?? '0' },
      maxUses: { headerName: 'Max Uses', width: 120, formatter: (value) => (value == null ? 'Unlimited' : String(value)) },
      isCustom: { headerName: 'Custom', width: 110, specialRenderer: 'isCustom' },
      // lastUsedAt: { headerName: 'Last Used At', width: 170, formatter: (value) => value ? new Date(value).toLocaleString() : '—' },
      // expiresAt: { headerName: 'Expires At', width: 150, formatter: (value) => value ? new Date(value).toLocaleDateString() : 'Never' },
      status: { headerName: 'Status', width: 120, specialRenderer: 'status' },
    };

    const dynamicColumns: ColDef[] = [];
    
    // Define the order of columns to display
    const columnOrder = ['code', 'userId', 'userType', 'usageCount', 'maxUses', 'isCustom', 'status'];
    
    // Fields to exclude from display (internal/system fields)
    const excludedFields = new Set(['id', 'uuid', 'createdAt', 'updatedAt', '__v', '_id', 'programId', 'action', 'lastUsedAt', 'expiresAt']);
    
    columnOrder.forEach(field => {
      if (fields.includes(field) && columnConfig[field] && !excludedFields.has(field)) {
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

        // Apply special formatting for code field
        if (config.specialRenderer === 'code') {
          colDef.cellStyle = { color: '#192537CC', fontWeight: '600' };
        }

        // Apply formatter if provided
        if (config.formatter) {
          colDef.valueFormatter = (params) => config.formatter!(params.value);
        }

        // Apply special renderers
        if (config.specialRenderer === 'isCustom') {
          colDef.cellStyle = { textAlign: 'center', verticalAlign: 'middle' };
          colDef.cellRenderer = (params: { data: any }) => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-center h-full';
            const isCustom = params.data?.isCustom ?? false;
            div.innerHTML = `
              <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                isCustom ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }">
                ${isCustom ? 'Yes' : 'No'}
              </span>
            `;
            return div;
          };
        } else if (config.specialRenderer === 'status') {
          colDef.cellStyle = { textAlign: 'center', verticalAlign: 'middle' };
          colDef.cellRenderer = (params: { data: any }) => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-center h-full';
            const status: string = params.data?.status ?? '';
            const isActive = status.toUpperCase() === 'ACTIVE';
            const displayStatus = TextTransformUtil.toSentenceCase(status);
            div.innerHTML = `
              <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }">
                ${displayStatus || '—'}
              </span>
            `;
            return div;
          };
        }

        // Apply text alignment for numeric fields
        if (field === 'usageCount' || field === 'maxUses') {
          colDef.cellStyle = { ...colDef.cellStyle, textAlign: 'center' };
        }

        dynamicColumns.push(colDef);
      }
    });

    this.columnDefs = dynamicColumns;
  }

  private getDefaultColumnDefs(): ColDef[] {
    const columns: ColDef[] = [
      {
        headerName: 'Code',
        field: 'code',
        width: 160,
        cellStyle: { color: '#192537CC', fontWeight: '600' },
        sortable: true,
        filter: false,
        resizable: true,
      },
      {
        headerName: 'User ID',
        field: 'userId',
        width: 130,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
        resizable: true,
      },
      {
        headerName: 'User Type',
        field: 'userType',
        width: 140,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
        resizable: true,
        valueFormatter: (params) => TextTransformUtil.toSentenceCase(params.value),
      },
      {
        headerName: 'Usage Count',
        field: 'usageCount',
        width: 130,
        cellStyle: { color: '#192537CC', textAlign: 'center' },
        sortable: true,
        filter: false,
        resizable: true,
        valueFormatter: (params) => params.value ?? '0',
      },
      {
        headerName: 'Max Uses',
        field: 'maxUses',
        width: 120,
        cellStyle: { color: '#192537CC', textAlign: 'center' },
        sortable: true,
        filter: false,
        resizable: true,
        valueFormatter: (params) => (params.value ?? 'Unlimited'),
      },
      {
        headerName: 'Custom',
        field: 'isCustom',
        width: 110,
        sortable: true,
        filter: false,
        resizable: true,
        cellStyle: { textAlign: 'center', verticalAlign: 'middle' },
        cellRenderer: (params: { data: any }) => {
          const div = document.createElement('div');
          div.className = 'flex items-center justify-center h-full';
          const isCustom = params.data?.isCustom ?? false;
          div.innerHTML = `
            <span class="px-2 py-1 text-xs font-semibold rounded-full ${
              isCustom ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }">
              ${isCustom ? 'Yes' : 'No'}
            </span>
          `;
          return div;
        },
      },
      // {
      //   headerName: 'Last Used At',
      //   field: 'lastUsedAt',
      //   width: 170,
      //   cellStyle: { color: '#192537CC' },
      //   sortable: true,
      //   filter: false,
      //   resizable: true,
      //   valueFormatter: (params) =>
      //     params.value ? new Date(params.value).toLocaleString() : '—',
      // },
      // {
      //   headerName: 'Expires At',
      //   field: 'expiresAt',
      //   width: 150,
      //   cellStyle: { color: '#192537CC' },
      //   sortable: true,
      //   filter: false,
      //   resizable: true,
      //   valueFormatter: (params) =>
      //     params.value ? new Date(params.value).toLocaleDateString() : 'Never',
      // },
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        sortable: true,
        filter: false,
        resizable: true,
        cellStyle: { textAlign: 'center', verticalAlign: 'middle' },
        cellRenderer: (params: { data: any }) => {
          const div = document.createElement('div');
          div.className = 'flex items-center justify-center h-full';
          const status: string = params.data?.status ?? '';
          const isActive = status.toUpperCase() === 'ACTIVE';
          const displayStatus = TextTransformUtil.toSentenceCase(status);
          div.innerHTML = `
            <span class="px-2 py-1 text-xs font-semibold rounded-full ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }">
              ${displayStatus || '—'}
            </span>
          `;
          return div;
        },
      },
    ];

    return columns;
  }

  onView(data: any): void {
    const uuid = data?.uuid || data?.id;
    if (!uuid) return;
    // Pass the referral code data via router state
    this.router.navigate(['/referral-codes/view', uuid], {
      state: { referralCodeData: data }
    });
  }

  onPaginationChanged(event: { page: number; pageSize: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.loadReferralCodes(this.searchText);
   }

  onSearchChange(event: any): void {
    if (event?.target) {
      const searchTerm = event.target.value || '';
      this.searchText = searchTerm;
      this.searchSubject.next(searchTerm);
    }
  }

}
