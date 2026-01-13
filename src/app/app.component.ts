import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  currentRoute: string = '';
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'usuario';

  constructor(
    private menuController: MenuController,
    private router: Router
  ) {
    // Detectar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
      this.detectarRol();
    });
  }

  ngOnInit() {
    this.detectarRol();
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
