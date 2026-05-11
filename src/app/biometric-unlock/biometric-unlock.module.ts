import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BiometricUnlockPageRoutingModule } from './biometric-unlock-routing.module';
import { BiometricUnlockPage } from './biometric-unlock.page';

@NgModule({
  imports: [CommonModule, IonicModule, BiometricUnlockPageRoutingModule],
  declarations: [BiometricUnlockPage],
})
export class BiometricUnlockPageModule {}
