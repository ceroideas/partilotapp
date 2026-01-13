import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
  standalone: false,
})
export class NotificacionesPage implements OnInit {

  notificaciones: any[] = [];
  notificacionesFiltradas: any[] = [];
  filtroEstado: string = 'todas';
  notificacionesNoLeidas: number = 0;

  constructor(
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.cargarNotificaciones();
  }

  ionViewWillEnter() {
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    try {
      const notificacionesGuardadas = JSON.parse(localStorage.getItem('notificaciones') || '[]');
      
      if (notificacionesGuardadas.length > 0) {
        this.notificaciones = notificacionesGuardadas;
      } else {
        // Datos de ejemplo para desarrollo
        this.notificaciones = [
          {
            id: 1,
            tipo: 'ganador',
            titulo: '¡Felicidades! Has ganado',
            mensaje: 'Has acertado 3 números en el sorteo del 15/01/2024',
            fecha: new Date('2024-01-15T20:30:00'),
            leida: false,
            detalle: 'Participación #12345 - Premio de €150.00'
          },
          {
            id: 2,
            tipo: 'cobro',
            titulo: 'Cobro disponible',
            mensaje: 'Tienes un cobro pendiente de €150.00',
            fecha: new Date('2024-01-16T09:15:00'),
            leida: false,
            detalle: 'Puedes cobrar tu premio desde la sección de cobros'
          },
          {
            id: 3,
            tipo: 'sorteo',
            titulo: 'Nuevo sorteo disponible',
            mensaje: 'El sorteo de hoy está abierto para participar',
            fecha: new Date('2024-01-17T08:00:00'),
            leida: true,
            detalle: 'Participa en el sorteo de las 19:00'
          },
          {
            id: 4,
            tipo: 'regalo',
            titulo: 'Has recibido un regalo',
            mensaje: 'Juan Pérez te ha regalado una participación',
            fecha: new Date('2024-01-17T12:30:00'),
            leida: true,
            detalle: 'Participación #12346 disponible en tu cartera'
          }
        ];
        localStorage.setItem('notificaciones', JSON.stringify(this.notificaciones));
      }

      this.calcularNoLeidas();
      this.filtrarNotificaciones();
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      this.notificaciones = [];
    }
  }

  calcularNoLeidas() {
    this.notificacionesNoLeidas = this.notificaciones.filter(n => !n.leida).length;
  }

  filtrarNotificaciones() {
    if (this.filtroEstado === 'todas') {
      this.notificacionesFiltradas = this.notificaciones;
    } else if (this.filtroEstado === 'no-leidas') {
      this.notificacionesFiltradas = this.notificaciones.filter(n => !n.leida);
    } else {
      this.notificacionesFiltradas = this.notificaciones.filter(n => n.leida);
    }
    
    // Ordenar por fecha (más recientes primero)
    this.notificacionesFiltradas.sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  verDetalle(notificacion: any) {
    // Marcar como leída
    if (!notificacion.leida) {
      notificacion.leida = true;
      const index = this.notificaciones.findIndex(n => n.id === notificacion.id);
      if (index !== -1) {
        this.notificaciones[index] = notificacion;
        localStorage.setItem('notificaciones', JSON.stringify(this.notificaciones));
        this.calcularNoLeidas();
        this.filtrarNotificaciones();
      }
    }

    // Navegar al detalle
    this.router.navigate(['/notificacion-detalle'], {
      queryParams: { id: notificacion.id }
    });
  }

  async marcarTodasComoLeidas() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Marcar todas las notificaciones como leídas?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Marcar',
          handler: () => {
            this.notificaciones.forEach(n => n.leida = true);
            localStorage.setItem('notificaciones', JSON.stringify(this.notificaciones));
            this.calcularNoLeidas();
            this.filtrarNotificaciones();
          }
        }
      ]
    });
    await alert.present();
  }

}
