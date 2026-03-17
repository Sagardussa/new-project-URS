import { Component, Input, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-page-heading',
    imports: [CommonModule],
    templateUrl: './page-heading.component.html',
    styleUrl: './page-heading.component.css'
})
export class PageHeadingComponent {
  @Input() title: string = '';
  @Input() subtitle?: string; // Optional subtitle

  activeTab: number = 1;
  constructor(private router: Router){}

    selectTab(tabIndex: number) {
      this.activeTab = tabIndex;
    }
  

}
