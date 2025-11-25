import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';

export type UserType = 'admin' | 'cliente';

export type RegisterErrorReason = 'invalid-cpf' | 'duplicate-cpf' | 'duplicate-username' | 'unknown';
export type RegisterResult = { success: true } | { success: false; reason: RegisterErrorReason };

// Interface para endereços
export interface Address {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  referencePoint?: string;
  type: string;
  isDefault?: boolean;
}

// A resposta do seu Spring no login/registo (o ClientDto)
export interface UserResponse {
  id: number;
  username: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  roles: string[]; // Ex: ["ROLE_ADMIN"]
  addresses?: Address[]; // Endereços do cliente
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'authUser';
  private currentUserCache: UserResponse | null = null;
  private apiUrl = `${environment.apiBaseUrl}/auth`;

  // ⬅️ LOGIN ADMIN LOCAL REINTRODUZIDO
  private readonly VALID_USERNAME = 'admin';
  private readonly VALID_PASSWORD = 'CoghiOmaisLindo2025!';

  constructor(private router: Router, private http: HttpClient) {
    // Restaurar usuário do sessionStorage ao inicializar
    this.loadFromSession();
  }

  private loadFromSession(): void {
    const saved = sessionStorage.getItem(this.SESSION_KEY);
    if (saved) {
      try {
        this.currentUserCache = JSON.parse(saved);
      } catch (e) {
        sessionStorage.removeItem(this.SESSION_KEY);
      }
    }
  }

  private saveToSession(user: UserResponse | null): void {
    if (user) {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(this.SESSION_KEY);
    }
    this.currentUserCache = user;
  }

  // Atualiza parcialmente o usuário em cache e persiste em sessionStorage
  updateCurrentUser(partial: Partial<UserResponse>): void {
    const current = this.currentUserCache || (sessionStorage.getItem(this.SESSION_KEY) ? JSON.parse(sessionStorage.getItem(this.SESSION_KEY) as string) as UserResponse : null);
    if (!current) return;
    const updated: UserResponse = { ...current, ...partial } as UserResponse;
    this.saveToSession(updated);
  }

  // Atalho específico para endereços
  setAddresses(addresses: Address[]): void {
    this.updateCurrentUser({ addresses } as any);
  }

  isLoggedIn(): boolean {
    return this.currentUserCache !== null;
  }

  getCurrentUserId(): number | null {
    return this.currentUserCache?.id || null;
  }

  getCurrentUser(): UserResponse | null {
    return this.currentUserCache;
  }

  // Método para verificar sessão no backend e atualizar cache
  checkSession(): Observable<UserResponse | null> {
    // Se já tem usuário em cache, retorna ele
    if (this.currentUserCache) {
      return of(this.currentUserCache);
    }
    
    const url = `${this.apiUrl}/me`;
    return this.http.get<UserResponse>(url).pipe(
      tap(user => this.saveToSession(user)),
      catchError(() => {
        this.saveToSession(null);
        return of(null);
      })
    );
  }

  getUserType(): UserType | null {
    if (!this.currentUserCache) return null;
    if (this.currentUserCache.roles?.includes('ROLE_ADMIN')) return 'admin';
    return 'cliente';
  }

  isAdmin(): boolean {
    return this.getUserType() === 'admin';
  }

  isCliente(): boolean {
    return this.getUserType() === 'cliente';
  }

  /**
   * Conecta no @PostMapping("/login") do AuthController
   */
  login(username: string, password: string): Observable<boolean> {
    
    // 1. ADMIN LOCAL CHECK (Não chama o backend - APENAS PARA DESENVOLVIMENTO)
    if (username === this.VALID_USERNAME && password === this.VALID_PASSWORD) {
      const adminUser = { 
          id: 0, 
          name: 'Administrador Local', 
          username: 'admin', 
          cpf: '00000000000',
          email: 'admin@local.com',
          roles: ['ROLE_ADMIN'],
          addresses: []
      };
      this.saveToSession(adminUser);
      return of(true); 
    }

    // 2. Login de Cliente (100% via Spring)
    const url = `${this.apiUrl}/login`;
    return this.http.post<UserResponse>(url, { username, password }, { withCredentials: true }).pipe(
      tap(userInfo => {
        console.log('Login response from backend:', userInfo);
        console.log('Addresses received:', userInfo.addresses);
        this.saveToSession(userInfo);
      }),
      map(() => true),
      catchError(() => {
        this.saveToSession(null);
        return of(false);
      })
    );
  }

  /**
   * Regista E DEPOIS faz login automaticamente
   */
  registerCliente(name: string, cpf: string, email: string, phone: string, username: string, password: string): Observable<RegisterResult> {
    
    const url = `${this.apiUrl}/register`;
    const body = { name, cpf, email, phone, username, password };
    
    return this.http.post<UserResponse>(url, body, { withCredentials: true }).pipe(
      switchMap((responseDoSpring) => {
        // Chama o login (que agora lida com o backend)
        return this.login(username, password);
      }),
      
      map((loginSuccess): RegisterResult => {
        if (loginSuccess) {
          return { success: true };
        } else {
          return { success: false, reason: 'unknown' };
        }
      }),
      
      catchError((err: HttpErrorResponse): Observable<RegisterResult> => {
        const reason = err.error?.reason || 'unknown';
        return of({ success: false, reason: reason as RegisterErrorReason });
      })
    );
  }
  
  /**
   * Conecta no @PostMapping("/change-password") do AuthController
   */
  changePassword(cpf: string, currentPassword: string, newPassword: string): Observable<boolean> {
    const url = `${this.apiUrl}/change-password`;
    const body = { cpf, currentPassword, newPassword }; 
    
    return this.http.post(url, body, { withCredentials: true }).pipe(
      map(() => true), 
      catchError(() => of(false))
    );
  }

  /**
   * Limpa cache e chama logout no backend
   */
  logout(): void {
    const url = `${this.apiUrl}/logout`;
    this.http.post(url, {}, { withCredentials: true }).subscribe({
      complete: () => {
        this.saveToSession(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.saveToSession(null);
        this.router.navigate(['/login']);
      }
    });
  }
}
