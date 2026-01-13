import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VentaManualPage } from './venta-manual.page';

const routes: Routes = [
  {
    path: '',
    component: VentaManualPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VentaManualPageRoutingModule {}
