import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';

@Injectable({
  providedIn: 'root'
})
export class AlertModalService {
  constructor(private modalCtrl: ModalController) {}

  /**
   * Muestra un modal de alerta (mismo estilo que "Pago registrado con éxito").
   * El modal solo existe mientras está abierto; al cerrar se destruye.
   * Retorna una promesa que se resuelve cuando el usuario pulsa Aceptar o cierra.
   */
  show(title: string, message: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const modal = await this.modalCtrl.create({
          component: AlertModalComponent,
          cssClass: 'alert-modal-box',
          componentProps: { title, message },
          backdropDismiss: true
        });
        await modal.present();
        modal.onDidDismiss().then(() => resolve());
      } catch (e) {
        reject(e);
      }
    });
  }
}
