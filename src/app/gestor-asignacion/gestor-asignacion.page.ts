import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DevolutionsService } from '../core/services/devolutions.service';
import { VentasService } from '../core/services/ventas.service';
import { AuthService } from '../core/services/auth.service';
import { AlertController } from '@ionic/angular';
import { environment } from '../../environments/environment';

type Step = 'sorteos' | 'participaciones' | 'resumen' | 'firma';

export interface AsignacionParticipation {
  id: number;
  number: number;
  participation_code: string;
  set_id: number;
  set_name?: string;
}

@Component({
  selector: 'app-gestor-asignacion',
  templateUrl: './gestor-asignacion.page.html',
  styleUrls: ['./gestor-asignacion.page.scss'],
  standalone: false,
})
export class GestorAsignacionPage implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;

  step: Step = 'sorteos';
  loading = false;
  errorMessage = '';
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'gestor';

  sellerId: number | null = null;
  entityId: number | null = null;
  sellerName = '';
  selectedEntity: any = null;

  lotteries: any[] = [];
  selectedLottery: any = null;
  sets: any[] = [];
  selectedSet: any = null;
  rangoDesde = '';
  rangoHasta = '';
  unidadNumero = '';
  participacionesToAssign: AsignacionParticipation[] = [];

  signatureDataUrl: string | null = null;
  isDrawing = false;
  hasSignature = false;
  procesando = false;
  showSuccessModal = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private devolutionsService: DevolutionsService,
    private ventasService: VentasService,
    public authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.detectarRol();
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { seller_id?: number; entity_id?: number; seller_name?: string } | undefined;
    if (state?.seller_id != null && state?.entity_id != null) {
      this.sellerId = state.seller_id;
      this.entityId = state.entity_id;
      this.sellerName = state.seller_name || 'Vendedor';
      this.selectedEntity = { id: this.entityId, name: '' };
      this.loadLotteries();
    } else {
      this.errorMessage = 'Faltan datos del vendedor. Vuelve al detalle del vendedor.';
    }
  }

  ngAfterViewInit() {
    // Canvas para firma se inicializa cuando step === 'firma'
  }

  detectarRol() {
    const guardado = localStorage.getItem('rolActual');
    if (guardado === 'usuario' || guardado === 'vendedor' || guardado === 'gestor') {
      this.rolActual = guardado;
    } else {
      this.rolActual = this.authService.isManager() ? 'gestor' : (this.authService.isSeller() ? 'vendedor' : 'usuario');
    }
  }

  loadLotteries() {
    if (!this.entityId) return;
    this.loading = true;
    this.errorMessage = '';
    this.devolutionsService.getLotteriesByEntity(this.entityId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.lotteries) {
          this.lotteries = res.lotteries;
          if (this.lotteries.length === 0) {
            this.errorMessage = 'No hay sorteos para esta entidad.';
          }
        } else {
          this.errorMessage = 'Error al cargar sorteos.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Error al cargar sorteos.';
      }
    });
  }

  selectSorteo(lottery: any) {
    this.selectedLottery = lottery;
    this.loadSets();
    this.step = 'participaciones';
  }

  loadSets() {
    if (!this.entityId || !this.selectedLottery) return;
    this.loading = true;
    this.errorMessage = '';
    this.devolutionsService.getSetsByEntityAndLottery(this.entityId, this.selectedLottery.id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.sets) {
          this.sets = res.sets;
          this.selectedSet = this.sets.length === 1 ? this.sets[0] : null;
          if (this.sets.length === 0) {
            this.errorMessage = 'No hay sets con participaciones para este sorteo.';
          }
        } else {
          this.errorMessage = 'Error al cargar sets.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Error al cargar sets.';
      }
    });
  }

  compareSet(a: any, b: any): boolean {
    return a && b && a.id === b.id;
  }

  onSetChange(ev: any) {
    const v = ev?.detail?.value;
    if (v != null) this.selectedSet = v;
  }

  validarYAsignar() {
    if (!this.sellerId || !this.selectedSet) {
      this.mostrarAlerta('Falta selección', 'Selecciona set.');
      return;
    }
    const desde = this.rangoDesde ? parseInt(this.rangoDesde, 10) : undefined;
    const hasta = this.rangoHasta ? parseInt(this.rangoHasta, 10) : undefined;
    const unidad = this.unidadNumero ? parseInt(this.unidadNumero, 10) : undefined;

    if (desde != null && hasta != null) {
      this.validarRango(desde, hasta);
    } else if (unidad != null && !isNaN(unidad)) {
      this.validarUnidad(unidad);
    } else {
      this.mostrarAlerta('Datos requeridos', 'Indica un rango (desde y hasta) o un número de participación.');
    }
  }

  private validarRango(desde: number, hasta: number) {
    this.loading = true;
    this.ventasService.validateAssignments(this.sellerId!, this.selectedSet.id, desde, hasta).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.participations && res.participations.length > 0) {
          this.agregarParticipacionesSinDuplicar(res.participations);
          this.rangoDesde = '';
          this.rangoHasta = '';
          this.unidadNumero = '';
        } else {
          this.mostrarAlerta('Sin resultados', res?.message || 'No hay participaciones disponibles en ese rango.');
        }
      },
      error: (err) => {
        this.loading = false;
        this.mostrarAlerta('Error', err?.error?.message || 'Error al validar el rango.');
      }
    });
  }

  private validarUnidad(numero: number) {
    this.validarRango(numero, numero);
  }

  private agregarParticipacionesSinDuplicar(participations: any[]) {
    const setNombre = this.selectedSet?.set_name ?? this.selectedSet?.name ?? 'Set';
    for (const p of participations) {
      const id = p.id;
      const setId = p.set_id ?? this.selectedSet?.id;
      if (!this.participacionesToAssign.find(x => x.id === id)) {
        this.participacionesToAssign.push({
          id,
          number: p.number,
          participation_code: p.participation_code || '',
          set_id: setId,
          set_name: setNombre
        });
      }
    }
  }

  quitarParticipacion(p: AsignacionParticipation) {
    this.participacionesToAssign = this.participacionesToAssign.filter(x => x.id !== p.id);
  }

  irAResumen() {
    this.step = 'resumen';
  }

  backToParticipaciones() {
    this.step = 'participaciones';
  }

  aceptarResumenContinuar() {
    this.step = 'firma';
    this.hasSignature = false;
    this.signatureDataUrl = null;
    setTimeout(() => this.initSignatureCanvas(), 100);
  }

  private initSignatureCanvas() {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#212529';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }

  startDrawing(ev: TouchEvent | MouseEvent) {
    this.isDrawing = true;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = this.getCoords(ev, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }

  draw(ev: TouchEvent | MouseEvent) {
    if (!this.isDrawing) return;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ev.preventDefault();
    const coords = this.getCoords(ev, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    this.hasSignature = true;
  }

  endDrawing() {
    this.isDrawing = false;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    this.signatureDataUrl = canvas.toDataURL('image/png');
  }

  private getCoords(ev: TouchEvent | MouseEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    if (ev instanceof TouchEvent) {
      const t = ev.touches[0] || ev.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (ev as MouseEvent).clientX - rect.left, y: (ev as MouseEvent).clientY - rect.top };
  }

  clearSignature() {
    const canvas = this.signatureCanvas?.nativeElement;
    if (canvas && canvas.getContext('2d')) {
      const ctx = canvas.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
    this.hasSignature = false;
    this.signatureDataUrl = null;
  }

  enviarAsignacion() {
    if (!this.sellerId || this.participacionesToAssign.length === 0) {
      this.mostrarAlerta('Aviso', 'No hay participaciones para asignar.');
      return;
    }
    if (!this.hasSignature) {
      this.mostrarAlerta('Firma requerida', 'El vendedor debe firmar para confirmar.');
      return;
    }
    this.procesando = true;
    const payload = this.participacionesToAssign.map(p => ({ id: p.id, number: p.number, set_id: p.set_id }));
    this.ventasService.saveAssignments(this.sellerId, payload).subscribe({
      next: (res) => {
        this.procesando = false;
        if (res.success) {
          this.showSuccessModal = true;
        } else {
          this.mostrarAlerta('Error', res.message || 'No se pudo guardar la asignación.');
        }
      },
      error: (err) => {
        this.procesando = false;
        this.mostrarAlerta('Error', err?.error?.message || 'Error al guardar la asignación.');
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/tabs/gestor-tab2'], { replaceUrl: true });
  }

  backToSorteos() {
    this.step = 'sorteos';
    this.selectedLottery = null;
    this.sets = [];
    this.selectedSet = null;
    this.participacionesToAssign = [];
    this.loadLotteries();
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    const normalized = (imagePath || '').replace(/^storage\/?/, '');
    return `${base}/uploads/${normalized}`;
  }

  onLotteryImageError(lot: any) {
    if (lot) lot.image = null;
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  async escanearQRUnidad() {
    if (!this.entityId || !this.selectedLottery || !this.selectedSet) {
      this.mostrarAlerta('Falta selección', 'Selecciona sorteo y set antes de escanear.');
      return;
    }
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanText: 'Escanea el código QR de la participación (unidad)'
      });
      const qrText = result?.ScanResult?.trim() || null;
      const referencia = this.extraerReferenciaDeQR(qrText);
      if (!referencia) {
        this.mostrarAlerta('QR no válido', 'No se pudo obtener la referencia.');
        return;
      }
      this.validarPorReferencia(referencia);
    } catch (err) {
      console.error('Error escáner QR:', err);
      this.mostrarAlerta('Error', 'No se pudo iniciar el escáner.');
    }
  }

  async escanearQRParaDesde() {
    if (!this.entityId || !this.selectedLottery) {
      this.mostrarAlerta('Falta selección', 'Selecciona sorteo.');
      return;
    }
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanText: 'Escanea el QR de la primera participación (Desde)'
      });
      const qrText = result?.ScanResult?.trim() || null;
      const referencia = this.extraerReferenciaDeQR(qrText);
      if (!referencia) {
        this.mostrarAlerta('QR no válido', 'No se pudo obtener la referencia.');
        return;
      }
      this.resolverReferenciaParaCampo(referencia, 'desde');
    } catch (err) {
      console.error('Error escáner QR:', err);
      this.mostrarAlerta('Error', 'No se pudo iniciar el escáner.');
    }
  }

  async escanearQRParaHasta() {
    if (!this.entityId || !this.selectedLottery) {
      this.mostrarAlerta('Falta selección', 'Selecciona sorteo.');
      return;
    }
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanText: 'Escanea el QR de la última participación (Hasta)'
      });
      const qrText = result?.ScanResult?.trim() || null;
      const referencia = this.extraerReferenciaDeQR(qrText);
      if (!referencia) {
        this.mostrarAlerta('QR no válido', 'No se pudo obtener la referencia.');
        return;
      }
      this.resolverReferenciaParaCampo(referencia, 'hasta');
    } catch (err) {
      console.error('Error escáner QR:', err);
      this.mostrarAlerta('Error', 'No se pudo iniciar el escáner.');
    }
  }

  private resolverReferenciaParaCampo(referencia: string, campo: 'desde' | 'hasta') {
    this.loading = true;
    this.devolutionsService.validateParticipations({
      entity_id: this.entityId!,
      lottery_id: this.selectedLottery.id,
      referencia
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.participations && res.participations.length > 0) {
          const num = res.participations[0].number ?? (res.participations[0] as any).participation_number;
          if (num != null) {
            if (campo === 'desde') this.rangoDesde = String(num);
            else this.rangoHasta = String(num);
            const first = res.participations[0] as any;
            if (first.set_id && this.sets.length > 0) {
              const set = this.sets.find(s => s.id === first.set_id);
              if (set) this.selectedSet = set;
            }
          }
        } else {
          this.mostrarAlerta('Sin resultados', 'No se encontró esa participación.');
        }
      },
      error: () => {
        this.loading = false;
        this.mostrarAlerta('Error', 'Error al validar el QR.');
      }
    });
  }

  private validarPorReferencia(referencia: string) {
    this.loading = true;
    this.devolutionsService.validateParticipations({
      entity_id: this.entityId!,
      lottery_id: this.selectedLottery.id,
      referencia
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.participations && res.participations.length > 0) {
          const first = res.participations[0] as any;
          const num = first.number ?? first.participation_number;
          if (num != null && this.sellerId && this.selectedSet) {
            this.ventasService.validateAssignments(this.sellerId, this.selectedSet.id, num, num).subscribe({
              next: (r) => {
                if (r.success && r.participations && r.participations.length > 0) {
                  this.agregarParticipacionesSinDuplicar(r.participations);
                  this.unidadNumero = '';
                  this.rangoDesde = '';
                  this.rangoHasta = '';
                } else {
                  this.mostrarAlerta('No disponible', 'Esa participación no está disponible para asignar.');
                }
              },
              error: () => this.mostrarAlerta('Error', 'No se pudo validar la participación.')
            });
          } else {
            this.mostrarAlerta('Sin resultados', 'No se pudo obtener el número de participación.');
          }
        } else {
          this.mostrarAlerta('Sin resultados', 'No se encontró esa participación.');
        }
      },
      error: () => {
        this.loading = false;
        this.mostrarAlerta('Error', 'Error al validar el QR.');
      }
    });
  }

  private extraerReferenciaDeQR(qrText: string | null): string | null {
    if (!qrText) return null;
    const t = qrText.trim();
    if (!t) return null;
    const m = t.match(/(?:participation|ref|referencia)[=\/:]\s*([a-zA-Z0-9_-]+)/i);
    if (m) return m[1];
    if (/^[a-zA-Z0-9_-]{1,64}$/.test(t)) return t;
    return t;
  }
}
