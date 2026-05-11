import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BiometricService } from '../services/biometric.service';

/**
 * Guard que exige login. Si no está autenticado, redirige a /login.
 * Con biometría activa en app nativa, exige desbloqueo antes de las rutas protegidas.
 */
export const loggedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const biometricService = inject(BiometricService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (biometricService.mustShowBiometricGate()) {
    router.navigate(['/biometric-unlock'], {
      queryParams: { returnUrl: state.url },
      replaceUrl: true,
    });
    return false;
  }

  return true;
};
