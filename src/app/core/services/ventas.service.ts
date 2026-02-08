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
}
