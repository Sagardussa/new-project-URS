import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[phoneMask]',
  standalone:true
})
export class PhoneMaskDirective {
  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2,
    private readonly control: NgControl
  ) {}

  @HostListener('input', ['$event']) 
  onInputChange(event: InputEvent): void {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value.replace(/\D/g, '');
    if (value.length > 3 && value.length <= 6) {
      value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
      
    } else if (value.length > 6) {
      value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 10)}`;
    }

    // Update the input value and form control
    this.renderer.setProperty(this.el.nativeElement, 'value', value);
    this.control.control?.setValue(value, { emitEvent: false });
  }
}
