import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VentasService } from '../core/services/ventas.service';
import { CarteraService } from '../core/services/cartera.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: false,
})
export class HistorialPage implements OnInit {

  historial: any[] = [];
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'usuario';
  loadingHistorial = false;
  errorHistorial: string | null = null;
  itemExpandido: string | number | null = null; // ID del item expandido (string para API: 'd-1', 'r-1')

  constructor(
    private router: Router,
    private ventasService: VentasService,
    private carteraService: CarteraService
  ) { }

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

  /** Para usuario: solo digitalizaciones, regalos, cobros y donaciones. Para vendedor/gestor: todo el historial. */
  get historialParaLista(): any[] {
    if (this.rolActual === 'usuario') {
      return this.historial.filter((i: any) =>
        ['digitalizacion', 'regalo', 'recibido-regalo', 'cobro', 'donacion'].includes(i.tipo)
      );
    }
    return this.historial;
  }

  loadHistorial() {
    this.errorHistorial = null;

    // Como vendedor: cargar historial desde la API Partilot
    if (this.rolActual === 'vendedor') {
      this.loadingHistorial = true;
      this.ventasService.getHistorial().subscribe({
        next: (res) => {
          this.loadingHistorial = false;
          if (res.success && Array.isArray(res.historial)) {
            this.historial = res.historial.sort((a: any, b: any) =>
              new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            return;
          }
          this.cargarHistorialDesdeLocalStorage();
        },
        error: () => {
          this.loadingHistorial = false;
          this.errorHistorial = 'No se pudo cargar el historial. Comprueba la conexión.';
          this.cargarHistorialDesdeLocalStorage();
        }
      });
      return;
    }

    // Como usuario: cargar historial desde API (digitalizaciones, regalos; cobros pendiente)
    if (this.rolActual === 'usuario') {
      this.loadingHistorial = true;
      this.carteraService.getHistorial().subscribe({
        next: (res) => {
          this.loadingHistorial = false;
          if (res.success && Array.isArray(res.historial)) {
            this.historial = res.historial.sort((a: any, b: any) =>
              new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            return;
          }
          this.cargarHistorialDesdeLocalStorage();
        },
        error: () => {
          this.loadingHistorial = false;
          this.errorHistorial = 'No se pudo cargar el historial. Comprueba la conexión.';
          this.cargarHistorialDesdeLocalStorage();
        }
      });
      return;
    }

    // Gestor: solo localStorage
    this.cargarHistorialDesdeLocalStorage();
  }

  private cargarHistorialDesdeLocalStorage() {
    try {
      const historialGuardado = JSON.parse(localStorage.getItem('historial') || '[]');
      
      if (historialGuardado.length > 0) {
        this.historial = historialGuardado.sort((a: any, b: any) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
      } else {
        // Datos de ejemplo basados en el diseño
        this.historial = [
          {
            id: 0,
            tipo: 'venta',
            fecha: new Date('2025-09-02T16:45:00').toISOString(),
            formaPago: 'efectivo',
            descripcion: 'Participación CSIF-Rioja',
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
            }
          },
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
      'venta': 'receipt-outline',
      'venta-digital': 'phone-portrait-outline',
      'digitalizacion': 'qr-code-outline',
      'regalo': 'arrow-down-outline',
      'recibido-regalo': 'gift-outline',
      'cobro': 'camera-outline',
      'donacion': 'heart-outline',
      'codigo-recarga': 'document-text-outline',
      'codigo': 'document-text-outline'
    };
    return iconos[tipo] || 'document-outline';
  }

  getTituloTipo(tipo: string): string {
    const titulos: { [key: string]: string } = {
      'venta': 'Venta',
      'venta-digital': 'Venta Digital',
      'digitalizacion': 'Digitalización',
      'regalo': 'Envio Regalo',
      'recibido-regalo': 'Recibido Regalo',
      'cobro': 'Cobro',
      'donacion': 'Donacion',
      'codigo-recarga': 'Código de Recarga',
      'codigo': 'Código de Recarga'
    };
    return titulos[tipo] || 'Acción';
  }

  getColorTipo(tipo: string): string {
    const colores: { [key: string]: string } = {
      'venta': '#28a745',
      'venta-digital': '#0D6EFD',
      'digitalizacion': '#0D6EFD',
      'regalo': '#F49200',
      'cobro': '#28a745',
      'donacion': '#DC3545',
      'codigo': '#6c757d',
      'codigo-recarga': '#6c757d'
    };
    return colores[tipo] || '#6c757d';
  }

  /** Descripción para la lista: ej. "Participación CSIF-Rioja" */
  getDescripcion(item: any): string {
    if (item.descripcion) return item.descripcion;
    const entidad = item.participacion?.entidad || item.entidad;
    if (entidad) return `Participación ${entidad}`;
    return 'Participación';
  }

  /** Fecha y hora para la cabecera del listado: "02/09/25 - 16:45h" */
  formatearFechayHora(fecha: string): string {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear().toString().slice(-2);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} - ${h}:${m}h`;
  }

  getFormaPagoTexto(forma: string | null | undefined): string {
    if (!forma || forma === 'null' || forma === 'undefined') return 'Efectivo';
    const map: { [key: string]: string } = {
      'efectivo': 'Efectivo',
      'bizum': 'Bizum',
      'transferencia': 'Transferencia',
      'omitir': 'Omitir'
    };
    return map[forma.toLowerCase()] || forma;
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

  /** Icono específico para ventas en el diseño de vendedor */
  getIconoVenta(tipo: string): string {
    if (tipo === 'venta-digital') {
      return 'phone-portrait-outline';
    }
    return 'receipt-outline'; // ticket para venta normal
  }

  /** Título específico para ventas en el diseño de vendedor */
  getTituloVenta(tipo: string): string {
    if (tipo === 'venta-digital') {
      return 'Venta Digital';
    }
    return 'Venta';
  }

  /** Toggle del detalle expandido */
  toggleDetalleVenta(item: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.itemExpandido === item.id) {
      this.itemExpandido = null;
    } else {
      this.itemExpandido = item.id;
    }
  }

  /** Verificar si un item está expandido */
  estaExpandido(item: any): boolean {
    return this.itemExpandido === item.id;
  }

  /** Manejar error al cargar imagen */
  onImageError(event: any) {
    event.target.src = '/assets/participacion.png';
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return '';
    // Si ya es una URL completa, retornarla tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Si es una imagen base64, retornarla tal cual
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
    // Construir URL completa desde la API base (sin /api)
    const apiBaseUrl = environment.apiUrl.replace('/api', '');
    return `${apiBaseUrl}/uploads/${imagePath}`;
  }

  /** URL de imagen de una participación (API devuelve snapshot_path, mock puede usar imagen/snapshotPath) */
  getParticipacionImageUrl(participacion: any): string {
    if (!participacion) return '';
    const path = participacion.snapshot_path ?? participacion.snapshotPath ?? participacion.imagen;
    return path ? (path.startsWith('http') || path.startsWith('data:') ? path : this.getImageUrl(path)) : '';
  }

}
