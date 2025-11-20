import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = `${environment.apiBaseUrl}/api`;
  constructor(private http: HttpClient) {}

  getGames(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/games`).pipe(catchError(() => of([])));
  }

  getConsoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/consoles`).pipe(catchError(() => of([])));
  }

  getAccessories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/accessories`).pipe(catchError(() => of([])));
  }

  createRental(rentalData: any): Observable<any> {
    return this.http.post<any>(`${this.api}/rentals`, rentalData);
  }

  getRentals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/rentals`).pipe(catchError(() => of([])));
  }

  getRentalsForCpf(cpf: string): Observable<any[]> {
    if (!cpf) return of([]);
    // Não atrapalhar o tratamento de erro do componente (para o usuário ver mensagens específicas)
    return this.http.get<any[]>(`${this.api}/rentals/me`, { headers: { 'X-Client-Cpf': cpf } });
  }
}
