import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-chart-dropdown',
    imports: [CommonModule],
    templateUrl: './chart-dropdown.component.html',
    styleUrl: './chart-dropdown.component.css'
})
export class ChartDropdownComponent {
  @Input() title: string = ''; // Title of the dropdown button
  @Input() items: { label: string; link: string }[] = []; // Array of items for the dropdown
  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  onSelectChange(selectedLink: string) {
    // Logic to handle the selected option
    if (selectedLink) {
      window.location.href = selectedLink; // Navigate to the selected link
    }
  }
}
