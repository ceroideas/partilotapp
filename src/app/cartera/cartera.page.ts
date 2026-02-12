import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CarteraService } from '../core/services/cartera.service';
import { AuthService } from '../core/services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cartera',
  templateUrl: './cartera.page.html',
  styleUrls: ['./cartera.page.scss'],
  standalone: false,
})
export class CarteraPage implements OnInit, OnDestroy {

  participaciones: any[] = [];
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'usuario';
  participacionExpandidaId: number | null = null;
  loading = false;
  participacionParaRegalar: any = null;
  emailDestinatario = '';
  mostrarModalExito = false;
  mensajeExitoRegalo = '';
  emailRegaladoA = '';
  private participacionesChangedSubscription?: Subscription;

  constructor(
    private router: Router,
    private carteraService: CarteraService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.detectarRol();
    this.loadParticipaciones();
    
    // Suscribirse a cambios en las participaciones
    this.participacionesChangedSubscription = this.carteraService.getParticipacionesChanged().subscribe(() => {
      this.loadParticipaciones();
    });
  }

  ngOnDestroy() {
    // Limpiar suscripción al destruir el componente
    if (this.participacionesChangedSubscription) {
      this.participacionesChangedSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
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
      this.router.navigate(['/tabs/vendedor-tab3']);
    } else if (rol === 'usuario') {
      localStorage.setItem('esVendedor', 'false');
      this.router.navigate(['/tabs/tab3']);
    } else if (rol === 'gestor') {
      localStorage.setItem('esVendedor', 'false');
      this.router.navigate(['/tabs/gestor-tab3']);
    }
  }

  loadParticipaciones() {
    if (!this.authService.isLoggedIn() || this.authService.isSeller()) {
      this.participaciones = [];
      return;
    }
    this.loading = true;
    this.carteraService.getParticipations().subscribe({
      next: (res) => {
        this.loading = false;
        this.participaciones = (res.participations || []).map((p: any) => ({ ...p, estado: p.estado || 'activa' }));
      },
      error: () => {
        this.loading = false;
        this.participaciones = [];
      }
    });
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    if (path.startsWith('storage/')) return `${base}/${path}`;
    return `${base}/storage/${path}`;
  }

  agregarParticipacion() {
    this.router.navigate(['/digitalizar-participacion']);
  }

  irACobrarGestionar() {
    this.router.navigate(['/cobrar-gestionar']);
  }

  toggleDetalle(participacion: any) {
    const id = participacion.id;
    this.participacionExpandidaId = this.participacionExpandidaId === id ? null : id;
  }

  estaExpandida(participacion: any): boolean {
    return this.participacionExpandidaId === participacion.id;
  }

  getEstadoTexto(estado: string): string {
    const map: { [key: string]: string } = {
      cobrada: 'Pagada',
      donada: 'Donada',
      caducada: 'Caducada',
      regalada: 'Regalada',
      recibida: 'Recibida',
      activa: ''
    };
    return map[estado] || '';
  }

  puedeRegalar(participacion: any): boolean {
    if (!participacion) return false;
    const e = participacion.estado || 'activa';
    if (e === 'cobrada' || e === 'caducada' || e === 'regalada') return false;
    if (participacion.received_from_email) return false;
    return true;
  }

  abrirModalRegalo(participacion: any, event: Event) {
    event?.stopPropagation();
    this.participacionParaRegalar = participacion;
    this.emailDestinatario = '';
  }

  cerrarModalRegalo() {
    this.participacionParaRegalar = null;
    this.emailDestinatario = '';
  }

  enviarRegalo() {
    if (!this.participacionParaRegalar || !this.emailDestinatario.trim()) return;
    const email = this.emailDestinatario.trim();
    this.carteraService.gift(this.participacionParaRegalar.id, email).subscribe({
      next: (res: any) => {
        this.cerrarModalRegalo();
        this.mensajeExitoRegalo = `La participación perteneciente a ${this.participacionParaRegalar?.entidad || 'la entidad'} ha sido enviada correctamente a ${res.gifted_to_email || email}.`;
        this.emailRegaladoA = res.gifted_to_email || email;
        this.mostrarModalExito = true;
        this.loadParticipaciones();
      },
      error: async (err) => {
        const msg = err.error?.message || 'No se pudo enviar el regalo.';
        const alert = await this.alertController.create({ header: 'Error', message: msg, buttons: ['OK'] });
        await alert.present();
      }
    });
  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
    this.mensajeExitoRegalo = '';
    this.emailRegaladoA = '';
  }

  manejarErrorImagen(event: any) {
    if (event?.target) {
      event.target.style.display = 'none';
      const parent = event.target.closest('.participacion-image');
      if (parent) parent.classList.add('image-error');
    }
  }
}
