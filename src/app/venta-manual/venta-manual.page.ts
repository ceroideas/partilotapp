import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-venta-manual',
  templateUrl: './venta-manual.page.html',
  styleUrls: ['./venta-manual.page.scss'],
  standalone: false,
})
export class VentaManualPage implements OnInit {

  tipoParticipacion: 'fisicas' | 'digitales' = 'fisicas';
  numeroSorteo: string = '38/25';
  
  // Para participaciones físicas
  participacionUnidad: string = '';
  rangoDesde: string = '';
  rangoHasta: string = '';
  
  // Para participaciones digitales
  numeroParticipaciones: number = 1;
  disponibilidad: number = 120;
  
  // Modal de resumen
  mostrarModalResumen: boolean = false;
  totalParticipaciones: number = 0;
  importeTotal: number = 0;
  formaPago: 'efectivo' | 'bizum' | 'omitir' | null = null;
  
  // Modal de éxito
  mostrarModalExito: boolean = false;
  
  precioPorParticipacion: number = 5.00;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

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

  cambiarTipoParticipacion() {
    // Resetear campos al cambiar tipo
    this.participacionUnidad = '';
    this.rangoDesde = '';
    this.rangoHasta = '';
    this.numeroParticipaciones = 1;
  }

  escanearQR() {
    this.router.navigate(['/venta-qr']);
  }

  disminuirParticipaciones() {
    if (this.numeroParticipaciones > 1) {
      this.numeroParticipaciones--;
      this.validarVenta();
    }
  }

  aumentarParticipaciones() {
    if (this.numeroParticipaciones < this.disponibilidad) {
      this.numeroParticipaciones++;
      this.validarVenta();
    }
  }

  validarVenta() {
    // Validación se hace en puedeVender()
  }

  puedeVender(): boolean {
    if (this.tipoParticipacion === 'fisicas') {
      // Para físicas: debe tener unidad O rango completo
      return !!(this.participacionUnidad || (this.rangoDesde && this.rangoHasta));
    } else {
      // Para digitales: debe tener al menos 1 participación
      return this.numeroParticipaciones > 0 && this.numeroParticipaciones <= this.disponibilidad;
    }
  }

  calcularTotalParticipaciones(): number {
    if (this.tipoParticipacion === 'fisicas') {
      if (this.participacionUnidad) {
        return 1;
      } else if (this.rangoDesde && this.rangoHasta) {
        // Extraer números del rango (ej: "1/0001" -> 1, "1/0005" -> 5)
        const desde = this.extraerNumero(this.rangoDesde);
        const hasta = this.extraerNumero(this.rangoHasta);
        return hasta - desde + 1;
      }
      return 0;
    } else {
      return this.numeroParticipaciones;
    }
  }

  extraerNumero(participacion: string): number {
    // Extraer el número después de la barra (ej: "1/0001" -> 1)
    const partes = participacion.split('/');
    if (partes.length > 1) {
      return parseInt(partes[1]) || 0;
    }
    return 0;
  }

  mostrarResumen() {
    this.totalParticipaciones = this.calcularTotalParticipaciones();
    this.importeTotal = this.totalParticipaciones * this.precioPorParticipacion;
    this.formaPago = null;
    this.mostrarModalResumen = true;
  }

  cerrarModalResumen() {
    this.mostrarModalResumen = false;
  }

  seleccionarFormaPago(forma: 'efectivo' | 'bizum' | 'omitir') {
    this.formaPago = forma;
  }

  async registrarVenta() {
    if (!this.formaPago) {
      await this.mostrarAlerta('Atención', 'Por favor selecciona una forma de pago');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando venta...',
    });
    await loading.present();

    try {
      const venta = {
        id: Date.now(),
        tipo: this.tipoParticipacion === 'fisicas' ? 'fisica' : 'digital',
        tipoVenta: this.tipoParticipacion === 'fisicas' ? 
          (this.participacionUnidad ? 'unidad' : 'rango') : 'digital',
        participacionUnidad: this.participacionUnidad || null,
        rangoDesde: this.rangoDesde || null,
        rangoHasta: this.rangoHasta || null,
        numeroParticipaciones: this.tipoParticipacion === 'digitales' ? this.numeroParticipaciones : null,
        totalParticipaciones: this.totalParticipaciones,
        importeTotal: this.importeTotal,
        formaPago: this.formaPago,
        numeroSorteo: this.numeroSorteo,
        fecha: new Date().toISOString(),
        estado: 'registrada'
      };

      const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
      ventas.push(venta);
      localStorage.setItem('ventas', JSON.stringify(ventas));

      await loading.dismiss();
      this.cerrarModalResumen();
      this.mostrarModalExito = true;
    } catch (error) {
      await loading.dismiss();
      await this.mostrarAlerta('Error', 'No se pudo registrar la venta. Intenta nuevamente.');
    }
  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
    // Limpiar formulario
    this.participacionUnidad = '';
    this.rangoDesde = '';
    this.rangoHasta = '';
    this.numeroParticipaciones = 1;
    // Opcional: navegar a otra vista
    // this.router.navigate(['/vendedor']);
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

}
