import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false,
})
export class RegistroPage {
  email = '';
  password = '';
  fechaNacimiento = '';
  aceptarCondiciones = false;
  loading = false;
  showPassword = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    public authService: AuthService
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (!this.email.trim() || !this.password) {
      await this.mostrarAlerta('Atención', 'Introduce email y contraseña.');
      return;
    }
    if (!this.fechaNacimiento) {
      await this.mostrarAlerta('Atención', 'Introduce tu fecha de nacimiento.');
      return;
    }
    if (!this.aceptarCondiciones) {
      await this.mostrarAlerta('Atención', 'Debes aceptar las condiciones de uso.');
      return;
    }

    this.loading = true;
    this.authService.register(this.email, this.password, this.fechaNacimiento).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/tabs');
      },
      error: async (err) => {
        this.loading = false;
        const errors = err.error?.errors as Record<string, string[]> | undefined;
        const message = err.error?.message || (errors
          ? ([] as string[]).concat(...Object.values(errors)).join(' ')
          : 'Error al registrar. Intenta de nuevo.');
        await this.mostrarAlerta('Error', message);
      },
    });
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  verCondiciones() {
    this.router.navigate(['/condiciones-legales']);
  }

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
