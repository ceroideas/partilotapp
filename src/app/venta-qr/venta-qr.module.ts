import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VentaQrPageRoutingModule } from './venta-qr-routing.module';

import { VentaQRPage } from './venta-qr.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VentaQrPageRoutingModule
  ],
  declarations: [VentaQRPage]
})
export class VentaQrPageModule {}
