import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-modal-exito-pago',
  templateUrl: './modal-exito-pago.component.html',
  styleUrls: ['./modal-exito-pago.component.scss'],
  standalone: false
})
export class ModalExitoPagoComponent {
  constructor(private modalCtrl: ModalController) {}

  aceptar() {
    this.modalCtrl.dismiss();
  }
}
