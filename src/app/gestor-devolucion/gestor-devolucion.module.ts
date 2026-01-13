import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorDevolucionPageRoutingModule } from './gestor-devolucion-routing.module';

import { GestorDevolucionPage } from './gestor-devolucion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorDevolucionPageRoutingModule
  ],
  declarations: [GestorDevolucionPage]
})
export class GestorDevolucionPageModule {}