import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EntidadDetallePage } from './entidad-detalle.page';

const routes: Routes = [
  {
    path: '',
    component: EntidadDetallePage
  },
  {
    path: ':id',
    component: EntidadDetallePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntidadDetallePageRoutingModule {}

