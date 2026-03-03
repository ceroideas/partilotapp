import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorPagoPageRoutingModule } from './gestor-pago-routing.module';

import { GestorPagoPage } from './gestor-pago.page';
import { ModalExitoPagoComponent } from './modal-exito-pago/modal-exito-pago.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorPagoPageRoutingModule
  ],
  declarations: [GestorPagoPage, ModalExitoPagoComponent]
})
export class GestorPagoPageModule {}
