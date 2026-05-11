import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { BiometricService } from '../core/services/biometric.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: false,
})
export class SplashPage implements OnInit, OnDestroy {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private biometricService: BiometricService
  ) {}

  ngOnInit(): void {
    this.timeoutId = setTimeout(() => this.navigateAfterSplash(), 3000);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private navigateAfterSplash(): void {
    if (this.authService.isLoggedIn()) {
      if (this.biometricService.mustShowBiometricGate()) {
        this.router.navigate(['/biometric-unlock'], { replaceUrl: true });
        return;
      }
      this.authService.navigateToDefaultHome();
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
