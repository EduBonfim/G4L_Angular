import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    // Verificar se tem pelo menos 1 letra maiúscula
    const hasUpperCase = /[A-Z]/.test(value);
    
    // Verificar se tem pelo menos 1 número
    const hasNumber = /[0-9]/.test(value);
    
    // Verificar se tem pelo menos 1 caractere especial
    const hasSpecialChar = /[!@#$%&*_\-+=]/.test(value);
    
    // Verificar tamanho mínimo de 6 caracteres
    const hasMinLength = value.length >= 6;

    const passwordValid = hasUpperCase && hasNumber && hasSpecialChar && hasMinLength;

    return !passwordValid ? {
      passwordStrength: {
        hasUpperCase,
        hasNumber,
        hasSpecialChar,
        hasMinLength
      }
    } : null;
  };
}
