import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Client, Rental, Console, Game, Accessory, Address } from '../../models/data.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'; // ⬅️ Verifique se este caminho está correto

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  
  addGameForm: FormGroup;
  addAccessoryForm: FormGroup;
  addConsoleForm: FormGroup;
  editForm: FormGroup;
  
  clients: Client[] = [];
  rentals: Rental[] = [];
  consoles: Console[] = [];
  games: Game[] = [];
  accessories: Accessory[] = [];
  
  // Paginação para jogos, acessórios e consoles
  gamesPage = 1;
  accessoriesPage = 1;
  consolesPage = 1;
  itemsPerPage = 6;
  
  // Modal de edição
  showEditModal = false;
  editingItemType: 'game' | 'accessory' | 'console' | null = null;
  editingItemId: string | null = null;
  
  // Filtros de pesquisa
  gamesSearchTerm = '';
  accessoriesSearchTerm = '';
  consolesSearchTerm = '';

  // Filtros e Paginação
  selectedClientCpf: string = 'all';
  selectedConsoleId: string = 'all';
  dateFrom: string | null = null;
  dateTo: string | null = null;
  rentalPageSize = 4;
  currentPage = 1;
  
  private apiUrl = environment.apiBaseUrl;

  /**
   * Converte o DTO do backend para o modelo usado na UI.
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
      endDate: dto.endDate,
      pendingExtensionAmount: Number(dto.pendingExtensionAmount ?? dto.extensoesValor ?? 0),
      pendingExtensionStatus: (dto.pendingExtensionStatus ?? dto.extensoesStatus ?? ((dto.pendingExtensionAmount ?? 0) > 0 ? 'pendente' : 'pago')),
      paymentConfirmed: dto.paymentConfirmed ?? dto.pagamentoConfirmado ?? false
    } as Rental;
  }

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.addGameForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      image: ['', Validators.required],
      console: ['all', Validators.required]
    });

    this.addAccessoryForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      image: ['', Validators.required],
      console: ['all', Validators.required]
    });

    this.addConsoleForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      image: ['', Validators.required]
    });
    
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      image: ['', Validators.required],
      console: ['all']
    });
  }

  ngOnInit(): void {
    this.loadAdminData();
  }

  /**
   * Carrega todos os dados da API (Spring Backend)
   */
  loadAdminData(): void {
    this.http.get<Client[]>(`${this.apiUrl}/api/clients`).subscribe({
      next: (data) => {
        this.clients = data;
        console.log('Clients carregados:', data.length);
      },
      error: (err) => console.error('Erro ao carregar clients:', err)
    });
    
    // Use ApiService helper to avoid failing the whole admin page on 400/500
    this.api.getRentals().subscribe({
      next: (data) => {
        const normalized = (data || []).map(d => this.normalizeRentalDto(d));
        this.rentals = normalized;
        console.log('Rentals carregados:', normalized.length, normalized);
      },
      error: (err) => {
        console.error('Erro ao carregar rentals:', err);
        if (err?.error) console.error('Response body:', err.error);
      }
    });
    
    this.api.getConsoles().subscribe(data => this.consoles = data);
    this.api.getGames().subscribe(data => this.games = data);
    this.api.getAccessories().subscribe(data => this.accessories = data);
  }

  // ⬇️ --- FUNÇÕES AUXILIARES DE UI (ADICIONADAS DE VOLTA) --- ⬇️

  remainingLabel(r: Rental): string {
    if (!r.endDate) return '—';
    const now = new Date();
    const end = new Date(r.endDate);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) {
      const ago = now.getTime() - end.getTime();
      const d = Math.floor(ago / 86400000);
      const h = Math.floor((ago % 86400000) / 3600000);
      return `Expirado há ${d}d ${h}h`;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    return `Restam ${d}d ${h}h`;
  }

  remainingParts(r: Rental): { expired: boolean; years: number; months: number; days: number; critical: boolean } {
    if (!r.endDate) return { expired: false, years: 0, months: 0, days: 0, critical: false };
    const now = new Date();
    const end = new Date(r.endDate);
    let days = Math.floor((end.getTime() - now.getTime()) / 86400000);
    if (days <= 0) return { expired: true, years: 0, months: 0, days: 0, critical: true };
    const years = Math.floor(days / 365);
    days = days % 365;
    const months = Math.floor(days / 30);
    const remDays = days % 30;
    const critical = years === 0 && months === 0 && remDays < 7;
    return { expired: false, years, months, days: remDays, critical };
  }

  // ⬆️ --- FIM DAS FUNÇÕES AUXILIARES DE UI --- ⬆️

  /**
   * Chama o RentalController para estender o aluguel
   */
  extendRental(rental: Rental, planStr: string, multStr: string): void {
    const mult = parseInt(multStr, 10);
    const plan = planStr || rental.plan;
    if (!mult || mult <= 0) return;

    const body = { plan, mult };
    const url = `${this.apiUrl}/api/rentals/${rental.id}/extend`;

    this.http.post<any>(url, body).subscribe({
      next: (updatedDto) => {
        const updatedRental = this.normalizeRentalDto(updatedDto);
        alert('Aluguel estendido com sucesso!');
        // Atualiza localmente quando possível
        const i = this.rentals.findIndex(r => r.id === updatedRental.id);
        if (i !== -1) {
          this.rentals[i] = updatedRental;
        } else {
          this.loadAdminData();
        }
      },
      error: (err) => {
        alert(`Falha ao estender aluguel: ${err.error.message || 'Erro no servidor'}`);
      }
    });
  }

  /**
   * Chama o RentalController para confirmar o pagamento
   */
  confirmExtensions(rental: Rental): void {
    if (!confirm("Confirmar o pagamento deste aluguel? Esta ação não pode ser desfeita.")) {
      return;
    }

    const url = `${this.apiUrl}/api/rentals/${rental.id}/confirm-payment`;
    
    this.http.post<any>(url, {}).subscribe({
      next: (updatedDto) => {
        const updatedRental = this.normalizeRentalDto(updatedDto);
        // Fallback caso backend não retorne campos de extensão
        if (updatedDto == null || (updatedDto.pendingExtensionAmount === undefined && updatedDto.extensoesValor === undefined)) {
          updatedRental.pendingExtensionAmount = 0;
          updatedRental.pendingExtensionStatus = 'pago';
        }
        alert("Pagamento confirmado com sucesso!");
        const index = this.rentals.findIndex(r => r.id === updatedRental.id);
        if (index !== -1) {
          this.rentals[index] = updatedRental;
        } else {
          this.loadAdminData();
        }
      },
      error: (err) => {
        alert(`Falha ao confirmar pagamento: ${err.error.message || 'Erro no servidor'}`);
      }
    });
  }

  /**
   * Adiciona o Jogo no Spring (GameController)
   */
  onAddGame(): void {
    if (this.addGameForm.invalid) {
      this.addGameForm.markAllAsTouched();
      return;
    }
    
    const url = `${this.apiUrl}/api/games`;
    this.http.post<Game>(url, this.addGameForm.value).subscribe({
      next: (newGame) => {
        alert('Jogo cadastrado com sucesso!');
        this.addGameForm.reset({ console: 'all' });
        this.api.getGames().subscribe(data => this.games = data);
      },
      error: (err) => {
        alert(`Falha ao cadastrar Jogo: ${err.error.message || 'Verifique se o nome já existe'}`);
      }
    });
  }

  /**
   * Adiciona o Acessório no Spring (AccessoryController)
   */
  onAddAccessory(): void {
    if (this.addAccessoryForm.invalid) {
      this.addAccessoryForm.markAllAsTouched();
      return;
    }
    
    const url = `${this.apiUrl}/api/accessories`;
    this.http.post<Accessory>(url, this.addAccessoryForm.value).subscribe({
      next: (newAccessory) => {
        alert('Acessório cadastrado com sucesso!');
        this.addAccessoryForm.reset({ console: 'all' });
        this.api.getAccessories().subscribe(data => this.accessories = data);
      },
      error: (err) => {
        alert(`Falha ao cadastrar Acessório: ${err.error.message || 'Verifique se o nome já existe'}`);
      }
    });
  }

  /**
   * Adiciona o Console no Spring (ConsoleController)
   */
  onAddConsole(): void {
    if (this.addConsoleForm.invalid) {
      this.addConsoleForm.markAllAsTouched();
      return;
    }

    const url = `${this.apiUrl}/api/consoles`;
    this.http.post<Console>(url, this.addConsoleForm.value).subscribe({
      next: (newConsole) => {
        alert('Console cadastrado com sucesso!');
        this.addConsoleForm.reset();
        this.api.getConsoles().subscribe(data => this.consoles = data);
      },
      error: (err) => {
        alert(`Falha ao cadastrar Console: ${err.error.message || 'Verifique se o nome já existe'}`);
      }
    });
  }

  /**
   * Deleta o Console no Spring (ConsoleController)
   */
  onDeleteConsole(id: string): void {
    if (!confirm('Confirma a exclusão deste console?')) { return; }
    
    const url = `${this.apiUrl}/api/consoles/${id}`;
    this.http.delete(url).subscribe({
      next: () => {
        this.api.getConsoles().subscribe(data => this.consoles = data);
      },
      error: (err) => alert("Falha ao excluir console.")
    });
  }

  /**
   * Deleta o Jogo no Spring (GameController)
   */
  onDeleteGame(id: string): void {
    if (!confirm('Confirma a exclusão deste jogo?')) { return; }
    
    const url = `${this.apiUrl}/api/games/${id}`;
    this.http.delete(url).subscribe({
      next: () => {
        this.api.getGames().subscribe(data => this.games = data);
      },
      error: (err) => alert("Falha ao excluir jogo.")
    });
  }

  /**
   * Deleta o Acessório no Spring (AccessoryController)
   */
  onDeleteAccessory(id: string): void {
    if (!confirm('Confirma a exclusão deste acessório?')) { return; }
    
    const url = `${this.apiUrl}/api/accessories/${id}`;
    this.http.delete(url).subscribe({
      next: () => {
        this.api.getAccessories().subscribe(data => this.accessories = data);
      },
      error: (err) => alert("Falha ao excluir acessório.")
    });
  }

  /**
   * Deleta o Cliente no Spring (ClientController) e seus aluguéis associados
   */
  onDeleteClient(id: any): void {
    if (!confirm('Confirmar exclusão do cliente e todos os seus aluguéis?')) { return; }

    const url = `${this.apiUrl}/api/clients/${id}`;
    this.http.delete(url).subscribe({
      next: () => {
        // Recarregar listas afetadas
        this.http.get<Client[]>(`${this.apiUrl}/api/clients`).subscribe({
          next: (data) => this.clients = data,
          error: () => {}
        });
        this.api.getRentals().subscribe({ next: (data) => {
          const normalized = (data || []).map(d => this.normalizeRentalDto(d));
          this.rentals = normalized;
        }});
      },
      error: () => alert('Falha ao excluir cliente.')
    });
  }

  // Paginação de jogos
  get filteredGames(): Game[] {
    if (!this.gamesSearchTerm) return this.games;
    const term = this.gamesSearchTerm.toLowerCase();
    return this.games.filter(g => g.name.toLowerCase().includes(term));
  }
  
  get paginatedGames(): Game[] {
    const start = (this.gamesPage - 1) * this.itemsPerPage;
    return this.filteredGames.slice(start, start + this.itemsPerPage);
  }
  
  get gamesTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredGames.length / this.itemsPerPage));
  }
  
  gamesNextPage(): void {
    if (this.gamesPage < this.gamesTotalPages) this.gamesPage++;
  }
  
  gamesPrevPage(): void {
    if (this.gamesPage > 1) this.gamesPage--;
  }
  
  // Paginação de acessórios
  get filteredAccessories(): Accessory[] {
    if (!this.accessoriesSearchTerm) return this.accessories;
    const term = this.accessoriesSearchTerm.toLowerCase();
    return this.accessories.filter(a => a.name.toLowerCase().includes(term));
  }
  
  get paginatedAccessories(): Accessory[] {
    const start = (this.accessoriesPage - 1) * this.itemsPerPage;
    return this.filteredAccessories.slice(start, start + this.itemsPerPage);
  }
  
  get accessoriesTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAccessories.length / this.itemsPerPage));
  }
  
  accessoriesNextPage(): void {
    if (this.accessoriesPage < this.accessoriesTotalPages) this.accessoriesPage++;
  }
  
  accessoriesPrevPage(): void {
    if (this.accessoriesPage > 1) this.accessoriesPage--;
  }
  
  // Paginação de consoles
  get filteredConsoles(): Console[] {
    if (!this.consolesSearchTerm) return this.consoles;
    const term = this.consolesSearchTerm.toLowerCase();
    return this.consoles.filter(c => c.name.toLowerCase().includes(term));
  }
  
  get paginatedConsoles(): Console[] {
    const start = (this.consolesPage - 1) * this.itemsPerPage;
    return this.filteredConsoles.slice(start, start + this.itemsPerPage);
  }
  
  get consolesTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredConsoles.length / this.itemsPerPage));
  }
  
  consolesNextPage(): void {
    if (this.consolesPage < this.consolesTotalPages) this.consolesPage++;
  }
  
  consolesPrevPage(): void {
    if (this.consolesPage > 1) this.consolesPage--;
  }
  
  // Métodos de edição
  openEditModal(type: 'game' | 'accessory' | 'console', item: any): void {
    this.editingItemType = type;
    this.editingItemId = item.id;
    this.showEditModal = true;
    
    if (type === 'game' || type === 'accessory') {
      this.editForm.patchValue({
        name: item.name,
        price: item.price,
        image: item.image,
        console: item.console || 'all'
      });
    } else {
      this.editForm.patchValue({
        name: item.name,
        price: item.price,
        image: item.image
      });
    }
  }
  
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingItemType = null;
    this.editingItemId = null;
    this.editForm.reset({ console: 'all' });
  }
  
  saveEdit(): void {
    if (this.editForm.invalid || !this.editingItemId || !this.editingItemType) {
      this.editForm.markAllAsTouched();
      return;
    }
    
    // Preparar dados para envio
    let data = { ...this.editForm.value };
    
    // Se for jogo ou acessório, converter o nome do console para abreviação
    if ((this.editingItemType === 'game' || this.editingItemType === 'accessory') && data.console && data.console !== 'all') {
      data.console = this.getConsoleAbbreviation(data.console);
    }
    
    let url = '';
    
    if (this.editingItemType === 'game') {
      url = `${this.apiUrl}/api/games/${this.editingItemId}`;
    } else if (this.editingItemType === 'accessory') {
      url = `${this.apiUrl}/api/accessories/${this.editingItemId}`;
    } else if (this.editingItemType === 'console') {
      url = `${this.apiUrl}/api/consoles/${this.editingItemId}`;
    }
    
    this.http.put(url, data).subscribe({
      next: () => {
        alert('Item atualizado com sucesso!');
        this.closeEditModal();
        this.loadAdminData();
      },
      error: (err) => {
        alert(`Falha ao atualizar: ${err.error?.message || 'Erro no servidor'}`);
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
  }

  // ⬇️ --- FUNÇÕES DE UI (ADICIONADAS DE VOLTA) --- ⬇️

  getConsoleName(id?: string): string {
    if (!id) { return 'Todos'; }
    const found = this.consoles.find(c => c.id === id);
    return found ? found.name : id;
  }

  getGameNames(ids: string[]): string {
    return (ids || [])
      .map(id => {
        const g = this.games.find(x => x.id === id);
        return g ? g.name : id;
      })
      .join(', ') || '-';
  }

  getAccessoryNames(ids: string[]): string {
    return (ids || [])
      .map(id => {
        const a = this.accessories.find(x => x.id === id);
        return a ? a.name : id;
      })
      .join(', ') || '-';
  }

  get displayedRentals(): Rental[] {
    // Helper to parse various date formats safely
    const parseDateToMs = (val: any): number => {
      if (!val) return 0;
      if (val instanceof Date) return val.getTime();
      const s = String(val);
      // ISO format quick path
      if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
        const t = Date.parse(s);
        return isNaN(t) ? 0 : t;
      }
      // dd/MM/yyyy[ HH:mm[:ss]]
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
      if (m) {
        const dd = Number(m[1]);
        const MM = Number(m[2]) - 1;
        const yyyy = Number(m[3]);
        const hh = Number(m[4] ?? '0');
        const mm = Number(m[5] ?? '0');
        const ss = Number(m[6] ?? '0');
        const d = new Date(yyyy, MM, dd, hh, mm, ss);
        return d.getTime();
      }
      const t = Date.parse(s);
      return isNaN(t) ? 0 : t;
    };

    let list = [...this.rentals];

    // Filtro por cliente (mantido como está)
    if (this.selectedClientCpf !== 'all') {
      list = list.filter(r => r.client?.cpf === this.selectedClientCpf);
    }

    // Filtro por console: aceita tanto id quanto nome
    if (this.selectedConsoleId !== 'all') {
      const sel = String(this.selectedConsoleId);
      const found = this.consoles.find(c => String(c.id) === sel || String(c.name) === sel);
      const candidates = new Set<string>([sel]);
      if (found) {
        if (found.id != null) candidates.add(String(found.id));
        if (found.name != null) candidates.add(String(found.name));
      }
      list = list.filter(r => r.consoleId != null && candidates.has(String(r.consoleId)));
    }

    // Filtro por data inicial/final com parsing robusto
    const fromMs = this.dateFrom ? new Date(`${this.dateFrom}T00:00:00`).getTime() : null;
    const toMs = this.dateTo ? new Date(`${this.dateTo}T23:59:59.999`).getTime() : null;
    if (fromMs != null) {
      list = list.filter(r => parseDateToMs(r.orderDate) >= fromMs);
    }
    if (toMs != null) {
      list = list.filter(r => parseDateToMs(r.orderDate) <= toMs);
    }

    // Ordena do mais recente (no topo) para o mais antigo
    return list.sort((a, b) => parseDateToMs(b.orderDate) - parseDateToMs(a.orderDate));
  }

  get displayedCount(): number {
    return this.displayedRentals.length;
  }

  clearFilters(): void {
    this.selectedClientCpf = 'all';
    this.selectedConsoleId = 'all';
    this.dateFrom = null;
    this.dateTo = null;
    this.currentPage = 1;
  }

  exportToCsv(): void {
    // Normalizador para evitar caracteres "quebrados" e garantir NFC
    const normalizeText = (v: any) => String(v ?? '').normalize('NFC');

    const rows = this.displayedRentals.map(r => {
      // Tente complementar dados do cliente a partir da lista completa de clientes
      const refClient = this.clients.find(c => (c.id && r.client?.id && String(c.id) === String(r.client.id)) || (c.cpf && r.client?.cpf && String(c.cpf) === String(r.client.cpf)) ) || r.client;

      const cliente = normalizeText(refClient?.name || r.client?.name || '');
      const cpf = normalizeText(refClient?.cpf || r.client?.cpf || '');
      const console = normalizeText(this.getConsoleName(r.consoleId));
      const plano = normalizeText(r.plan || '');
      const jogos = normalizeText(this.getGameNames(r.gameIds));
      const acessorios = normalizeText(this.getAccessoryNames(r.accessoryIds));
      const opcaoCompra = normalizeText(r.purchaseOption ? 'Sim' : 'Não');
      const total = normalizeText(r.totalPrice?.toFixed(2)?.replace('.', ','));
      const dataHora = normalizeText(new Date(r.orderDate).toLocaleString('pt-BR'));
      const pago = normalizeText((r as any).paymentConfirmed ? 'Sim' : 'Não');

      let endPadrao = '';

      const addrs = (refClient?.addresses || r.client?.addresses || []) as any[];
      if (addrs.length) {
        const def: any = addrs.find((a: any) => a?.default) || addrs[0];
        const refSuf = def?.reference ? ` (Ref.: ${def.reference})` : '';
        endPadrao = normalizeText(`${def?.type ?? ''}: ${def?.address ?? ''}, ${def?.number ?? ''} — ${def?.district ?? ''} — ${def?.city ?? ''} / ${def?.uf ?? ''} — CEP ${def?.cep ?? ''}${refSuf}`);
      }

      return [
        cliente, cpf, console, plano, jogos, acessorios, opcaoCompra, total, dataHora, pago,
        endPadrao
      ];
    });

    const header = [
      'Cliente', 'CPF', 'Console', 'Plano', 'Jogos', 'Acessórios', 'Opção de Compra', 'Total (R$)', 'Data e Hora', 'Pago',
      'Endereço Padrão'
    ];

    const escape = (v: any) => `"${normalizeText(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map(line => line.map(escape).join(';')).join('\n');

    // Adiciona BOM UTF-8 para compatibilidade com Excel/Windows
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alugueis_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  get paginatedRentals(): Rental[] {
    const list = this.displayedRentals;
    const totalPages = Math.max(1, Math.ceil(list.length / this.rentalPageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * this.rentalPageSize;
    return list.slice(start, start + this.rentalPageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayedRentals.length / this.rentalPageSize));
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
  }

  prevPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }
  
  /**
   * Converte o nome do console para abreviação (ps5, xbox, switch, steam)
   * Mantém consistência com a forma de salvamento do cadastro
   */
  private getConsoleAbbreviation(consoleName: string): string {
    if (!consoleName || consoleName === 'all') return 'all';
    
    const name = consoleName.toLowerCase().trim();
    
    if (name.includes('playstation') || name === 'ps5') return 'ps5';
    if (name.includes('xbox')) return 'xbox';
    if (name.includes('switch') || name.includes('nintendo')) return 'switch';
    if (name.includes('steam')) return 'steam';
    
    // Se não reconhecer, retorna como está
    return consoleName;
  }
}