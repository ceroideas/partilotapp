import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {

  constructor(private router: Router) {}

  verTutoriales() {
    // TODO: Navegar a tutoriales
    console.log('Ver tutoriales');
  }

  irACartera() {
    this.router.navigate(['/tabs/tab1']);
  }

  irAEscaner() {
    this.router.navigate(['/tabs/tab5']);
  }

  irALoteriaSocial() {
    this.router.navigate(['/loteria-social']);
  }

  cambiarAVendedor() {
    localStorage.setItem('rolActual', 'vendedor');
    localStorage.setItem('esVendedor', 'true');
    // Siempre navegar a la home de vendedor dentro de tabs
    this.router.navigate(['/tabs/vendedor-tab3']);
  }

  cambiarAGestor() {
    localStorage.setItem('rolActual', 'gestor');
    localStorage.setItem('esVendedor', 'false');
    // Siempre navegar a la home de gestor dentro de tabs
    this.router.navigate(['/tabs/gestor-tab3']);
  }

}
