import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorVendedoresPage } from './gestor-vendedores.page';

const routes: Routes = [
  {
    path: '',
    component: GestorVendedoresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorVendedoresPageRoutingModule {}
