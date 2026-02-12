import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CarteraService } from '../core/services/cartera.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-digitalizar-participacion',
  templateUrl: './digitalizar-participacion.page.html',
  styleUrls: ['./digitalizar-participacion.page.scss'],
  standalone: false,
})
export class DigitalizarParticipacionPage implements OnInit {

  paso: 'elegir' | 'escanear' | 'manual' | 'detalle' = 'elegir';
  referenciaManual = '';
  participacion: any = null;
  status: 'can_link' | 'already_mine' | 'already_other' | 'not_found' | null = null;
  mensajeError = '';
  mostrandoScanner = false;

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router,
    private carteraService: CarteraService
  ) { }

  ngOnInit() {}

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    if (path.startsWith('storage/')) return `${base}/${path}`;
    return `${base}/storage/${path}`;
  }

  async abrirEscaner() {
    this.mostrandoScanner = true;
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanText: 'Escanea el código QR de la participación'
      });
      const ref = result?.ScanResult?.trim() || '';
      if (ref) {
        await this.consultarReferencia(ref);
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('User canceled')) {
        await this.mostrarAlerta('Error', 'No se pudo iniciar el escáner.');
      }
    } finally {
      this.mostrandoScanner = false;
    }
  }

  irAManual() {
    this.paso = 'manual';
    this.referenciaManual = '';
    this.participacion = null;
    this.status = null;
    this.mensajeError = '';
  }

  async buscarPorReferencia() {
    const ref = this.referenciaManual.trim();
    if (!ref) {
      await this.mostrarAlerta('Atención', 'Introduce el número de referencia');
      return;
    }
    await this.consultarReferencia(ref);
  }

  async consultarReferencia(referencia: string) {
    const pasoAnterior = this.paso;
    const loading = await this.loadingController.create({ message: 'Buscando...' });
    await loading.present();
    this.carteraService.checkByReference(referencia).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        this.participacion = res.participation || null;
        this.status = res.status || null;
        this.mensajeError = res.message || '';
        this.paso = 'detalle';
        if (this.status === 'not_found' || this.status === 'already_other') {
          await this.mostrarAlerta(
            this.status === 'not_found' ? 'No encontrada' : 'No se puede vincular',
            this.mensajeError
          );
          this.paso = pasoAnterior === 'manual' ? 'manual' : 'elegir';
          this.participacion = null;
        }
      },
      error: async (err) => {
        await loading.dismiss();
        const msg = err.error?.message || (err.status === 422
          ? 'La participación no se puede vincular porque ya se encuentra leída por otro usuario.'
          : 'No se encuentra la participación. Comprueba la referencia o el código QR.');
        await this.mostrarAlerta(err.status === 422 ? 'No se puede vincular' : 'No encontrada', msg);
        this.paso = pasoAnterior === 'manual' ? 'manual' : 'elegir';
        this.participacion = null;
      }
    });
  }

  async confirmarDigitalizar() {
    if (!this.participacion?.referencia || this.status !== 'can_link') return;
    const loading = await this.loadingController.create({ message: 'Añadiendo a tu cartera...' });
    await loading.present();
    this.carteraService.linkToWallet(this.participacion.referencia).subscribe({
      next: async () => {
        await loading.dismiss();
        // Notificar a la cartera para que recargue las participaciones
        this.carteraService.notifyParticipacionesChanged();
        await this.mostrarAlerta('Listo', 'Participación añadida a tu cartera.');
        this.router.navigate(['/tabs/tab1']);
      },
      error: async (err) => {
        await loading.dismiss();
        await this.mostrarAlerta('Error', err.error?.message || 'No se pudo añadir.');
      }
    });
  }

  volver() {
    if (this.paso === 'detalle') {
      this.paso = this.referenciaManual ? 'manual' : 'elegir';
      this.participacion = null;
      this.status = null;
    } else if (this.paso === 'manual') {
      this.paso = 'elegir';
      this.referenciaManual = '';
    } else {
      this.router.navigate(['/tabs/tab1']);
    }
  }

  cerrar() {
    this.router.navigate(['/tabs/tab1']);
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }
}
