import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-venta',
  templateUrl: './venta.page.html',
  styleUrls: ['./venta.page.scss'],
  standalone: false,
})
export class VentaPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  cambiarRol(rol: string) {
    if (rol === 'usuario') {
      localStorage.setItem('rolActual', 'usuario');
      localStorage.setItem('esVendedor', 'false');
      // Siempre navegar a la home de usuario
      this.router.navigate(['/tabs/tab3']);
    } else if (rol === 'gestor') {
      localStorage.setItem('rolActual', 'gestor');
      localStorage.setItem('esVendedor', 'false');
      // Siempre navegar a la home de gestor dentro de tabs
      this.router.navigate(['/tabs/gestor-tab3']);
    }
  }

  irAVentaQR() {
    this.router.navigate(['/venta-qr']);
  }

  irAVentaManual() {
    this.router.navigate(['/venta-manual']);
  }

}
