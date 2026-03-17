import { Directive, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[maxLength]',
  standalone: true
})
export class MaxLengthDirective {
  @Input('maxLength') maxLength!: number;
  constructor(private readonly control: NgControl) { }
 @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value.length > this.maxLength) {
      input.value = input.value.slice(0, this.maxLength);
      this.control.control?.setValue(input.value);
    }
  }
}
