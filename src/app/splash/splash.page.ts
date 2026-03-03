import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

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
    private authService: AuthService
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
      const rol = localStorage.getItem('rolActual') || 'usuario';
      if (rol === 'gestor') {
        this.router.navigate(['/tabs/gestor-tab3'], { replaceUrl: true });
      } else if (rol === 'vendedor') {
        this.router.navigate(['/tabs/vendedor-tab3'], { replaceUrl: true });
      } else {
        this.router.navigate(['/tabs/tab3'], { replaceUrl: true });
      }
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
