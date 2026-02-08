import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  returnUrl = '/vendedor';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/vendedor';
  }

  ionViewDidEnter() {
    if (this.authService.isLoggedIn() && this.authService.isSeller()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  async onSubmit() {
    if (!this.email.trim() || !this.password) {
      await this.mostrarAlerta('Atención', 'Introduce email y contraseña');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
    });
    await loading.present();

    this.authService.login(this.email, this.password).subscribe({
      next: async (response) => {
        await loading.dismiss();
        if (response.success) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          await this.mostrarAlerta('Error', response.message || 'No se pudo iniciar sesión');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        const message = err.error?.message || 'Error de conexión. Verifica la URL de la API.';
        await this.mostrarAlerta('Error', message);
      }
    });
  }

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
