import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VentaManualPageRoutingModule } from './venta-manual-routing.module';

import { VentaManualPage } from './venta-manual.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VentaManualPageRoutingModule
  ],
  declarations: [VentaManualPage]
})
export class VentaManualPageModule {}
