import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-regalar-participacion',
  templateUrl: './regalar-participacion.page.html',
  styleUrls: ['./regalar-participacion.page.scss'],
  standalone: false,
})
export class RegalarParticipacionPage implements OnInit {

  participaciones: any[] = [];
  participacionSeleccionada: number | null = null;
  destinatarioNombre: string = '';
  destinatarioEmail: string = '';
  mensajePersonal: string = '';

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarParticipaciones();
  }

  cargarParticipaciones() {
    // Cargar participaciones disponibles para regalar (estado: activa)
    try {
      const todasParticipaciones = JSON.parse(localStorage.getItem('participaciones') || '[]');
      this.participaciones = todasParticipaciones.filter((p: any) => p.estado === 'activa');
      
      if (this.participaciones.length === 0) {
        // Datos de ejemplo para desarrollo
        this.participaciones = [
          { id: 1, numero: '12345', fecha: '2024-01-15', numeros: '1, 5, 12, 23, 34', estado: 'activa' },
          { id: 2, numero: '12346', fecha: '2024-01-16', numeros: '2, 8, 15, 28, 31', estado: 'activa' },
        ];
      }
    } catch (error) {
      console.error('Error cargando participaciones:', error);
      this.participaciones = [];
    }
  }

  recargarParticipaciones() {
    this.cargarParticipaciones();
  }

  getParticipacion() {
    return this.participaciones.find(p => p.id === this.participacionSeleccionada);
  }

  puedeRegalar(): boolean {
    return !!(
      this.participacionSeleccionada &&
      this.destinatarioNombre &&
      this.destinatarioEmail &&
      this.validarEmail(this.destinatarioEmail)
    );
  }

  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async regalarParticipacion() {
    if (!this.puedeRegalar()) {
      await this.mostrarAlerta('Error', 'Por favor completa todos los campos correctamente');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Enviando regalo...',
    });
    await loading.present();

    try {
      // TODO: Integrar con servicio para enviar regalo
      const regalo = {
        participacionId: this.participacionSeleccionada,
        destinatarioNombre: this.destinatarioNombre,
        destinatarioEmail: this.destinatarioEmail,
        mensajePersonal: this.mensajePersonal,
        fecha: new Date().toISOString()
      };

      // Guardar registro del regalo
      const regalos = JSON.parse(localStorage.getItem('regalos') || '[]');
      regalos.push(regalo);
      localStorage.setItem('regalos', JSON.stringify(regalos));

      // Actualizar estado de participación
      const todasParticipaciones = JSON.parse(localStorage.getItem('participaciones') || '[]');
      const index = todasParticipaciones.findIndex((p: any) => p.id === this.participacionSeleccionada);
      if (index !== -1) {
        todasParticipaciones[index].estado = 'regalada';
        localStorage.setItem('participaciones', JSON.stringify(todasParticipaciones));
      }

      await loading.dismiss();

      const alert = await this.alertController.create({
        header: '¡Regalo enviado!',
        message: `La participación ha sido enviada a ${this.destinatarioNombre}`,
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
      await this.mostrarAlerta('Error', 'No se pudo enviar el regalo. Intenta nuevamente.');
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
