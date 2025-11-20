import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida CEP brasileiro nos formatos 00000-000 ou 00000000.
 */
export function cepValidator(): ValidatorFn {
  const regex = /^\d{5}-?\d{3}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = (control.value || '').toString().trim();
    if (!value) return null; // deixe required para outro validator
    return regex.test(value) ? null : { cepInvalid: true };
  };
}
