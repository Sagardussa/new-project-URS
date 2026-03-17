import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-success',
    imports: [CommonModule],
    templateUrl: './success.component.html',
    styleUrl: './success.component.css'
})
export class SuccessComponent {
  @Input() imageUrl: string = ''; // Default image URL if needed
  @Input() heading: string = 'Success!';
  @Input() paragraph: string = 'Operation completed successfully';
}
