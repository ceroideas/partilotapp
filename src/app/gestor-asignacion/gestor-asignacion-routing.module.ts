import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorAsignacionPage } from './gestor-asignacion.page';

const routes: Routes = [
  {
    path: '',
    component: GestorAsignacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorAsignacionPageRoutingModule {}
