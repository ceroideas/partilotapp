import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CondicionesLegalesPage } from './condiciones-legales.page';

const routes: Routes = [
  {
    path: '',
    component: CondicionesLegalesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CondicionesLegalesPageRoutingModule {}
