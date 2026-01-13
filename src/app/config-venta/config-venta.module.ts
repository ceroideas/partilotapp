import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfigVentaPageRoutingModule } from './config-venta-routing.module';

import { ConfigVentaPage } from './config-venta.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfigVentaPageRoutingModule
  ],
  declarations: [ConfigVentaPage]
})
export class ConfigVentaPageModule {}
