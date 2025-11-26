import { Component, OnInit } from '@angular/core';
import { Accessory } from '../../models/data.model';
import { DataService } from '../../services/data.service';
import { ApiService } from '../../services/api.service';
import { RentStateService } from '../../services/rent-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accessories',
  templateUrl: './accessories.component.html',
})
export class AccessoriesComponent implements OnInit {
  accessories: Accessory[] = [];
  selectedAccessoryIds: string[] = [];
  selectedConsoleName: string | null = null;
  selectedConsoleId: string | null = null;
  selectedConsoleMapping: string | null = null;

  get filteredAccessories(): Accessory[] {
    if (!this.selectedConsoleMapping) { return this.accessories; }
    return this.accessories.filter(a => !a.console || a.console === 'all' || a.console === this.selectedConsoleMapping);
  }

  constructor(
    private dataService: DataService,
    private api: ApiService,
    private rentState: RentStateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.api.getAccessories().subscribe(accessories => {
      if (accessories && accessories.length > 0) {
        this.accessories = accessories.map(a => ({
          id: a.id?.toString() || '',
          name: a.name || '',
          price: a.price || 0,
          console: a.console || 'all',
          image: a.imagem || a.image || ''
        }));
        console.log('Acessórios carregados:', this.accessories.length);
      } else {
        this.accessories = this.dataService.getAccessories();
      }
    });
    
    this.selectedAccessoryIds = [...this.rentState.getState().selectedAccessoryIds];
    
    // Carregar console selecionado do estado de aluguel
    const savedState = this.rentState.getState();
    this.selectedConsoleId = savedState.selectedConsoleId;
    this.selectedConsoleName = savedState.selectedConsoleName;
    this.selectedConsoleMapping = savedState.selectedConsoleMapping;
    console.log('Estado carregado (accessories):', { id: this.selectedConsoleId, name: this.selectedConsoleName, mapping: this.selectedConsoleMapping });
  }

  isSelected(id: string): boolean {
    return this.selectedAccessoryIds.includes(id);
  }

  toggleSelect(accessory: Accessory): void {
    const idx = this.selectedAccessoryIds.indexOf(accessory.id);
    if (idx > -1) {
      this.selectedAccessoryIds.splice(idx, 1);
    } else {
      this.selectedAccessoryIds.push(accessory.id);
    }
    this.rentState.updateAccessories(this.selectedAccessoryIds);
  }

  goToRent(): void {
    this.router.navigate(['/rent']);
  }
}