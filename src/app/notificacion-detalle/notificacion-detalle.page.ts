import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-notificacion-detalle',
  templateUrl: './notificacion-detalle.page.html',
  styleUrls: ['./notificacion-detalle.page.scss'],
  standalone: false,
})
export class NotificacionDetallePage implements OnInit {

  notificacion: any = null;
  notificacionId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.notificacionId = params['id'] ? parseInt(params['id']) : null;
      this.cargarNotificacion();
    });
  }

  cargarNotificacion() {
    if (!this.notificacionId) {
      this.router.navigate(['/notificaciones']);
      return;
    }

    try {
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones') || '[]');
      this.notificacion = notificaciones.find((n: any) => n.id === this.notificacionId);
      
      if (!this.notificacion) {
        this.router.navigate(['/notificaciones']);
        return;
      }

      // Marcar como leída
      if (!this.notificacion.leida) {
        this.notificacion.leida = true;
        const index = notificaciones.findIndex((n: any) => n.id === this.notificacionId);
        if (index !== -1) {
          notificaciones[index] = this.notificacion;
          localStorage.setItem('notificaciones', JSON.stringify(notificaciones));
        }
      }
    } catch (error) {
      console.error('Error cargando notificación:', error);
      this.router.navigate(['/notificaciones']);
    }
  }

  mostrarAcciones(): boolean {
    return this.notificacion && ['cobro', 'ganador', 'regalo', 'sorteo'].includes(this.notificacion.tipo);
  }

  irACobros() {
    this.router.navigate(['/cobro-participaciones']);
  }

  irAResultados() {
    this.router.navigate(['/resultados']);
  }

  irACartera() {
    this.router.navigate(['/cartera']);
  }

  irASorteo() {
    this.router.navigate(['/feed']);
  }

}
