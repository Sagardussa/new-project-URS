import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

export interface AlertOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonText?: string;
  cancelButtonColor?: string;
  showCancelButton?: boolean;
  showCloseButton?: boolean;
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
  timer?: number;
  timerProgressBar?: boolean;
  toast?: boolean;
  position?: 'top' | 'top-start' | 'top-end' | 'center' | 'center-start' | 'center-end' | 'bottom' | 'bottom-start' | 'bottom-end';
  showConfirmButton?: boolean;
  width?: string | number;
  background?: string;
  customClass?: {
    container?: string;
    popup?: string;
    header?: string;
    title?: string;
    closeButton?: string;
    icon?: string;
    image?: string;
    content?: string;
    input?: string;
    actions?: string;
    confirmButton?: string;
    cancelButton?: string;
    footer?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor() { }

  /**
   * Show a basic alert message
   */
  showAlert(title: string, text?: string, icon: SweetAlertIcon = 'info', options?: AlertOptions): Promise<SweetAlertResult> {
    // Use toast format for better UX
    const message = text ? `${title}: ${text}` : title;
    return this.showSimpleToast(message, icon);
  }

  /**
   * Show a success alert
   */
  showSuccess(title: string, text?: string, options?: AlertOptions): Promise<SweetAlertResult> {
    const message = text ? `${title}: ${text}` : title;
    return this.showSimpleToast(message, 'success');
  }

  /**
   * Show an error alert
   */
  showError(title: string, text?: string, options?: AlertOptions): Promise<SweetAlertResult> {
    const message = text ? `${title}: ${text}` : title;
    return this.showSimpleToast(message, 'error');
  }

  /**
   * Show a warning alert
   */
  showWarning(title: string, text?: string, options?: AlertOptions): Promise<SweetAlertResult> {
    const message = text ? `${title}: ${text}` : title;
    return this.showSimpleToast(message, 'warning');
  }

  /**
   * Show an info alert
   */
  showInfo(title: string, text?: string, options?: AlertOptions): Promise<SweetAlertResult> {
    const message = text ? `${title}: ${text}` : title;
    return this.showSimpleToast(message, 'info');
  }

  /**
   * Show a confirmation dialog
   */
  async showConfirm(
    title: string, 
    text?: string, 
    icon: SweetAlertIcon = 'warning', 
    confirmButtonText: string = 'Yes', 
    cancelButtonText: string = 'No',
    options?: AlertOptions
  ): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      reverseButtons: false,
      allowOutsideClick: false,
      ...options
    });
    
    return result.isConfirmed;
  }

  /**
   * Show a delete confirmation dialog
   */
  async showDeleteConfirm(
    title: string = 'Are you sure?', 
    text: string = 'You won\'t be able to revert this!',
    options?: AlertOptions
  ): Promise<boolean> {
    return this.showConfirm(title, text, 'warning', 'Yes, delete it!', 'Cancel', {
      confirmButtonColor: '#d33',
      ...options
    });
  }

  /**
   * Show a toast notification
   */
  showToast(
    icon: SweetAlertIcon, 
    title: string, 
    position: 'top' | 'top-start' | 'top-end' | 'center' | 'center-start' | 'center-end' | 'bottom' | 'bottom-start' | 'bottom-end' = 'top-end',
    timer: number = 2000,
    options?: AlertOptions
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      toast: true,
      position,
      icon,
      title,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
      ...options
    });
  }

  /**
   * Show a success toast
   */
  showSuccessToast(title: string, position?: any, timer: number = 2000): Promise<SweetAlertResult> {
    return this.showSimpleToast(title, 'success', timer);
  }

  /**
   * Show an error toast
   */
  showErrorToast(title: string, position?: any, timer: number = 2000): Promise<SweetAlertResult> {
    return this.showSimpleToast(title, 'error', timer);
  }

  /**
   * Show a warning toast
   */
  showWarningToast(title: string, position?: any, timer: number = 2000): Promise<SweetAlertResult> {
    return this.showSimpleToast(title, 'warning', timer);
  }

  /**
   * Show an info toast
   */
  showInfoToast(title: string, position?: any, timer: number = 2000): Promise<SweetAlertResult> {
    return this.showSimpleToast(title, 'info', timer);
  }

  /**
   * Show a loading alert
   */
  showLoading(title: string = 'Loading...', text?: string): void {
    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Close any open SweetAlert dialog
   */
  close(): void {
    Swal.close();
  }

  /**
   * Show an input dialog
   */
  async showInput(
    title: string,
    inputPlaceholder: string = '',
    inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'range' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'url' = 'text',
    options?: AlertOptions
  ): Promise<string | null> {
    const result = await Swal.fire({
      title,
      input: inputType,
      inputPlaceholder,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      inputValidator: (value: any) => {
        if (!value) {
          return 'You need to write something!';
        }
        return null;
      },
      ...options
    });

    return result.isConfirmed ? result.value : null;
  }

  /**
   * Show a custom HTML alert
   */
  showHtml(title: string, html: string, icon?: SweetAlertIcon, options?: AlertOptions): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      html,
      icon,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6',
      ...options
    });
  }

  /**
   * Show a simplified toast notification with just message and icon
   * Displays on the right side of the screen in a single line
   */
  showSimpleToast(
    message: string,
    icon: SweetAlertIcon = 'info',
    timer: number = 2000
  ): Promise<SweetAlertResult> {
    // Format message to ensure it displays in 1-2 lines max
    const formattedMessage = message
      .replaceAll('\n', ' ')  // Replace newlines with spaces
      .replaceAll('  ', ' ') // Replace multiple spaces with single space
      .trim();
    
    // Inject CSS only once if not already present
    if (!document.getElementById('swal2-toast-compact-style')) {
      const style = document.createElement('style');
      style.id = 'swal2-toast-compact-style';
      style.textContent = `
        .swal2-toast-compact {
          max-width: 400px !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          transition: max-width 0.3s ease !important;
        }
        .swal2-toast-compact:hover {
          max-width: 600px !important;
        }
        .swal2-toast-title-compact {
          font-size: 14px !important;
          line-height: 1.4 !important;
          max-height: 2.8em !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          white-space: normal !important;
          word-break: break-word !important;
          margin: 0 !important;
          padding: 0 8px 0 0 !important;
          transition: max-height 0.3s ease !important;
        }
        .swal2-toast-compact:hover .swal2-toast-title-compact {
          max-height: none !important;
          -webkit-line-clamp: unset !important;
          display: block !important;
          overflow: visible !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: formattedMessage,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      width: 'auto',
      padding: '12px 16px',
      customClass: {
        popup: 'swal2-toast-compact',
        title: 'swal2-toast-title-compact',
        icon: 'swal2-toast-icon'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  }

  /**
   * Show an auto-close alert with timer
   */
  showTimedAlert(
    title: string, 
    text?: string, 
    icon: SweetAlertIcon = 'info', 
    timer: number = 2000,
    options?: AlertOptions
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon,
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
      ...options
    });
  }
}
