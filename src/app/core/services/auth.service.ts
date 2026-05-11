import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { BiometricService } from './biometric.service';

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  seller?: any;
  manager?: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private biometricService: BiometricService
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
          this.biometricService.markBiometricUnlockSessionOk();
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
          this.biometricService.markBiometricUnlockSessionOk();
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
          if (response.seller) {
            localStorage.setItem('seller', JSON.stringify(response.seller));
          } else {
            localStorage.removeItem('seller');
          }
          if (response.manager) {
            localStorage.setItem('manager', JSON.stringify(response.manager));
          } else {
            localStorage.removeItem('manager');
          }
          // Rol inicial según tablas sellers/managers (no users.role): gestor > vendedor > usuario
          const canManager = !!response.manager;
          const canSeller = !!response.seller;
          if (canManager) {
            localStorage.setItem('rolActual', 'gestor');
            localStorage.setItem('esVendedor', 'false');
          } else if (canSeller) {
            localStorage.setItem('rolActual', 'vendedor');
            localStorage.setItem('esVendedor', 'true');
          } else {
            localStorage.setItem('rolActual', 'usuario');
            localStorage.setItem('esVendedor', 'false');
          }
          this.biometricService.markBiometricUnlockSessionOk();
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
    localStorage.removeItem('manager');
    localStorage.removeItem('rolActual');
    this.biometricService.clearStoredLoginCredentials();
    this.biometricService.invalidateBiometricUnlockSession();
    // Recarga completa para descargar de caché todas las vistas de Ionic y evitar datos viejos
    window.location.href = '/login';
  }

  /** Navega al inicio por rol (tabs). Opcionalmente usa returnUrl si es una ruta interna. */
  navigateToDefaultHome(returnUrl?: string | null): void {
    const safe =
      returnUrl &&
      returnUrl.startsWith('/') &&
      !returnUrl.startsWith('//') &&
      !returnUrl.includes('://')
        ? returnUrl
        : null;
    if (safe) {
      this.router.navigateByUrl(safe, { replaceUrl: true });
      return;
    }
    const rol = localStorage.getItem('rolActual') || 'usuario';
    if (rol === 'gestor') {
      this.router.navigate(['/tabs/gestor-tab3'], { replaceUrl: true });
    } else if (rol === 'vendedor') {
      this.router.navigate(['/tabs/vendedor-tab3'], { replaceUrl: true });
    } else {
      this.router.navigate(['/tabs/tab3'], { replaceUrl: true });
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isSeller(): boolean {
    return !!localStorage.getItem('seller');
  }

  /** Usuario puede actuar como gestor (está en tabla managers). */
  isManager(): boolean {
    return !!localStorage.getItem('manager');
  }

  /** Alias: mismo que isManager (gestor = manager en la app). */
  isGestor(): boolean {
    return this.isManager();
  }

  /** Puede actuar como cliente (cualquier usuario logueado). */
  canCliente(): boolean {
    return this.isLoggedIn();
  }

  /** Puede actuar como vendedor (está en tabla sellers con estado activo). */
  canSeller(): boolean {
    return this.isLoggedIn() && this.isSeller();
  }

  /** Puede actuar como gestor (está en tabla managers). */
  canManager(): boolean {
    return this.isLoggedIn() && this.isManager();
  }

  /** Puede ver pestaña Usuario/Cliente (todos los usuarios logueados). */
  canViewUsuario(): boolean {
    return this.canCliente();
  }

  /** Puede ver pestaña Vendedor (solo si está en sellers). */
  canViewVendedor(): boolean {
    return this.canSeller();
  }

  /** Puede ver pestaña Gestor (solo si está en managers). */
  canViewGestor(): boolean {
    return this.canManager();
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

  getManager(): any {
    const manager = localStorage.getItem('manager');
    return manager ? JSON.parse(manager) : null;
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
          } else {
            localStorage.removeItem('seller');
          }
          if (response.manager) {
            localStorage.setItem('manager', JSON.stringify(response.manager));
          } else {
            localStorage.removeItem('manager');
          }
        }
      })
    );
  }
}
