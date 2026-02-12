import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';

type TipoAcceso = 'usuario' | 'vendedor';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  tipoAcceso: TipoAcceso = 'usuario';
  returnUrl = '/tabs';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    this.returnUrl = returnUrl || '/tabs';
  }

  ionViewDidEnter() {
    if (!this.authService.isLoggedIn()) return;
    if (this.authService.isSeller()) {
      this.router.navigateByUrl(this.returnUrl || '/tabs/vendedor-tab3');
    } else {
      this.router.navigateByUrl(this.returnUrl || '/tabs');
    }
  }

  setTipoAcceso(event: any) {
    const value = event?.detail?.value;
    if (value === 'usuario' || value === 'vendedor') {
      this.tipoAcceso = value;
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

    const request$ = this.tipoAcceso === 'usuario'
      ? this.authService.loginUsuario(this.email, this.password)
      : this.authService.login(this.email, this.password);

    request$.subscribe({
      next: async (response) => {
        await loading.dismiss();
        if (response.success) {
          if (this.tipoAcceso === 'usuario') {
            this.router.navigateByUrl('/tabs');
          } else {
            this.router.navigateByUrl(this.returnUrl || '/tabs/vendedor-tab3');
          }
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
