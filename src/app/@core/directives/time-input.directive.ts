import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appTimeInput]',
  standalone: true
})
export class TimeInputDirective {
  @Input() timeType: 'hours' | 'minutes' = 'hours'; // Defines if it's for hours or minutes

  constructor(private readonly el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    let inputValue: string = this.el.nativeElement.value;

    // Remove non-numeric characters
    inputValue = inputValue.replace(/\D/g, '');

    // Restrict range based on timeType
    if (this.timeType === 'hours') {
      if (+inputValue > 23) inputValue = '23';
    } else if (this.timeType === 'minutes') {
      if (+inputValue > 59) inputValue = '59';
    }

    // Ensure max length of 2 digits
    if (inputValue.length > 2) {
      inputValue = inputValue.substring(0, 2);
    }

    this.el.nativeElement.value = inputValue;
  }
}
