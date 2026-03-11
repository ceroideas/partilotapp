import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DevolutionsService {
  private apiUrl = environment.apiUrl;
  /** Rutas bajo /api/management/devolutions (Laravel) */
  private base = `${this.apiUrl}/management/devolutions`;

  constructor(private http: HttpClient) {}

  getEntities(): Observable<{ success: boolean; entities: any[] }> {
    return this.http.get<{ success: boolean; entities: any[] }>(`${this.base}/entities`);
  }

  getLotteriesByEntity(entityId: number): Observable<{ success: boolean; lotteries: any[] }> {
    return this.http.get<{ success: boolean; lotteries: any[] }>(`${this.base}/lotteries`, {
      params: { entity_id: entityId.toString() }
    });
  }

  getReservesByEntityAndLottery(entityId: number, lotteryId: number): Observable<{ success: boolean; reserves: any[] }> {
    return this.http.get<{ success: boolean; reserves: any[] }>(`${this.base}/reserves-by-entity`, {
      params: { entity_id: entityId.toString(), lottery_id: lotteryId.toString() }
    });
  }

  getAvailableRangesForReserve(reserveId: number, sellerId?: number): Observable<{ success: boolean; available_ranges: number[][] }> {
    let params: { reserve_id: string; seller_id?: string } = { reserve_id: reserveId.toString() };
    if (sellerId != null) params.seller_id = sellerId.toString();
    return this.http.get<{ success: boolean; available_ranges: number[][] }>(
      `${this.base}/available-ranges-reserve`,
      { params: params as any }
    );
  }

  getSellersByEntity(entityId: number): Observable<{ success: boolean; sellers: any[] }> {
    return this.http.get<{ success: boolean; sellers: any[] }>(`${this.base}/sellers`, {
      params: { entity_id: entityId.toString() }
    });
  }

  getSetsByEntityAndLottery(entityId: number, lotteryId: number): Observable<{ success: boolean; sets: any[] }> {
    return this.http.get<{ success: boolean; sets: any[] }>(`${this.base}/sets-by-entity`, {
      params: { entity_id: entityId.toString(), lottery_id: lotteryId.toString() }
    });
  }

  validateParticipations(params: {
    entity_id: number;
    lottery_id: number;
    set_id?: number;
    reserve_id?: number;
    desde?: number;
    hasta?: number;
    participation_id?: number;
    referencia?: string;
    seller_id?: number;
  }): Observable<{ success: boolean; participations?: any[]; message?: string }> {
    return this.http.post<{ success: boolean; participations?: any[]; message?: string }>(
      `${this.base}/validate`,
      params
    );
  }

  getLiquidationSummary(params: {
    entity_id: number;
    lottery_id: number;
    set_id?: number;
    reserve_id?: number;
    participations?: number[];
    seller_id?: number;
    tipo_devolucion?: string;
  }): Observable<{ success: boolean; summary?: any }> {
    let httpParams = new HttpParams()
      .set('entity_id', params.entity_id.toString())
      .set('lottery_id', params.lottery_id.toString());
    if (params.set_id != null) {
      httpParams = httpParams.set('set_id', params.set_id.toString());
    }
    if (params.reserve_id != null) {
      httpParams = httpParams.set('reserve_id', params.reserve_id.toString());
    }
    if (params.participations && params.participations.length > 0) {
      params.participations.forEach(id => {
        httpParams = httpParams.append('participations[]', id.toString());
      });
    }
    if (params.seller_id != null) {
      httpParams = httpParams.set('seller_id', params.seller_id.toString());
    }
    if (params.tipo_devolucion) {
      httpParams = httpParams.set('tipo_devolucion', params.tipo_devolucion);
    }
    return this.http.get<{ success: boolean; summary?: any }>(`${this.base}/liquidation-summary`, {
      params: httpParams
    });
  }

  storeDevolution(body: {
    entity_id: number;
    lottery_id: number;
    set_id?: number | null;
    return_reason?: string;
    seller_id?: number;
    tipo_devolucion?: string;
    liquidacion: {
      devolver: number[];
      vender: number[];
      pagos?: Array<{ payment_method: string; amount: number }>;
    };
  }): Observable<{ success: boolean; devolution_id?: number; message?: string }> {
    return this.http.post<{ success: boolean; devolution_id?: number; message?: string }>(
      `${this.base}`,
      body
    );
  }
}
