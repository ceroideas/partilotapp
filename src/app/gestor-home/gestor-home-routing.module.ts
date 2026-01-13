import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorHomePage } from './gestor-home.page';

const routes: Routes = [
  {
    path: '',
    component: GestorHomePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorHomePageRoutingModule {}
