import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorVendedoresPageRoutingModule } from './gestor-vendedores-routing.module';

import { GestorVendedoresPage } from './gestor-vendedores.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorVendedoresPageRoutingModule
  ],
  declarations: [GestorVendedoresPage]
})
export class GestorVendedoresPageModule {}
