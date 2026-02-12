import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { VentasService } from '../core/services/ventas.service';
import { CarteraService } from '../core/services/cartera.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-escaner',
  templateUrl: './escaner.page.html',
  styleUrls: ['./escaner.page.scss'],
  standalone: false,
})
export class EscanerPage implements OnInit {

  modoEscaneo: boolean = true;
  ticketEscaneado: any = null;
  imagenTicket: string | null = null;
  
  // Modo vendedor (digitalización múltiple)
  isVendedor: boolean = false;
  participacionesDigitalizadas: any[] = [];
  mostrarInfoDigitalizacion: boolean = false;
  
  // Modal de resumen y pago
  mostrarModalResumen: boolean = false;
  formaPago: 'efectivo' | 'bizum' | 'transferencia' | 'omitir' | null = null;
  mostrarModalExito: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private authService: AuthService,
    private ventasService: VentasService
  ) { }

  ngOnInit() {
    this.isVendedor = this.authService.isSeller();
    this.modoEscaneo = true;
  }

  async scanQR() {
    if (this.isVendedor) {
      // Modo vendedor: escáner para digitalización múltiple
      await this.iniciarScannerVendedor();
    } else {
      // Modo usuario: escáner normal
      await this.iniciarScannerUsuario();
    }
  }

  async iniciarScannerVendedor() {
    this.modoEscaneo = true;
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanText: 'Escanea el código QR de la participación'
      });
      const referencia = result?.ScanResult?.trim() || null;
      if (referencia) {
        await this.procesarQRDigitalizacion(referencia);
      }
    } catch (err: any) {
      console.error('Error escáner QR:', err);
      if (err.message && err.message.includes('User canceled')) {
        // Usuario canceló, no hacer nada
        return;
      }
      await this.mostrarAlerta('Error', 'No se pudo iniciar el escáner.');
    } finally {
      this.modoEscaneo = false;
    }
  }

  async iniciarScannerUsuario() {
    // TODO: Implementar escáner QR real con plugin de Capacitor
    // Por ahora simulamos el escaneo
    this.modoEscaneo = false;
    
    // Simular datos del ticket escaneado
    this.ticketEscaneado = {
      numero: '60089',
      entidad: 'Peña Rondalosa',
      fechaSorteo: '22/12/25',
      importeJugado: 5.00,
      donativo: 1.00,
      importeTotal: 6.00,
      numeroParticipacion: '1/0001',
      numeroReferencia: '0000000000000000000',
      premio: 0.00,
      tipo: 'social'
    };
    
    this.imagenTicket = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  private async procesarQRDigitalizacion(referencia: string) {
    const loading = await this.loadingController.create({ message: 'Procesando...' });
    await loading.present();

    // Llamar a la API para digitalizar la participación
    this.ventasService.digitalizeParticipation(referencia).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          const p = res.participation || res;
          const participacion = {
            id: Date.now(),
            numero: p.participation_code || p.numero || referencia,
            referencia,
            entidad: p.entity_name || p.entidad || p.set?.reserve?.entity?.name || '',
            precio: p.amount || p.importeTotal || p.played_amount || 0,
            fechaSorteo: p.draw_date || p.fechaSorteo || '',
            imagen: p.image || p.snapshot_path || null
          };
          this.participacionesDigitalizadas.push(participacion);
          this.mostrarInfoDigitalizacion = true;
          this.modoEscaneo = false;
        } else {
          await this.mostrarAlerta('Error', res.message || 'No se pudo digitalizar la participación.');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        await this.mostrarAlerta('Error', err.error?.message || 'Error al procesar el código QR.');
      }
    });
  }

  async digitalizar() {
    if (!this.ticketEscaneado) return;

    try {
      // Guardar participación
      const participacion = {
        id: Date.now(),
        numero: this.ticketEscaneado.numero,
        entidad: this.ticketEscaneado.entidad,
        fechaSorteo: this.ticketEscaneado.fechaSorteo,
        importeJugado: this.ticketEscaneado.importeJugado,
        donativo: this.ticketEscaneado.donativo,
        importeTotal: this.ticketEscaneado.importeTotal,
        numeroParticipacion: this.ticketEscaneado.numeroParticipacion,
        numeroReferencia: this.ticketEscaneado.numeroReferencia,
        imagen: this.imagenTicket,
        estado: 'activa',
        fechaDigitalizacion: new Date().toISOString()
      };

      const participaciones = JSON.parse(localStorage.getItem('participaciones') || '[]');
      participaciones.push(participacion);
      localStorage.setItem('participaciones', JSON.stringify(participaciones));

      // Guardar en historial
      const historial = JSON.parse(localStorage.getItem('historial') || '[]');
      historial.unshift({
        id: Date.now(),
        tipo: 'digitalizacion',
        fecha: new Date().toISOString(),
        participacion: participacion
      });
      localStorage.setItem('historial', JSON.stringify(historial));

      const alert = await this.alertController.create({
        header: 'Digitalización exitosa',
        message: 'La participación ha sido guardada en tu cartera.',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigate(['/tabs/tab1']); // Ir a cartera
            }
          }
        ]
      });
      await alert.present();
    } catch (error) {
      console.error('Error digitalizando:', error);
      this.mostrarAlerta('Error', 'No se pudo digitalizar la participación.');
    }
  }

  nuevaDigitalizacion() {
    // Volver al escáner para agregar otra participación
    this.modoEscaneo = true;
    this.mostrarInfoDigitalizacion = false;
  }

  calcularImporteTotal(): number {
    return this.participacionesDigitalizadas.reduce((total, p) => total + (p.precio || 0), 0);
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

  async venderDigitalizaciones() {
    if (!this.formaPago) {
      await this.mostrarAlerta('Atención', 'Por favor selecciona una forma de pago');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Registrando ventas...' });
    await loading.present();

    // Procesar cada participación digitalizada
    const ventas = [];
    for (const participacion of this.participacionesDigitalizadas) {
      try {
        const paymentMethod = this.formaPago === 'omitir' ? null : this.formaPago;
        const res = await firstValueFrom(this.ventasService.sellByQr(participacion.referencia, undefined, undefined, paymentMethod));
        if (res?.success) {
          ventas.push(res);
        }
      } catch (err) {
        console.error('Error vendiendo participación:', err);
      }
    }

    await loading.dismiss();

    if (ventas.length > 0) {
      // Guardar en historial
      ventas.forEach((res, index) => {
        const p = res.participation || res;
        const participacion = this.participacionesDigitalizadas[index];
        this.guardarVentaDigitalEnHistorial(res, participacion.referencia);
      });

      this.cerrarModalResumen();
      this.mostrarModalExito = true;
    } else {
      await this.mostrarAlerta('Error', 'No se pudo registrar ninguna venta.');
    }
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

  cerrarModalExito() {
    this.mostrarModalExito = false;
    this.participacionesDigitalizadas = [];
    this.mostrarInfoDigitalizacion = false;
    this.modoEscaneo = true;
  }

  async gestionarPremio() {
    if (!this.ticketEscaneado || !this.ticketEscaneado.premio || this.ticketEscaneado.premio === 0) return;

    // Navegar a gestión de premio
    this.router.navigate(['/tabs/cobrar-gestionar']);
  }

  volverAEscanear() {
    this.modoEscaneo = true;
    this.ticketEscaneado = null;
    this.imagenTicket = null;
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
