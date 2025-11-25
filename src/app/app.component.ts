import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Games4Life';
  isLoggedIn = false;
  isAdmin = false;
  isCliente = false;
  currentUserName: string | null = null;
  menuOpen = false;
  needsAddress = false;
  showAddressTip = false;
  private addressesLoaded = false;
  private apiBase = environment.apiBaseUrl;

  constructor(private authService: AuthService, private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    // Atualizar status imediatamente com dados do sessionStorage
    this.updateAuthStatus();
    
    // Verificar sessão no backend ao iniciar (em background)
    this.authService.checkSession().subscribe(() => {
      this.updateAuthStatus();
    });
    
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        this.updateAuthStatus();
      }
    });
  }

  updateAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isAdmin = this.authService.isAdmin();
    this.isCliente = this.authService.isCliente();
    const user = this.authService.getCurrentUser();
    this.currentUserName = user?.name || null;
    const addrs = user?.addresses || [];
      console.log('=== UPDATE AUTH STATUS ===');
      console.log('User:', user?.name);
      console.log('Is Cliente:', this.isCliente);
      console.log('Addresses count:', addrs.length);
      console.log('Addresses:', addrs);
    this.needsAddress = !!(this.isLoggedIn && this.isCliente && addrs.length === 0);
    // Se logado e cliente e os endereços ainda não foram carregados, busca do backend
    if (this.isLoggedIn && this.isCliente && user?.id && addrs.length === 0 && !this.addressesLoaded) {
      const url = `${this.apiBase}/addresses/client/${user.id}`;
      console.log('Buscando endereços para o header:', url);
      this.addressesLoaded = true; // evita requisições repetidas em navegações
      this.http.get<any[]>(url).subscribe({
        next: (addresses) => {
          try {
            // Atualiza AuthService + sessionStorage em sincronia
            this.authService.setAddresses(addresses as any);
            console.log('Endereços atualizados (header):', addresses?.length || 0);
            // Recalcula estado do header após atualizar
            this.needsAddress = !!(this.isLoggedIn && this.isCliente && (addresses?.length || 0) === 0);
          } catch {}
        },
        error: (err) => {
          console.warn('Falha ao buscar endereços no header:', err);
        }
      });
    }
      console.log('Needs Address:', this.needsAddress);
      console.log('========================');
    this.showAddressTip = false;
  }

  logout(): void {
    this.authService.logout();
    this.updateAuthStatus();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  toggleAddressTip(): void {
    this.showAddressTip = !this.showAddressTip;
  }
}