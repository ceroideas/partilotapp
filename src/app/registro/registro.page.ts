import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false,
})
export class RegistroPage implements OnInit {
  email = '';
  password = '';
  phone = '';
  smsCode = '';
  linkCode = '';
  fechaNacimiento = '';
  aceptarCondiciones = false;
  loading = false;
  showPassword = false;

  smsVerificationEnabled = false;
  smsCodeLength = 6;
  smsSending = false;
  smsCooldown = 0;
  smsResendCooldown = 60;
  private smsCooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getSmsConfig().subscribe({
      next: (cfg) => {
        this.smsVerificationEnabled = cfg.enabled === true;
        this.smsCodeLength = cfg.code_length || 6;
        this.smsResendCooldown = cfg.resend_cooldown_seconds || 60;
      },
      error: () => {
        this.smsVerificationEnabled = false;
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  enviarCodigoSms() {
    const phone = this.phone.trim();
    if (!phone) {
      void this.mostrarAlerta('Atención', 'Introduce tu teléfono móvil antes de pedir el código.');
      return;
    }
    if (this.smsCooldown > 0 || this.smsSending) {
      return;
    }

    this.smsSending = true;
    this.authService.sendRegisterSmsCode(phone).subscribe({
      next: async (res) => {
        this.smsSending = false;
        if (res.success) {
          this.iniciarCooldownSms(this.smsResendCooldown);
          await this.mostrarAlerta('SMS enviado', res.message || 'Revisa tu móvil e introduce el código.');
        } else {
          await this.mostrarAlerta('Error', res.message || 'No se pudo enviar el SMS.');
        }
      },
      error: async (err) => {
        this.smsSending = false;
        const msg = err?.error?.message || 'No se pudo enviar el SMS. Comprueba el número.';
        await this.mostrarAlerta('Error', msg);
      },
    });
  }

  private iniciarCooldownSms(seconds: number) {
    this.smsCooldown = seconds;
    if (this.smsCooldownTimer) {
      clearInterval(this.smsCooldownTimer);
    }
    this.smsCooldownTimer = setInterval(() => {
      this.smsCooldown--;
      if (this.smsCooldown <= 0 && this.smsCooldownTimer) {
        clearInterval(this.smsCooldownTimer);
        this.smsCooldownTimer = null;
      }
    }, 1000);
  }

  async onSubmit() {
    if (!this.email.trim() || !this.password) {
      await this.mostrarAlerta('Atención', 'Introduce email y contraseña.');
      return;
    }
    const phoneTrim = this.phone.trim();
    if (this.smsVerificationEnabled && phoneTrim) {
      const code = this.smsCode.trim();
      if (!code || code.length !== this.smsCodeLength) {
        await this.mostrarAlerta(
          'Verificación SMS',
          `Introduce el código de ${this.smsCodeLength} dígitos que recibiste por SMS.`
        );
        return;
      }
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
    this.authService
      .register(
        this.email,
        this.password,
        this.fechaNacimiento,
        phoneTrim || undefined,
        this.smsVerificationEnabled && phoneTrim ? this.smsCode.trim() : undefined,
        this.linkCode.trim() || undefined
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl('/tabs');
        },
        error: async (err) => {
          this.loading = false;
          const errors = err.error?.errors as Record<string, string[]> | undefined;
          const message =
            err.error?.message ||
            (errors
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
