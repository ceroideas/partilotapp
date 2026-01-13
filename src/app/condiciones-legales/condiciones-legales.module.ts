import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CondicionesLegalesPageRoutingModule } from './condiciones-legales-routing.module';

import { CondicionesLegalesPage } from './condiciones-legales.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CondicionesLegalesPageRoutingModule
  ],
  declarations: [CondicionesLegalesPage]
})
export class CondicionesLegalesPageModule {}
