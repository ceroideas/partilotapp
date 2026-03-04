import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-alert-modal',
  templateUrl: './alert-modal.component.html',
  styleUrls: ['./alert-modal.component.scss'],
  standalone: false
})
export class AlertModalComponent {
  @Input() title = '';
  @Input() message = '';

  constructor(private modalCtrl: ModalController) {}

  cerrar(): void {
    this.modalCtrl.dismiss();
  }
}
