import { Component } from '@angular/core';
import { NavbarComponent } from './header/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [NavbarComponent, FooterComponent, CommonModule, SharedModule, RouterOutlet],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {}
