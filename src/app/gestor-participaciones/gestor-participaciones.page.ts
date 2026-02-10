import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { VentasService } from '../core/services/ventas.service';
import { AuthService } from '../core/services/auth.service';
import { LoadingController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-gestor-participaciones',
  templateUrl: './gestor-participaciones.page.html',
  styleUrls: ['./gestor-participaciones.page.scss'],
  standalone: false,
})
export class GestorParticipacionesPage implements OnInit {
  isVendedor: boolean = false;
  
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ventasService: VentasService,
    private authService: AuthService,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.isVendedor = this.authService.isSeller();
    if (this.isVendedor) {
      this.loadEntities();
    }
  }

  async loadEntities() {
    const loading = await this.loadingController.create({ message: 'Cargando...' });
    await loading.present();

    this.ventasService.getMyEntities().subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success && res.entities) {
          this.entities = res.entities;
          if (this.entities.length === 1) {
            this.selectedEntity = this.entities[0];
            this.loadTacos();
          } else if (this.entities.length > 1) {
            this.showEntitySelection = true;
          } else {
            await this.mostrarAlerta('Sin entidades', 'No tienes entidades asignadas.');
          }
        }
      },
      error: async (err) => {
        await loading.dismiss();
        await this.mostrarAlerta('Error', 'Error al cargar las entidades.');
      }
    });
  }

  selectEntity(entity: any) {
    this.selectedEntity = entity;
    this.showEntitySelection = false;
    this.loadTacos();
  }

  async loadTacos() {
    if (!this.selectedEntity) return;

    const loading = await this.loadingController.create({ message: 'Cargando participaciones...' });
    await loading.present();

    this.ventasService.getMyTacos(this.selectedEntity.id).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.summary = res.summary;
          this.tacos = res.tacos;
          this.showTacosList = true;
        }
      },
      error: async (err) => {
        await loading.dismiss();
        await this.mostrarAlerta('Error', 'Error al cargar los tacos.');
      }
    });
  }

  async viewTaco(taco: any) {
    const loading = await this.loadingController.create({ message: 'Cargando...' });
    await loading.present();

    this.ventasService.getTacoParticipations(taco.set_id, taco.book_number).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.selectedTaco = res.taco_info;
          this.tacoParticipations = res.participations;
          this.showTacoDetail = true;
        }
      },
      error: async (err) => {
        await loading.dismiss();
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
}
