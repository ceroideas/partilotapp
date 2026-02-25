import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { VentasService } from '../core/services/ventas.service';
import { AuthService } from '../core/services/auth.service';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-gestor-participaciones',
  templateUrl: './gestor-participaciones.page.html',
  styleUrls: ['./gestor-participaciones.page.scss'],
  standalone: false,
})
export class GestorParticipacionesPage implements OnInit, OnDestroy {
  isVendedor: boolean = false;
  isGestor: boolean = false;
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'vendedor';
  
  // Vista 1: Selección de entidades
  entities: any[] = [];
  selectedEntity: any = null;
  showEntitySelection: boolean = false;
  
  // Vista 2: Lista de tacos
  summary: any = null;
  tacos: any[] = [];
  showTacosList: boolean = false;
  
  // Vista 3: Participaciones del taco
  selectedTaco: any = null;
  tacoParticipations: any[] = [];
  showTacoDetail: boolean = false;

  loading = false;
  private ventasChangedSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ventasService: VentasService,
    public authService: AuthService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.isVendedor = this.authService.isSeller();
    this.detectarRol();
    // Carga solo en ionViewWillEnter para evitar doble carga (mensaje "no hay" duplicado)
    this.ventasChangedSub = this.ventasService.getVentasChanged().subscribe(() => {
      if (this.usaFlujoGestor) this.recargarVistaActualGestor();
      else if (this.usaFlujoVendedor) this.recargarVistaActual();
    });
  }

  ngOnDestroy() {
    this.ventasChangedSub?.unsubscribe();
  }

  /** True si estamos en la pestaña de gestor (usa API managers/me). */
  private get usaFlujoGestor(): boolean {
    const ruta = window.location.pathname;
    return ruta.includes('/gestor-tab') && this.authService.isManager();
  }

  /** True si estamos en la pestaña de vendedor (usa API sellers/me). */
  private get usaFlujoVendedor(): boolean {
    const ruta = window.location.pathname;
    return ruta.includes('/vendedor-tab') && this.authService.isSeller();
  }

  /** Para la plantilla: true si estamos en pestaña gestor (mostrar nombre vendedor, etc.). */
  get enPestanaGestor(): boolean {
    return window.location.pathname.includes('/gestor-tab');
  }

  ionViewWillEnter() {
    this.detectarRol();
    this.isVendedor = this.authService.isSeller();
    this.isGestor = this.authService.isManager();
    if (this.usaFlujoGestor) {
      this.recargarVistaActualGestor();
    } else if (this.usaFlujoVendedor) {
      this.recargarVistaActual();
    }
  }

  /** Recarga la vista actual (entidades, tacos o detalle taco) para reflejar ventas recientes */
  private recargarVistaActual() {
    if (this.showTacoDetail && this.selectedTaco) {
      const setId = this.selectedTaco.set_id ?? this.selectedTaco.setId;
      const bookNumber = this.selectedTaco.book_number ?? this.selectedTaco.bookNumber;
      if (setId != null && bookNumber != null) {
        this.viewTaco({ set_id: setId, book_number: bookNumber });
      }
    } else if (this.showTacosList && this.selectedEntity) {
      this.loadTacos();
    } else {
      this.loadEntities();
    }
  }

  /** Recarga la vista actual para gestor (entidades, tacos con vendedor o detalle taco) */
  private recargarVistaActualGestor() {
    if (this.showTacoDetail && this.selectedTaco) {
      const setId = this.selectedTaco.set_id ?? this.selectedTaco.setId;
      const bookNumber = this.selectedTaco.book_number ?? this.selectedTaco.bookNumber;
      const sellerId = this.selectedTaco.seller_id ?? this.selectedTaco.sellerId;
      if (setId != null && bookNumber != null && sellerId != null) {
        this.viewTacoGestor(setId, bookNumber, sellerId);
      }
    } else if (this.showTacosList && this.selectedEntity) {
      this.loadTacosGestor();
    } else {
      this.loadEntitiesGestor();
    }
  }

  detectarRol() {
    const ruta = window.location.pathname;
    const tieneSeller = this.authService.isSeller();
    const esGestor = this.authService.isGestor();

    // La ruta tiene prioridad: si estamos en tabs de vendedor/gestor, usar ese rol
    if (ruta.includes('/vendedor-tab') && tieneSeller) {
      this.rolActual = 'vendedor';
      localStorage.setItem('rolActual', 'vendedor');
      localStorage.setItem('esVendedor', 'true');
      return;
    }
    if (ruta.includes('/gestor-tab') && esGestor) {
      this.rolActual = 'gestor';
      localStorage.setItem('rolActual', 'gestor');
      localStorage.setItem('esVendedor', 'false');
      return;
    }

    const rolGuardado = localStorage.getItem('rolActual');
    if (rolGuardado) {
      this.rolActual = rolGuardado as 'usuario' | 'vendedor' | 'gestor';
      if (this.rolActual === 'vendedor' && !tieneSeller) this.rolActual = 'usuario';
      if (this.rolActual === 'gestor' && !esGestor) this.rolActual = tieneSeller ? 'vendedor' : 'usuario';
    } else {
      this.rolActual = tieneSeller ? 'vendedor' : (esGestor ? 'gestor' : 'usuario');
      localStorage.setItem('rolActual', this.rolActual);
    }
  }

  isSeller(): boolean {
    return this.authService.isSeller();
  }

  cambiarRol(rol: 'usuario' | 'vendedor' | 'gestor') {
    this.rolActual = rol;
    localStorage.setItem('rolActual', rol);
    if (rol === 'vendedor') {
      localStorage.setItem('esVendedor', 'true');
      this.router.navigate(['/tabs/vendedor-tab4']);
    } else if (rol === 'usuario') {
      localStorage.setItem('esVendedor', 'false');
      this.router.navigate(['/tabs/tab3']);
    } else if (rol === 'gestor') {
      localStorage.setItem('esVendedor', 'false');
      this.router.navigate(['/tabs/gestor-tab1']);
    }
  }

  loadEntitiesGestor() {
    this.loading = true;
    this.ventasService.getManagerEntities().subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success && res.entities) {
          this.entities = res.entities || [];
          if (this.entities.length === 1) {
            this.selectedEntity = this.entities[0];
            this.loadTacosGestor();
          } else if (this.entities.length > 1) {
            this.showEntitySelection = true;
          } else {
            this.mostrarAlerta('Sin entidades', 'No tienes entidades asignadas como gestor.');
          }
        } else {
          this.mostrarAlerta('Error', res.message || 'Error al cargar las entidades.');
        }
      },
      error: (err) => {
        this.loading = false;
        this.mostrarAlerta('Error', err?.error?.message || 'Error al cargar las entidades.');
      }
    });
  }

  loadTacosGestor() {
    if (!this.selectedEntity) return;
    this.loading = true;
    this.ventasService.getManagerTacos(this.selectedEntity.id).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.summary = res.summary;
          this.tacos = res.tacos || [];
          this.showTacosList = true;
        } else {
          this.mostrarAlerta('Error', res.message || 'Error al cargar los tacos.');
        }
      },
      error: (err) => {
        this.loading = false;
        this.mostrarAlerta('Error', err?.error?.message || 'Error al cargar los tacos.');
      }
    });
  }

  viewTacoGestor(setId: number, bookNumber: number, sellerId: number) {
    this.loading = true;
    this.ventasService.getManagerTacoParticipations(setId, bookNumber, sellerId).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.selectedTaco = { ...res.taco_info, set_id: res.taco_info.set_id, book_number: res.taco_info.book_number };
          this.tacoParticipations = res.participations;
          this.showTacoDetail = true;
        }
      },
      error: () => {
        this.loading = false;
        this.mostrarAlerta('Error', 'Error al cargar las participaciones.');
      }
    });
  }

  async loadEntities() {
    this.loading = true;
    this.ventasService.getMyEntities().subscribe({
      next: async (res: any) => {
        this.loading = false;
        if (res.success && res.entities) {
          this.entities = res.entities || [];
          if (this.entities.length === 1) {
            this.selectedEntity = this.entities[0];
            this.loadTacos();
          } else if (this.entities.length > 1) {
            this.showEntitySelection = true;
          } else {
            await this.mostrarAlerta('Sin entidades', 'No tienes entidades asignadas.');
          }
        } else {
          await this.mostrarAlerta('Error', res.message || 'Error al cargar las entidades.');
        }
      },
      error: async (err) => {
        this.loading = false;
        console.error('Error al cargar entidades:', err);
        const errorMessage = err?.error?.message || 'Error al cargar las entidades.';
        await this.mostrarAlerta('Error', errorMessage);
      }
    });
  }

  selectEntity(entity: any) {
    this.selectedEntity = entity;
    this.showEntitySelection = false;
    if (this.isGestor) {
      this.loadTacosGestor();
    } else {
      this.loadTacos();
    }
  }

  async loadTacos() {
    if (!this.selectedEntity) return;
    this.loading = true;
    this.ventasService.getMyTacos(this.selectedEntity.id).subscribe({
      next: async (res: any) => {
        this.loading = false;
        if (res.success) {
          this.summary = res.summary;
          this.tacos = res.tacos || [];
          this.showTacosList = true;
          
          // Si no hay tacos, mostrar mensaje
          if (this.tacos.length === 0) {
            await this.mostrarAlerta('Sin participaciones', 'No tienes participaciones asignadas para esta entidad.');
          }
        } else {
          await this.mostrarAlerta('Error', res.message || 'Error al cargar los tacos.');
        }
      },
      error: async (err) => {
        this.loading = false;
        console.error('Error al cargar tacos:', err);
        const errorMessage = err?.error?.message || 'Error al cargar los tacos.';
        await this.mostrarAlerta('Error', errorMessage);
      }
    });
  }

  /** Abre el detalle de un taco: como vendedor o como gestor (con seller_id) */
  openTaco(taco: any) {
    if (this.isGestor && (taco.seller_id != null || taco.sellerId != null)) {
      const setId = taco.set_id ?? taco.setId;
      const bookNumber = taco.book_number ?? taco.bookNumber;
      const sellerId = taco.seller_id ?? taco.sellerId;
      this.viewTacoGestor(setId, bookNumber, sellerId);
    } else {
      this.viewTaco(taco);
    }
  }

  async viewTaco(taco: any) {
    this.loading = true;
    this.ventasService.getTacoParticipations(taco.set_id, taco.book_number).subscribe({
      next: async (res: any) => {
        this.loading = false;
        if (res.success) {
          this.selectedTaco = res.taco_info;
          this.tacoParticipations = res.participations;
          this.showTacoDetail = true;
        }
      },
      error: async (err) => {
        this.loading = false;
        await this.mostrarAlerta('Error', 'Error al cargar las participaciones.');
      }
    });
  }

  backToTacos() {
    this.showTacoDetail = false;
    this.selectedTaco = null;
    this.tacoParticipations = [];
  }

  backToEntities() {
    this.showTacosList = false;
    this.selectedEntity = null;
    this.summary = null;
    this.tacos = [];
    if (this.entities.length > 1) {
      this.showEntitySelection = true;
    }
  }

  getStatusBadgeClass(status: string, paymentMethod?: string): string {
    if (status === 'vendida') {
      if (paymentMethod === 'efectivo') return 'badge-efectivo';
      if (paymentMethod === 'bizum') return 'badge-bizum';
      if (paymentMethod === 'transferencia') return 'badge-transferencia';
      return 'badge-vendida';
    }
    if (status === 'devuelta') return 'badge-devuelta';
    return 'badge-disponible';
  }

  getStatusText(status: string, paymentMethod?: string): string {
    if (status === 'vendida') {
      if (paymentMethod) {
        return paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) + ' Vendida';
      }
      return 'Vendida';
    }
    if (status === 'devuelta') return 'Devuelta';
    return 'Disponible';
  }

  getPaymentCount(amount: number, salesAmount: number, salesCount: number): number {
    if (salesAmount === 0 || salesCount === 0) return 0;
    // Calcular precio promedio por participación vendida
    const avgPrice = salesAmount / salesCount;
    // Calcular cuántas participaciones representa este monto
    return Math.round(amount / avgPrice);
  }

  padNumber(num: number, length: number): string {
    return String(num).padStart(length, '0');
  }

  formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES');
  }

  getTacoSalesCount(): number {
    return this.tacoParticipations.filter(p => p.status === 'vendida').length;
  }

  getTacoSalesAmount(): number {
    const price = this.selectedTaco?.price_per_participation || 0;
    return this.getTacoSalesCount() * price;
  }

  getTacoReturnedCount(): number {
    return this.tacoParticipations.filter(p => p.status === 'devuelta').length;
  }

  getTacoReturnedAmount(): number {
    const price = this.selectedTaco?.price_per_participation || 0;
    return this.getTacoReturnedCount() * price;
  }

  getTacoAvailableCount(): number {
    return this.tacoParticipations.filter(p => p.status === 'asignada').length;
  }

  getTacoAvailableAmount(): number {
    const price = this.selectedTaco?.price_per_participation || 0;
    return this.getTacoAvailableCount() * price;
  }

  getTacoPaymentBreakdown(): any {
    const price = this.selectedTaco?.price_per_participation || 0;
    const breakdown: any = { efectivo: 0, bizum: 0, transferencia: 0, sin_registrar: 0 };
    
    this.tacoParticipations
      .filter(p => p.status === 'vendida')
      .forEach(p => {
        if (p.payment_method === 'efectivo') breakdown.efectivo += price;
        else if (p.payment_method === 'bizum') breakdown.bizum += price;
        else if (p.payment_method === 'transferencia') breakdown.transferencia += price;
        else breakdown.sin_registrar += price;
      });
    
    return breakdown;
  }

  getTacoPaymentCount(method: string): number {
    return this.tacoParticipations.filter(p => 
      p.status === 'vendida' && p.payment_method === method
    ).length;
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return '';
    // Si ya es una URL completa, retornarla tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Construir URL completa desde la API base (sin /api)
    const apiBaseUrl = environment.apiUrl.replace('/api', '');
    return `${apiBaseUrl}/uploads/${imagePath}`;
  }
}
