import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ComprobarNumeroPageRoutingModule } from './comprobar-numero-routing.module';

import { ComprobarNumeroPage } from './comprobar-numero.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComprobarNumeroPageRoutingModule
  ],
  declarations: [ComprobarNumeroPage]
})
export class ComprobarNumeroPageModule {}
