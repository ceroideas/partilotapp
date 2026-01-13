import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CobrarGestionarPageRoutingModule } from './cobrar-gestionar-routing.module';

import { CobrarGestionarPage } from './cobrar-gestionar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CobrarGestionarPageRoutingModule
  ],
  declarations: [CobrarGestionarPage]
})
export class CobrarGestionarPageModule {}
