import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { VentasService } from '../core/services/ventas.service';

@Component({
  selector: 'app-venta-qr',
  templateUrl: './venta-qr.page.html',
  styleUrls: ['./venta-qr.page.scss'],
  standalone: false,
})
export class VentaQRPage implements OnInit {

  mostrandoScanner: boolean = false;
  participaciones: any[] = [];
  referenciaEscaneada: string | null = null;
  
  // Modal de resumen
  mostrarModalResumen: boolean = false;
  formaPago: 'efectivo' | 'bizum' | 'transferencia' | 'omitir' | null = null;
  
  // Modal de éxito
  mostrarModalExito: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private ventasService: VentasService
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

  async iniciarScanner() {
    this.mostrandoScanner = true;
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanText: 'Escanea el código QR de la participación'
      });
      const referencia = result?.ScanResult?.trim() || null;
      if (referencia) {
        await this.procesarQR(referencia);
      }
    } catch (err) {
      console.error('Error escáner QR:', err);
      await this.mostrarAlerta('Error', 'No se pudo iniciar el escáner. Ejecuta npx cap sync.');
    } finally {
      this.mostrandoScanner = false;
    }
  }

  private async procesarQR(referencia: string) {
    const loading = await this.loadingController.create({ message: 'Procesando...' });
    await loading.present();

    this.ventasService.sellByQr(referencia).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          const p = res.participation || res;
          this.participaciones.push({
            numero: p.participation_code || p.numero || referencia,
            referencia,
            entidad: p.entity_name || p.entidad || '',
            precio: p.amount || p.importeTotal || 0
          });
          this.guardarVentaDigitalEnHistorial(res, referencia);
          this.mostrarModalExito = true;
        } else {
          await this.mostrarAlerta('Error', res.message || 'No se pudo registrar la venta.');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        await this.mostrarAlerta('Error', err.error?.message || 'Error al procesar el código QR.');
      }
    });
  }

  cancelarScanner() {
    this.mostrandoScanner = false;
  }

  guardarVentaDigitalEnHistorial(res: any, referencia: string): void {
    const p = res.participation || res;
    const entidad = p.entity_name || p.entidad || '—';
    const drawDate = p.draw_date
      ? new Date(p.draw_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
      : '—';
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');
    historial.unshift({
      id: Date.now(),
      tipo: 'venta-digital',
      fecha: new Date().toISOString(),
      formaPago: this.formaPago || null,
      descripcion: `Participación ${entidad}`,
      participacion: {
        entidad,
        numero: p.participation_code || p.numero || referencia,
        fechaSorteo: drawDate,
        importeJugado: p.played_amount ?? p.importeJugado ?? 0,
        donativo: p.donation_amount ?? p.donativo,
        importeTotal: p.amount ?? p.importeTotal ?? 0,
        numeroParticipacion: p.participation_code || referencia,
        numeroReferencia: p.reference || referencia.padEnd(19, '0').slice(0, 19),
        imagen: p.image || null
      }
    });
    localStorage.setItem('historial', JSON.stringify(historial));
  }

  cerrarVenta() {
    this.router.navigate(['/tabs/vendedor-tab3']);
  }

  calcularImporteTotal(): number {
    return this.participaciones.reduce((total, p) => total + p.precio, 0);
  }

  mostrarResumen() {
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
    await this.cerrarModalResumen();
    this.cerrarModalExito();
  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
    this.participaciones = [];
    this.router.navigate(['/tabs/vendedor-tab3']);
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
