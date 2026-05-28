import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CarteraService } from '../core/services/cartera.service';
import { AlertModalService } from '../core/services/alert-modal.service';

@Component({
  selector: 'app-regalar-participacion',
  templateUrl: './regalar-participacion.page.html',
  styleUrls: ['./regalar-participacion.page.scss'],
  standalone: false,
})
export class RegalarParticipacionPage implements OnInit {

  participaciones: any[] = [];
  participacionSeleccionada: number | null = null;
  destinatarioEmail = '';
  mensajePersonal = '';
  loading = false;

  constructor(
    private alertController: AlertController,
    private router: Router,
    private carteraService: CarteraService,
    private alertModal: AlertModalService
  ) { }

  ngOnInit() {
    this.cargarParticipaciones();
  }

  ionViewWillEnter() {
    this.cargarParticipaciones();
  }

  cargarParticipaciones() {
    this.loading = true;
    this.carteraService.getParticipations().subscribe({
      next: (res) => {
        this.loading = false;
        this.participaciones = (res.participations || []).filter((p: any) => {
          const e = p.estado || 'activa';
          return !['cobrada', 'donada', 'caducada', 'regalada', 'pendiente_regalo'].includes(e)
            && !p.received_from_email;
        });
      },
      error: () => {
        this.loading = false;
        this.participaciones = [];
      }
    });
  }

  getParticipacion() {
    return this.participaciones.find(p => p.id === this.participacionSeleccionada);
  }

  puedeRegalar(): boolean {
    return !!(
      this.participacionSeleccionada &&
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

    const email = this.destinatarioEmail.trim();
    const alert = await this.alertController.create({
      header: 'Confirmar regalo',
      message: `¿Enviar la participación a ${email}? Asegúrate de que el correo es correcto: no podrás deshacerlo.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Regalar',
          handler: () => {
            this.enviarRegalo(email);
          }
        }
      ]
    });
    await alert.present();
  }

  private enviarRegalo(email: string) {
    if (!this.participacionSeleccionada) return;
    this.loading = true;
    this.carteraService.gift(this.participacionSeleccionada, email, this.mensajePersonal).subscribe({
      next: async (res) => {
        this.loading = false;
        this.carteraService.notifyParticipacionesChanged();
        await this.alertModal.show(
          'Regalo enviado',
          res.message || `Participación enviada a ${res.gifted_to_email || email}.`
        );
        this.router.navigate(['/tabs/tab1']);
      },
      error: async (err) => {
        this.loading = false;
        await this.mostrarAlerta('Error', err?.error?.message || 'No se pudo enviar el regalo.');
      }
    });
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }
}
