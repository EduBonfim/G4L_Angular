import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { cpfValidator } from '../../validators/cpf.validator';
import { cepValidator } from '../../validators/cep.validator';
import { passwordValidator } from '../../validators/password.validator';
import { HttpClient } from '@angular/common/http';
import { AuthService, RegisterResult } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Address } from '../../models/data.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  isLogin = true; // True = login, False = cadastro
  loginForm: FormGroup;
  registerForm: FormGroup;
  
  // Step 2 - endereço
  isAddressStep = false;
  addressForm!: FormGroup;
  savedAddressesCount = 0;
  addresses: Address[] = []; // Vai guardar os endereços do backend
  editingIndex: number | null = null;
  editingAddressId: number | null = null; // ID do endereço no DB
  
  cepLookupLoading = false;
  cepLookupError: string | null = null;
  
  loginFailed = false;
  registerFailed = false;
  registerMessage = '';
  
  // toggles de visibilidade de senha
  showLoginPassword = false;
  showRegPassword = false;
  showRegConfirmPassword = false;
  
  private intendedUrl: string | null = null;
  redirectCountdown: number | null = null;
  private redirectInterval: any = null;
  
  private apiUrl = environment.apiBaseUrl;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      cpf: ['', [Validators.required, cpfValidator()]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6), passwordValidator()]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    const redirectParam = this.route.snapshot.queryParamMap.get('redirect');
    if (redirectParam) {
      this.intendedUrl = redirectParam === 'rent' ? '/rent' : (`/${redirectParam.replace(/^\//, '')}`);
    }
    
    if (this.authService.isLoggedIn()) {
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin']);
      } else if (this.intendedUrl) {
        this.router.navigate([this.intendedUrl]);
      } else {
        this.router.navigate(['/rent']);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.redirectInterval) {
      clearInterval(this.redirectInterval);
      this.redirectInterval = null;
    }
  }

  private beginRedirectCountdown(url: string): void {
    this.redirectCountdown = 3;
    if (this.redirectInterval) {
      clearInterval(this.redirectInterval);
    }
    this.redirectInterval = setInterval(() => {
      if (this.redirectCountdown !== null) {
        this.redirectCountdown = this.redirectCountdown - 1;
        if (this.redirectCountdown <= 0) {
          clearInterval(this.redirectInterval);
          this.redirectInterval = null;
          this.router.navigate([url]);
        }
      }
    }, 1000);
  }

  toggleForm(): void {
    this.isLogin = !this.isLogin;
    this.isAddressStep = false;
    this.loginFailed = false;
    this.registerFailed = false;
    this.registerMessage = '';
    this.editingIndex = null;
    this.editingAddressId = null;
    this.cepLookupError = null;
  }

  // Getters para facilitar o template
  get fLogin() { return this.loginForm.controls; }
  get f() { return this.registerForm.controls; }
  get passwordsMismatch(): boolean {
    const p = this.registerForm.get('password')?.value;
    const c = this.registerForm.get('confirmPassword')?.value;
    return !!p && !!c && p !== c;
  }

  // ⬇️ --- FUNÇÕES AUXILIARES DE MÁSCARAS E VALIDAÇÃO DE SENHA --- ⬇️

  // Getters para checklist de senha
  get passwordValue(): string {
    return this.registerForm.get('password')?.value || '';
  }

  get hasMinLength(): boolean {
    return this.passwordValue.length >= 6;
  }

  get hasUpperCase(): boolean {
    return /[A-Z]/.test(this.passwordValue);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.passwordValue);
  }

  get hasSpecialChar(): boolean {
    return /[!@#$%&*_\-+=]/.test(this.passwordValue);
  }

  // Máscaras simples para CPF e Telefone
  onCpfInput(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input) return;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 11);
    let out = digits;
    if (digits.length > 3) out = digits.slice(0,3) + '.' + digits.slice(3);
    if (digits.length > 6) out = out.slice(0,7) + '.' + out.slice(7);
    if (digits.length > 9) out = out.slice(0,11) + '-' + out.slice(11);
    this.registerForm.get('cpf')?.setValue(out, { emitEvent: false });
  }

  onPhoneInput(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input) return;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 12);
    // Formato (00)-00000-0000
    let out = digits;
    if (digits.length > 0) out = '(' + digits.slice(0,2);
    if (digits.length >= 2) out = out + ')';
    if (digits.length > 2) out = out + '-' + digits.slice(2,7);
    if (digits.length > 7) out = out + '-' + digits.slice(7);
    this.registerForm.get('phone')?.setValue(out, { emitEvent: false });
  }

  onPasswordInput(ev: Event, fieldName: 'password' | 'confirmPassword'): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input) return;
    const sanitized = (input.value || '').replace(/[^a-zA-Z0-9!@#$%&*_\-+=]/g, '');
    this.registerForm.get(fieldName)?.setValue(sanitized, { emitEvent: false });
  }

  // ⬆️ --- FIM DAS FUNÇÕES AUXILIARES DE MÁSCARAS E VALIDAÇÃO DE SENHA --- ⬆️


  onSubmitLogin(): void {
    this.loginFailed = false;
    if (this.loginForm.invalid) {
      return;
    }
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe(success => {
      if (success) {
        if (this.authService.isAdmin()) {
          this.beginRedirectCountdown('/admin');
        } else if (this.intendedUrl) {
          this.beginRedirectCountdown(this.intendedUrl);
        } else {
          this.beginRedirectCountdown('/rent');
        }
      } else {
        this.loginFailed = true;
      }
    });
  }

  onSubmitRegister(): void {
    this.registerFailed = false;
    this.registerMessage = '';
    if (this.registerForm.invalid) {
      return;
    }
    const { name, cpf, email, phone, username, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.registerFailed = true;
      this.registerMessage = 'As senhas não conferem. Digite novamente.';
      return;
    }

    this.authService.registerCliente(name, cpf, email, phone, username, password).subscribe((result: RegisterResult) => {
      if (result.success) {
        this.isAddressStep = true;
        this.isLogin = false;
        this.registerMessage = '';
        this.loginFailed = false;
        this.registerFailed = false;
        
        this.initAddressForm();
        this.loadUserAddresses(); 
      } else {
        this.registerFailed = true;
        switch (result.reason) {
          case 'invalid-cpf':
            this.registerMessage = 'CPF inválido. Verifique os dígitos e tente novamente.';
            break;
          case 'duplicate-cpf':
            this.registerMessage = 'Este CPF já está cadastrado. Faça login ou use outro CPF.';
            break;
          case 'duplicate-username':
            this.registerMessage = 'Este nome de usuário já está em uso. Escolha outro.';
            break;
          default:
            this.registerMessage = 'Não foi possível concluir o cadastro.';
        }
      }
    });
  }

  private initAddressForm(): void {
    this.addressForm = this.fb.group({
      address: ['', [Validators.required]],
      number: ['', [Validators.required]],
      district: ['', [Validators.required]],
      cep: ['', [Validators.required, cepValidator()]],
      city: ['', [Validators.required]],
      uf: ['', [Validators.required, Validators.maxLength(2), Validators.minLength(2)]],
      reference: ['', [Validators.maxLength(100)]],
      type: ['Casa', [Validators.required]],
      isDefault: [false]
    });
  }
  
  private loadUserAddresses(): void {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) return;

	const url = `${this.apiUrl}/addresses/client/${currentUserId}`;
    
    this.http.get<Address[]>(url).subscribe(addressesFromBackend => {
      this.addresses = addressesFromBackend;
      this.savedAddressesCount = this.addresses.length;
    });
  }

  onCepInput(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input) return;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 8);
    let out = digits;
    if (digits.length > 5) out = digits.slice(0,5) + '-' + digits.slice(5);
    this.addressForm.get('cep')?.setValue(out, { emitEvent: false });
    if (digits.length === 8) this.lookupCep(digits);
    else this.cepLookupError = null;
  }

  private lookupCep(digitsOnlyCep: string): void {
    this.cepLookupLoading = true;
    this.cepLookupError = null;

    // ⬅️ CORREÇÃO FINAL: Chama o proxy no Spring (Resolve o CORS)
	const urlInterna = `${this.apiUrl}/cep/${digitsOnlyCep}`;
    
    this.http.get<any>(urlInterna).subscribe({
      next: (data) => {
        this.cepLookupLoading = false;
        if (data && !data.erro) {
          if (data.logradouro) this.addressForm.get('address')?.setValue(data.logradouro);
          if (data.bairro) this.addressForm.get('district')?.setValue(data.bairro);
          if (data.localidade) this.addressForm.get('city')?.setValue(data.localidade);
          if (data.uf) this.addressForm.get('uf')?.setValue(data.uf);
        } else {
          this.cepLookupError = 'CEP não encontrado';
        }
      },
      error: () => {
        this.cepLookupLoading = false;
        this.cepLookupError = 'Falha ao consultar CEP';
      }
    });
  }

  onSubmitAddress(addAnother: boolean = false): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) return;

    const addressData = this.addressForm.value;
	const apiUrl = `${this.apiUrl}/addresses`;

    if (this.editingAddressId !== null) {
      // MODO EDIÇÃO (PUT)
      const url = `${apiUrl}/${this.editingAddressId}`;
      this.http.put<Address>(url, addressData).subscribe(updatedAddress => {
        this.addresses[this.editingIndex!] = updatedAddress;
        this.resetAddressForm();
      });

    } else {
      // MODO CRIAÇÃO (POST)
      if (this.addresses.length >= 2) { 
        alert('Você pode cadastrar no máximo 2 endereços.'); 
        return; 
      }
      
      const url = `${apiUrl}/client/${currentUserId}`;
      this.http.post<Address>(url, addressData).subscribe(newAddress => {
        this.addresses.push(newAddress);
        this.savedAddressesCount = this.addresses.length;
        
        if (addAnother && this.savedAddressesCount < 2) {
          this.resetAddressForm(true);
        } else {
          this.resetAddressForm();
        }
      });
    }
  }

  finishRegistration(): void {
    const target = this.intendedUrl ? this.intendedUrl : '/rent';
    this.beginRedirectCountdown(target);
  }

  // Esta função agora espera um objeto 'Address'
  editAddress(address: Address): void {
    this.editingAddressId = address.id || null;
    this.editingIndex = this.addresses.indexOf(address);
    const a = address;
    
    this.addressForm.setValue({
      address: a.address || '',
      number: a.number || '',
      district: a.district || '',
      cep: a.cep || '',
      city: a.city || '',
      uf: a.uf || '',
      reference: a.reference || '',
      type: a.type || 'Casa',
      isDefault: !!a.default
    });
  }

  // Esta função agora espera um objeto 'Address'
  removeAddress(addressToRemove: Address): void {
    if (!addressToRemove.id) return;
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;
    
	const url = `${this.apiUrl}/addresses/${addressToRemove.id}`;
    
    this.http.delete(url).subscribe({
      next: () => {
        this.addresses = this.addresses.filter(a => a.id !== addressToRemove.id);
        this.savedAddressesCount = this.addresses.length;
        
        if (this.editingAddressId === addressToRemove.id) {
          this.resetAddressForm();
        }
      },
      error: (err) => {
        alert("Falha ao remover o endereço no servidor.");
        console.error(err);
      }
    });
  }

  private resetAddressForm(keepType: boolean = false): void {
    const type = this.addressForm.value.type;
    this.addressForm.reset({
      address: '', number: '', district: '', cep: '', reference: '',
      type: keepType ? type : 'Casa', 
      isDefault: false 
    });
    this.editingIndex = null;
    this.editingAddressId = null;
    this.cepLookupError = null;
  }
}