
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Client, Rental, Game, Console, Accessory, Address } from '../../models/data.model';
import { Router } from '@angular/router';
import { cepValidator } from '../../validators/cep.validator';
import { passwordValidator } from '../../validators/password.validator';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-area',
  templateUrl: './user-area.component.html',
  styleUrls: ['./user-area.component.css']
})
export class UserAreaComponent implements OnInit, OnDestroy {
  currentUser: Client | null = null;
  editForm: FormGroup;
  passwordForm: FormGroup;
  isEditing = false;
  userRentals: Rental[] = [];
  // Tick usado para forçar atualização periódica da contagem regressiva
  nowTick: number = Date.now();
  private countdownTimer: any;
  
  addressForm!: FormGroup;
  addresses: Address[] = [];
  editingAddressIndex: number | null = null;
  editingAddressId: number | null = null;
  
  cepLookupLoading = false;
  cepLookupError: string | null = null;
  showCurrentPassword = false;
  showNewPassword = false;
  
  games: Game[] = [];
  consoles: Console[] = [];
  accessories: Accessory[] = [];
  
  extendNotice: { [id: number]: string } = {};
  selectedPlan: { [id: number]: string } = {};
  selectedMult: { [id: number]: number } = {};
  
  // Paginação de aluguéis
  rentalsPage = 1;
  rentalsPerPage = 4;
  
  private apiUrl = environment.apiBaseUrl;
  
  /**
   * Normaliza o DTO vindo do backend (RentalDto) para o modelo usado pelo frontend
   * garantindo que as telas funcionem mesmo quando o backend não envia objetos
   * aninhados (ex.: client) ou IDs (envia nomes).
   */
  private normalizeRentalDto(dto: any): Rental {
    const client: Client = {
      id: dto.clientId ?? null,
      name: dto.clientName ?? '',
      cpf: dto.clientCpf ?? '',
      email: dto.clientEmail ?? '',
      phone: dto.clientPhone ?? ''
    } as Client;

    const consoleId = dto.consoleId ?? dto.consoleName ?? '';
    const gameIds = (dto.gameIds ?? dto.games ?? []) as string[];
    const accessoryIds = (dto.accessoryIds ?? dto.acessories ?? []) as string[];

    return {
      id: dto.id,
      client,
      consoleId,
      plan: dto.plan ?? 'Mensal',
      gameIds,
      accessoryIds,
      purchaseOption: !!(dto.purchaseOption ?? dto.opcaoCompra),
      totalPrice: Number(dto.totalPrice ?? dto.total ?? 0),
      orderDate: dto.orderDate ?? dto.dataHora ?? new Date().toISOString(),
      endDate: dto.endDate, // pode não vir do backend; telas tratam caso ausente
      pendingExtensionAmount: Number(dto.pendingExtensionAmount ?? dto.extensoesValor ?? 0),
      pendingExtensionStatus: (dto.pendingExtensionStatus ?? dto.extensoesStatus ?? ((dto.pendingExtensionAmount ?? 0) > 0 ? 'pendente' : 'pago')),
      paymentConfirmed: dto.paymentConfirmed ?? dto.pagamentoConfirmado ?? false
    } as Rental;
  }

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private api: ApiService,
    private http: HttpClient
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      cpf: [{value: '', disabled: true}, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6), passwordValidator()]]
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUser = currentUser as any; // Cast para manter compatibilidade
      this.populateForm();
      this.initAddressSection();
      this.loadUserAddresses();
      this.loadUserRentals();
    } else {
      // Se não tem usuário em cache, tenta buscar do backend
      this.authService.checkSession().subscribe(user => {
        if (user) {
          this.currentUser = user as any;
          this.populateForm();
          this.initAddressSection();
          this.loadUserAddresses();
          this.loadUserRentals();
        } else {
          this.router.navigate(['/login']);
        }
      });
    }

    this.api.getGames().subscribe(g => { this.games = g; });
    this.api.getConsoles().subscribe(c => { this.consoles = c; });
    this.api.getAccessories().subscribe(a => { this.accessories = a; });

    // Atualiza cada minuto para refletir countdown sem interação do usuário
    this.countdownTimer = setInterval(() => {
      this.nowTick = Date.now();
    }, 60000); // 1 minuto
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  populateForm(): void {
    if (this.currentUser) {
      this.editForm.patchValue({
        name: this.currentUser.name,
        cpf: this.currentUser.cpf,
        email: this.currentUser.email,
        phone: this.currentUser.phone
      });
    }
  }

  loadUserRentals(): void {
    if (!this.currentUser) {
      console.log('loadUserRentals: sem currentUser');
      return;
    }
    // Use ApiService helper to unify error handling
    console.log('Carregando rentals do usuário via ApiService.getRentalsForCpf');
    this.api.getRentalsForCpf(this.currentUser!.cpf).subscribe({
      next: (allRentals) => {
        console.log('Todos os rentals (bruto):', allRentals);
        // Normaliza todos os registros vindos do backend
        const normalized = allRentals.map(r => this.normalizeRentalDto(r));
        // Filtra de forma resiliente mesmo se client vier ausente no DTO original
        this.userRentals = normalized.filter(r => (r.client?.cpf || '') === this.currentUser!.cpf);
        console.log('Rentals do usuário:', this.userRentals);
        
        for (const r of this.userRentals) {
          if (!this.selectedPlan[r.id]) this.selectedPlan[r.id] = r.plan || 'Mensal';
          if (!this.selectedMult[r.id]) this.selectedMult[r.id] = 1;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar rentals:', err);
        if (err?.error) console.error('Response body:', err.error);
        // Fallback: se der 401/404/400, tenta a lista completa e filtra no cliente (compatibilidade)
        this.api.getRentals().subscribe(list => {
          const normalized = (list || []).map(r => this.normalizeRentalDto(r));
          this.userRentals = normalized.filter(r => (r.client?.cpf || '') === this.currentUser!.cpf);
        });
      }
    });
  }
  
  loadUserAddresses(): void {
    if (!this.currentUser || !this.currentUser.id) return;
    const url = `${this.apiUrl}/api/addresses/client/${this.currentUser.id}`;
    
    this.http.get<Address[]>(url).subscribe(addressesFromBackend => {
      this.addresses = addressesFromBackend;
      console.log('Endereços carregados:', this.addresses.length);
      // Atualizar sessionStorage com os endereços carregados
      this.updateCurrentUserInLocalStorage();
    });
  }

  getRemainingLabel(rental: Rental): string {
    if (!rental.endDate) return '—';
    const now = new Date();
    const end = new Date(rental.endDate);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) {
      const agoMs = now.getTime() - end.getTime();
      const agoDays = Math.floor(agoMs / 86400000);
      const agoHours = Math.floor((agoMs % 86400000) / 3600000);
      return `Expirado há ${agoDays}d ${agoHours}h`;
    }
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    return `Restam ${days}d ${hours}h`;
  }

  // Contagem regressiva detalhada (dias, horas, minutos) sempre em azul
  getCountdown(rental: Rental): string {
    if (!rental.endDate) return '—';
    const now = this.nowTick; // usa tick para reatividade
    const end = new Date(rental.endDate).getTime();
    const diffMs = end - now;
    if (diffMs <= 0) {
      const agoMs = now - end;
      const agoDays = Math.floor(agoMs / 86400000);
      const agoHours = Math.floor((agoMs % 86400000) / 3600000);
      const agoMinutes = Math.floor((agoMs % 3600000) / 60000);
      return `Expirado há ${agoDays}d ${agoHours}h ${agoMinutes}m`;
    }
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${days}d ${hours}h ${minutes}m`;
  }

  getRemainingParts(rental: Rental): { expired: boolean; years: number; months: number; days: number; totalDays: number; critical: boolean } {
    if (!rental.endDate) return { expired: false, years: 0, months: 0, days: 0, totalDays: 0, critical: false };
    const now = new Date();
    const end = new Date(rental.endDate);
    let diffDays = Math.floor((end.getTime() - now.getTime()) / 86400000);
    if (diffDays <= 0) {
      return { expired: true, years: 0, months: 0, days: 0, totalDays: 0, critical: true };
    }
    const years = Math.floor(diffDays / 365);
    diffDays = diffDays % 365;
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    const critical = (years === 0 && months === 0 && (days < 7));
    return { expired: false, years, months, days, totalDays: years * 365 + months * 30 + days, critical };
  }
  
  wouldExceedMax(rental: Rental): boolean {
    const parts = this.getRemainingParts(rental);
    const plan = this.selectedPlan[rental.id] || rental.plan;
    const mult = this.selectedMult[rental.id] || 1;
    
    // Calcular dias que serão adicionados
    let daysToAdd = 0;
    if (plan === 'Semanal') {
      daysToAdd = 7 * mult;
    } else if (plan === 'Mensal') {
      daysToAdd = 30 * mult;
    } else if (plan === 'Anual') {
      daysToAdd = 365 * mult;
    }
    
    // Total de dias após a extensão
    const totalDaysAfterExtension = parts.totalDays + daysToAdd;
    
    // Limite máximo: 3 anos = 1095 dias (365 * 3)
    const maxDays = 365 * 3;
    
    return totalDaysAfterExtension > maxDays;
  }

  getConsoleName(consoleId: string): string {
    const console = this.consoles.find(c => c.id === consoleId);
    return console ? console.name : consoleId;
  }

  getGameNames(gameIds: string[]): string {
    return (gameIds || [])
      .map(id => {
        const game = this.games.find(g => g.id === id);
        return game ? game.name : id;
      })
      .join(', ') || '-';
  }

  getAccessoryNames(accessoryIds: string[]): string {
    return (accessoryIds || [])
      .map(id => {
        const acc = this.accessories.find(a => a.id === id);
        return acc ? acc.name : id;
      })
      .join(', ') || '-';
  }

  get newPasswordValue(): string {
    return this.passwordForm.get('newPassword')?.value || '';
  }

  get hasMinLength(): boolean {
    return this.newPasswordValue.length >= 6;
  }

  get hasUpperCase(): boolean {
    return /[A-Z]/.test(this.newPasswordValue);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.newPasswordValue);
  }

  get hasSpecialChar(): boolean {
    return /[!@#$%&*_\-+=]/.test(this.newPasswordValue);
  }

  onPasswordInput(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    if (!input) return;
    const sanitized = (input.value || '').replace(/[^a-zA-Z0-9!@#$%&*_\-+=]/g, '');
    this.passwordForm.get('newPassword')?.setValue(sanitized, { emitEvent: false });
  }

  extendUserRental(rental: Rental): void { 
    const plan = this.selectedPlan[rental.id] || rental.plan;
    const mult = this.selectedMult[rental.id] || 1;

    if (!mult || mult <= 0) return;
    
    // Validar se vai ultrapassar 3 anos
    if (this.wouldExceedMax(rental)) {
      alert('Não é possível estender. O limite máximo de 3 anos seria ultrapassado.');
      return;
    }

    const body = { plan, mult };
    const url = `${this.apiUrl}/api/rentals/${rental.id}/extend`;

    this.http.post<any>(url, body).subscribe({
      next: (updatedDto) => {
        const updatedRental = this.normalizeRentalDto(updatedDto);
        // Fallback: se backend não reportar extensões pendentes, atualizar localmente
        if (updatedDto == null || (updatedDto.pendingExtensionAmount === undefined && updatedDto.extensoesValor === undefined)) {
          const add = this.additionalCost(rental);
          updatedRental.pendingExtensionAmount = (rental.pendingExtensionAmount || 0) + add;
          updatedRental.pendingExtensionStatus = 'pendente';
        }
        const index = this.userRentals.findIndex(r => r.id === rental.id);
        if (index !== -1) {
          this.userRentals[index] = updatedRental;
        }
        const added = this.additionalCost(rental);
        this.extendNotice[rental.id] = `Valor de R$ ${added.toFixed(2)} adicionado. O aluguel foi estendido com sucesso!`;
        setTimeout(() => delete this.extendNotice[rental.id], 6000);
      },
      error: (err) => {
        alert(`Falha ao estender aluguel: ${err?.error?.message || 'Erro no servidor'}`);
      }
    });
  }

  additionalCost(rental: Rental): number {
    const plan = this.selectedPlan[rental.id] || rental.plan;
    const mult = this.selectedMult[rental.id] || 1;
    // Tabela alinhada com UI antiga: Semana 99, Mês 299, Ano 500
    const p = (plan === 'Semanal') ? 99 : (plan === 'Mensal') ? 299 : (plan === 'Anual') ? 500 : 0;
    const price = p;
    return price * mult;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateForm();
    }
  }

  saveChanges(): void {
    if (this.editForm.invalid) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }
    if (!this.currentUser || !this.currentUser.id) return;

    const updatedData = {
      name: this.editForm.get('name')?.value,
      email: this.editForm.get('email')?.value,
      phone: this.editForm.get('phone')?.value
    };
    
    const url = `${this.apiUrl}/api/clients/${this.currentUser.id}`;

    this.http.put<Client>(url, updatedData).subscribe({
      next: (userFromBackend) => {
        this.currentUser = {
          ...this.currentUser,
          id: this.currentUser?.id || userFromBackend.id,
          cpf: this.currentUser?.cpf || userFromBackend.cpf,
          name: userFromBackend.name,
          email: userFromBackend.email,
          phone: userFromBackend.phone
        };
        // Atualizar sessionStorage via AuthService
        const authUser = this.authService.getCurrentUser();
        if (authUser) {
          authUser.name = userFromBackend.name;
          authUser.email = userFromBackend.email;
          authUser.phone = userFromBackend.phone;
          sessionStorage.setItem('authUser', JSON.stringify(authUser));
        }
        alert('Informações atualizadas com sucesso!');
        this.isEditing = false;
        this.populateForm();
        this.loadUserRentals();
      },
      error: (err) => {
        alert('Falha ao atualizar informações no servidor.');
        console.error(err);
      }
    });
  }
  
  initAddressSection(): void {
    this.addressForm = this.fb.group({
      address: ['', Validators.required],
      number: ['', Validators.required],
      district: ['', Validators.required],
      cep: ['', [Validators.required, cepValidator()]],
      city: ['', Validators.required],
      uf: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
      reference: ['', [Validators.maxLength(100)]],
      type: ['Casa', Validators.required],
      isDefault: [false]
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

    const urlInterna = `${this.apiUrl}/api/cep/${digitsOnlyCep}`;
    
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

  editAddress(address: Address): void {
    this.editingAddressId = address.id || null; 
    this.editingAddressIndex = this.addresses.indexOf(address); 

    this.addressForm.setValue({
      address: address.address || '',
      number: address.number || '',
      district: address.district || '',
      cep: address.cep || '',
      city: address.city || '',
      uf: address.uf || '',
      reference: address.reference || '',
      type: address.type || 'Casa',
      isDefault: !!address.default
    });
  }

  removeAddress(addressToRemove: Address): void {
    if (!addressToRemove.id) return;
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;

    const url = `${this.apiUrl}/api/addresses/${addressToRemove.id}`;
    
    this.http.delete(url).subscribe({
      next: () => {
        this.addresses = this.addresses.filter(a => a.id !== addressToRemove.id);
        this.updateCurrentUserInLocalStorage();
      },
      error: (err) => {
        alert("Falha ao remover o endereço no servidor.");
        console.error(err);
      }
    });
  }

  addOrUpdateAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    if (!this.currentUser || !this.currentUser.id) return;

    const addressData = this.addressForm.value;

    if (this.editingAddressId !== null) {
      const url = `${this.apiUrl}/api/addresses/${this.editingAddressId}`;
      
      this.http.put<Address>(url, addressData).subscribe(updatedAddress => {
        this.addresses[this.editingAddressIndex!] = updatedAddress;
        this.updateCurrentUserInLocalStorage();
        this.resetAddressForm();
      });

    } else {
      if (this.addresses.length >= 2) { 
        alert('Você pode cadastrar no máximo 2 endereços.'); 
        return; 
      }
      
      const url = `${this.apiUrl}/api/addresses/client/${this.currentUser.id}`;
      
      this.http.post<Address>(url, addressData).subscribe(newAddress => {
        this.addresses.push(newAddress);
        this.updateCurrentUserInLocalStorage();
        this.resetAddressForm();
      });
    }
  }

  // Atualiza o currentUser no cache do AuthService com a lista de endereços atualizada
  updateCurrentUserInLocalStorage(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      // Atualizar via AuthService para sincronizar cache + sessionStorage
      this.authService.setAddresses(this.addresses as any);
      console.log('CurrentUser atualizado (endereços):', this.addresses.length);
    }
  }

  resetAddressForm(): void {
    this.addressForm.reset({ type: 'Casa', isDefault: false });
    this.editingAddressIndex = null;
    this.editingAddressId = null;
  }
  
  changePassword(): void {
    if (!this.currentUser || !this.currentUser.cpf) return;
    if (this.passwordForm.invalid) {
      alert('Preencha a senha atual e a nova senha corretamente.');
      return;
    }
    
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(this.currentUser.cpf, currentPassword, newPassword)
      .subscribe({
        next: (success) => {
          if (success) {
            alert('Senha alterada com sucesso!');
            this.passwordForm.reset();
          } else {
            alert('Senha atual incorreta. Tente novamente.');
          }
        },
        error: (err) => {
          alert('Falha ao se comunicar com o servidor. Tente mais tarde.');
          console.error(err);
      }
    });
  }
  
  // Métodos de paginação
  get sortedRentals(): Rental[] {
    // Ordena do mais recente (no topo) para o mais antigo
    return [...this.userRentals].sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA; // Decrescente (mais recentes primeiro)
    });
  }
  
  get paginatedRentals(): Rental[] {
    const start = (this.rentalsPage - 1) * this.rentalsPerPage;
    return this.sortedRentals.slice(start, start + this.rentalsPerPage);
  }
  
  get rentalsTotalPages(): number {
    return Math.max(1, Math.ceil(this.userRentals.length / this.rentalsPerPage));
  }
  
  rentalsNextPage(): void {
    if (this.rentalsPage < this.rentalsTotalPages) this.rentalsPage++;
  }
  
  rentalsPrevPage(): void {
    if (this.rentalsPage > 1) this.rentalsPage--;
  }

  logout(): void {
    this.authService.logout();
  }
}