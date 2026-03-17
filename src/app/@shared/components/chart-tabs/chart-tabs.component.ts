import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-chart-tabs',
    imports: [
        CommonModule
    ],
    templateUrl: './chart-tabs.component.html',
    styleUrl: './chart-tabs.component.css'
})
export class ChartTabsComponent {
  @Input() tabs: string[] = [];  // Accepts an array of tab labels
  activeTab: string = '';

  ngOnInit() {
    if (this.tabs.length > 0) {
      this.activeTab = this.tabs[0];  // Set the first tab as active by default
    }
  }

  selectTab(tab: string) {
    this.activeTab = tab;
  }
}
