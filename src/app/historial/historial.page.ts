import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: false,
})
export class HistorialPage implements OnInit {

  historial: any[] = [];
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'usuario';

  constructor(private router: Router) { }

  ngOnInit() {
    this.detectarRol();
    this.loadHistorial();
  }

  ionViewWillEnter() {
    this.detectarRol();
    this.loadHistorial();
  }

  detectarRol() {
    const rolGuardado = localStorage.getItem('rolActual');
    const esVendedorStr = localStorage.getItem('esVendedor');
    
    if (rolGuardado) {
      this.rolActual = rolGuardado as 'usuario' | 'vendedor' | 'gestor';
    } else if (esVendedorStr === 'true') {
      this.rolActual = 'vendedor';
    } else {
      // Detectar desde la ruta
      const ruta = window.location.pathname;
      if (ruta.includes('/vendedor-tab') || ruta.includes('/venta') || ruta.includes('/gestor-participaciones')) {
        this.rolActual = 'vendedor';
      } else {
        this.rolActual = 'usuario';
      }
    }
  }

  cambiarRol(rol: 'usuario' | 'vendedor' | 'gestor') {
    this.rolActual = rol;
    localStorage.setItem('rolActual', rol);
    
    if (rol === 'vendedor') {
      localStorage.setItem('esVendedor', 'true');
      // Siempre navegar a la home de vendedor dentro de tabs
      this.router.navigate(['/tabs/vendedor-tab3']);
    } else if (rol === 'usuario') {
      localStorage.setItem('esVendedor', 'false');
      // Siempre navegar a la home de usuario
      this.router.navigate(['/tabs/tab3']);
    } else if (rol === 'gestor') {
      localStorage.setItem('esVendedor', 'false');
      // Siempre navegar a la home de gestor dentro de tabs
      this.router.navigate(['/tabs/gestor-tab3']);
    }
  }

  loadHistorial() {
    try {
      // Cargar historial desde localStorage
      const historialGuardado = JSON.parse(localStorage.getItem('historial') || '[]');
      
      if (historialGuardado.length > 0) {
        this.historial = historialGuardado.sort((a: any, b: any) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
      } else {
        // Datos de ejemplo basados en el diseño
        this.historial = [
          {
            id: 1,
            tipo: 'digitalizacion',
            fecha: new Date('2025-11-10').toISOString(),
            participacion: {
              entidad: 'CSIF-Rioja',
              numero: '40083',
              fechaSorteo: '22/12/25',
              importeJugado: 5.00,
              donativo: 1.00,
              importeTotal: 6.00,
              numeroParticipacion: '1/0001',
              numeroReferencia: '0000000000000000000',
              imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            },
            descripcion: 'Participación digitalizada'
          },
          {
            id: 2,
            tipo: 'regalo',
            fecha: new Date('2025-11-09').toISOString(),
            participacion: {
              entidad: 'CSIF-Rioja',
              numero: '40083',
              fechaSorteo: '22/12/25',
              importeJugado: 5.00,
              donativo: 1.00,
              importeTotal: 6.00,
              imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            },
            emailDestinatario: 'jorgeruizortega@example.es',
            descripcion: 'Participación regalada'
          },
          {
            id: 3,
            tipo: 'recibido-regalo',
            fecha: new Date('2025-11-08').toISOString(),
            participacion: {
              entidad: 'CSIF-Rioja',
              numero: '40083',
              fechaSorteo: '22/12/25',
              importeTotal: 6.00
            },
            emailRemitente: 'amigo@example.es',
            descripcion: 'Regalo recibido'
          },
          {
            id: 4,
            tipo: 'cobro',
            fecha: new Date('2025-11-07').toISOString(),
            importeTotal: 25.00,
            participaciones: [
              {
                entidad: 'CSIF-Rioja',
                numero: '40083',
                importeTotal: 25.00
              }
            ],
            descripcion: 'Cobro de participaciones'
          },
          {
            id: 5,
            tipo: 'donacion',
            fecha: new Date('2025-11-06').toISOString(),
            importeDonacion: 25.00,
            descripcion: 'Donación realizada'
          },
          {
            id: 6,
            tipo: 'codigo-recarga',
            fecha: new Date('2025-11-05').toISOString(),
            codigoRecarga: 'BA0858695',
            importeCodigo: 25.00,
            participacion: {
              entidad: 'CSIF-Rioja',
              numero: '40083',
              fechaSorteo: '22/12/25',
              importeJugado: 5.00,
              donativo: 1.00,
              importeTotal: 6.00,
              imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            },
            descripcion: 'Código de recarga generado'
          }
        ];
        localStorage.setItem('historial', JSON.stringify(this.historial));
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      this.historial = [];
    }
  }

  getIconoTipo(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'digitalizacion': 'qr-code-outline',
      'regalo': 'arrow-down-outline',
      'recibido-regalo': 'gift-outline',
      'cobro': 'camera-outline',
      'donacion': 'heart-outline',
      'codigo-recarga': 'document-text-outline'
    };
    return iconos[tipo] || 'document-outline';
  }

  getTituloTipo(tipo: string): string {
    const titulos: { [key: string]: string } = {
      'digitalizacion': 'Digitalización',
      'regalo': 'Envio Regalo',
      'recibido-regalo': 'Recibido Regalo',
      'cobro': 'Cobro',
      'donacion': 'Donacion',
      'codigo-recarga': 'Código de Recarga'
    };
    return titulos[tipo] || 'Acción';
  }

  getColorTipo(tipo: string): string {
    const colores: { [key: string]: string } = {
      'digitalizacion': '#0D6EFD',
      'regalo': '#F49200',
      'cobro': '#28a745',
      'donacion': '#DC3545',
      'codigo': '#6c757d'
    };
    return colores[tipo] || '#6c757d';
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    // Comparar solo fecha (sin hora)
    const fechaDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const hoyDate = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const ayerDate = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate());

    if (fechaDate.getTime() === hoyDate.getTime()) {
      return 'Hoy';
    } else if (fechaDate.getTime() === ayerDate.getTime()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  }

}
