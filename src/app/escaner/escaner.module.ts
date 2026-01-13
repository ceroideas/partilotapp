import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EscanerPageRoutingModule } from './escaner-routing.module';

import { EscanerPage } from './escaner.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EscanerPageRoutingModule
  ],
  declarations: [EscanerPage]
})
export class EscanerPageModule {}
