import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LotteryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Obtener resultados de lotería con filtros */
  getResults(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/lottery/results`).pipe(
      map((results: any[]) => {
        // Filtrar solo los que tienen resultados (tienen datos en result)
        const conResultados = results.filter((lottery: any) => {
          // Verificar si tiene resultados
          return lottery.result && lottery.result !== null;
        });

        // Filtrar por máximo 6 meses de antigüedad
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

        const filtradosPorFecha = conResultados.filter((lottery: any) => {
          if (!lottery.draw_date) return false;
          const fechaSorteo = new Date(lottery.draw_date);
          return fechaSorteo >= seisMesesAtras;
        });

        // Ordenar del más reciente al más antiguo
        filtradosPorFecha.sort((a: any, b: any) => {
          const fechaA = new Date(a.draw_date).getTime();
          const fechaB = new Date(b.draw_date).getTime();
          return fechaB - fechaA; // Más reciente primero
        });

        return filtradosPorFecha;
      })
    );
  }
}
