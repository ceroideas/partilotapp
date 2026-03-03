import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorAsignacionPageRoutingModule } from './gestor-asignacion-routing.module';

import { GestorAsignacionPage } from './gestor-asignacion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorAsignacionPageRoutingModule
  ],
  declarations: [GestorAsignacionPage]
})
export class GestorAsignacionPageModule {}
