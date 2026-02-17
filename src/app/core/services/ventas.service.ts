import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getReserves(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/me/reserves`);
  }

  validateSale(setId: number, desde: number, hasta: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/sellers/me/validate-sale`, {
      set_id: setId,
      desde,
      hasta
    });
  }

  sellManual(setId: number, desde: number, hasta: number, paymentMethod?: string | null): Observable<any> {
    const body: any = { set_id: setId, desde, hasta };
    if (paymentMethod) {
      body.payment_method = paymentMethod;
    }
    return this.http.post(`${this.apiUrl}/sales/manual`, body);
  }

  sellByQr(referencia: string, desde?: number, hasta?: number, paymentMethod?: string | null): Observable<any> {
    const body: any = { referencia };
    if (desde !== undefined && hasta !== undefined) {
      body.desde = desde;
      body.hasta = hasta;
    }
    if (paymentMethod) {
      body.payment_method = paymentMethod;
    }
    return this.http.post(`${this.apiUrl}/sales/qr`, body);
  }

  getMyEntities(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/me/entities`);
  }

  getMyLotteries(entityId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/me/lotteries?entity_id=${entityId}`);
  }

  getMyTacos(entityId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/me/tacos?entity_id=${entityId}`);
  }

  getTacoParticipations(setId: number, bookNumber: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/me/tacos/${setId}/${bookNumber}/participations`);
  }

  /**
   * Resolver QR del taco (portada): devuelve rangos disponibles para el vendedor.
   * Solo vendedores. GET /api/sellers/me/taco-by-qr?taco_ref=...
   */
  getTacoByQr(tacoRef: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/me/taco-by-qr`, {
      params: { taco_ref: tacoRef }
    });
  }

  /**
   * Obtener historial de ventas del vendedor autenticado desde la API Partilot.
   */
  getHistorial(): Observable<{ success: boolean; historial: any[] }> {
    return this.http.get<{ success: boolean; historial: any[] }>(`${this.apiUrl}/sales/me`);
  }

  /**
   * Digitalizar participación escaneando QR
   */
  digitalizeParticipation(referencia: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/participations/digitalize`, { referencia });
  }
}
