import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  returnUrl = '/tabs';
  loading = false;
  showPassword = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    this.returnUrl = returnUrl || '/tabs';
  }

  ionViewDidEnter() {
    if (!this.authService.isLoggedIn()) return;
    // Redirigir según el rol del usuario
    this.navigateByRole();
  }

  private navigateByRole() {
    if (this.authService.isGestor()) {
      // Usar gestor-tab3 que parece ser la ruta estándar según otros componentes
      this.router.navigateByUrl(this.returnUrl || '/tabs/gestor-tab3');
    } else if (this.authService.isSeller()) {
      this.router.navigateByUrl(this.returnUrl || '/tabs/vendedor-tab3');
    } else {
      this.router.navigateByUrl(this.returnUrl || '/tabs');
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async recordarPassword() {
    await this.mostrarAlerta('Recordar contraseña', 'Contacta con tu entidad o administrador para recuperar tu contraseña.');
  }

  loginBiometrico() {
    // Placeholder: integración con Capacitor Identity o similar
    this.mostrarAlerta('Acceso biométrico', 'Próximamente disponible.');
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  async onSubmit() {
    if (!this.email.trim() || !this.password) {
      await this.mostrarAlerta('Atención', 'Introduce email y contraseña');
      return;
    }

    this.loading = true;
    // Usar loginUsuario que determina automáticamente el rol del usuario
    this.authService.loginUsuario(this.email, this.password).subscribe({
      next: async (response) => {
        this.loading = false;
        if (response.success) {
          // Navegar según el rol detectado automáticamente
          this.navigateByRole();
        } else {
          await this.mostrarAlerta('Error', response.message || 'No se pudo iniciar sesión');
        }
      },
      error: async (err) => {
        this.loading = false;
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
