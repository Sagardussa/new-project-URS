import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import type { ColDef } from 'ag-grid-community';
import { SharedModule } from '@shared';
import { EventsService } from '../../services/events.service';
import { AlertService } from '@core';

@Component({
  selector: 'app-list-events',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule],
  templateUrl: './list-events.component.html',
  styleUrl: './list-events.component.css',
})
export class ListEventsComponent implements OnInit{
  searchPlaceholder = 'Search events...';
  columnDefs: ColDef[] = [];
  filteredData: Event[] = [];
  totalRows = 0;
  pageSize = 10;
  currentPage = 1;
  searchText = '';
  loading = true;
  error = '';
  rowData: any[] = [];

  constructor(
    private readonly eventsService: EventsService,
    private readonly router: Router,
    private readonly alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.loading = true;
    this.eventsService.getEvents().subscribe({
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
        this.error = 'Failed to load events';
        this.loading = false;
      }
    })
  }


  private buildColumnDefs(data: any[]): void {
    if (!data || data.length === 0) {
      this.columnDefs = this.getDefaultColumnDefs();
      return;
    }

    const firstItem = data[0];
    const fields = Object.keys(firstItem);
    
    const columnConfig: Record<string, { headerName: string; formatter?: (value: any) => string; width?: number }> = {
      displayName: { headerName: 'Display Name', width: 200 },
      eventName: { headerName: 'Event Name', width: 250 },
      category: { headerName: 'Category', width: 150 },
      description: { headerName: 'Description', width: 300 },
      status: { headerName: 'Status', width: 120 },
      };

    const dynamicColumns: ColDef[] = [];
    
    // Define the order of columns to display
    const columnOrder = ['displayName', 'eventName', 'category', 'description', 'status'];
    
    columnOrder.forEach(field => {
      if (fields.includes(field) && columnConfig[field]) {
        const config = columnConfig[field];
        dynamicColumns.push({
          headerName: config.headerName,
          field: field,
          width: config.width,
          cellStyle: { color: '#192537CC' },
          valueFormatter: config.formatter ? (params) => config.formatter!(params.value) : undefined,
          sortable: true,
          filter: false,
          resizable: true,
        });
      }
    });

    dynamicColumns.push({
      headerName: 'Status',
      field: 'isActive',
      width: 120,
      sortable: true,
      filter: true,
      resizable: true,
      cellStyle: { textAlign: 'center', verticalAlign: 'middle' },
      cellRenderer: (params: { data: any }) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-center h-full';
        const isActive = params.data?.isActive ?? false;
        const uuid = params.data?.uuid;
        
        div.innerHTML = `
          <label class="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              class="sr-only peer" 
              ${isActive ? 'checked' : ''}
              data-uuid="${uuid}"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        `;
        
        const toggle = div.querySelector('input[type="checkbox"]');
        if (toggle && uuid) {
          toggle.addEventListener('change', (e) => {
            e.stopPropagation();
            const newStatus = (e.target as HTMLInputElement).checked;
            this.onStatusToggle(uuid, newStatus);
          });
        }
        
        return div;
      },
    });

    this.columnDefs = dynamicColumns;
  }

  private getDefaultColumnDefs(): ColDef[] {
    return [
      {
        headerName: 'Display Name',
        field: 'displayName',
        width: 200,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Event Name',
        field: 'eventName',
        width: 250,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Category',
        field: 'category',
        width: 150,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Description',
        field: 'description',
        width: 300,
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
      },
      // {
      //   headerName: 'Status',
      //   field: 'isActive',
      //   width: 120,
      //   valueFormatter: (params) => (params.value ? 'Active' : 'Inactive'),
      //   cellStyle: { color: '#192537CC' },
      //   sortable: true,
      //   filter: true,
      // },
     
      {
        headerName: 'Status',
        field: 'isActive',
        width: 120,
        sortable: true,
        filter: false,
        resizable: true,
        cellStyle: { textAlign: 'center', verticalAlign: 'middle' },
        cellRenderer: (params: { data: any }) => {
          const div = document.createElement('div');
          div.className = 'flex items-center justify-center h-full';
          const isActive = params.data?.isActive ?? false;
          const uuid = params.data?.uuid;
          
          div.innerHTML = `
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                class="sr-only peer" 
                ${isActive ? 'checked' : ''}
                data-uuid="${uuid}"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          `;
          
          const toggle = div.querySelector('input[type="checkbox"]');
          if (toggle && uuid) {
            toggle.addEventListener('change', (e) => {
              e.stopPropagation();
              const newStatus = (e.target as HTMLInputElement).checked;
              this.onStatusToggle(uuid, newStatus);
            });
          }
          
          return div;
        },
      },
    ];
  }

  onPaginationChanged(event: { page: number; pageSize: number }): void {
  }

  onSearchChange(event: unknown): void {
  }

  onEdit(id: string | number): void {
    this.router.navigate(['/events/edit', id]);
  }

  onDelete(id: string | number) {
   
    this.alertService.showConfirm('Are you sure you want to delete this event?.').then(
      (confirmed) => {
        if (confirmed) {
          this.loading = true;
          this.eventsService.delete(String(id)).subscribe({
            next: (response : any) => {
              if (response.statusCode === 200) {
                this.loadEvents();
                this.alertService.showSuccess('Event deleted successfully');
              } else {
                this.alertService.showError('Failed to delete event');
              }
            },
            error: (error) => {
              console.error('Error deleting event:', error);
              this.alertService.showError('Failed to delete event');
            }
          })
        }
      }
    )
  }

  onStatusToggle(uuid: string, isActive: boolean): void {
    this.eventsService.updateEventStatus(uuid, isActive).subscribe({
      next: (response: any) => {
        if (response.statusCode === 200) {
          this.alertService.showSuccess(`Event ${isActive ? 'activated' : 'deactivated'} successfully`);
          this.loadEvents();
        } else {
          this.alertService.showError('Failed to update event status');
          this.loadEvents(); // Reload to revert the toggle
        }
      },
      error: (error) => {
        console.error('Error updating event status:', error);
        this.alertService.showError('Failed to update event status');
        this.loadEvents(); // Reload to revert the toggle
      }
    });
  }
}
  
  

