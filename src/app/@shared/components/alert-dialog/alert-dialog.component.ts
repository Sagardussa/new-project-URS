import { Component, Input, OnInit } from '@angular/core';
import { AlertDialogService } from './alert-dialog.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'alert-dialog',
    imports: [CommonModule],
    templateUrl: './alert-dialog.component.html',
    styleUrl: './alert-dialog.component.css'
})
export class AlertDialogComponent implements OnInit {
  isVisible: boolean = false;
  @Input() successIcon: string = 'assets/InvoiceSent.svg';
  @Input() errorIcon: string = 'assets/InvoiceSent.svg';
  defaultIcon: string = 'assets/InvoiceSent.svg';
  alertType: 'success' | 'error' | 'info' = 'success';
  @Input() title: string = 'Vendor Invite Sent Successfully!';
  @Input() message: string =
    'The vendor has been notified and will receive an email with steps to join the platform.';
  buttonText: string = 'Close';

  constructor(private readonly alertService: AlertDialogService) {}

  ngOnInit(): void {
    // Subscribe to the alert state from the service
    this.alertService.alertState$.subscribe((alert) => {
      if (alert) {
        this.isVisible = alert.isVisible;
        this.alertType = alert.type;
        this.title = alert.title;
        this.message = alert.message;
        this.buttonText = alert.buttonText;
      }
    });
  }

  close() {
    this.alertService.closeAlert();
  }
}
