import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertDialogService {
  private alertSubject = new Subject<any>();

  // Observable for the alert dialog
  alertState$ = this.alertSubject.asObservable();

  buttonText: string = 'Close';

  // Method to show the alert dialog
  showAlert(type: string, title: string, message: string) {
    this.alertSubject.next({
      isVisible: true,
      type,
      title,
      message,
      buttonText: this.buttonText,
    });
  }

  // Method to close the alert dialog
  closeAlert() {
    this.alertSubject.next({ isVisible: false });
  }

  async showConfirm(
    title: string,
    text: string,
    icon: SweetAlertIcon = 'warning',
    confirmButtonText: string = 'Yes',
    cancelButtonText: string = 'No'
  ): Promise<boolean> {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: false,
    }).then((result) => result.isConfirmed);
  }
}
