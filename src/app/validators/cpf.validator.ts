import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function isValidCPF(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos os dígitos iguais

  const calcCheckDigit = (base: string, factorStart: number): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i], 10) * (factorStart - i);
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcCheckDigit(cpf.slice(0, 9), 10);
  const d2 = calcCheckDigit(cpf.slice(0, 9) + String(d1), 11);
  return cpf.endsWith(`${d1}${d2}`);
}

export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null; // deixe 'required' cuidar do vazio
    return isValidCPF(value) ? null : { cpfInvalid: true };
  };
}
