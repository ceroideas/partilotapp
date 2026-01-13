import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CuentaCobroPage } from './cuenta-cobro.page';

const routes: Routes = [
  {
    path: '',
    component: CuentaCobroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuentaCobroPageRoutingModule {}
