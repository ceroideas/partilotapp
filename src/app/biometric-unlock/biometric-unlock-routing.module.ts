import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BiometricUnlockPage } from './biometric-unlock.page';

const routes: Routes = [{ path: '', component: BiometricUnlockPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BiometricUnlockPageRoutingModule {}
