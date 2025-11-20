import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { RentStateService } from '../../services/rent-state.service';
import { Game, Accessory, Console } from '../../models/data.model';

@Component({
  selector: 'app-rent',
  templateUrl: './rent.component.html',
  styleUrls: ['./rent.component.css']
})
export class RentComponent implements OnInit, OnDestroy {
  consoles: Console[] = [];
  games: Game[] = [];
  accessories: Accessory[] = [];
  
  selectedConsoleId: string | null = null;
  selectedConsoleName: string | null = null;
  selectedConsoleMapping: string | null = null; // Nome usado no banco (ps5, xbox, switch, steam)
  selectedPlan: string | null = null;
  selectedGameIds: string[] = [];
  selectedAccessoryIds: string[] = [];
  purchaseOption = false;
  totalPrice = 0;
  showDetails = false;

  // Flags de carregamento
  private consolesLoaded = false;
  private gamesLoaded = false;
  private accessoriesLoaded = false;

  // Filtro por letra inicial dos jogos
  selectedLetter: string | null = null;

  // Paginação
  pageSize = 8;
  consolesPageSize = 4;
  consolesPage = 1;
  gamesPage = 1;
  accessoriesPage = 1;

  // Mapeia ID do console para o nome usado no banco (ps5, xbox, switch, steam)
  getConsoleMappingById(consoleId: string): string | null {
    const console = this.consoles.find(c => c.id === consoleId);
    if (!console) return null;
    const name = console.name.toLowerCase();
    if (name.includes('playstation')) return 'ps5';
    if (name.includes('xbox')) return 'xbox';
    if (name.includes('switch')) return 'switch';
    if (name.includes('steam')) return 'steam';
    return null;
  }

  // Normaliza string (minúscula, sem acentos) e preserva separadores para transformação posterior
  private normalizeBase(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Lista de aliases permitidos por console conhecido do admin.
  // Importante: não colapsar "Nintendo Switch" com "Super Nintendo Classic".
  private getConsoleAliases(name: string | null): Set<string> {
    const aliases = new Set<string>();
    if (!name) return aliases;
    const base = this.normalizeBase(name);
    if (!base) return aliases;
    aliases.add(base); // o próprio nome do dropdown (normalizado)

    // Mapear apenas equivalentes seguros para compatibilidade com itens legados
    // sem misturar famílias diferentes (ex.: Super Nintendo vs Nintendo Switch).
    const eq = (s: string) => aliases.add(this.normalizeBase(s));
    
    // Usa match EXATO de palavras-chave principais para evitar falsos positivos
    if (base === 'playstation 5' || base === 'ps5' || base === 'playstation5') { 
      eq('ps5'); eq('playstation 5'); eq('playstation5'); 
    }
    else if (base.startsWith('xbox series')) { 
      eq('xbox'); eq('xbox series x'); eq('xbox series s'); 
    }
    else if (base === 'nintendo switch' || base === 'switch') { 
      eq('switch'); eq('nintendo switch'); 
    }
    else if (base === 'steam deck' || base === 'steam') { 
      eq('steam'); eq('steam deck'); 
    }
    // Qualquer outro console novo (ex.: Super Nintendo Classic, Mega Drive) não recebe alias amplo
    // e casa apenas por igualdade exata de nome do dropdown.
    return aliases;
  }

  // Normaliza um valor de origem (campo console de jogo/acessório) para comparar
  private normalizeConsoleField(value: string | undefined): string {
    return this.normalizeBase(value || '');
  }

  // Retorna lista de jogos filtrada dinamicamente pelo console selecionado (inclui novos consoles)
  get filteredGames(): Game[] {
    let list = this.games;
    if (this.selectedConsoleName) {
      const aliases = this.getConsoleAliases(this.selectedConsoleName);
      const selectedId = this.selectedConsoleId; // ID do console selecionado
      
      list = list.filter(g => {
        const field = this.normalizeConsoleField(g.console);
        // Para jogos, 'all' não entra em filtros específicos
        if (field === 'all') return false;
        
        // Verifica se g.console bate com o nome normalizado OU com o ID do console selecionado
        const matchByName = aliases.has(field);
        const matchById = selectedId && g.console === selectedId;
        
        return matchByName || matchById;
      });
      
      console.log('Filtro de jogos:', { 
        selectedConsoleName: this.selectedConsoleName, 
        selectedId, 
        aliases: Array.from(aliases), 
        totalGames: this.games.length,
        filteredCount: list.length,
        gamesConsoles: this.games.map(g => ({ name: g.name, console: g.console }))
      });
    }
    if (this.selectedLetter) {
      const letter = this.selectedLetter.toUpperCase();
      list = list.filter(g => g.name?.trim().toUpperCase().startsWith(letter));
    }
    return list;
  }

  // Letras disponíveis considerando filtragem dinâmica
  get availableLetters(): string[] {
    const letters = new Set<string>();
    const list = this.filteredGames; // já aplica regra dinâmica
    list.forEach(g => {
      const ch = (g.name || '').trim().charAt(0).toUpperCase();
      if (ch >= 'A' && ch <= 'Z') letters.add(ch);
    });
    return Array.from(letters).sort();
  }

  get gamesTotalPages(): number { return Math.max(1, Math.ceil(this.filteredGames.length / this.pageSize)); }

  get pagedGames(): Game[] {
    const start = (this.gamesPage - 1) * this.pageSize;
    return this.filteredGames.slice(start, start + this.pageSize);
  }

  // Filtra acessórios dinamicamente pelo console selecionado
  get filteredAccessories(): Accessory[] {
    if (!this.selectedConsoleName) { return this.accessories; }
    const aliases = this.getConsoleAliases(this.selectedConsoleName);
    const selectedId = this.selectedConsoleId; // ID do console selecionado
    
    return this.accessories.filter(a => {
      // Acessórios com 'all' continuam visíveis para qualquer console
      if (!a.console || a.console === 'all') return true;
      const field = this.normalizeConsoleField(a.console);
      if (field === 'all') return true;
      
      // Verifica por nome normalizado OU ID do console
      const matchByName = aliases.has(field);
      const matchById = selectedId && a.console === selectedId;
      
      return matchByName || matchById;
    });
  }

  get accessoriesTotalPages(): number { return Math.max(1, Math.ceil(this.filteredAccessories.length / this.pageSize)); }

  get pagedAccessories(): Accessory[] {
    const start = (this.accessoriesPage - 1) * this.pageSize;
    return this.filteredAccessories.slice(start, start + this.pageSize);
  }

  // Paginação helpers
  range(n: number): number[] { return Array.from({ length: n }, (_, i) => i + 1); }

  // Paginação de consoles
  get consolesTotalPages(): number { return Math.max(1, Math.ceil(this.consoles.length / this.consolesPageSize)); }
  get pagedConsoles(): Console[] {
    const start = (this.consolesPage - 1) * this.consolesPageSize;
    return this.consoles.slice(start, start + this.consolesPageSize);
  }
  prevConsoles(): void { this.consolesPage = Math.max(1, this.consolesPage - 1); }
  nextConsoles(): void { this.consolesPage = Math.min(this.consolesTotalPages, this.consolesPage + 1); }
  setConsolesPage(p: number): void { this.consolesPage = Math.min(Math.max(1, p), this.consolesTotalPages); }

  prevGames(): void { this.gamesPage = Math.max(1, this.gamesPage - 1); }
  nextGames(): void { this.gamesPage = Math.min(this.gamesTotalPages, this.gamesPage + 1); }
  setGamesPage(p: number): void { this.gamesPage = Math.min(Math.max(1, p), this.gamesTotalPages); }

  prevAccessories(): void { this.accessoriesPage = Math.max(1, this.accessoriesPage - 1); }
  nextAccessories(): void { this.accessoriesPage = Math.min(this.accessoriesTotalPages, this.accessoriesPage + 1); }
  setAccessoriesPage(p: number): void { this.accessoriesPage = Math.min(Math.max(1, p), this.accessoriesTotalPages); }

  setLetter(letter: string | null): void {
    this.selectedLetter = letter;
    this.gamesPage = 1;
  }

  onLetterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target && typeof target.value === 'string' ? target.value : '';
    this.setLetter(value || null);
  }

  constructor(
    private dataService: DataService,
    private api: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private rentStateService: RentStateService
  ) {
  }

  private afterDataLoad(): void {
    // Recalcula mapeamento do console quando os consoles estiverem prontos
    if (this.selectedConsoleId && !this.selectedConsoleMapping && this.consolesLoaded) {
      this.selectedConsoleMapping = this.getConsoleMappingById(this.selectedConsoleId) as string | null;
      const selectedConsole = this.consoles.find(c => c.id === this.selectedConsoleId);
      this.selectedConsoleName = selectedConsole ? selectedConsole.name : this.selectedConsoleName;
      this.rentStateService.updateConsole(this.selectedConsoleId, this.selectedConsoleName, this.selectedConsoleMapping);
    }

    // Quando dados de jogos/acessórios chegarem, reconcile as seleções salvas
    if (this.gamesLoaded) {
      const allowedGameIds = this.filteredGames.map(g => g.id);
      const newGameIds = this.selectedGameIds.filter(id => allowedGameIds.includes(id));
      if (newGameIds.length !== this.selectedGameIds.length) {
        this.selectedGameIds = newGameIds;
        this.rentStateService.updateGames(this.selectedGameIds);
      }
    }
    if (this.accessoriesLoaded) {
      const allowedAccessoryIds = this.filteredAccessories.map(a => a.id);
      const newAccIds = this.selectedAccessoryIds.filter(id => allowedAccessoryIds.includes(id));
      if (newAccIds.length !== this.selectedAccessoryIds.length) {
        this.selectedAccessoryIds = newAccIds;
        this.rentStateService.updateAccessories(this.selectedAccessoryIds);
      }
    }

    // Sempre recalcular total quando qualquer dado chega
    this.updateTotal();
  }

  ngOnInit(): void {
    // Carregar dados do backend via API
    this.api.getConsoles().subscribe(consoles => {
      if (consoles && consoles.length > 0) {
        this.consoles = consoles.map(c => ({
          id: c.id?.toString() || '',
          name: c.name || '',
          price: c.price || 0,
          image: c.imagem || c.image || '' // Suporta ambos os nomes
        }));
        console.log('Consoles carregados do backend:', this.consoles); // Debug
      } else {
        // Fallback para localStorage
        this.consoles = this.dataService.getConsoles();
        console.log('Consoles carregados do localStorage:', this.consoles); // Debug
      }
      this.consolesLoaded = true;
      this.afterDataLoad();
    });

    this.api.getAccessories().subscribe(accessories => {
      if (accessories && accessories.length > 0) {
        this.accessories = accessories.map(a => ({
          id: a.id?.toString() || '',
          name: a.name || '',
          price: a.price || 0,
          console: a.console || 'all',
          image: a.imagem || a.image || '' // Suporta ambos os nomes
        }));
        console.log('Acessórios carregados:', this.accessories.length); // Debug
      } else {
        // Fallback para localStorage
        this.accessories = this.dataService.getAccessories();
      }
      this.accessoriesLoaded = true;
      this.afterDataLoad();
    });

    this.api.getGames().subscribe(g => {
      if (g && g.length > 0) {
        this.games = g.map(x => ({ 
          id: x.id?.toString() || x.name, 
          name: x.name, 
          price: x.price || 0, 
          console: x.console || 'all', 
          image: x.imagem || x.image || '' // Suporta ambos os nomes
        }));
        console.log('Jogos carregados:', this.games.length, this.games.map(g => ({ name: g.name, console: g.console }))); // Debug
      } else {
        this.games = this.dataService.getGames();
      }
      this.gamesLoaded = true;
      this.afterDataLoad();
    });
    
    // Restaurar estado salvo
    const savedState = this.rentStateService.getState();
    this.selectedConsoleId = savedState.selectedConsoleId;
    this.selectedConsoleName = savedState.selectedConsoleName;
    this.selectedConsoleMapping = this.selectedConsoleId ? this.getConsoleMappingById(this.selectedConsoleId) : null;
    this.selectedPlan = savedState.selectedPlan;
    this.selectedGameIds = [...savedState.selectedGameIds];
    this.selectedAccessoryIds = [...savedState.selectedAccessoryIds];
    this.purchaseOption = savedState.purchaseOption;
    
    // A compatibilização agora acontece quando os dados carregam (afterDataLoad)
    
    // Garantir páginas válidas ao carregar dados
    this.consolesPage = 1;
    this.gamesPage = 1;
    this.accessoriesPage = 1;
    
    // O total será recalculado quando os dados chegarem via afterDataLoad()
  }

  ngOnDestroy(): void {
    // Cleanup se necessário
  }

  selectConsole(consoleId: string): void {
    if (this.selectedConsoleId === consoleId) {
      // Se clicar no console já selecionado, desmarca
      this.selectedConsoleId = null;
      this.selectedConsoleName = null;
      this.selectedConsoleMapping = null;
    } else {
      this.selectedConsoleId = consoleId;
      const selectedConsole = this.consoles.find(c => c.id === consoleId);
      this.selectedConsoleName = selectedConsole ? selectedConsole.name : null;
      this.selectedConsoleMapping = this.getConsoleMappingById(consoleId);
      console.log('Console selecionado:', { id: consoleId, name: this.selectedConsoleName, mapping: this.selectedConsoleMapping }); // Debug
    }
    // Quando trocar o console, resetar paginação de jogos e acessórios
    this.gamesPage = 1;
    this.accessoriesPage = 1;
    // Resetar filtro por letra ao trocar de console
    this.selectedLetter = null;
    // Remover jogos e acessórios selecionados que não são compatíveis com o console agora selecionado
    const allowedGameIds = this.filteredGames.map(g => g.id);
    this.selectedGameIds = this.selectedGameIds.filter(id => allowedGameIds.includes(id));
    const allowedAccessoryIds = this.filteredAccessories.map((a: Accessory) => a.id);
    this.selectedAccessoryIds = this.selectedAccessoryIds.filter((id: string) => allowedAccessoryIds.includes(id));
    
    // Salvar estado
    this.rentStateService.updateConsole(this.selectedConsoleId, this.selectedConsoleName, this.selectedConsoleMapping);
    this.rentStateService.updateGames(this.selectedGameIds);
    this.rentStateService.updateAccessories(this.selectedAccessoryIds);
    
    this.updateTotal();
  }

  selectPlan(plan: string): void {
    this.selectedPlan = this.selectedPlan === plan ? null : plan;
    // Desmarcar a opção de compra se o plano não for Anual
    if (this.selectedPlan !== 'Anual') {
      this.purchaseOption = false;
    }
    
    // Salvar estado
    this.rentStateService.updatePlan(this.selectedPlan);
    this.rentStateService.updatePurchaseOption(this.purchaseOption);
    
    this.updateTotal();
  }

  toggleGame(gameId: string): void {
    const index = this.selectedGameIds.indexOf(gameId);
    if (index > -1) { this.selectedGameIds.splice(index, 1); } 
    else { this.selectedGameIds.push(gameId); }
    
    // Salvar estado
    this.rentStateService.updateGames(this.selectedGameIds);
    
    this.updateTotal();
  }

  toggleAccessory(accessoryId: string): void {
    const index = this.selectedAccessoryIds.indexOf(accessoryId);
    if (index > -1) { this.selectedAccessoryIds.splice(index, 1); } 
    else { this.selectedAccessoryIds.push(accessoryId); }
    
    // Salvar estado
    this.rentStateService.updateAccessories(this.selectedAccessoryIds);
    
    this.updateTotal();
  }

  onPurchaseOptionChange(event: Event): void {
    this.purchaseOption = (event.target as HTMLInputElement).checked;
    
    // Salvar estado
    this.rentStateService.updatePurchaseOption(this.purchaseOption);
    
    this.updateTotal();
  }

  updateTotal(): void {
    let total = 0;

    // Calcula o preço do console
    if (this.selectedConsoleId) {
      const selectedConsole = this.consoles.find(c => c.id === this.selectedConsoleId);
      total += selectedConsole?.price || 0;
      console.log('Console price:', selectedConsole?.price, 'Console:', selectedConsole?.name); // Debug
    }

    // Adiciona o preço do plano
    if (this.selectedPlan) {
      const planPrices: { [key: string]: number } = {
        'Semanal': 99.00,
        'Mensal': 299.00,
        'Anual': 500.00
      };
      total += planPrices[this.selectedPlan] || 0;
      console.log('Plan price:', planPrices[this.selectedPlan], 'Plan:', this.selectedPlan); // Debug
    }

    // Calcula o preço total dos jogos
    const selectedGames = this.games.filter(game => this.selectedGameIds.includes(game.id));
    const gamesTotal = selectedGames.reduce((sum, game) => sum + game.price, 0);
    total += gamesTotal;
    console.log('Games total:', gamesTotal, 'Selected games:', selectedGames.length); // Debug

    // Calcula o preço total dos acessórios
    const selectedAccessories = this.accessories.filter(acc => this.selectedAccessoryIds.includes(acc.id));
    const accessoriesTotal = selectedAccessories.reduce((sum, acc) => sum + acc.price, 0);
    total += accessoriesTotal;
    console.log('Accessories total:', accessoriesTotal, 'Selected accessories:', selectedAccessories.length); // Debug

    // Adiciona a taxa de compra se necessário
    if (this.purchaseOption) {
      total += 1800;
      console.log('Purchase fee added: 1800'); // Debug
    }

    this.totalPrice = total;
    console.log('Total price calculated:', this.totalPrice); // Debug
  }

  finalizeRental(): void {
    if (!this.selectedConsoleId || !this.selectedPlan) {
      alert('Por favor, selecione um console e um plano.');
      return;
    }

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        alert('Você precisa estar logado para finalizar o aluguel.');
        this.router.navigate(['/login'], { queryParams: { redirect: 'rent' } });
        return;
      }

      const addrs = currentUser.addresses;
      console.log('Current user:', currentUser);
      console.log('Addresses:', addrs);
      
      if (!addrs || !Array.isArray(addrs) || addrs.length === 0) {
        alert('Cadastre um endereço para concluir o aluguel.');
        this.router.navigate(['/user-area']);
        return;
      }

      // Enviar aluguel para o backend
      const consoleIdNum = parseInt(this.selectedConsoleId);
      const gamesIdsNum = this.selectedGameIds.map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));
      const accessoriesIdsNum = this.selectedAccessoryIds.map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));

      // Validar se os IDs são válidos
      if (isNaN(consoleIdNum)) {
        console.error('ID do console inválido:', this.selectedConsoleId);
        alert('Erro: ID do console inválido. Por favor, selecione novamente.');
        return;
      }

      const rentalData = {
        clientId: currentUser.id,
        consoleId: consoleIdNum,
        plan: this.selectedPlan,
        gamesIds: gamesIdsNum,
        accessoriesIds: accessoriesIdsNum,
        purchaseOption: this.purchaseOption
      };

        console.log('=== DADOS DO ALUGUEL ===');
        console.log('Current User:', currentUser);
        console.log('Rental Data:', rentalData);
        console.log('=======================');

      this.api.createRental(rentalData).subscribe({
        next: (response: any) => {
            console.log('Aluguel criado com sucesso:', response);
          
            // Atualizar dados do usuário no sessionStorage se necessário
            const updatedUser = this.authService.getCurrentUser();
            if (updatedUser) {
              sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
            }
          
          // Limpar estado após finalizar aluguel
          this.rentStateService.clearState();
          
          alert('Aluguel finalizado com sucesso! Entraremos em contato para combinar a entrega.');
          this.router.navigate(['/user-area']);
        },
        error: (err: any) => {
          console.error('Erro completo ao criar aluguel:', err);
          console.error('Status:', err.status);
          console.error('Mensagem:', err.error);
          const errorMsg = err.error?.message || err.message || 'Erro desconhecido';
          alert(`Erro ao finalizar aluguel: ${errorMsg}\nVerifique o console para mais detalhes.`);
        }
      });
  }

  // Preço do plano exposto para o template
  planPrice(plan: 'Semanal' | 'Mensal' | 'Anual'): number {
    return this.dataService.getPlanPrice(plan);
  }

  // Métodos para modal de detalhes
  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  getSelectedConsole(): Console | undefined {
    return this.consoles.find(c => c.id === this.selectedConsoleId);
  }

  getSelectedGames(): Game[] {
    return this.games.filter(g => this.selectedGameIds.includes(g.id));
  }

  getSelectedAccessories(): Accessory[] {
    return this.accessories.filter(a => this.selectedAccessoryIds.includes(a.id));
  }

  clearSelection(): void {
    // Limpar todas as seleções
    this.selectedConsoleId = null;
    this.selectedConsoleName = null;
    this.selectedConsoleMapping = null;
    this.selectedPlan = null;
    this.selectedGameIds = [];
    this.selectedAccessoryIds = [];
    this.purchaseOption = false;
    this.selectedLetter = null;
    
    // Resetar paginação
    this.consolesPage = 1;
    this.gamesPage = 1;
    this.accessoriesPage = 1;
    
    // Limpar estado no serviço
    this.rentStateService.clearState();
    
    // Recalcular total
    this.updateTotal();
    
    // Feedback visual
    console.log('Seleção limpa com sucesso');
  }
}