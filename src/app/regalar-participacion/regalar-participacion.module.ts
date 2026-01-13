import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegalarParticipacionPageRoutingModule } from './regalar-participacion-routing.module';

import { RegalarParticipacionPage } from './regalar-participacion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegalarParticipacionPageRoutingModule
  ],
  declarations: [RegalarParticipacionPage]
})
export class RegalarParticipacionPageModule {}
