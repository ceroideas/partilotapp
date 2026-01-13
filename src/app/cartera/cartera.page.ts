import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cartera',
  templateUrl: './cartera.page.html',
  styleUrls: ['./cartera.page.scss'],
  standalone: false,
})
export class CarteraPage implements OnInit {

  participaciones: any[] = [];
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'usuario';

  constructor(private router: Router) { }

  ngOnInit() {
    this.detectarRol();
    this.loadParticipaciones();
  }

  ionViewWillEnter() {
    // Recargar participaciones cuando se entre a la vista
    this.detectarRol();
    this.loadParticipaciones();
  }

  detectarRol() {
    const rolGuardado = localStorage.getItem('rolActual');
    const esVendedorStr = localStorage.getItem('esVendedor');
    
    if (rolGuardado) {
      this.rolActual = rolGuardado as 'usuario' | 'vendedor' | 'gestor';
    } else if (esVendedorStr === 'true') {
      this.rolActual = 'vendedor';
    } else {
      this.rolActual = 'usuario';
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

  loadParticipaciones() {
    try {
      // Cargar participaciones del localStorage
      const participacionesGuardadas = JSON.parse(localStorage.getItem('participaciones') || '[]');
      
      if (participacionesGuardadas.length > 0) {
        this.participaciones = participacionesGuardadas;
      } else {
        // Datos de ejemplo si no hay participaciones guardadas
        this.participaciones = [
          { 
            id: 1, 
            numero: '40083',
            entidad: 'CSIF-Rioja',
            fechaSorteo: '22/12/25',
            importeTotal: 25.00,
            estado: 'activa',
            imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          },
          { 
            id: 2, 
            numero: '60089',
            entidad: 'Peña Rondalosa',
            fechaSorteo: '22/12/25',
            importeTotal: 5.00,
            estado: 'activa',
            imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          },
          {
            id: 3,
            numero: '40083',
            entidad: 'CSIF-Rioja',
            fechaSorteo: '22/12/25',
            importeTotal: 25.00,
            estado: 'cobrada',
            imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          },
          {
            id: 4,
            numero: '46545-93934',
            entidad: 'UGT',
            fechaSorteo: '22/12/25',
            importeTotal: 5.00,
            estado: 'cobrada',
            imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          },
          {
            id: 5,
            numero: '40083',
            entidad: 'CSIF-Rioja',
            fechaSorteo: '22/12/24',
            importeTotal: 5.00,
            estado: 'caducada',
            imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        ];
        localStorage.setItem('participaciones', JSON.stringify(this.participaciones));
      }
    } catch (error) {
      console.error('Error cargando participaciones:', error);
      this.participaciones = [];
    }
  }

  agregarParticipacion() {
    // Navegar a la vista de digitalizar participación
    this.router.navigate(['/digitalizar-participacion']);
  }

  irACobrarGestionar() {
    // Navegar a la vista de cobrar/gestionar
    this.router.navigate(['/cobrar-gestionar']);
  }

  verDetalle(participacion: any) {
    // TODO: Navegar a detalle de participación
    console.log('Ver detalle:', participacion);
  }

  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'cobrada': 'Cobrada',
      'donada': 'Donada',
      'caducada': 'Caducada',
      'activa': ''
    };
    return estados[estado] || '';
  }

  actualizarParticipaciones() {
    this.loadParticipaciones();
  }

  manejarErrorImagen(event: any) {
    // Evitar bucle infinito verificando si ya es el placeholder
    if (event.target.src && !event.target.src.includes('data:image')) {
      // Si falla la imagen, usar un placeholder base64 o simplemente ocultar
      event.target.style.display = 'none';
      event.target.parentElement.classList.add('image-error');
    }
  }

  obtenerImagenSegura(imagen: string | undefined): string {
    // Si la imagen es base64, devolverla directamente
    if (imagen && imagen.startsWith('data:image')) {
      return imagen;
    }
    // Si no hay imagen o no es válida, devolver null para usar el placeholder CSS
    return imagen || '';
  }

}
