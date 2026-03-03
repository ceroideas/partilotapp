import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AlertOptions {
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertModalService {
  private resolveDismiss: (() => void) | null = null;
  private readonly current$ = new BehaviorSubject<AlertOptions | null>(null);

  readonly current = this.current$.asObservable();
  get isOpen(): boolean {
    return this.current$.value !== null;
  }
  get currentValue(): AlertOptions | null {
    return this.current$.value;
  }

  /**
   * Muestra un modal de alerta (mismo estilo que el modal de éxito).
   * Retorna una promesa que se resuelve cuando el usuario pulsa Aceptar o cierra.
   */
  show(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      this.resolveDismiss = resolve;
      this.current$.next({ title, message });
    });
  }

  /** Llamado por el componente al cerrar el modal (Aceptar o X). */
  dismiss(): void {
    this.current$.next(null);
    if (this.resolveDismiss) {
      this.resolveDismiss();
      this.resolveDismiss = null;
    }
  }
}
