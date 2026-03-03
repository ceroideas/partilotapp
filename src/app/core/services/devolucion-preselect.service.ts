import { Injectable } from '@angular/core';

/**
 * Guarda entidad y vendedor cuando se navega desde "Devolver" en detalle del vendedor
 * a la pestaña Devoluciones, para no depender del router state (que se pierde al cambiar de tab).
 */
@Injectable({ providedIn: 'root' })
export class DevolucionPreselectService {
  private entity: any = null;
  private sellerId: number | null = null;
  private seller: any = null;

  setFromDetail(entity: any, seller: { id: number; [key: string]: any }) {
    this.entity = entity;
    this.sellerId = seller?.id ?? null;
    this.seller = seller;
  }

  getAndClear(): { entity: any; sellerId: number; seller: any } | null {
    if (!this.entity || this.sellerId == null) return null;
    const data = { entity: this.entity, sellerId: this.sellerId, seller: this.seller };
    this.entity = null;
    this.sellerId = null;
    this.seller = null;
    return data;
  }
}
