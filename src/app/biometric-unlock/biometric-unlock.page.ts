import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { BiometricService } from '../core/services/biometric.service';

@Component({
  selector: 'app-biometric-unlock',
  templateUrl: './biometric-unlock.page.html',
  styleUrls: ['./biometric-unlock.page.scss'],
  standalone: false,
})
export class BiometricUnlockPage {
  biometricIcon = 'finger-print-outline';
  desbloqueando = false;
  private autoIntentoHecho = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private biometricService: BiometricService,
    private alertController: AlertController
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.autoIntentoHecho = false;
    if (!this.authService.isLoggedIn()) {
      await this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }
    if (!this.biometricService.mustShowBiometricGate()) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      this.authService.navigateToDefaultHome(returnUrl);
      return;
    }
    this.biometricIcon = await this.biometricService.getBiometricIconName();
  }

  ionViewDidEnter(): void {
    if (!this.authService.isLoggedIn() || !this.biometricService.mustShowBiometricGate()) {
      return;
    }
    if (!this.autoIntentoHecho) {
      this.autoIntentoHecho = true;
      void this.desbloquear();
    }
  }

  async desbloquear(): Promise<void> {
    if (this.desbloqueando) return;
    if (!(await this.biometricService.isBiometryAvailable())) {
      await this.mostrarAlerta(
        'Biometría no disponible',
        'No se puede usar la biometría en este dispositivo. Cierra sesión e inicia con email y contraseña.'
      );
      return;
    }
    this.desbloqueando = true;
    const ok = await this.biometricService.authenticate();
    this.desbloqueando = false;
    if (!ok) return;
    this.biometricService.markBiometricUnlockSessionOk();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.authService.navigateToDefaultHome(returnUrl);
  }

  cerrarSesion(): void {
    this.authService.logout().subscribe(() => {});
  }

  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
