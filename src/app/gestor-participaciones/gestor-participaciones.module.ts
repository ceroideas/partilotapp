import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorParticipacionesPageRoutingModule } from './gestor-participaciones-routing.module';

import { GestorParticipacionesPage } from './gestor-participaciones.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorParticipacionesPageRoutingModule
  ],
  declarations: [GestorParticipacionesPage]
})
export class GestorParticipacionesPageModule {}
