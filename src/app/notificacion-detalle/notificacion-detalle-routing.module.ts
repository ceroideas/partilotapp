import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NotificacionDetallePage } from './notificacion-detalle.page';

const routes: Routes = [
  {
    path: '',
    component: NotificacionDetallePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificacionDetallePageRoutingModule {}
