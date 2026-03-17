import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'lib-page-spinner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './page-spinner.component.html',
    styleUrls: ['./page-spinner.component.css']
})
export class PageSpinnerComponent {
    @Input() size: 'small' | 'medium' | 'large' = 'medium';
    @Input() color: string = '#4361ee';
    @Input() className: string = '';

    get spinnerSize() {
        switch (this.size) {
            case 'small':
                return { width: '32', height: '32' };
            case 'medium':
                return { width: '48', height: '48' };
            case 'large':
                return { width: '64', height: '64' };
            default:
                return { width: '48', height: '48' };
        }
    }

    get containerClass() {
        const baseClass = 'm-auto animate-spin-smooth';
        return this.className ? `${baseClass} ${this.className}` : baseClass;
    }
} 