import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ComprobarNumeroPage } from './comprobar-numero.page';

const routes: Routes = [
  {
    path: '',
    component: ComprobarNumeroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComprobarNumeroPageRoutingModule {}
