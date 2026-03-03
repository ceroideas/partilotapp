import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  currentRoute: string = '';
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'usuario';
  userName: string = '';
  userEmail: string = '';
  userImage: string | null = null;

  constructor(
    private menuController: MenuController,
    private router: Router,
    public authService: AuthService
  ) {
    // Detectar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
      this.detectarRol();
      this.actualizarUsuario();
    });
  }

  async ngOnInit() {
    this.detectarRol();
    this.actualizarUsuario();
    await this.inicializarStatusBar();
  }

  /**
   * Configura la barra de estado del dispositivo para que no se monte sobre el header.
   * Solo se ejecuta en app nativa (Capacitor).
   */
  private async inicializarStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
    } catch (e) {
      console.warn('StatusBar no disponible:', e);
    }
  }

  actualizarUsuario() {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.name || '';
      this.userEmail = user.email || '';
      this.userImage = this.getUserImageUrl(user.image);
    } else {
      this.userImage = null;
    }
  }

  /** URL de la imagen del usuario (desde API). Las imágenes de usuario se sirven desde storage. */
  getUserImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    const path = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${base}/storage/${path.replace(/^storage\/?/, '')}`;
  }

  onUserImageError() {
    this.userImage = null;
  }

  logout(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.menuController.close('main-menu');
    this.authService.logout().subscribe(() => {});
  }

  detectarRol() {
    const rolGuardado = localStorage.getItem('rolActual');
    const esVendedorStr = localStorage.getItem('esVendedor');
    
    if (rolGuardado) {
      this.rolActual = rolGuardado as 'usuario' | 'vendedor' | 'gestor';
    } else if (esVendedorStr === 'true') {
      this.rolActual = 'vendedor';
    } else {
      // Detectar desde la ruta
      if (this.currentRoute.includes('/gestor-tab') || this.currentRoute.includes('/gestor-home') || this.currentRoute.includes('/gestor-vendedores') || this.currentRoute.includes('/gestor-devolucion') || this.currentRoute.includes('/gestor-pago')) {
        this.rolActual = 'gestor';
        localStorage.setItem('rolActual', 'gestor');
        localStorage.setItem('esVendedor', 'false');
      } else if (this.currentRoute.includes('/vendedor-tab') || this.currentRoute.includes('/venta') || this.currentRoute.includes('/venta-qr') || this.currentRoute.includes('/venta-manual')) {
        this.rolActual = 'vendedor';
        localStorage.setItem('rolActual', 'vendedor');
        localStorage.setItem('esVendedor', 'true');
      } else {
        this.rolActual = 'usuario';
      }
    }
  }

  esVendedor(): boolean {
    return this.rolActual === 'vendedor';
  }

  esGestor(): boolean {
    return this.rolActual === 'gestor';
  }

  cerrarMenu() {
    this.menuController.close('main-menu');
  }
}
