import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit, OnDestroy {

  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'usuario';
  private rolAnterior: string = '';
  private intervalId: any;
  private routerSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.detectarRol();
    this.rolAnterior = this.rolActual;
    
    // Escuchar cambios en localStorage para detectar cambios de rol (solo funciona entre pestañas)
    window.addEventListener('storage', () => {
      this.detectarRol();
    });
    
    // Verificar cambios de rol periódicamente (para cambios en la misma pestaña)
    this.intervalId = setInterval(() => {
      this.detectarRol();
      // Si el rol cambió, forzar actualización
      if (this.rolAnterior !== this.rolActual) {
        this.rolAnterior = this.rolActual;
        // Forzar detección de cambios de Angular
        setTimeout(() => {
          // Esto fuerza a Angular a detectar el cambio
        }, 0);
      }
    }, 500); // Verificar cada 500ms
    
    // También escuchar cambios de ruta
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.detectarRol();
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    // Detectar rol cada vez que se entra a la vista
    this.detectarRol();
  }

  detectarRol() {
    // Perfil real: si tiene 'seller' en localStorage es vendedor; si no tiene pero tiene token es usuario
    const tieneSeller = this.authService.isSeller();
    const rolGuardado = localStorage.getItem('rolActual');

    if (tieneSeller) {
      this.rolActual = 'vendedor';
      if (rolGuardado !== 'vendedor') {
        localStorage.setItem('rolActual', 'vendedor');
        localStorage.setItem('esVendedor', 'true');
      }
    } else if (rolGuardado === 'gestor') {
      this.rolActual = 'gestor';
    } else {
      // Usuario (client) o sin sesión
      this.rolActual = 'usuario';
      if (rolGuardado && rolGuardado !== 'usuario') {
        localStorage.setItem('rolActual', 'usuario');
        localStorage.setItem('esVendedor', 'false');
      }
    }

    this.redirigirSiRutaNoCorrespondeAlPerfil();
  }

  /**
   * Si estás logueado como vendedor no puedes ver tabs de usuario y viceversa.
   */
  private redirigirSiRutaNoCorrespondeAlPerfil() {
    if (!this.authService.isLoggedIn()) return;

    const ruta = this.router.url;
    const enTabUsuario = /\/tabs\/(tab[1-5])(?:\/|$)/.test(ruta);
    const enTabVendedor = /\/tabs\/vendedor-tab/.test(ruta);
    const enTabGestor = /\/tabs\/gestor-tab/.test(ruta);

    if (this.rolActual === 'vendedor' && enTabUsuario) {
      this.router.navigate(['/tabs/vendedor-tab3'], { replaceUrl: true });
      return;
    }
    if (this.rolActual === 'usuario' && (enTabVendedor || enTabGestor)) {
      this.router.navigate(['/tabs/tab3'], { replaceUrl: true });
      return;
    }
    if (this.rolActual === 'gestor' && (enTabUsuario || enTabVendedor)) {
      this.router.navigate(['/tabs/gestor-tab3'], { replaceUrl: true });
      return;
    }
  }

  cambiarRol(rol: 'usuario' | 'vendedor' | 'gestor') {
    this.rolActual = rol;
    localStorage.setItem('rolActual', rol);
    
    if (rol === 'vendedor') {
      localStorage.setItem('esVendedor', 'true');
      // Siempre navegar a la home de vendedor dentro de tabs
      this.router.navigate(['/tabs/vendedor-tab3']);
    } else if (rol === 'usuario') {
      localStorage.setItem('esVendedor', 'false');
      // Siempre navegar a la home de usuario
      this.router.navigate(['/tabs/tab3']);
    } else if (rol === 'gestor') {
      localStorage.setItem('esVendedor', 'false');
      // Siempre navegar a la home de gestor dentro de tabs
      this.router.navigate(['/tabs/gestor-tab3']);
    }
  }

  esVendedor(): boolean {
    return this.rolActual === 'vendedor';
  }

  esGestor(): boolean {
    return this.rolActual === 'gestor';
  }

}
