import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { VentasService } from '../core/services/ventas.service';

@Component({
  selector: 'app-venta-manual',
  templateUrl: './venta-manual.page.html',
  styleUrls: ['./venta-manual.page.scss'],
  standalone: false,
})
export class VentaManualPage implements OnInit {

  tipoParticipacion: 'fisicas' | 'digitales' = 'fisicas';
  numeroSorteo: string = '';
  
  // Reserva y Set (para API)
  reserves: any[] = [];
  sets: any[] = [];
  reserveSeleccionado: any = null;
  setSeleccionado: any = null;
  
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
  formaPago: 'efectivo' | 'bizum' | 'transferencia' | 'omitir' | null = null;
  
  // Modal de éxito
  mostrarModalExito: boolean = false;
  
  precioPorParticipacion: number = 0;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private ventasService: VentasService
  ) { }

  ngOnInit() {
    this.cargarReserves();
  }

  cargarReserves() {
    this.ventasService.getReserves().subscribe({
      next: (res: any) => {
        if (res.success && res.reserves) {
          this.reserves = res.reserves;
          if (this.reserves.length === 1) {
            this.reserveSeleccionado = this.reserves[0];
            this.onReserveChange();
          }
        }
      },
      error: () => {
        this.reserves = [];
      }
    });
  }

  onReserveChange() {
    if (this.reserveSeleccionado?.sets) {
      this.sets = this.reserveSeleccionado.sets;
      this.setSeleccionado = this.sets.length === 1 ? this.sets[0] : null;
      this.numeroSorteo = this.reserveSeleccionado?.lottery?.name || '';
      if (this.setSeleccionado) {
        this.precioPorParticipacion = parseFloat(this.setSeleccionado.played_amount) || 0;
      }
    } else {
      this.sets = [];
      this.setSeleccionado = null;
    }
  }

  onSetChange() {
    if (this.setSeleccionado) {
      this.precioPorParticipacion = parseFloat(this.setSeleccionado.played_amount) || 0;
    }
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
      return !!(this.setSeleccionado && (this.participacionUnidad || (this.rangoDesde && this.rangoHasta)));
    }
    return this.numeroParticipaciones > 0 && this.numeroParticipaciones <= this.disponibilidad;
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
    const n = parseInt(participacion, 10);
    if (!isNaN(n)) return n;
    const partes = participacion.split('/');
    if (partes.length > 1) {
      return parseInt(partes[1], 10) || 0;
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

  seleccionarFormaPago(forma: 'efectivo' | 'bizum' | 'transferencia' | 'omitir') {
    this.formaPago = forma;
  }

  async registrarVenta() {
    if (!this.formaPago) {
      await this.mostrarAlerta('Atención', 'Por favor selecciona una forma de pago');
      return;
    }

    if (this.tipoParticipacion !== 'fisicas' || !this.setSeleccionado) {
      await this.mostrarAlerta('Error', 'Selecciona un sorteo y set válidos.');
      return;
    }

    let desde: number;
    let hasta: number;
    if (this.participacionUnidad) {
      desde = hasta = this.extraerNumero(this.participacionUnidad);
    } else if (this.rangoDesde && this.rangoHasta) {
      desde = this.extraerNumero(this.rangoDesde);
      hasta = this.extraerNumero(this.rangoHasta);
      if (desde > hasta) {
        await this.mostrarAlerta('Error', 'El rango desde no puede ser mayor que hasta.');
        return;
      }
    } else {
      await this.mostrarAlerta('Error', 'Indica participación o rango.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando venta...',
    });
    await loading.present();

    const paymentMethod = this.formaPago === 'omitir' ? null : this.formaPago;
    this.ventasService.sellManual(this.setSeleccionado.id, desde, hasta, paymentMethod).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.cerrarModalResumen();
          this.mostrarModalExito = true;
        } else {
          await this.mostrarAlerta('Error', res.message || 'No se pudo registrar la venta.');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        const msg = err.error?.message || 'Error de conexión. Intenta de nuevo.';
        await this.mostrarAlerta('Error', msg);
      }
    });
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
