import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLinkActive, RouterModule } from '@angular/router';

interface MenuItem { label: string; routerLink: string; }
@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, RouterLinkActive, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() menuItems: MenuItem[] = [];
  constructor(){}
  
}
