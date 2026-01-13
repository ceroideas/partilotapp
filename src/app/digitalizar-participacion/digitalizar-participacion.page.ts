import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-digitalizar-participacion',
  templateUrl: './digitalizar-participacion.page.html',
  styleUrls: ['./digitalizar-participacion.page.scss'],
  standalone: false,
})
export class DigitalizarParticipacionPage implements OnInit {

  imagenCapturada: string | null = null;
  numeroParticipacion: string = '';
  fechaSorteo: string = '';
  numerosJugados: string = '';

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router
  ) { }

  ngOnInit() {
  }

  abrirCamara() {
    // TODO: Implementar acceso a cámara
    // Por ahora simulamos captura
    this.mostrarAlerta('Info', 'Funcionalidad de cámara en desarrollo. Por ahora puedes seleccionar de galería.');
    // En producción usar: Camera.getPhoto() de Capacitor o @ionic-native/camera
  }

  abrirGaleria() {
    // TODO: Implementar acceso a galería
    // Por ahora simulamos selección
    this.imagenCapturada = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // Placeholder
  }

  capturarOtra() {
    this.imagenCapturada = null;
    this.limpiarFormulario();
  }

  eliminarImagen() {
    this.imagenCapturada = null;
    this.limpiarFormulario();
  }

  limpiarFormulario() {
    this.numeroParticipacion = '';
    this.fechaSorteo = '';
    this.numerosJugados = '';
  }

  puedeGuardar(): boolean {
    return !!(
      this.imagenCapturada &&
      this.numeroParticipacion &&
      this.fechaSorteo &&
      this.numerosJugados
    );
  }

  async guardarParticipacion() {
    if (!this.puedeGuardar()) {
      await this.mostrarAlerta('Error', 'Por favor completa todos los campos');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Guardando participación...',
    });
    await loading.present();

    try {
      // TODO: Integrar con servicio para guardar en backend
      // Por ahora simulamos guardado
      const participacion = {
        numero: this.numeroParticipacion,
        fecha: this.fechaSorteo,
        numeros: this.numerosJugados,
        imagen: this.imagenCapturada
      };

      // Guardar en localStorage temporalmente
      const participaciones = JSON.parse(localStorage.getItem('participaciones') || '[]');
      participaciones.push(participacion);
      localStorage.setItem('participaciones', JSON.stringify(participaciones));

      await loading.dismiss();

      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Participación guardada correctamente',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigate(['/cartera']);
            }
          }
        ]
      });
      await alert.present();
    } catch (error) {
      await loading.dismiss();
      await this.mostrarAlerta('Error', 'No se pudo guardar la participación. Intenta nuevamente.');
    }
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
