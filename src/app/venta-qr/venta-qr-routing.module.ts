import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VentaQRPage } from './venta-qr.page';

const routes: Routes = [
  {
    path: '',
    component: VentaQRPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VentaQrPageRoutingModule {}
