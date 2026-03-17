import { Component, OnInit } from '@angular/core';
import { FooterService } from '@core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-footer',
    imports: [CommonModule],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  year: number = new Date().getFullYear();


  currentRoute: string = '';
  isFooterVisible: boolean = true;
  constructor(private readonly footerService: FooterService) { }

  ngOnInit(): void {
    this.footerService.showFooter.subscribe((isVisible) => {
      this.isFooterVisible = isVisible;
    });
  }
}
