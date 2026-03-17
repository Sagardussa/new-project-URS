import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { NavbarService, AuthService, ClickOutsideDirective } from '@core';
import { Subscription, Subject } from 'rxjs';
import { SharedModule } from '@shared';
import { MenubarComponent } from '../menubar/menubar.component';
@Component({
    selector: 'app-navbar',
    imports: [CommonModule, SharedModule, MenubarComponent, ClickOutsideDirective],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

  isTrue: boolean = false;
  isNavUserDropdown: boolean = false;
  isSidebarOpen = false;
  navbarClass: string = 'bg-white text-[#19253799]';
  showNavbar: boolean = true;
  currentRoute: string = '';
  subscription: Subscription;
  isActive: boolean = false;
  private userDropdownCloseTimeout: any;
  userDropdownAnimationClass: string = 'fade-in';
  private readonly destroy$ = new Subject<void>();

  private firstNavigationHandled = false;

  constructor(
    private readonly router: Router,
    private readonly navbarServices: NavbarService,
    private readonly authService: AuthService,
  ) {
    this.subscription = this.navbarServices.showNavbar.subscribe((value) => {
      this.showNavbar = value;
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
        this.firstNavigationHandled = true;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    if (this.userDropdownCloseTimeout) {
      clearTimeout(this.userDropdownCloseTimeout);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  openMenu() {
    this.isTrue = !this.isTrue;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  onBackdropKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      this.closeSidebar();
    }
  }

  closeMenu(): void {
    this.isTrue = false;
  }

  closeUserDropdown(): void {
    this.isNavUserDropdown = false;
  }

  closeAllMenus(): void {
    this.isTrue = false;
    this.isNavUserDropdown = false;
    this.isSidebarOpen = false;
  }

  openUserDropdown() {
    this.isNavUserDropdown = !this.isNavUserDropdown;
  }

  showUserDropdown() {
    if (this.userDropdownCloseTimeout) {
      clearTimeout(this.userDropdownCloseTimeout);
      this.userDropdownCloseTimeout = null;
    }
    this.isNavUserDropdown = true;
    this.userDropdownAnimationClass = 'fade-in';
  }

  hideUserDropdown() {
    this.userDropdownAnimationClass = 'fade-out';
    
    this.userDropdownCloseTimeout = setTimeout(() => {
      this.isNavUserDropdown = false;
      this.userDropdownAnimationClass = 'fade-in';
    }, 200);
  }

  ngOnInit(): void {
    if (!this.firstNavigationHandled) {
      this.currentRoute = this.router.url;
    }
  }

  /**
   * Get user's display name (no profile API)
   */
  getUserDisplayName(): string {
    return 'Admin';
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
    this.closeAllMenus();
  }

  signout() {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.removeTokens();
        this.router.navigate(['/auth/login']);
        this.closeAllMenus();
      },
      error: () => {
        this.authService.removeTokens();
        this.router.navigate(['/auth/login']);
        this.closeAllMenus();
      }
    });
  }
}
