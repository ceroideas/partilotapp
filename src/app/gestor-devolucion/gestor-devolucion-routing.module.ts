import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorDevolucionPage } from './gestor-devolucion.page';

const routes: Routes = [
  {
    path: '',
    component: GestorDevolucionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorDevolucionPageRoutingModule {}
