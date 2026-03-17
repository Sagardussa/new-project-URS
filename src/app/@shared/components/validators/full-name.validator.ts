import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validator for full name field
 * Ensures:
 * - At least 2 words (First + Last name)
 * - Only alphabetic characters, spaces, and apostrophes
 */
export function fullNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.trim();
  if (!value) return null; // Let required validator handle empty values

  // Must contain at least 2 words (First + Last)
  const parts = value.split(' ').filter((p: string) => p.length > 0);

  if (parts.length < 2) {
    return { fullNameRequired: true };
  }

  // Only alphabets and apostrophes allowed
  const regex = /^[A-Za-z']+( [A-Za-z']+)*$/;

  return regex.test(value) ? null : { invalidName: true };
}
