import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchTerm: string | null | undefined, field?: string): any[] {
    // Return all items if no items, no search term, or empty search term
    if (!items || !searchTerm || (typeof searchTerm === 'string' && searchTerm.trim() === '')) {
      return items;
    }

    const searchLower = String(searchTerm).toLowerCase().trim();
    
    return items.filter(item => {
      if (field) {
        // Filter by specific field
        const fieldValue = this.getNestedProperty(item, field);
        return fieldValue ? String(fieldValue).toLowerCase().includes(searchLower) : false;
      } else {
        // Filter by any string property (search in headerName, field, and other string properties)
        // Prioritize searching in common display fields like headerName, name, label, title
        const searchFields = ['headerName', 'name', 'label', 'title', 'field'];
        for (const searchField of searchFields) {
          if (item[searchField] && String(item[searchField]).toLowerCase().includes(searchLower)) {
            return true;
          }
        }
        // Fallback: search in all string values
        return Object.values(item).some(value => {
          if (value == null || typeof value === 'object' || Array.isArray(value)) {
            return false;
          }
          return String(value).toLowerCase().includes(searchLower);
        });
      }
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}

