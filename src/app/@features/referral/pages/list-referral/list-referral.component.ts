import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from '@app/@shared';
import { ReferralService } from '../../services/referral.service';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { TextTransformUtil } from '@shared/utils/text-transform.util';

interface AttributionData {
  device?: string;
  ipAddress?: string;
  refereeEmail?: string;
  signupSource?: string;
  signupTimestamp?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-list-referral',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './list-referral.component.html',
  styleUrl: './list-referral.component.css',
})
export class ListReferralComponent implements OnInit {
  columnDefs: ColDef[] = [];
  totalRows = 0;
  pageSize = 10;
  currentPage = 1;
  loading = true;
  error = '';
  rowData: any[] = [];
  showAttributionModal = false;
  attributionData: any = null;

  constructor(
    private readonly referral: ReferralService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadReferrals();
  }

  private loadReferrals(): void {
    this.loading = true;
    this.error = '';
    this.referral.fetchList(this.currentPage, this.pageSize).subscribe({
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
        console.error(error);
        this.error = 'Failed to load referrals';
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
    
    // Define column configuration for referral fields
    const columnConfig: Record<string, { headerName: string; width?: number; formatter?: (value: any) => string }> = {
      referrerUserId: { headerName: 'Referrer User ID', width: 150 },
      referrerUserType: { headerName: 'Referrer Type', width: 150, formatter: (value) => TextTransformUtil.toSentenceCase(value) },
      refereeUserId: { headerName: 'Referee User ID', width: 150 },
      refereeUserType: { headerName: 'Referee Type', width: 150, formatter: (value) => TextTransformUtil.toSentenceCase(value) },
      status: { headerName: 'Status', width: 120 },
      lifecycleStage: { headerName: 'Lifecycle Stage', width: 180, formatter: (value) => TextTransformUtil.toSentenceCase(value) },
      totalRewardsEarned: { headerName: 'Total Rewards', width: 140 },
      // createdAt: { headerName: 'Created At', width: 180 },
      // lastEventAt: { headerName: 'Last Event At', width: 180 },
      // attributionData: { headerName: 'Attribution Data', width: 140 },
    };

    const dynamicColumns: ColDef[] = [];
    const columnOrder = [
      'referrerUserId',
      'referrerUserType',
      'refereeUserId',
      'refereeUserType',
      'status',
      'lifecycleStage',
      'totalRewardsEarned',
      'createdAt',
      'lastEventAt',
      'attributionData'
    ];

    columnOrder.forEach(field => {
      if (firstItem.hasOwnProperty(field) && columnConfig[field]) {
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

        // Add custom formatting
        if (field === 'status') {
          colDef.cellRenderer = (params: ICellRendererParams) => {
            return this.createStatusRenderer(params);
          };
        } else if (field === 'referrerUserType' || field === 'refereeUserType' || field === 'lifecycleStage') {
          colDef.valueFormatter = (params) => TextTransformUtil.toSentenceCase(params.value);
        } else if (field === 'createdAt' || field === 'lastEventAt') {
          colDef.cellRenderer = (params: { value: string }) => {
            if (!params.value) return 'N/A';
            try {
              return new Date(params.value).toLocaleString();
            } catch {
              return params.value;
            }
          };
        } else if (field === 'attributionData') {
          colDef.cellRenderer = (params: ICellRendererParams) => {
            return this.createAttributionDataRenderer(params);
          };
        } else if (field === 'totalRewardsEarned') {
          colDef.cellRenderer = (params: { value: number }) => {
            return params.value?.toString() ?? '0';
          };
        } else if (config.formatter) {
          colDef.valueFormatter = (params) => config.formatter!(params.value);
        }

        dynamicColumns.push(colDef);
      }
    });

    this.columnDefs = dynamicColumns;
  }

  private getDefaultColumnDefs(): ColDef[] {
    return [
      {
        headerName: 'Referrer User ID',
        field: 'referrerUserId',
        width: 150,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Referrer Type',
        field: 'referrerUserType',
        width: 150,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
        valueFormatter: (params) => TextTransformUtil.toSentenceCase(params.value),
      },
      {
        headerName: 'Referee User ID',
        field: 'refereeUserId',
        width: 150,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Referee Type',
        field: 'refereeUserType',
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
        cellRenderer: (params: ICellRendererParams) => {
          return this.createStatusRenderer(params);
        },
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Lifecycle Stage',
        field: 'lifecycleStage',
        width: 180,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
        valueFormatter: (params) => TextTransformUtil.toSentenceCase(params.value),
      },
      {
        headerName: 'Total Rewards',
        field: 'totalRewardsEarned',
        width: 140,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
    ];
  }

  onPaginationChanged(event: { page: number; pageSize: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.loadReferrals();
  }

  openAttributionModal(data: AttributionData): void {
    this.attributionData = data;
    this.showAttributionModal = true;
  }

  closeAttributionModal(): void {
    this.showAttributionModal = false;
    this.attributionData = null;
  }

  formatAttributionData(data: any): string {
    if (!data || typeof data !== 'object') return 'No data available';
    return JSON.stringify(data, null, 2);
  }

  getAttributionEntries(): Array<{ key: string; value: any }> {
    if (!this.attributionData || typeof this.attributionData !== 'object') {
      return [];
    }
    return Object.entries(this.attributionData).map(([key, value]) => ({
      key: this.formatKey(key),
      value: this.formatValue(value)
    }));
  }

  formatKey(key: string): string {
    return key
      .replaceAll(/([A-Z])/g, ' $1')
      .replaceAll(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && this.isDateString(value)) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return String(value);
  }

  private isDateString(value: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(value) && !Number.isNaN(Date.parse(value));
  }

  private createStatusRenderer(params: ICellRendererParams): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.height = '100%';
    
    const status = params.value ?? '';
    const statusUpper = status.toUpperCase();
    
    // Color mapping for different statuses with text and background colors
    const statusConfig: Record<string, { textColor: string; backgroundColor: string }> = {
      'ACTIVE': {
        textColor: '#16a34a', // Dark vibrant green
        backgroundColor: '#dcfce7' // Light pastel green
      },
      'INACTIVE': {
        textColor: '#ef4444',
        backgroundColor: '#fee2e2'
      },
      'PENDING': {
        textColor: '#f59e0b',
        backgroundColor: '#fef3c7'
      },
      'COMPLETED': {
        textColor: '#3b82f6',
        backgroundColor: '#dbeafe'
      },
    };
    
    const config = statusConfig[statusUpper] ?? {
      textColor: '#6b7280',
      backgroundColor: '#f3f4f6'
    };
    
    const span = document.createElement('span');
    span.textContent = TextTransformUtil.toSentenceCase(params.value ?? '');
    span.style.color = config.textColor;
    span.style.fontWeight = '600';
    span.style.backgroundColor = config.backgroundColor;
    span.style.padding = '4px 12px';
    span.style.fontSize = '12px';
    span.style.borderRadius = '9999px';
    span.style.display = 'inline-block';
    span.style.lineHeight = '1.5';
    
    div.appendChild(span);
    return div;
  }

  private createAttributionDataRenderer(params: ICellRendererParams): HTMLElement {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-center h-full';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    
    const value = params.value as AttributionData | undefined;
    if (!value || typeof value !== 'object') {
      div.textContent = 'N/A';
      return div;
    }
    
    const entries = Object.entries(value);
    if (entries.length === 0) {
      div.textContent = 'N/A';
      return div;
    }
    
    const viewLink = document.createElement('button');
    viewLink.type = 'button';
    viewLink.title = 'View Attribution Data';
    viewLink.classList.add('cursor-pointer', 'flex', 'justify-center', 'items-center');
    viewLink.style.background = 'none';
    viewLink.style.border = 'none';
    viewLink.style.padding = '0';
    
    const viewSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    viewSvg.setAttribute('class', 'w-4 h-4');
    viewSvg.setAttribute('fill', 'none');
    viewSvg.setAttribute('viewBox', '0 0 24 24');
    viewSvg.setAttribute('stroke', 'currentColor');
    
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('stroke-linecap', 'round');
    path1.setAttribute('stroke-linejoin', 'round');
    path1.setAttribute('stroke-width', '2');
    path1.setAttribute('d', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z');
    
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('stroke-linecap', 'round');
    path2.setAttribute('stroke-linejoin', 'round');
    path2.setAttribute('stroke-width', '2');
    path2.setAttribute('d', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z');
    
    viewSvg.appendChild(path1);
    viewSvg.appendChild(path2);
    viewLink.appendChild(viewSvg);
    
    viewLink.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openAttributionModal(value);
    });
    
    div.appendChild(viewLink);
    return div;
  }
}
