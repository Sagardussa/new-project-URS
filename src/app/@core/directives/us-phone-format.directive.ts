import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appUsPhoneFormat]'
})
export class UsPhoneFormatDirective {

  constructor(private readonly el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInputChange(event: any): void {
    const input = this.el.nativeElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    let formatted = '';
    if (value.length > 0) {
      formatted = '(' + value.substring(0, 3);
    }
    if (value.length >= 4) {
      formatted += ') ' + value.substring(3, 6);
    }
    if (value.length >= 7) {
      formatted += '-' + value.substring(6);
    }

    input.value = formatted;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    nativeInputValueSetter?.call(input, formatted);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }
}
