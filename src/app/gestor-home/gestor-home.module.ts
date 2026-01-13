import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorHomePageRoutingModule } from './gestor-home-routing.module';

import { GestorHomePage } from './gestor-home.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorHomePageRoutingModule
  ],
  declarations: [GestorHomePage]
})
export class GestorHomePageModule {}
