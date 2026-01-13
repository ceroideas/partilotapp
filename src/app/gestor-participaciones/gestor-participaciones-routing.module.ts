import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorParticipacionesPage } from './gestor-participaciones.page';

const routes: Routes = [
  {
    path: '',
    component: GestorParticipacionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorParticipacionesPageRoutingModule {}
