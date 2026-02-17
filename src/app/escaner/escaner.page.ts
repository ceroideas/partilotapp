import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
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
  
  // Modo vendedor: venta individual por QR (Tarea 2) o digitalización múltiple
  isVendedor: boolean = false;
  participacionesDigitalizadas: any[] = [];
  mostrarInfoDigitalizacion: boolean = false;

  /** Venta individual desde escáner (Tarea 2): escanear → consultar → detalle y set → modal pago → vender */
  ventaPendienteVendedor: {
    referencia: string;
    participacion: any;
    infoSet: { setName: string; lotteryName: string; participationNumber: number; importePorParticipacion: number };
  } | null = null;
  
  // Modal de resumen y pago
  mostrarModalResumen: boolean = false;
  formaPago: 'efectivo' | 'bizum' | 'transferencia' | 'omitir' | null = null;
  mostrarModalExito: boolean = false;

  // Modo usuario: datos de participación consultada
  participacion: any = null;
  status: 'can_link' | 'already_mine' | 'already_other' | 'not_found' | null = null;
  mensajeError = '';

  loading = false;
  loadingMessage = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService,
    private ventasService: VentasService,
    private carteraService: CarteraService
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
      const qrText = result?.ScanResult?.trim() || null;
      const referencia = this.extraerReferenciaDeQR(qrText);
      if (referencia) {
        // Tarea 2 opción B: flujo completo en EscanerPage: consultar → mostrar detalle y set → modal pago → vender
        await this.consultarYMostrarVentaIndividual(referencia);
      }
    } catch (err: any) {
      console.error('Error escáner QR:', err);
      if (err.message && err.message.includes('User canceled')) {
        return;
      }
      await this.mostrarAlerta('Error', 'No se pudo iniciar el escáner.');
    } finally {
      this.modoEscaneo = false;
    }
  }

  /** Tarea 2: consultar participación por referencia, validar y mostrar detalle + set para venta individual */
  private consultarYMostrarVentaIndividual(referencia: string) {
    this.loading = true;
    this.loadingMessage = 'Buscando participación...';
    this.carteraService.checkByReference(referencia).subscribe({
      next: (checkRes: any) => {
        this.loading = false;
        if (checkRes.status === 'not_found' || !checkRes.participation) {
          this.mostrarAlerta('Error', checkRes.message || 'No se encontró la participación con esa referencia.');
          return;
        }
        const participation = checkRes.participation;
        const set = participation?.set;
        const lottery = set?.reserve?.lottery;
        const participationNumber = participation?.participation_number ?? participation?.numero;
        const importe = participation?.amount ?? participation?.played_amount ?? participation?.importeTotal ?? 0;
        this.ventaPendienteVendedor = {
          referencia,
          participacion: participation,
          infoSet: {
            setName: set?.set_name || `Set #${set?.set_number ?? ''}`,
            lotteryName: lottery?.name || '',
            participationNumber,
            importePorParticipacion: importe
          }
        };
      },
      error: async (err) => {
        this.loading = false;
        await this.mostrarAlerta('Error', err.error?.message || 'Error al buscar la participación.');
      }
    });
  }

  /** Abre el modal de resumen para venta individual (1 participación) */
  mostrarResumenVentaIndividual() {
    this.formaPago = null;
    this.mostrarModalResumen = true;
  }

  /** Cancela la venta individual y vuelve al escáner */
  cancelarVentaIndividual() {
    this.ventaPendienteVendedor = null;
    this.modoEscaneo = true;
  }

  /** Cantidad e importe en el modal: venta individual (1) o múltiple (participacionesDigitalizadas) */
  getCantidadResumenVendedor(): number {
    if (this.ventaPendienteVendedor) return 1;
    return this.participacionesDigitalizadas.length;
  }

  getImporteTotalResumenVendedor(): number {
    if (this.ventaPendienteVendedor) {
      return this.ventaPendienteVendedor.infoSet.importePorParticipacion ?? 0;
    }
    return this.calcularImporteTotal();
  }

  /** Registrar venta: desde modal, puede ser venta individual o múltiple */
  async registrarVentaDesdeModal() {
    if (!this.formaPago) {
      await this.mostrarAlerta('Atención', 'Por favor selecciona una forma de pago.');
      return;
    }
    if (this.ventaPendienteVendedor) {
      this.registrarVentaIndividual();
    } else {
      await this.venderDigitalizaciones();
    }
  }

  /** Vender una sola participación (flujo escáner vendedor - Tarea 2) */
  private registrarVentaIndividual() {
    if (!this.ventaPendienteVendedor) return;
    const paymentMethod = this.formaPago === 'omitir' ? null : this.formaPago;
    this.loading = true;
    this.loadingMessage = 'Registrando venta...';
    this.ventasService.sellByQr(this.ventaPendienteVendedor.referencia, undefined, undefined, paymentMethod ?? undefined).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          const formaPagoUsada = this.formaPago === 'omitir' ? null : this.formaPago;
          this.guardarVentaDigitalEnHistorial(res, this.ventaPendienteVendedor!.referencia, formaPagoUsada);
          this.ventaPendienteVendedor = null;
          this.cerrarModalResumen();
          this.mostrarModalExito = true;
        } else {
          this.mostrarAlerta('Error', res.message || 'No se pudo registrar la venta.');
        }
      },
      error: async (err) => {
        this.loading = false;
        await this.mostrarAlerta('Error', err.error?.message || 'Esta participación no está asignada a ti o ya está vendida.');
      }
    });
  }

  async iniciarScannerUsuario() {
    this.modoEscaneo = true;
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanText: 'Escanea el código QR de la participación'
      });
      const qrText = result?.ScanResult?.trim() || null;
      const referencia = this.extraerReferenciaDeQR(qrText);
      if (referencia) {
        await this.consultarReferencia(referencia);
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

  async consultarReferencia(referencia: string) {
    this.loading = true;
    this.loadingMessage = 'Buscando...';
    this.carteraService.checkByReference(referencia).subscribe({
      next: async (res: any) => {
        this.loading = false;
        this.participacion = res.participation || null;
        this.status = res.status || null;
        this.mensajeError = res.message || '';
        
        if (this.status === 'not_found' || this.status === 'already_other') {
          await this.mostrarAlerta(
            this.status === 'not_found' ? 'No encontrada' : 'No se puede vincular',
            this.mensajeError
          );
          this.participacion = null;
          this.status = null;
          this.modoEscaneo = true;
        } else {
          // Preparar datos para mostrar en la vista
          const p = this.participacion;
          this.ticketEscaneado = {
            numero: p?.participation_code || p?.numero || referencia,
            entidad: p?.entity_name || p?.entidad || p?.set?.reserve?.entity?.name || '—',
            fechaSorteo: p?.draw_date ? new Date(p.draw_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—',
            importeJugado: p?.played_amount ?? p?.importeJugado ?? 0,
            donativo: p?.donation_amount ?? p?.donativo ?? 0,
            importeTotal: p?.amount ?? p?.importeTotal ?? 0,
            numeroParticipacion: p?.participation_code || referencia,
            numeroReferencia: referencia,
            premio: p?.prize_amount ?? p?.premio ?? 0,
            tipo: p?.type || 'social'
          };
          this.imagenTicket = p?.image || p?.snapshot_path ? this.getImageUrl(p.image || p.snapshot_path) : null;
        }
      },
      error: async (err) => {
        this.loading = false;
        const msg = err.error?.message || (err.status === 422
          ? 'La participación no se puede vincular porque ya se encuentra leída por otro usuario.'
          : 'No se encuentra la participación. Comprueba la referencia o el código QR.');
        await this.mostrarAlerta(err.status === 422 ? 'No se puede vincular' : 'No encontrada', msg);
        this.participacion = null;
        this.status = null;
        this.modoEscaneo = true;
      }
    });
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    if (path.startsWith('storage/')) return `${base}/${path}`;
    return `${base}/storage/${path}`;
  }

  private async procesarQRDigitalizacion(referencia: string) {
    this.loading = true;
    this.loadingMessage = 'Procesando...';
    this.ventasService.digitalizeParticipation(referencia).subscribe({
      next: async (res: any) => {
        this.loading = false;
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
        this.loading = false;
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
    this.formaPago = null;
    if (this.ventaPendienteVendedor) {
      this.ventaPendienteVendedor = null;
      this.modoEscaneo = true;
    }
  }

  seleccionarFormaPago(forma: 'efectivo' | 'bizum' | 'transferencia' | 'omitir') {
    this.formaPago = forma;
  }

  async venderDigitalizaciones() {
    if (!this.formaPago) {
      await this.mostrarAlerta('Atención', 'Por favor selecciona una forma de pago');
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Registrando ventas...';

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

    this.loading = false;

    if (ventas.length > 0) {
      // Guardar en historial
      const formaPagoUsada = this.formaPago === 'omitir' ? null : this.formaPago;
      ventas.forEach((res, index) => {
        const p = res.participation || res;
        const participacion = this.participacionesDigitalizadas[index];
        this.guardarVentaDigitalEnHistorial(res, participacion.referencia, formaPagoUsada);
      });

      this.cerrarModalResumen();
      this.mostrarModalExito = true;
    } else {
      await this.mostrarAlerta('Error', 'No se pudo registrar ninguna venta.');
    }
  }

  guardarVentaDigitalEnHistorial(res: any, referencia: string, formaPagoUsada?: string | null): void {
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
      formaPago: formaPagoUsada ?? this.formaPago ?? null,
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
    this.participacion = null;
    this.status = null;
    this.mensajeError = '';
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Extrae la referencia de una URL de QR o devuelve el texto si ya es una referencia
   * Formato esperado: https://panel.partilot.es/comprobar-participacion?ref=0000000000000
   */
  private extraerReferenciaDeQR(qrText: string | null): string | null {
    if (!qrText) return null;
    
    // Si contiene "ref=", extraer la referencia de la URL
    if (qrText.includes('ref=')) {
      const parts = qrText.split('ref=');
      if (parts.length > 1) {
        // Tomar la parte después de "ref=" y limpiar posibles parámetros adicionales
        const referencia = parts[1].split('&')[0].split('#')[0].trim();
        return referencia || null;
      }
    }
    
    // Si no contiene "ref=", asumir que es la referencia directamente
    return qrText.trim() || null;
  }

}
