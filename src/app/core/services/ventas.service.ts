import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = environment.apiUrl;
  private ventasChanged$ = new Subject<void>();

  /** Emitir cuando hay ventas/participaciones que requieren recargar pantallas */
  notifyVentasChanged(): void {
    this.ventasChanged$.next();
  }

  /** Observable para suscribirse y recargar participaciones e historial */
  getVentasChanged(): Observable<void> {
    return this.ventasChanged$.asObservable();
  }

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

  /**
   * Verificar si un usuario existe por email (para venta digital)
   */
  checkUserExists(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/check-exists`, { email });
  }

  /**
   * Vender participaciones digitales a un usuario existente
   */
  sellDigital(setId: number, quantity: number, buyerEmail: string, paymentMethod?: string | null): Observable<any> {
    const body: any = { set_id: setId, quantity, buyer_email: buyerEmail };
    if (paymentMethod) {
      body.payment_method = paymentMethod;
    }
    return this.http.post(`${this.apiUrl}/sales/digital`, body);
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

  /** Gestor: entidades que gestiona (tabla managers) */
  getManagerEntities(): Observable<any> {
    return this.http.get(`${this.apiUrl}/managers/me/entities`);
  }

  /** Gestor: vendedores de una entidad (listado con participaciones y monto por liquidar) */
  getManagerEntitySellers(entityId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/managers/me/entities/${entityId}/sellers`);
  }

  /** Gestor: detalle de un vendedor (participaciones + liquidación + lotteries_with_pending) */
  getManagerSellerDetail(entityId: number, sellerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/managers/me/entities/${entityId}/sellers/${sellerId}/detail`);
  }

  /** Gestor: registrar liquidación de un vendedor (solo seller_settlements) */
  storeManagerSettlement(
    entityId: number,
    sellerId: number,
    data: { lottery_id: number; pagos: Array<{ payment_method: string; amount: number }> }
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/managers/me/entities/${entityId}/sellers/${sellerId}/settlement`,
      data
    );
  }

  /** Gestor: tacos de una entidad (con seller_id y seller_name en cada taco) */
  getManagerTacos(entityId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/managers/me/tacos`, { params: { entity_id: entityId } });
  }

  /** Gestor: participaciones de un taco (set + book + seller) */
  getManagerTacoParticipations(setId: number, bookNumber: number, sellerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/managers/me/tacos/${setId}/${bookNumber}/participations`, {
      params: { seller_id: sellerId }
    });
  }

  /** Gestor: comprobar si existe usuario por email (flujo Añadir Vendedor SIPART) */
  checkManagerUserEmail(email: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${this.apiUrl}/managers/me/check-user-email`, { email });
  }

  /** Gestor: añadir vendedor PARTILOT (usuario existente) */
  storeManagerExistingUser(entityId: number, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/managers/me/store-existing-user`, { entity_id: entityId, email });
  }

  /** Gestor: invitar vendedor (0 coincidencias) */
  storeManagerNewUser(entityId: number, email: string, name?: string, last_name?: string): Observable<any> {
    const body: any = { entity_id: entityId, email };
    if (name != null) body.name = name;
    if (last_name != null) body.last_name = last_name;
    return this.http.post(`${this.apiUrl}/managers/me/store-new-user`, body);
  }

  /** Gestor: crear vendedor externo (formulario completo) */
  storeManagerExternalSeller(entityId: number, data: {
    name?: string; last_name?: string; last_name2?: string;
    email: string; phone?: string; birthday?: string; nif_cif?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/managers/me/store-external-seller`, { entity_id: entityId, ...data });
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
