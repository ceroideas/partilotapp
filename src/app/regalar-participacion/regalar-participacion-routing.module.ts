import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegalarParticipacionPage } from './regalar-participacion.page';

const routes: Routes = [
  {
    path: '',
    component: RegalarParticipacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegalarParticipacionPageRoutingModule {}
