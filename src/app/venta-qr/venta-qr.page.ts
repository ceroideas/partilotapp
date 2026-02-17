import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { VentasService } from '../core/services/ventas.service';
import { CarteraService } from '../core/services/cartera.service';
import { AuthService } from '../core/services/auth.service';

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

  loading = false;

  // Modo de venta: 'unidad' o 'rango'
  modoVenta: 'unidad' | 'rango' = 'unidad';

  // Información del set cuando se lee QR
  infoSet: {
    setName?: string;
    lotteryName?: string;
    participationNumber?: number;
    setId?: number;
    desde?: number;
    hasta?: number;
  } | null = null;

  // Datos temporales para modo rango
  primeraReferencia: string | null = null;
  primeraParticipationNumber: number | null = null;
  primeraSetId: number | null = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private ventasService: VentasService,
    private carteraService: CarteraService,
    private authService: AuthService
  ) { }

  canViewUsuario(): boolean { return this.authService.canViewUsuario(); }
  canViewVendedor(): boolean { return this.authService.canViewVendedor(); }
  canViewGestor(): boolean { return this.authService.canViewGestor(); }

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

  cambiarModo(modo: 'unidad' | 'rango') {
    this.modoVenta = modo;
    // Limpiar datos al cambiar de modo
    this.infoSet = null;
    this.primeraReferencia = null;
    this.primeraParticipationNumber = null;
    this.primeraSetId = null;
  }

  getTextoBotonEscanear(): string {
    if (this.modoVenta === 'rango') {
      if (!this.primeraReferencia) {
        return 'Escanear QR (Desde)';
      }
      return 'Escanear QR (Hasta)';
    }
    return 'Escanear QR';
  }

  async iniciarScanner() {
    this.mostrandoScanner = true;
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const scanText = this.modoVenta === 'rango' 
        ? (!this.primeraReferencia ? 'Escanea el código QR de la primera participación (Desde)' : 'Escanea el código QR de la última participación (Hasta)')
        : 'Escanea el código QR de la participación';
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanText: scanText
      });
      const qrText = result?.ScanResult?.trim() || null;
      const referencia = this.extraerReferenciaDeQR(qrText);
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
    this.loading = true;
    
    if (this.modoVenta === 'unidad') {
      // Modo unidad: vender directamente (el backend valida asignación)
      await this.venderUnidad(referencia);
    } else {
      // Modo rango: primero obtener info y validar asignación
      await this.procesarRango(referencia);
    }
  }

  private async procesarRango(referencia: string) {
    // Primero obtener información de la participación
    this.carteraService.checkByReference(referencia).subscribe({
      next: async (checkRes: any) => {
        if (!checkRes.success || checkRes.status === 'not_found') {
          this.loading = false;
          await this.mostrarAlerta('Error', checkRes.message || 'No se encontró la participación con esa referencia.');
          return;
        }

        const participation = checkRes.participation;
        const set = participation?.set;
        const lottery = set?.reserve?.lottery;
        const participationNumber = participation?.participation_number || participation?.numero;
        const setId = set?.id;

        // Validar que la participación esté asignada al vendedor
        // Hacer una llamada al backend para validar asignación
        // Usamos sellByQr solo para validar (sin payment_method), pero esto vendería la participación
        // Mejor: validar directamente consultando si está asignada
        await this.validarAsignacionYProcesarRango(referencia, participationNumber, setId, set, lottery);
      },
      error: async (err) => {
        this.loading = false;
        await this.mostrarAlerta('Error', err.error?.message || 'Error al buscar la participación.');
      }
    });
  }

  private async validarAsignacionYProcesarRango(referencia: string, participationNumber: number, setId: number, set: any, lottery: any) {
    if (!this.primeraReferencia) {
      // Primera lectura (desde) - guardar información
      // La validación real se hará cuando se intente vender el rango completo
      // Por ahora, solo guardamos la info y mostramos
      this.primeraReferencia = referencia;
      this.primeraParticipationNumber = participationNumber;
      this.primeraSetId = setId;
      
      this.infoSet = {
        setName: set?.set_name || `Set #${set?.set_number || ''}`,
        lotteryName: lottery?.name || '',
        participationNumber: participationNumber,
        setId: setId,
        desde: participationNumber
      };
      
      this.loading = false;
      await this.mostrarAlerta('Éxito', `Primera participación escaneada: Participación ${participationNumber} del Set "${this.infoSet.setName}". Ahora escanea la última participación (Hasta).`);
    } else {
      // Segunda lectura (hasta) - validar mismo set y vender rango completo
      if (setId !== this.primeraSetId) {
        this.loading = false;
        await this.mostrarAlerta('Error', 'Las participaciones deben pertenecer al mismo set. Por favor, escanea participaciones del mismo set.');
        return;
      }

      if (participationNumber <= this.primeraParticipationNumber!) {
        this.loading = false;
        await this.mostrarAlerta('Error', `La participación "hasta" (${participationNumber}) debe ser mayor que la participación "desde" (${this.primeraParticipationNumber}).`);
        return;
      }

      // Actualizar infoSet
      this.infoSet = {
        ...this.infoSet!,
        hasta: participationNumber
      };

      // Vender el rango completo (el backend validará que todas estén asignadas)
      await this.venderRango(this.primeraReferencia, this.primeraParticipationNumber!, participationNumber);
    }
  }

  private async venderUnidad(referencia: string) {
    this.ventasService.sellByQr(referencia).subscribe({
      next: async (res: any) => {
        this.loading = false;
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
          await this.mostrarAlerta('Error', res.message || 'Esta participación no está asignada a ti o ya está vendida.');
        }
      },
      error: async (err) => {
        this.loading = false;
        await this.mostrarAlerta('Error', err.error?.message || 'Esta participación no está asignada a ti o ya está vendida.');
      }
    });
  }

  private async venderRango(referenciaDesde: string, desde: number, hasta: number) {
    this.ventasService.sellByQr(referenciaDesde, desde, hasta, this.formaPago || undefined).subscribe({
      next: async (res: any) => {
        this.loading = false;
        if (res.success) {
          // El backend devuelve count, crear entradas para el rango
          const cantidad = res.count || (hasta - desde + 1);
          const nuevasParticipaciones = [];
          for (let i = desde; i <= hasta; i++) {
            nuevasParticipaciones.push({
              numero: i,
              referencia: referenciaDesde,
              entidad: this.infoSet?.lotteryName || '',
              precio: 0
            });
          }
          this.participaciones = [...this.participaciones, ...nuevasParticipaciones];
          
          this.guardarVentaRangoEnHistorial(res, desde, hasta, cantidad);
          this.mostrarModalExito = true;
          
          // Limpiar datos del rango
          this.infoSet = null;
          this.primeraReferencia = null;
          this.primeraParticipationNumber = null;
          this.primeraSetId = null;
        } else {
          await this.mostrarAlerta('Error', res.message || 'No se pudo registrar la venta del rango.');
        }
      },
      error: async (err) => {
        this.loading = false;
        await this.mostrarAlerta('Error', err.error?.message || 'Error al procesar la venta del rango.');
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

  guardarVentaRangoEnHistorial(res: any, desde: number, hasta: number, cantidad: number): void {
    const entidad = this.infoSet?.lotteryName || '—';
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');
    historial.unshift({
      id: Date.now(),
      tipo: 'venta-digital-rango',
      fecha: new Date().toISOString(),
      formaPago: this.formaPago || null,
      descripcion: `Rango de participaciones ${desde}-${hasta} del Set "${this.infoSet?.setName || ''}" - ${entidad}`,
      desde: desde,
      hasta: hasta,
      cantidad: cantidad,
      setName: this.infoSet?.setName || '',
      lotteryName: this.infoSet?.lotteryName || '',
      importeTotal: 0 // Se calculará si es necesario
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
