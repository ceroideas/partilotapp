import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EntidadDetallePageRoutingModule } from './entidad-detalle-routing.module';

import { EntidadDetallePage } from './entidad-detalle.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EntidadDetallePageRoutingModule
  ],
  declarations: [EntidadDetallePage]
})
export class EntidadDetallePageModule {}

