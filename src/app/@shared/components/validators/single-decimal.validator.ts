import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validator for experience field
 * Ensures only one decimal place (e.g., 3.5, 7.8, 12.9)
 */
export function singleDecimalValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;

  const stringValue = value.toString();
  
  // Check if value has more than one decimal place
  const decimalParts = stringValue.split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > 1) {
    return { singleDecimal: true };
  }

  return null;
}
