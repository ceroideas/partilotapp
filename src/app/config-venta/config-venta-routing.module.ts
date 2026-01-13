import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfigVentaPage } from './config-venta.page';

const routes: Routes = [
  {
    path: '',
    component: ConfigVentaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfigVentaPageRoutingModule {}
