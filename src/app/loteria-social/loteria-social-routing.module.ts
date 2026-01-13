import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoteriaSocialPage } from './loteria-social.page';

const routes: Routes = [
  {
    path: '',
    component: LoteriaSocialPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoteriaSocialPageRoutingModule {}
