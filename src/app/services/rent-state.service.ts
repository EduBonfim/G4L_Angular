import { Injectable } from '@angular/core';

export interface RentState {
  selectedConsoleId: string | null;
  selectedConsoleName: string | null;
  selectedConsoleMapping: string | null; // ps5, xbox, switch, steam
  selectedPlan: string | null;
  selectedGameIds: string[];
  selectedAccessoryIds: string[];
  purchaseOption: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RentStateService {
  private readonly STATE_KEY = 'rentState';
  private state: RentState;

  constructor() {
    // Carregar estado do sessionStorage ao inicializar
    this.state = this.loadFromSession();
  }

  private loadFromSession(): RentState {
    const saved = sessionStorage.getItem(this.STATE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Se houver erro ao parsear, retorna estado padrão
      }
    }
    return {
      selectedConsoleId: null,
      selectedConsoleName: null,
      selectedConsoleMapping: null,
      selectedPlan: null,
      selectedGameIds: [],
      selectedAccessoryIds: [],
      purchaseOption: false
    };
  }

  private saveToSession(): void {
    sessionStorage.setItem(this.STATE_KEY, JSON.stringify(this.state));
  }

  getState(): RentState {
    return { ...this.state };
  }

  setState(state: Partial<RentState>): void {
    this.state = { ...this.state, ...state };
    this.saveToSession();
  }

  updateConsole(consoleId: string | null, consoleName: string | null, consoleMapping: string | null = null): void {
    this.state.selectedConsoleId = consoleId;
    this.state.selectedConsoleName = consoleName;
    this.state.selectedConsoleMapping = consoleMapping;
    this.saveToSession();
  }

  updatePlan(plan: string | null): void {
    this.state.selectedPlan = plan;
    // Resetar opção de compra se não for plano Anual
    if (plan !== 'Anual') {
      this.state.purchaseOption = false;
    }
    this.saveToSession();
  }

  updateGames(gameIds: string[]): void {
    this.state.selectedGameIds = [...gameIds];
    this.saveToSession();
  }

  updateAccessories(accessoryIds: string[]): void {
    this.state.selectedAccessoryIds = [...accessoryIds];
    this.saveToSession();
  }

  updatePurchaseOption(purchase: boolean): void {
    this.state.purchaseOption = purchase;
    this.saveToSession();
  }

  clearState(): void {
    this.state = {
      selectedConsoleId: null,
      selectedConsoleName: null,
      selectedConsoleMapping: null,
      selectedPlan: null,
      selectedGameIds: [],
      selectedAccessoryIds: [],
      purchaseOption: false
    };
    this.saveToSession();
  }
}
