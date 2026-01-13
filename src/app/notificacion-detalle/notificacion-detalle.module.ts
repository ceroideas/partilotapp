import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NotificacionDetallePageRoutingModule } from './notificacion-detalle-routing.module';

import { NotificacionDetallePage } from './notificacion-detalle.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotificacionDetallePageRoutingModule
  ],
  declarations: [NotificacionDetallePage]
})
export class NotificacionDetallePageModule {}
