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

  /** Login perfil Vendedor (solo cuentas con rol seller). */
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
          localStorage.setItem('rolActual', 'vendedor');
          localStorage.setItem('esVendedor', 'true');
        }
      })
    );
  }

  /** Registro de cliente sencillo (email, password, fecha_nacimiento). */
  register(email: string, password: string, fechaNacimiento: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, {
      email,
      password,
      fecha_nacimiento: fechaNacimiento,
      aceptar_condiciones: true,
    }).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }
          localStorage.removeItem('seller');
          localStorage.setItem('rolActual', 'usuario');
          localStorage.setItem('esVendedor', 'false');
        }
      })
    );
  }

  /** Login único que determina automáticamente el rol del usuario. 
   * Si el usuario es gestor, vendedor o usuario normal, se establece el rol correspondiente. */
  loginUsuario(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login-usuario`, { email, password }).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }
          // Si el usuario es vendedor y tiene seller activo, guardarlo para permitir cambio de roles
          if (response.seller) {
            localStorage.setItem('seller', JSON.stringify(response.seller));
          } else {
            localStorage.removeItem('seller');
          }
          
          // Determinar el rol inicial según las capacidades del usuario
          const user = response.user;
          const isGestor = user?.role === 'entity' || user?.role === 'administration' || user?.role === 'super_admin';
          const isVendedor = !!response.seller;
          
          // Establecer el rol inicial: gestor tiene prioridad, luego vendedor, luego usuario
          if (isGestor) {
            localStorage.setItem('rolActual', 'gestor');
            localStorage.setItem('esVendedor', 'false');
          } else if (isVendedor) {
            localStorage.setItem('rolActual', 'vendedor');
            localStorage.setItem('esVendedor', 'true');
          } else {
            localStorage.setItem('rolActual', 'usuario');
            localStorage.setItem('esVendedor', 'false');
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
    localStorage.removeItem('rolActual');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isSeller(): boolean {
    return !!localStorage.getItem('seller');
  }

  /** Usuario es gestor (rol entity). */
  isGestor(): boolean {
    const user = this.getUser();
    return user?.role === 'entity' || user?.role === 'administration' || user?.role === 'super_admin';
  }

  /** Puede ver pestaña Usuario (todos los usuarios logueados). */
  canViewUsuario(): boolean {
    return this.isLoggedIn();
  }

  /** Puede ver pestaña Vendedor (solo si está asignado como vendedor). */
  canViewVendedor(): boolean {
    return this.isLoggedIn() && this.isSeller();
  }

  /** Puede ver pestaña Gestor (solo si es gestor/entity/administration). */
  canViewGestor(): boolean {
    return this.isLoggedIn() && this.isGestor();
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
