import { AbstractControl, ValidationErrors } from '@angular/forms';

export function validUrlValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null; // Not required
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
  return urlPattern.test(value) ? null : { invalidUrl: true };
} 