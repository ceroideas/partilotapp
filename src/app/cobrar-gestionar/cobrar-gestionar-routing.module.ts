import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CobrarGestionarPage } from './cobrar-gestionar.page';

const routes: Routes = [
  {
    path: '',
    component: CobrarGestionarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CobrarGestionarPageRoutingModule {}
