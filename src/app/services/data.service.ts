import { Injectable } from '@angular/core';
import { Console, Game, Accessory, Rental, Client } from '../models/data.model';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly PLAN_PRICES: { [key: string]: number } = { Semanal: 99, Mensal: 299, Anual: 500 };
  public readonly PURCHASE_FEE = 1800;

  constructor() { this.initializeData(); }

  private initializeData(): void {
    if (!localStorage.getItem('consoles')) {
      const consoles: Console[] = [
        { id: 'ps5', name: 'PlayStation 5', price: 299, image: '/assets/consoles/Ps5.jpeg' },
        { id: 'xbox', name: 'Xbox Series X', price: 279, image: '/assets/consoles/xboxOneX.jpeg' },
        { id: 'switch', name: 'Nintendo Switch', price: 199, image: '/assets/consoles/SwitchOled.jpeg' },
        { id: 'steam', name: 'Steam Deck', price: 400, image: '/assets/consoles/SteamDeck.jpg' }
        // { id: '', name: '', price: , image: '' }
      ];
      localStorage.setItem('consoles', JSON.stringify(consoles));
    }
    if (!localStorage.getItem('games')) {
      const games: Game[] = [
        { id: 'fifa25', name: 'FIFA 25', price: 49, console: 'all', image: 'https://imgs.search.brave.com/8CdtI7vlmHLOjI4KBbS7xEVpClyhs86_GuHu0iLlujo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9odHRw/Mi5tbHN0YXRpYy5j/b20vRF9RX05QXzJY/Xzk0NDU3MC1DQlQ5/MDI4MzQ1MjM0MF8w/ODIwMjUtRS1maWZh/LTI1LWZjLTI1LWZp/c2ljYS1zb255Lndl/YnA' },
        { id: 'gow', name: 'God of War Ragnarök', price: 59, console: 'ps5', image: 'https://images.kabum.com.br/produtos/fotos/sync_mirakl/410629/Jogo-God-Of-War-Ragnar-k-Playstation-5_1719514745_gg.jpg' },
        { id: 'zelda', name: 'Zelda: Tears of the Kingdom', price: 69, console: 'switch', image: 'https://imgs.search.brave.com/Q8tr4iRYvLSzBL8p8dDNzj0PesFDxE8cR7dIhpYF8PY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NjE4R1IwV01vUUwu/anBn' },
        { id: 'spiderman', name: 'Spider-Man 2', price: 69, console: 'ps5', image: 'https://images.kabum.com.br/produtos/fotos/sync_mirakl/503115/Jogo-Marvels-Spider-Man-2-Standard-Edition-Playstation-5_1724244091_g.jpg' },
        { id: 'mario', name: 'Mario Kart 8 Deluxe', price: 59, console: 'switch', image: 'https://imgs.search.brave.com/skw4HoUF3pjne1tcDZIg6fnyD9RGyeq01aUqSo7-sy0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NjFVRm5XNFhld0wu/anBn' },
        { id: 'hollowknight', name: 'Hollow Knight', price: 59, console: 'steam', image: 'https://thunderkeys.com/cdn/shop/files/1_d34353ea-c2cc-456d-abd8-0036d65f8255.png?v=1703066100' },
        { id: 'subnautica', name: 'SubNautica Deep Ocean Bundle', price: 59, console: 'steam', image: 'https://www.mmoga.com/images/games/_ext/1625419/subnautica-deep-ocean-bundle_large.png' },
        { id: 'guardiansofthegalaxy', name: 'Marvel Guardians Of The Galaxy', price: 59, console: 'xbox', image: 'https://lojaarenagames.com.br/wp-content/uploads/2022/02/Marvel_Guardians_Of_The_Galaxy___Xbox_One__Series_X_698612-1.jpg' },
        { id: 'ittakestwo', name: 'It Takes Two', price: 59, console: 'xbox', image: 'https://images.kabum.com.br/produtos/fotos/sync_mirakl/256128/Jogo-It-Takes-Two-Xbox_1689295716_gg.jpg' },
        { id: 'needforspeed', name: 'Need for Speed Unbound', price: 59, console: 'xbox', image: 'https://needgames.com.br/wp-content/uploads/2022/12/need-for-speed-unbound-xbox-series-cover.jpg' }
        // { id: '', name: '', price: , console: '', image: '' }
        
      ];
      localStorage.setItem('games', JSON.stringify(games));
    }
    if (!localStorage.getItem('accessories')) {
      const accessories: Accessory[] = [
        { id: 'extra-controller', name: 'Controle Extra', price: 59, console: 'all', image: 'https://images.unsplash.com/photo-1659700785595-cf5907e6146f?q=80' },
        { id: 'vr-glasses', name: 'Óculos VR', price: 129, console: 'ps5', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80' },
        { id: 'headset', name: 'Headset Gamer', price: 59, console: 'all', image: 'https://images.unsplash.com/photo-1629429407756-4a7703614972?q=80' },
        { id: 'playstation', name: 'PlayStation Camera', price: 59, console: 'ps5', image: 'https://imgs.search.brave.com/H5-EBGttIT7NcoczWJL1Q-SkOaPKF69YE5e9IuiUrks/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnl0/aW1nLmNvbS92aV93/ZWJwL2xTRkpvQlda/NWJjL21heHJlc2Rl/ZmF1bHQud2VicA' },
        { id: 'kinect', name: 'Kinect', price: 80, console: 'xbox', image: 'https://gamerant.com/wp-content/uploads/2020/07/xbox-series-x-backward-compatibility-kinect.jpg' },
        { id: 'nintendo', name: 'Nintendo Labo', price: 80, console: 'switch', image: 'https://assets.b9.com.br/wp-content/uploads/2018/01/nlabo-b9.jpg' },
        { id: 'logitech-g920', name: 'Volante Logitech G920', price: 300, console: 'xbox', image: 'https://imgs.search.brave.com/iLJcwPddlMCgchm-ZaApy5_irJZhaIPgjFrpBHdewMA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/b2x4LmNvbS5ici90/aHVtYnM3MDB4NTAw/LzMxLzMxOTU4NzY5/NDU0MDU1MS53ZWJw' },
        { id: 'thrustmaster-t128', name: 'Volante Thrustmaster T128', price: 200, console: 'ps5', image: 'https://imgs.search.brave.com/FWYOwfhjn8rd_n-8Ykjdr6XEZhy_mmZRc_aQ3wZGXOk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zZ2Ft/aW5nLmVzL3N0b3Jh/Z2UvcHJvZHVjdG9z/L3RocnVzdG1hc3Rl/ci10MTI4LndlYnA' },
        { id: 'basecarregadora', name: 'Base Carregadora', price: 80, console: 'xbox', image: 'https://imgs.search.brave.com/506F-472nlgt83JnzOe3zSHpb-04oBvM5OAavB8iKek/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NjFDbG9henhvOEwu/anBn' }
        // { id: '', name: '', price: , console: '', image: '' }
      ];
      localStorage.setItem('accessories', JSON.stringify(accessories));
    }
    // Deduplicar IDs de acessórios caso tenha havido migração manual incorreta
    this.fixDuplicateAccessoryIds();
    if (!localStorage.getItem('alugueis')) {
        localStorage.setItem('alugueis', JSON.stringify([]));
    }
  }

  // Verifica e corrige acessórios com IDs duplicados gerando um sufixo único
  private fixDuplicateAccessoryIds(): void {
    try {
      const raw = localStorage.getItem('accessories');
      if (!raw) { return; }
      const list: Accessory[] = JSON.parse(raw);
      const seen = new Map<string, number>();
      let changed = false;
      for (const acc of list) {
        const count = seen.get(acc.id) || 0;
        if (count > 0) {
          // gera novo id único baseado no original + índice
          const newId = `${acc.id}-${count + 1}`;
          acc.id = newId;
          changed = true;
        }
        seen.set(acc.id, (seen.get(acc.id) || 0) + 1);
      }
      if (changed) {
        localStorage.setItem('accessories', JSON.stringify(list));
      }
    } catch { /* ignore parse errors */ }
  }

  private getItem<T>(key: string): T[] { const data = localStorage.getItem(key); return data ? JSON.parse(data) : []; }
  private setItem<T>(key: string, value: T[]): void { localStorage.setItem(key, JSON.stringify(value)); }

  getConsoles = (): Console[] => this.getItem<Console>('consoles');
  getGames = (): Game[] => this.getItem<Game>('games');
  getAccessories = (): Accessory[] => this.getItem<Accessory>('accessories');
  // Retorna aluguéis garantindo migração de campos endDate e planMultiplier
  getRentals = (): Rental[] => {
    const rentals = this.getItem<Rental>('alugueis');
    let changed = false;
    for (const r of rentals) {
      // Definir multiplicador inicial se ausente
      if (r.planMultiplier === undefined || r.planMultiplier === null) {
        r.planMultiplier = 1;
        changed = true;
      }
      // Calcular endDate se ausente
      if (!r.endDate) {
        const planDays = this.getPlanDays(r.plan);
        const baseDate = new Date(r.orderDate);
        baseDate.setDate(baseDate.getDate() + planDays * (r.planMultiplier || 1));
        r.endDate = baseDate.toISOString();
        changed = true;
      }
      // Campos de extensão pendente
      if (r.pendingExtensionAmount === undefined || r.pendingExtensionAmount === null) {
        r.pendingExtensionAmount = 0;
        changed = true;
      }
      if (!r.pendingExtensionStatus) {
        r.pendingExtensionStatus = (r.pendingExtensionAmount && r.pendingExtensionAmount > 0) ? 'pendente' : 'pago';
        changed = true;
      }
    }
    if (changed) {
      this.setItem<Rental>('alugueis', rentals as any);
    }
    return rentals;
  };

  // Dias correspondentes ao plano
  getPlanDays(plan: string): number {
    switch (plan) {
      case 'Semanal': return 7;
      case 'Mensal': return 30;
      case 'Anual': return 365;
      default: return 0;
    }
  }

  // Estende um aluguel existente, usando o plano informado (Semanal/Mensal/Anual)
  extendRental(rentalId: number, plan: string, multiplier: number): Rental | null {
    if (multiplier <= 0) return null;
    const rentals = this.getRentals(); // já migra
    const idx = rentals.findIndex(r => r.id === rentalId);
    if (idx === -1) return null;
    const rental = rentals[idx];
    const planDays = this.getPlanDays(plan || rental.plan);
    const planPrice = this.getPlanPrice(plan || rental.plan);
    // Atualizar endDate
    const currentEnd = rental.endDate ? new Date(rental.endDate) : new Date(rental.orderDate);
    const proposedEnd = new Date(currentEnd);
    proposedEnd.setDate(proposedEnd.getDate() + planDays * multiplier);
    // Limite máximo: orderDate + 3 anos
    const limit = new Date(rental.orderDate);
    limit.setFullYear(limit.getFullYear() + 3);
    if (proposedEnd.getTime() > limit.getTime()) {
      return null; // bloqueia extensão acima de 3 anos
    }
    rental.endDate = proposedEnd.toISOString();
    // Atualizar multiplicador acumulado
    if ((plan || rental.plan) === rental.plan) {
      rental.planMultiplier = (rental.planMultiplier || 1) + multiplier;
    }
    // Recalcular preço adicional (apenas plano * multiplier novo)
    rental.totalPrice = (rental.totalPrice || 0) + (planPrice * multiplier);
    // Registrar como extensão pendente
    rental.pendingExtensionAmount = (rental.pendingExtensionAmount || 0) + (planPrice * multiplier);
    rental.pendingExtensionStatus = 'pendente';
    rentals[idx] = rental;
    this.setItem<Rental>('alugueis', rentals as any);
    return rental;
  }

  // Expor preço dos planos para uso no template
  getPlanPrice(plan: 'Semanal' | 'Mensal' | 'Anual' | string): number {
    return this.PLAN_PRICES[plan] || 0;
  }

  getClients(): Client[] {
    const rentals = this.getRentals();
    const clientsMap = new Map<string, Client>();
    rentals.forEach(r => clientsMap.set(r.client.cpf, r.client));
    return Array.from(clientsMap.values());
  }

  addGame(game: Omit<Game, 'id'>): void {
    const games = this.getGames();
    const newGame: Game = { ...game, id: game.name.toLowerCase().replace(/\s/g, '-') };
    games.push(newGame);
    this.setItem('games', games);
  }

  addAccessory(accessory: Omit<Accessory, 'id'>): void {
    const accessories = this.getAccessories();
    const newAccessory: Accessory = { ...accessory, id: accessory.name.toLowerCase().replace(/\s/g, '-') };
    accessories.push(newAccessory);
    this.setItem('accessories', accessories);
  }

  addConsole(consoleItem: Omit<Console, 'id'>): void {
    const consoles = this.getConsoles();
    const newConsole: Console = { ...consoleItem, id: consoleItem.name.toLowerCase().replace(/\s/g, '-') };
    consoles.push(newConsole);
    this.setItem('consoles', consoles);
  }

  deleteConsole(id: string): void {
    const consoles = this.getConsoles().filter(c => c.id !== id);
    this.setItem('consoles', consoles);
  }

  deleteGame(id: string): void {
    const games = this.getGames().filter(g => g.id !== id);
    this.setItem('games', games);
  }

  deleteAccessory(id: string): void {
    const accessories = this.getAccessories().filter(a => a.id !== id);
    this.setItem('accessories', accessories);
  }

  calculateTotal(consoleId: string | null, plan: string | null, gameIds: string[], accessoryIds: string[], purchaseOption: boolean): number {
    let total = 0;

    // Calcula o preço do console
    if (consoleId) {
      const consoles = this.getConsoles();
      const selectedConsole = consoles.find(c => c.id === consoleId);
      total += selectedConsole?.price || 0;
    }

    // Adiciona o preço do plano
    if (plan) { 
      total += this.PLAN_PRICES[plan] || 0; 
    }

    // Calcula o preço total dos jogos
    const games = this.getGames();
    const selectedGames = games.filter(game => gameIds.includes(game.id));
    total += selectedGames.reduce((sum, game) => sum + game.price, 0);

    // Calcula o preço total dos acessórios
    const accessories = this.getAccessories();
    const selectedAccessories = accessories.filter(acc => accessoryIds.includes(acc.id));
    total += selectedAccessories.reduce((sum, acc) => sum + acc.price, 0);

    // Adiciona a taxa de compra se necessário
    if (purchaseOption) { 
      total += this.PURCHASE_FEE; 
    }

    return total;
  }

  finalizeRental(client: Client, consoleId: string, plan: string, gameIds: string[], accessoryIds: string[], purchaseOption: boolean, totalPrice: number): void {
    const rentals = this.getRentals(); // já migra existentes
    const newId = rentals.length > 0 ? Math.max(...rentals.map(r => r.id)) + 1 : 1;
    const orderDate = new Date();
    const planDays = this.getPlanDays(plan);
    const endDate = new Date(orderDate);
    endDate.setDate(endDate.getDate() + planDays); // multiplicador inicial 1
    const newRental: Rental = {
      id: newId,
      client,
      consoleId,
      plan,
      gameIds,
      accessoryIds,
      purchaseOption,
      totalPrice,
      orderDate: orderDate.toISOString(),
      endDate: endDate.toISOString(),
      planMultiplier: 1,
      pendingExtensionAmount: 0,
      pendingExtensionStatus: 'pago'
    };
    rentals.push(newRental);
    this.setItem('alugueis', rentals as any);
    
    // Salvar o usuário logado no localStorage para exibição na área de usuário
    localStorage.setItem('currentUser', JSON.stringify(client));
  }

  // Confirma o pagamento das extensões (zera valor pendente e marca como pago)
  confirmExtensionPayment(rentalId: number): Rental | null {
    const rentals = this.getRentals();
    const idx = rentals.findIndex(r => r.id === rentalId);
    if (idx === -1) return null;
    const r = rentals[idx];
    r.pendingExtensionAmount = 0;
    r.pendingExtensionStatus = 'pago';
    rentals[idx] = r;
    this.setItem<Rental>('alugueis', rentals as any);
    return r;
  }
}