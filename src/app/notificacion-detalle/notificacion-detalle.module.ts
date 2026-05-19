import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { NotificacionDetallePageRoutingModule } from './notificacion-detalle-routing.module';

import { NotificacionDetallePage } from './notificacion-detalle.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    NotificacionDetallePageRoutingModule
  ],
  declarations: [NotificacionDetallePage]
})
export class NotificacionDetallePageModule {}
