import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LoteriaSocialPageRoutingModule } from './loteria-social-routing.module';

import { LoteriaSocialPage } from './loteria-social.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoteriaSocialPageRoutingModule
  ],
  declarations: [LoteriaSocialPage]
})
export class LoteriaSocialPageModule {}
