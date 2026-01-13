import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CuentaCobroPageRoutingModule } from './cuenta-cobro-routing.module';

import { CuentaCobroPage } from './cuenta-cobro.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CuentaCobroPageRoutingModule
  ],
  declarations: [CuentaCobroPage]
})
export class CuentaCobroPageModule {}
