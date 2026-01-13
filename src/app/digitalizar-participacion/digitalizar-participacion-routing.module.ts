import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DigitalizarParticipacionPage } from './digitalizar-participacion.page';

const routes: Routes = [
  {
    path: '',
    component: DigitalizarParticipacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DigitalizarParticipacionPageRoutingModule {}
