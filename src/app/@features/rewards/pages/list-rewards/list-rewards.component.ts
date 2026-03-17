import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@shared';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { RewardsService, BalanceRecord, TransactionRecord } from '@features/rewards';
import { TextTransformUtil } from '@shared/utils/text-transform.util';

@Component({
  selector: 'app-list-rewards',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule, AgGridAngular],
  templateUrl: './list-rewards.component.html',
  styleUrl: './list-rewards.component.css',
})
export class ListRewardsComponent implements OnInit {
  /** For currency pipe: numeric balance (USD or points as number) */
  walletBalance = 0;
  lastUpdated: Date | null = null;
  isRefreshingWallet = false;
  isLoadingTransactions = false;
  /** First wallet from API (for display); currency is always points */
  balanceRecord: BalanceRecord | null = null;
  totalBalance = 0;
  balanceError = '';

  transactions: TransactionRecord[] = [];
  transactionsError = '';
  totalRows = 0;
  currentPage = 1;
  totalPages = 0;
  perPage = 10;
  paginationPageSizeSelector = [10, 20, 50, 100];

  columnDefs: ColDef[] = [];
  /** Column defs built once from config so widths stay stable on refresh */
  private columnDefsBuilt = false;
  gridOptions: GridOptions = {
    domLayout: 'normal',
    suppressHorizontalScroll: false,
    rowHeight: 60,
    defaultColDef: {
      sortable: true,
      resizable: true,
    },
  };

  constructor(private readonly rewardsService: RewardsService) {}

  ngOnInit(): void {
    this.loadBalance();
    this.loadTransactions();
  }

  private buildColumnDefs(data: Record<string, unknown>[]): void {
    if (!data || data.length === 0) {
      this.columnDefs = this.getDefaultColumnDefs();
      this.columnDefsBuilt = false;
      return;
    }
    if (this.columnDefsBuilt) {
      return;
    }

    const firstItem = data[0];
    const fields = Object.keys(firstItem);

    const columnConfig: Record<
      string,
      { headerName: string; width?: number; flex?: number; minWidth?: number; formatter?: (value: unknown, row?: TransactionRecord) => string; cellStyle?: (params: { data: TransactionRecord }) => Record<string, string> }
    > = {
      userId: { headerName: 'User ID', width: 140, minWidth: 140 },
      transactionType: { headerName: 'Transaction Type', width: 150, minWidth: 150, formatter: (value) => TextTransformUtil.toSentenceCase(value as string) },
      pointsAmount: {
        headerName: 'Points Amount',
        width: 140,
        minWidth: 140,
        formatter: (value, row) => {
          if (row == null) return '';
          const num = Number(value ?? 0);
          const isCredit = this.isCreditTransaction(row);
          const sign = isCredit ? '+' : '-';
          return `${sign}${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts`;
        },
        cellStyle: (params) => {
          const isCredit = this.isCreditTransaction(params.data);
          return { color: isCredit ? '#059669' : '#dc2626', fontWeight: '600' };
        },
      },
      description: {
        headerName: 'Description',
        flex: 1,
        minWidth: 220,
        formatter: (value) => this.formatDescriptionValue(value),
      },
    };

    const columnOrder = ['userId', 'transactionType', 'pointsAmount', 'description'];

    const dynamicColumns: ColDef[] = [];

    columnOrder.forEach((field) => {
      if (!fields.includes(field)) return;
      const config = columnConfig[field];
      const colDef: ColDef = {
        headerName: config?.headerName ?? this.generateHeaderName(field),
        field,
        width: config?.width,
        minWidth: config?.minWidth ?? 120,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
        resizable: true,
      };
      if (config?.flex != null) colDef.flex = config.flex;
      if (config?.cellStyle) colDef.cellStyle = config.cellStyle as (params: unknown) => Record<string, string>;
      if (config?.formatter) {
        colDef.valueFormatter = (params) => config.formatter!(params.value, params.data as TransactionRecord);
        if (field === 'description') {
          colDef.autoHeight = true;
          colDef.wrapText = true;
        }
      }
      dynamicColumns.push(colDef);
    });

    this.columnDefs = dynamicColumns;
    this.columnDefsBuilt = true;
  }

  private generateHeaderName(fieldName: string): string {
    return fieldName
      .replaceAll(/([A-Z])/g, ' $1')
      .replaceAll(/[_-]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /** EARNED / CREDIT = credit (green), REDEEMED / EXPIRED / ADJUSTED = debit (red) */
  private isCreditTransaction(row: TransactionRecord | null | undefined): boolean {
    if (!row?.transactionType) return false;
    const t = String(row.transactionType).toUpperCase();
    return t === 'EARNED' || t === 'CREDIT' || t === 'CREDITED';
  }

  private getDefaultColumnDefs(): ColDef[] {
    return [
      { headerName: 'User ID', field: 'userId', width: 140, minWidth: 140, cellStyle: { color: '#192537CC' }, sortable: true, filter: false, resizable: true },
      { headerName: 'Transaction Type', field: 'transactionType', width: 150, minWidth: 150, cellStyle: { color: '#192537CC' }, sortable: true, filter: false, resizable: true, valueFormatter: (params) => TextTransformUtil.toSentenceCase(params.value) },
      { headerName: 'Points Amount', field: 'pointsAmount', width: 140, minWidth: 140, cellStyle: { color: '#192537CC' }, sortable: true, filter: false, resizable: true },
      { headerName: 'Description', field: 'description', flex: 1, minWidth: 220, cellStyle: { color: '#192537CC' }, sortable: true, filter: false, resizable: true },
    ];
  }

  getFormattedTime(): string {
    if (!this.lastUpdated) return '';
    return this.lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  loadBalance(): void {
    this.balanceError = '';
    this.isRefreshingWallet = true;
    this.rewardsService.getBalances().subscribe({
      next: (res) => {
        if (res?.data) {
          const data = res.data;
          this.balanceRecord = data.record?.[0] ?? null;
          this.totalBalance =
            data.totalBalance ?? (Number(this.balanceRecord?.currentBalance) || 0);
          this.walletBalance = this.totalBalance;
          this.lastUpdated = new Date();
          if (this.transactions.length > 0) {
            this.buildColumnDefs(this.transactions as unknown as Record<string, unknown>[]);
          }
        } else {
          this.balanceRecord = null;
          this.totalBalance = 0;
          this.walletBalance = 0;
        }
        this.isRefreshingWallet = false;
      },
      error: (err) => {
        console.error(err);
        this.balanceError = 'Failed to load balance';
        this.balanceRecord = null;
        this.totalBalance = 0;
        this.walletBalance = 0;
        this.isRefreshingWallet = false;
      },
    });
  }

  loadTransactions(): void {
    this.transactionsError = '';
    this.rewardsService.getTransactions(this.currentPage, this.perPage).subscribe({
      next: (res) => {
        if (res?.data?.record) {
          this.transactions = res.data.record;
          const meta = res.data.meta ?? {};
          this.totalRows = meta.total ?? 0;
          this.currentPage = meta.page ?? 1;
          this.perPage = meta.limit ?? 10;
          this.totalPages = Math.ceil(this.totalRows / this.perPage) || 1;
          this.buildColumnDefs(this.transactions as unknown as Record<string, unknown>[]);
        } else {
          this.transactions = [];
          this.totalRows = 0;
          this.totalPages = 0;
          this.buildColumnDefs([]);
        }
        this.isLoadingTransactions = false;
      },
      error: (err) => {
        console.error(err);
        this.transactionsError = 'Failed to load transactions';
        this.transactions = [];
        this.buildColumnDefs([]);
        this.isLoadingTransactions = false;
      },
    });
  }

  refreshWalletData(): void {
    this.loadBalance();
  }

  onGridReady(params: GridReadyEvent): void {
    params.api?.sizeColumnsToFit?.();
  }

  goToFirstPage(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTransactions();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTransactions();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
    this.loadTransactions();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  private formatDescriptionValue(value: any): string {
    if (value == null) {
      return '';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }
}
