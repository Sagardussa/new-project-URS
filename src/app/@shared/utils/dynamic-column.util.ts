import type { ColDef } from 'ag-grid-community';

export interface DynamicColumnConfig {
  excludedFields?: string[];
  customFormatters?: Record<string, (value: any) => string>;
  customWidths?: Record<string, number>;
  customHeaders?: Record<string, string>;
}

export class DynamicColumnUtil {
  /**
   * Generate dynamic column definitions based on API response data
   */
  static generateColumnDefs(
    data: any[],
    config: DynamicColumnConfig = {}
  ): ColDef[] {
    if (!data || data.length === 0) {
      return [];
    }

    const firstItem = data[0];
    const fields = Object.keys(firstItem);
    
    // Default excluded fields (can be overridden)
    const defaultExcludedFields = new Set(['id', 'uuid', 'createdAt', 'updatedAt', '__v', '_id']);
    const excludedFields = config.excludedFields 
      ? new Set(config.excludedFields) 
      : defaultExcludedFields;
    
    // Filter and process fields dynamically
    const displayFields = fields.filter(field => !excludedFields.has(field));
    
    const dynamicColumns: ColDef[] = [];
    
    displayFields.forEach(field => {
      const sampleValue = firstItem[field];
      const colDef: ColDef = {
        headerName: config.customHeaders?.[field] || this.generateHeaderName(field),
        field: field,
        width: config.customWidths?.[field] || this.calculateColumnWidth(field, sampleValue),
        cellStyle: { color: '#192537CC' },
        sortable: true,
        filter: false,
        resizable: true,
      };

      // Add custom formatting based on data type or custom formatters
      const customFormatter = config.customFormatters?.[field];
      const autoFormatter = customFormatter || this.getValueFormatter(field, sampleValue);
      
      if (autoFormatter) {
        if (field.toLowerCase().includes('status')) {
          colDef.cellRenderer = (params: { value: any }) => autoFormatter(params.value);
        } else {
          colDef.valueFormatter = (params) => autoFormatter(params.value);
        }
      }

      dynamicColumns.push(colDef);
    });

    return dynamicColumns;
  }

  /**
   * Generate human-readable header name from field name
   */
  private static generateHeaderName(fieldName: string): string {
    return fieldName
      .replaceAll(/([A-Z])/g, ' $1') // Add space before capital letters
      .replaceAll(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /**
   * Calculate appropriate column width based on field name and sample value
   */
  private static calculateColumnWidth(fieldName: string, sampleValue: any): number {
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

  /**
   * Get appropriate value formatter based on data type and field name
   */
  private static getValueFormatter(fieldName: string, sampleValue: any): ((value: any) => string) | null {
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

  /**
   * Check if a string value looks like a date
   */
  private static isDateString(value: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(value) && !Number.isNaN(Date.parse(value));
  }
}