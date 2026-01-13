import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-venta-qr',
  templateUrl: './venta-qr.page.html',
  styleUrls: ['./venta-qr.page.scss'],
  standalone: false,
})
export class VentaQRPage implements OnInit {

  mostrandoScanner: boolean = false;
  participaciones: any[] = [];
  
  // Modal de resumen
  mostrarModalResumen: boolean = false;
  formaPago: 'efectivo' | 'bizum' | 'omitir' | null = null;
  
  // Modal de éxito
  mostrarModalExito: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.cargarParticipaciones();
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

  cargarParticipaciones() {
    // Cargar participaciones desde localStorage o inicializar vacío
    const participacionesGuardadas = localStorage.getItem('participacionesVentaQR');
    if (participacionesGuardadas) {
      this.participaciones = JSON.parse(participacionesGuardadas);
    }
  }

  guardarParticipaciones() {
    localStorage.setItem('participacionesVentaQR', JSON.stringify(this.participaciones));
  }

  iniciarScanner() {
    this.mostrandoScanner = true;
    // TODO: Iniciar escáner QR real con plugin de Capacitor
    // Por ahora simulamos el escaneo después de 2 segundos
    setTimeout(() => {
      this.simularEscaneo();
    }, 2000);
  }

  simularEscaneo() {
    // Simular escaneo de una participación
    const nuevaParticipacion = {
      id: Date.now(),
      numero: `1/${String(this.participaciones.length + 1).padStart(4, '0')}`,
      entidad: 'Peña Rondalosa',
      precio: 5.00
    };
    
    this.participaciones.push(nuevaParticipacion);
    this.guardarParticipaciones();
    this.mostrandoScanner = false;
  }

  cancelarScanner() {
    this.mostrandoScanner = false;
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
        tipo: 'qr',
        participaciones: [...this.participaciones],
        totalParticipaciones: this.participaciones.length,
        importeTotal: this.calcularImporteTotal(),
        formaPago: this.formaPago,
        fecha: new Date().toISOString(),
        estado: 'registrada'
      };

      const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
      ventas.push(venta);
      localStorage.setItem('ventas', JSON.stringify(ventas));

      // Limpiar participaciones de esta sesión
      this.participaciones = [];
      localStorage.removeItem('participacionesVentaQR');

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
