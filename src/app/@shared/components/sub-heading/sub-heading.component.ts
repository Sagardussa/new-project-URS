import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-sub-heading',
    imports: [CommonModule],
    templateUrl: './sub-heading.component.html',
    styleUrl: './sub-heading.component.css'
})
export class SubHeadingComponent {
  @Input() title: string = '';
  activeTab: number = 1;
  constructor(private router: Router){}

    selectTab(tabIndex: number) {
      this.activeTab = tabIndex;
    }
}
