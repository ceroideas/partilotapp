import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = environment.apiUrl;
  private base = `${this.apiUrl}/management/participations`;
  private paymentsBase = `${this.apiUrl}/management/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Entidades que el usuario ve como gestor (para pantalla Pago).
   */
  getEntities(): Observable<{ success: boolean; entities?: any[] }> {
    return this.http.get<{ success: boolean; entities?: any[] }>(`${this.paymentsBase}/entities`);
  }

  /**
   * Validar participaciones para pago (solo las que tienen premio tras escrutinio).
   */
  validateForPayment(params: {
    entity_id: number;
    lottery_id: number;
    set_id?: number;
    desde?: number;
    hasta?: number;
    referencia?: string;
  }): Observable<{ success: boolean; participations?: any[]; message?: string }> {
    return this.http.post<{ success: boolean; participations?: any[]; message?: string }>(
      `${this.base}/validate-for-payment`,
      params
    );
  }

  /**
   * Registrar pago: marca participaciones como pagadas y registra en historial.
   */
  registerPayment(participationIds: number[]): Observable<{ success: boolean; message?: string; count?: number }> {
    return this.http.post<{ success: boolean; message?: string; count?: number }>(
      `${this.base}/register-payment`,
      { participation_ids: participationIds }
    );
  }
}
