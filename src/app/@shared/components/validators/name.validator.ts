import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validator for individual name fields (first name or last name)
 * Ensures only alphabetic characters, spaces, and apostrophes
 */
export function nameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.trim();
  if (!value) return null; // Let required validator handle empty values

  // Only alphabets and apostrophes allowed
  const regex = /^[A-Za-z']+$/;

  return regex.test(value) ? null : { invalidName: true };
}
