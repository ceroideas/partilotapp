import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DigitalizarParticipacionPageRoutingModule } from './digitalizar-participacion-routing.module';

import { DigitalizarParticipacionPage } from './digitalizar-participacion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DigitalizarParticipacionPageRoutingModule
  ],
  declarations: [DigitalizarParticipacionPage]
})
export class DigitalizarParticipacionPageModule {}
