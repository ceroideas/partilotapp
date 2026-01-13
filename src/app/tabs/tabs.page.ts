import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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

  constructor(private router: Router) {}

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
    // Detectar rol desde localStorage o desde la ruta actual
    const esVendedorStr = localStorage.getItem('esVendedor');
    const rolGuardado = localStorage.getItem('rolActual');
    const usuarioStr = localStorage.getItem('usuario');
    
    // Prioridad: rol guardado > esVendedor > usuario.tipo > ruta
    if (rolGuardado) {
      this.rolActual = rolGuardado as 'usuario' | 'vendedor' | 'gestor';
    } else if (esVendedorStr === 'true') {
      this.rolActual = 'vendedor';
    } else if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        if (usuario.tipo === 'vendedor' || usuario.rol === 'vendedor') {
          this.rolActual = 'vendedor';
        } else if (usuario.tipo === 'gestor' || usuario.rol === 'gestor') {
          this.rolActual = 'gestor';
        } else {
          this.rolActual = 'usuario';
        }
      } catch (e) {
        this.rolActual = 'usuario';
      }
    } else {
      // Detectar desde la ruta actual
      const ruta = window.location.pathname;
      if (ruta.includes('/gestor-tab') || ruta.includes('/gestor-home') || ruta.includes('/gestor-vendedores') || ruta.includes('/gestor-devolucion') || ruta.includes('/gestor-pago')) {
        this.rolActual = 'gestor';
        localStorage.setItem('rolActual', 'gestor');
        localStorage.setItem('esVendedor', 'false');
      } else if (ruta.includes('/vendedor-tab') || ruta.includes('/venta') || ruta.includes('/gestor-participaciones') || ruta.includes('/venta-qr') || ruta.includes('/venta-manual')) {
        this.rolActual = 'vendedor';
        localStorage.setItem('rolActual', 'vendedor');
        localStorage.setItem('esVendedor', 'true');
      } else {
        this.rolActual = 'usuario';
      }
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
