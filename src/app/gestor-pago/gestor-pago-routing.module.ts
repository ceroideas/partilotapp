import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorPagoPage } from './gestor-pago.page';

const routes: Routes = [
  {
    path: '',
    component: GestorPagoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorPagoPageRoutingModule {}
