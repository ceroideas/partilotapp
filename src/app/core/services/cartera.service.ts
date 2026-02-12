import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CarteraService {
  private apiUrl = environment.apiUrl;
  private participacionesChanged$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  /** Observable para notificar cambios en las participaciones */
  getParticipacionesChanged(): Observable<void> {
    return this.participacionesChanged$.asObservable();
  }

  /** Notificar que las participaciones han cambiado */
  notifyParticipacionesChanged(): void {
    this.participacionesChanged$.next();
  }

  /** Listar participaciones de la cartera del usuario */
  getParticipations(): Observable<{ success: boolean; participations: any[] }> {
    return this.http.get<{ success: boolean; participations: any[] }>(`${this.apiUrl}/wallet/participations`);
  }

  /** Consultar participación por referencia (antes de vincular) */
  checkByReference(referencia: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/wallet/participations/check`, {
      params: { referencia }
    });
  }

  /** Vincular participación a la cartera */
  linkToWallet(referencia: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/wallet/participations/link`, { referencia });
  }

  /** Regalar participación a otro usuario por email */
  gift(participationId: number, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/wallet/participations/gift`, {
      participation_id: participationId,
      email
    });
  }

  /** Historial del usuario: digitalizaciones, regalos (cobros pendiente) */
  getHistorial(): Observable<{ success: boolean; historial: any[] }> {
    return this.http.get<{ success: boolean; historial: any[] }>(`${this.apiUrl}/wallet/historial`);
  }

  /** Participaciones cobrables (con premio, no regaladas, no cobradas) */
  getCobrables(): Observable<{ success: boolean; participations: any[] }> {
    return this.http.get<{ success: boolean; participations: any[] }>(`${this.apiUrl}/wallet/participations/cobrables`);
  }

  /** Registrar cobro (nombre, apellidos, nif, iban, participation_ids, importe_total) */
  registrarCobro(data: {
    participation_ids: number[];
    nombre: string;
    apellidos: string;
    nif: string;
    iban: string;
    importe_total: number;
  }): Observable<{ success: boolean; message?: string; collected_count?: number }> {
    return this.http.post<{ success: boolean; message?: string; collected_count?: number }>(`${this.apiUrl}/wallet/cobro`, data);
  }
}
