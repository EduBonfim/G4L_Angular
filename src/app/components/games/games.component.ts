import { Component, OnInit } from '@angular/core';
import { Game } from '../../models/data.model';
import { DataService } from '../../services/data.service';
import { ApiService } from '../../services/api.service';
import { RentStateService } from '../../services/rent-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
})
export class GamesComponent implements OnInit {
  games: Game[] = [];
  selectedGameIds: string[] = [];
  selectedConsoleName: string | null = null;
  selectedConsoleId: string | null = null;
  selectedConsoleMapping: string | null = null;

  get filteredGames(): Game[] {
    if (!this.selectedConsoleMapping) { return this.games; }
    return this.games.filter(g => g.console === this.selectedConsoleMapping || g.console === 'all');
  }

  constructor(
    private dataService: DataService,
    private api: ApiService,
    private rentState: RentStateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.api.getGames().subscribe(g => {
      if (g && g.length > 0) {
        this.games = g.map(x => ({ 
          id: x.id?.toString() || x.name, 
          name: x.name, 
          price: x.price || 0, 
          console: x.console || 'all', 
          image: x.imagem || x.image || '' 
        }));
        console.log('Jogos carregados:', this.games.length, this.games.map(g => ({ name: g.name, console: g.console })));
      } else {
        this.games = this.dataService.getGames();
      }
    });
    this.selectedGameIds = [...this.rentState.getState().selectedGameIds];
    
    // Carregar console selecionado do estado de aluguel
    const savedState = this.rentState.getState();
    this.selectedConsoleId = savedState.selectedConsoleId;
    this.selectedConsoleName = savedState.selectedConsoleName;
    this.selectedConsoleMapping = savedState.selectedConsoleMapping;
    console.log('Estado carregado:', { id: this.selectedConsoleId, name: this.selectedConsoleName, mapping: this.selectedConsoleMapping });
  }

  isSelected(id: string): boolean {
    return this.selectedGameIds.includes(id);
  }

  toggleSelect(game: Game): void {
    const idx = this.selectedGameIds.indexOf(game.id);
    if (idx > -1) {
      this.selectedGameIds.splice(idx, 1);
    } else {
      this.selectedGameIds.push(game.id);
    }
    this.rentState.updateGames(this.selectedGameIds);
  }

  goToRent(): void {
    this.router.navigate(['/rent']);
  }
}