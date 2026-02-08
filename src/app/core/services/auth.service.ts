import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  seller?: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }
          if (response.seller) {
            localStorage.setItem('seller', JSON.stringify(response.seller));
          }
        }
      })
    );
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    if (token) {
      return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
        tap(() => this.clearSession()),
        catchError(() => {
          this.clearSession();
          return of({});
        })
      );
    }
    this.clearSession();
    return of({});
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('seller');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isSeller(): boolean {
    return !!localStorage.getItem('seller');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getSeller(): any {
    const seller = localStorage.getItem('seller');
    return seller ? JSON.parse(seller) : null;
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, {}).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }
          if (response.seller) {
            localStorage.setItem('seller', JSON.stringify(response.seller));
          }
        }
      })
    );
  }
}
