import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {

  usuario: any = {};
  esVendedor: boolean = false;

  constructor(private router: Router) { }

  ngOnInit() {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      this.usuario = JSON.parse(usuarioStr);
    }
    
    // Verificar si es vendedor
    const esVendedorStr = localStorage.getItem('esVendedor');
    this.esVendedor = esVendedorStr === 'true' || 
                      this.usuario.tipo === 'vendedor' || 
                      this.usuario.rol === 'vendedor';
  }

  goToDigitalizarParticipacion() {
    this.router.navigate(['/digitalizar-participacion']);
  }

  goToRegalarParticipacion() {
    this.router.navigate(['/regalar-participacion']);
  }

  goToMovimientos() {
    this.router.navigate(['/movimientos']);
  }

  goToNotificaciones() {
    this.router.navigate(['/notificaciones']);
  }

  goToPreguntasFrecuentes() {
    this.router.navigate(['/preguntas-frecuentes']);
  }

  goToCondicionesLegales() {
    this.router.navigate(['/condiciones-legales']);
  }

  // Métodos para vendedor
  goToVendedor() {
    this.router.navigate(['/tabs/vendedor-tab3']);
  }

  goToVenta() {
    this.router.navigate(['/venta']);
  }

  goToGestorParticipaciones() {
    this.router.navigate(['/gestor-participaciones']);
  }

  goToCuentaCobro() {
    this.router.navigate(['/cuenta-cobro']);
  }

  goToConfigVenta() {
    this.router.navigate(['/config-venta']);
  }

}
