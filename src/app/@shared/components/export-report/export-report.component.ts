import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-export-report',
    imports: [CommonModule],
    templateUrl: './export-report.component.html',
    styleUrl: './export-report.component.css'
})
export class ExportReportComponent {
// //////////////////////////// grop by dropdown ///////////////////////
dropdownOpen = false;
toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
}
closeDropdown() {
  this.dropdownOpen = false;
}
}
