import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-chart-heading',
    imports: [],
    templateUrl: './chart-heading.component.html',
    styleUrl: './chart-heading.component.css'
})
export class ChartHeadingComponent {
  @Input() title: string = '';
  @Input() subtitle?: string; // Optional subtitle

}
