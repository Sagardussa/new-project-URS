import { Component, OnInit } from '@angular/core';
import {
  Router,
  NavigationEnd,
  RouterLinkActive,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared';

@Component({
    selector: 'app-menubar',
    imports: [CommonModule, SharedModule, RouterLinkActive],
    templateUrl: './menubar.component.html',
    styleUrl: './menubar.component.css'
})
export class MenubarComponent implements OnInit {

  navbarClass: string = 'bg-white text-[#19253799]';
  hideNavbarContent: boolean = false;
  currentRoute: string = '';

  constructor(
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    this.onPageChange();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
      }
    });
  }

  onPageChange() {
    this.navbarClass =
      'bg-white text-[#19253799] shadow-md shadow-[0px 15px 30px #00000033]';
  }
}
