import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VentasService } from '../core/services/ventas.service';
import { AuthService } from '../core/services/auth.service';
import { AlertController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-venta',
  templateUrl: './venta.page.html',
  styleUrls: ['./venta.page.scss'],
  standalone: false,
})
export class VentaPage implements OnInit {
  isVendedor: boolean = false;
  
  // Vista 1: Selección de entidades
  entities: any[] = [];
  selectedEntity: any = null;
  showEntitySelection: boolean = false;
  
  // Vista 2: Selección de sorteos
  lotteries: any[] = [];
  selectedLottery: any = null;
  showLotteriesList: boolean = false;
  
  // Vista 3: Venta (física o digital)
  showVentaView: boolean = false;
  tipoParticipacion: 'fisicas' | 'digitales' = 'fisicas';
  
  // Datos para venta (allSets = todos los sets; sets = filtrados por tipo físico/digital)
  reserves: any[] = [];
  allSets: any[] = [];
  sets: any[] = [];
  reserveSeleccionado: any = null;
  setSeleccionado: any = null;
  
  // Para participaciones físicas
  participacionUnidad: string = '';
  rangoDesde: string = '';
  rangoHasta: string = '';
  
  // Para participaciones digitales (pool entidad+sorteo; no hay selector de set)
  numeroParticipaciones: number = 1;
  disponibilidad: number = 120;
  totalDigitalAvailable: number = 0;
  precioPorParticipacion: number = 0;
  
  // Modal de resumen
  mostrarModalResumen: boolean = false;
  totalParticipaciones: number = 0;
  importeTotal: number = 0;
  formaPago: 'efectivo' | 'bizum' | 'transferencia' | 'omitir' | null = null;
  
  // Modal de éxito
  mostrarModalExito: boolean = false;
  ultimaVentaConEmail = false;
  ultimaVentaSinEmail = false;
  ultimaVentaPendingId: number | null = null;
  ultimaVentaRegistrationUrl: string | null = null;
  telefonoCompradorWhatsApp = '';
  notifyAutoEnabled = false;
  buyerNotifyChannel: 'sms' | 'manual' = 'manual';
  enviandoNotificacion = false;
  notificacionEnviada = false;

  // Modal email (para venta digital)
  mostrarModalEmail: boolean = false;
  emailCliente: string = '';
  clienteEncontrado: { id: number; email: string } | null = null;
  /** Venta digital a email no registrado: cobro ahora, registro por correo después. */
  ventaPendienteRegistro = false;
  /** Venta digital pendiente sin email del comprador. */
  ventaSoloCodigo = false;

  loading = false;

  constructor(
    private router: Router,
    private ventasService: VentasService,
    public authService: AuthService,
    private alertController: AlertController
  ) { }

  canViewUsuario(): boolean { return this.authService.canViewUsuario(); }
  canViewVendedor(): boolean { return this.authService.canViewVendedor(); }
  canViewGestor(): boolean { return this.authService.canViewGestor(); }

  ngOnInit() {
    this.isVendedor = this.authService.isSeller();
  }

  /** Carga inicial y al volver a la vista (cambio de rol/tab): refresca datos para no mostrar caché vieja. */
  ionViewWillEnter() {
    this.isVendedor = this.authService.isSeller();
    if (this.isVendedor) {
      this.loadBuyerNotifyConfig();
    }
    if (!this.isVendedor) return;
    this.loading = false;
    this.entities = [];
    this.selectedEntity = null;
    this.lotteries = [];
    this.selectedLottery = null;
    this.showEntitySelection = false;
    this.showLotteriesList = false;
    this.showVentaView = false;
    this.reserves = [];
    this.allSets = [];
    this.sets = [];
    this.reserveSeleccionado = null;
    this.setSeleccionado = null;
    this.loadEntities();
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
            this.loadLotteries();
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
    this.loadLotteries();
  }

  async loadLotteries() {
    if (!this.selectedEntity) return;
    this.loading = true;
    this.ventasService.getMyLotteries(this.selectedEntity.id).subscribe({
      next: async (res: any) => {
        this.loading = false;
        if (res.success) {
          this.lotteries = res.lotteries || [];
          // Siempre mostrar el paso de selección de sorteo (aunque haya solo 1)
          // para que selectLottery() llame a loadReservesAndSets() correctamente
          if (this.lotteries.length === 1) {
            this.selectedLottery = this.lotteries[0];
            this.showLotteriesList = true;
          } else if (this.lotteries.length > 1) {
            this.showLotteriesList = true;
          } else {
            await this.mostrarAlerta('Sin sorteos', 'No hay sorteos disponibles con reservas, sets y diseño para esta entidad.');
            this.showLotteriesList = true; // Mostrar vista de sorteos (vacía) para que aparezca la flecha atrás
          }
        } else {
          await this.mostrarAlerta('Error', res.message || 'Error al cargar los sorteos.');
        }
      },
      error: async (err) => {
        this.loading = false;
        console.error('Error al cargar sorteos:', err);
        const errorMessage = err?.error?.message || 'Error al cargar los sorteos.';
        await this.mostrarAlerta('Error', errorMessage);
      }
    });
  }

  selectLottery(lottery: any) {
    this.selectedLottery = lottery;
    this.showLotteriesList = false;
    this.showVentaView = true;
    this.loadReservesAndSets();
    if (this.tipoParticipacion === 'digitales' && this.selectedEntity?.id && lottery?.id) {
      this.loadTotalDigitalAvailable();
    }
  }
  
  async loadReservesAndSets() {
    if (!this.selectedLottery || !this.selectedEntity) return;
    this.loading = true;
    this.ventasService.getReserves().subscribe({
      next: async (res: any) => {
        this.loading = false;
        console.log('Respuesta completa de getReserves:', res);
        if (res.success && res.reserves) {
          console.log('Reserves recibidas:', res.reserves);
          // Filtrar TODAS las reservas de la entidad y sorteo seleccionados (puede haber varias)
          const matchingReserves = res.reserves.filter((r: any) => {
            const entityId = r.entity_id || r.entity?.id;
            const lotteryId = r.lottery_id || r.lottery?.id;
            return entityId === this.selectedEntity.id && lotteryId === this.selectedLottery.id;
          });

          if (matchingReserves.length > 0) {
            this.reserves = matchingReserves;
            this.reserveSeleccionado = matchingReserves[0];
            // Combinar todos los sets de todas las reservas coincidentes
            this.allSets = matchingReserves.flatMap((r: any) => r.sets || []);
            this.applySetsFilter();
            console.log('Sets encontrados:', this.allSets, 'filtrados:', this.sets);

            if (this.sets.length > 0) {
              console.log('Set seleccionado automáticamente:', this.setSeleccionado);
            } else {
              console.log('No hay sets del tipo seleccionado');
            }
          } else {
            console.log('No se encontró reserva, intentando con reserve_id');
            // Si no encuentra reserva, intentar cargar desde el reserve_id del sorteo
            if (this.selectedLottery.reserve_id) {
              const reserveById = res.reserves.find((r: any) => r.id === this.selectedLottery.reserve_id);
              if (reserveById) {
                console.log('Reserva encontrada por ID:', reserveById);
                this.reserveSeleccionado = reserveById;
                this.reserves = [reserveById];
                this.allSets = reserveById.sets || [];
                this.applySetsFilter();
                if (this.sets.length > 0) {
                  console.log('Set seleccionado desde reserve_id:', this.setSeleccionado);
                } else {
                  console.log('No hay sets disponibles en la reserva por ID');
                }
              } else {
                console.log('No se encontró reserva con ID:', this.selectedLottery.reserve_id);
              }
            } else {
              console.log('No hay reserve_id en el sorteo seleccionado');
            }
          }
        } else {
          console.log('No se recibieron reservas o la respuesta no fue exitosa');
        }
      },
      error: async (err) => {
        this.loading = false;
        console.error('Error al cargar reservas:', err);
      }
    });
  }

  backToLotteries() {
    this.showVentaView = false;
    this.selectedLottery = null;
    this.reserveSeleccionado = null;
    this.setSeleccionado = null;
    this.sets = [];
    this.reserves = [];
    this.participacionUnidad = '';
    this.rangoDesde = '';
    this.rangoHasta = '';
    if (this.lotteries.length > 1) {
      this.showLotteriesList = true;
    } else if (this.lotteries.length === 1) {
      // Si solo hay un sorteo, volver a la lista para poder seleccionarlo de nuevo
      this.showLotteriesList = true;
    }
  }

  backToEntities() {
    this.showLotteriesList = false;
    this.showVentaView = false;
    this.selectedLottery = null;
    this.lotteries = [];
    this.reserveSeleccionado = null;
    this.setSeleccionado = null;
    this.sets = [];
    this.reserves = [];
    this.participacionUnidad = '';
    this.rangoDesde = '';
    this.rangoHasta = '';
    this.showEntitySelection = true; // Siempre volver a selección de entidad (aunque solo haya 1, para poder salir)
  }

  /** Navegar al Home (útil cuando solo hay una entidad y se vuelve desde sorteos). */
  goToHome() {
    this.router.navigate(['/tabs/tab1']);
  }

  cambiarRol(rol: string) {
    if (rol === 'usuario') {
      localStorage.setItem('rolActual', 'usuario');
      localStorage.setItem('esVendedor', 'false');
      this.router.navigate(['/tabs/tab3']);
    } else if (rol === 'gestor') {
      localStorage.setItem('rolActual', 'gestor');
      localStorage.setItem('esVendedor', 'false');
      this.router.navigate(['/tabs/gestor-tab3']);
    }
  }

  cambiarTipoParticipacion() {
    this.participacionUnidad = '';
    this.rangoDesde = '';
    this.rangoHasta = '';
    this.numeroParticipaciones = 1;
    this.setSeleccionado = null;
    this.applySetsFilter();
    if (this.tipoParticipacion === 'digitales' && this.selectedEntity?.id && this.selectedLottery?.id) {
      this.loadTotalDigitalAvailable();
    } else {
      this.totalDigitalAvailable = 0;
    }
  }

  loadTotalDigitalAvailable() {
    if (!this.selectedEntity?.id || !this.selectedLottery?.id) return;
    this.ventasService.getTotalDigitalAvailable(this.selectedEntity.id, this.selectedLottery.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.totalDigitalAvailable = res.total_digital_available ?? 0;
          if (res.price_per_participation != null) {
            this.precioPorParticipacion = res.price_per_participation;
          }
        } else {
          this.totalDigitalAvailable = 0;
        }
      },
      error: () => { this.totalDigitalAvailable = 0; }
    });
  }

  /** Filtra sets por tipo físico o digital. Digitales: no se muestra set (pool entidad+sorteo); disponibilidad viene de loadTotalDigitalAvailable. */
  applySetsFilter() {
    if (!this.allSets.length) {
      this.sets = [];
      if (this.tipoParticipacion === 'digitales') {
        this.setSeleccionado = null;
      }
      return;
    }
    if (this.tipoParticipacion === 'fisicas') {
      this.sets = this.allSets.filter((s: any) => {
        const phys = Number(s.physical_participations ?? 0);
        const dig = Number(s.digital_participations ?? 0);
        return phys > 0 && dig === 0;
      });
      if (this.sets.length > 0) {
        this.setSeleccionado = this.sets[0];
        this.precioPorParticipacion = parseFloat(this.setSeleccionado.played_amount) || 0;
        this.disponibilidad = 120;
      } else {
        this.setSeleccionado = null;
        this.disponibilidad = 0;
      }
    } else {
      this.sets = [];
      this.setSeleccionado = null;
      this.disponibilidad = this.totalDigitalAvailable;
    }
  }

  onReserveChange() {
    if (this.reserveSeleccionado?.sets) {
      this.allSets = this.reserveSeleccionado.sets;
      this.applySetsFilter();
    } else {
      this.allSets = [];
      this.sets = [];
      this.setSeleccionado = null;
    }
  }

  onSetChange() {
    if (this.setSeleccionado) {
      this.precioPorParticipacion = parseFloat(this.setSeleccionado.played_amount) || 0;
    }
  }

  irAVentaQR() {
    // Navegar a venta-qr con los parámetros del sorteo seleccionado
    if (this.selectedLottery) {
      this.router.navigate(['/venta-qr'], {
        queryParams: {
          lottery_id: this.selectedLottery.id,
          reserve_id: this.selectedLottery.reserve_id,
          entity_id: this.selectedEntity.id
        }
      });
    } else {
      this.router.navigate(['/venta-qr']);
    }
  }

  puedeVender(): boolean {
    if (this.tipoParticipacion === 'fisicas') {
      if (!this.setSeleccionado) return false;
      const participacionUnidadStr = String(this.participacionUnidad || '').trim();
      const rangoDesdeStr = String(this.rangoDesde || '').trim();
      const rangoHastaStr = String(this.rangoHasta || '').trim();
      const tieneUnidad = participacionUnidadStr.length > 0;
      const tieneRango = rangoDesdeStr.length > 0 && rangoHastaStr.length > 0;
      return tieneUnidad || tieneRango;
    }
    // Digitales: entidad + sorteo + cantidad dentro del total disponible (pool; no hay set)
    return !!this.selectedEntity?.id && !!this.selectedLottery?.id
      && this.numeroParticipaciones > 0
      && this.numeroParticipaciones <= this.totalDigitalAvailable;
  }

  calcularTotalParticipaciones(): number {
    if (this.tipoParticipacion === 'fisicas') {
      if (this.participacionUnidad) {
        return 1;
      } else if (this.rangoDesde && this.rangoHasta) {
        const desde = this.extraerNumero(this.rangoDesde);
        const hasta = this.extraerNumero(this.rangoHasta);
        return hasta - desde + 1;
      }
      return 0;
    } else {
      return this.numeroParticipaciones;
    }
  }

  extraerNumero(participacion: string): number {
    const n = parseInt(participacion, 10);
    if (!isNaN(n)) return n;
    const partes = participacion.split('/');
    if (partes.length > 1) {
      return parseInt(partes[1], 10) || 0;
    }
    return 0;
  }

  mostrarResumen() {
    this.totalParticipaciones = this.calcularTotalParticipaciones();
    const precio = this.tipoParticipacion === 'digitales' ? this.precioPorParticipacion : (parseFloat(this.setSeleccionado?.played_amount as any) || 0);
    this.importeTotal = this.totalParticipaciones * precio;
    this.formaPago = null;
    if (this.tipoParticipacion === 'digitales') {
      this.emailCliente = '';
      this.clienteEncontrado = null;
      this.ventaPendienteRegistro = false;
      this.ventaSoloCodigo = false;
      this.mostrarModalEmail = true;
    } else {
      this.mostrarModalResumen = true;
    }
  }

  cerrarModalEmail() {
    this.mostrarModalEmail = false;
    this.emailCliente = '';
    this.clienteEncontrado = null;
    this.ventaSoloCodigo = false;
  }

  continuarConSoloCodigo() {
    this.clienteEncontrado = null;
    this.emailCliente = '';
    this.ventaPendienteRegistro = true;
    this.ventaSoloCodigo = true;
    this.mostrarModalEmail = false;
    this.mostrarModalResumen = true;
  }

  async verificarEmailYContinuar() {
    const email = (this.emailCliente || '').trim().toLowerCase();
    if (!email) {
      await this.mostrarAlerta('Atención', 'Introduce el email del cliente.');
      return;
    }
    this.loading = true;
    this.ventasService.checkUserExists(email).subscribe({
      next: async (res: any) => {
        this.loading = false;
        if (res.exists && res.user_id) {
          this.clienteEncontrado = { id: res.user_id, email };
          this.ventaPendienteRegistro = false;
          this.mostrarModalEmail = false;
          this.mostrarModalResumen = true;
        } else if (res.can_offer_registration) {
          await this.ofrecerVentaConRegistroPorEmail(email);
        } else {
          await this.mostrarAlerta(
            'Usuario no registrado',
            'El correo no está registrado en la aplicación.'
          );
        }
      },
      error: async (err) => {
        this.loading = false;
        const msg = err?.error?.message || 'Error al verificar el email. Intenta de nuevo.';
        await this.mostrarAlerta('Error', msg);
      }
    });
  }

  private async ofrecerVentaConRegistroPorEmail(email: string) {
    const alert = await this.alertController.create({
      header: 'Usuario no registrado',
      message:
        'El correo no tiene cuenta en Partilot. ¿Quieres cobrar la venta ahora y enviarle un correo para que se registre en la web y reciba sus participaciones?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, enviar correo',
          handler: () => {
            this.clienteEncontrado = null;
            this.ventaPendienteRegistro = true;
            this.emailCliente = email;
            this.mostrarModalEmail = false;
            this.mostrarModalResumen = true;
          },
        },
      ],
    });
    await alert.present();
  }

  cerrarModalResumen() {
    this.mostrarModalResumen = false;
    this.ventaPendienteRegistro = false;
    this.ventaSoloCodigo = false;
  }

  seleccionarFormaPago(forma: 'efectivo' | 'bizum' | 'transferencia' | 'omitir') {
    this.formaPago = forma;
  }

  async registrarVenta() {
    if (!this.formaPago) {
      await this.mostrarAlerta('Atención', 'Por favor selecciona una forma de pago');
      return;
    }

    if (this.tipoParticipacion === 'digitales') {
      if (!this.selectedEntity?.id || !this.selectedLottery?.id) {
        await this.mostrarAlerta('Error', 'Datos incompletos. Selecciona entidad y sorteo.');
        return;
      }
      const buyerEmail = (this.clienteEncontrado?.email || this.emailCliente || '').trim().toLowerCase();
      if (!this.ventaSoloCodigo) {
        if (!buyerEmail) {
          await this.mostrarAlerta('Error', 'Datos incompletos. Verifica el email del cliente.');
          return;
        }
        if (!this.clienteEncontrado && !this.ventaPendienteRegistro) {
          await this.mostrarAlerta('Error', 'Confirma el email del cliente antes de continuar.');
          return;
        }
      }
      this.loading = true;
      const paymentMethod = this.formaPago === 'omitir' ? null : this.formaPago;
      const digitalBase = {
        entity_id: this.selectedEntity.id,
        lottery_id: this.selectedLottery.id,
        quantity: this.numeroParticipaciones,
        payment_method: paymentMethod,
      };
      const sale$ = this.ventaPendienteRegistro
        ? this.ventasService.sellDigitalPending(
            this.ventaSoloCodigo ? digitalBase : { ...digitalBase, buyer_email: buyerEmail }
          )
        : this.ventasService.sellDigital({ ...digitalBase, buyer_email: buyerEmail });
      sale$.subscribe({
        next: async (res: any) => {
          this.loading = false;
          if (res.success) {
            const soloCodigo = this.ventaSoloCodigo;
            this.ultimaVentaConEmail = !soloCodigo && !!buyerEmail;
            this.ultimaVentaSinEmail = soloCodigo;
            this.ultimaVentaPendingId = soloCodigo ? (res.pending_id ?? null) : null;
            this.ultimaVentaRegistrationUrl = soloCodigo
              ? (res.buyer_registration_url ?? null)
              : null;
            this.telefonoCompradorWhatsApp = '';
            this.notificacionEnviada = false;
            this.ventasService.notifyVentasChanged();
            this.cerrarModalResumen();
            this.mostrarModalExito = true;
            this.clienteEncontrado = null;
            this.emailCliente = '';
            this.ventaPendienteRegistro = false;
            this.ventaSoloCodigo = false;
            this.loadTotalDigitalAvailable();
          } else {
            await this.mostrarAlerta('Error', res.message || 'No se pudo registrar la venta.');
          }
        },
        error: async (err) => {
          this.loading = false;
          const msg = err?.error?.message || 'Error de conexión. Intenta de nuevo.';
          await this.mostrarAlerta('Error', msg);
        }
      });
      return;
    }

    // Físicas
    if (!this.setSeleccionado) {
      await this.mostrarAlerta('Error', 'Selecciona un set válido.');
      return;
    }
    let desde: number;
    let hasta: number;
    if (this.participacionUnidad) {
      desde = hasta = this.extraerNumero(this.participacionUnidad);
    } else if (this.rangoDesde && this.rangoHasta) {
      desde = this.extraerNumero(this.rangoDesde);
      hasta = this.extraerNumero(this.rangoHasta);
      if (desde > hasta) {
        await this.mostrarAlerta('Error', 'El rango desde no puede ser mayor que hasta.');
        return;
      }
    } else {
      await this.mostrarAlerta('Error', 'Indica participación o rango.');
      return;
    }

    this.loading = true;
    const paymentMethod = this.formaPago === 'omitir' ? null : this.formaPago;
    this.ventasService.sellManual(this.setSeleccionado.id, desde, hasta, paymentMethod).subscribe({
      next: async (res: any) => {
        this.loading = false;
        if (res.success) {
          this.ventasService.notifyVentasChanged();
          this.cerrarModalResumen();
          this.mostrarModalExito = true;
        } else {
          await this.mostrarAlerta('Error', res.message || 'No se pudo registrar la venta.');
        }
      },
      error: async (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Error de conexión. Intenta de nuevo.';
        await this.mostrarAlerta('Error', msg);
      }
    });
  }

  private getSetLabelParaHistorial(): string | null {
    const s = this.setSeleccionado;
    if (!s) {
      return null;
    }
    const name = (s.set_name || s.name || '').trim();
    if (name) {
      return name;
    }
    if (s.set_number != null && s.set_number !== '') {
      return `Set ${s.set_number}`;
    }
    return null;
  }

  guardarVentaDigitalEnHistorial(res: any, buyerEmail?: string): void {
    const lottery = this.selectedLottery;
    const entidad = this.selectedEntity?.name || '—';
    const drawDate = lottery?.draw_date
      ? new Date(lottery.draw_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
      : '—';
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');
    historial.unshift({
      id: res.pending_id ? `p-${res.pending_id}` : Date.now(),
      pending_id: res.pending_id ?? null,
      tipo: 'venta-digital',
      fecha: new Date().toISOString(),
      formaPago: this.formaPago === 'omitir' ? null : this.formaPago,
      descripcion: this.ventaSoloCodigo
        ? `Venta digital ${entidad} · Sin email`
        : this.ventaPendienteRegistro
          ? `Venta digital ${entidad} · Pendiente de registro`
          : `Venta digital ${entidad}`,
      pendienteRegistro: this.ventaPendienteRegistro || this.ventaSoloCodigo,
      soloCodigo: this.ventaSoloCodigo,
      quantity: this.numeroParticipaciones,
      valid_until: res.valid_until ?? null,
      buyer_registration_url: res.buyer_registration_url ?? null,
      setLabel: this.getSetLabelParaHistorial(),
      participacion: {
        entidad,
        sorteo: lottery?.name || lottery?.lottery_type || '—',
        numero: `${this.numeroParticipaciones} dig.`,
        fechaSorteo: drawDate,
        importeJugado: this.precioPorParticipacion,
        importeTotal: this.importeTotal,
        clienteEmail: buyerEmail || this.clienteEncontrado?.email,
        pendienteRegistro: this.ventaPendienteRegistro || this.ventaSoloCodigo,
        esDigital: true,
        setLabel: this.getSetLabelParaHistorial(),
        set_number: this.setSeleccionado?.set_number ?? null,
        buyer_registration_url: res.buyer_registration_url ?? null,
      }
    });
    localStorage.setItem('historial', JSON.stringify(historial));
  }

  guardarVentaEnHistorial(res: any, desde: number, hasta: number): void {
    const lottery = this.selectedLottery;
    const entidad = this.selectedEntity?.name || '—';
    const drawDate = lottery?.draw_date
      ? new Date(lottery.draw_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
      : '—';
    const donativo = parseFloat(this.setSeleccionado?.donation_amount) || 0;
    const numeroDisplay = this.participacionUnidad || `${this.rangoDesde} - ${this.rangoHasta}`;
    const participacion = res.participation || res.sale || {};
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');
    historial.unshift({
      id: Date.now(),
      tipo: 'venta',
      fecha: new Date().toISOString(),
      formaPago: this.formaPago === 'omitir' ? null : this.formaPago,
      descripcion: `Participación ${entidad}`,
      participacion: {
        entidad,
        numero: participacion.participation_code || participacion.numero || numeroDisplay,
        fechaSorteo: drawDate,
        importeJugado: this.precioPorParticipacion,
        donativo: donativo > 0 ? donativo : undefined,
        importeTotal: this.importeTotal,
        numeroParticipacion: participacion.participation_code || this.participacionUnidad || `${desde}/${hasta}`,
        numeroReferencia: participacion.reference || participacion.numero_referencia || '0000000000000000000',
        imagen: participacion.image || null
      }
    });
    localStorage.setItem('historial', JSON.stringify(historial));
  }

  private loadBuyerNotifyConfig(): void {
    this.ventasService.getBuyerNotifyConfig().subscribe({
      next: (res) => {
        this.buyerNotifyChannel =
          res.buyer_notify_channel === 'sms' || res.sms_enabled ? 'sms' : 'manual';
        this.notifyAutoEnabled = !!res.notify_auto_enabled || this.buyerNotifyChannel === 'sms';
      },
      error: () => {
        this.notifyAutoEnabled = false;
        this.buyerNotifyChannel = 'manual';
      },
    });
  }

  getNotifyChannelLabel(): string {
    return this.buyerNotifyChannel === 'sms' ? 'SMS' : 'WhatsApp';
  }

  private normalizarTelefonoWhatsApp(raw: string): string | null {
    let digits = (raw || '').replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }
    if (digits.length === 9 && /^[6789]/.test(digits)) {
      digits = `34${digits}`;
    }
    if (digits.length < 8 || digits.length > 15) {
      return null;
    }
    return digits;
  }

  private buildMensajeWhatsAppSinCodigo(): string {
    const qty = this.numeroParticipaciones;
    const entidad = this.selectedEntity?.name || '—';
    const sorteo =
      this.selectedLottery?.name || this.selectedLottery?.lottery_type || '—';
    const participacionesTexto =
      qty === 1 ? '1 participación digital' : `${qty} participaciones digitales`;
    let msg = `Hola. Te he vendido ${participacionesTexto} de ${entidad} (${sorteo}).`;
    if (this.ultimaVentaRegistrationUrl) {
      msg += `\n\nPara completar el registro y reclamar tus participaciones, abre este enlace:\n${this.ultimaVentaRegistrationUrl}`;
    } else {
      msg +=
        '\n\nDescarga la app Partilot y sigue las instrucciones para vincular tus participaciones.';
    }
    return msg;
  }

  private abrirWhatsAppManual(telefono: string, mensaje: string): void {
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    if (Capacitor.isNativePlatform()) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  }

  getBotonMensajeCompradorLabel(): string {
    if (this.enviandoNotificacion) {
      return 'Enviando…';
    }
    if (!this.notifyAutoEnabled) {
      return 'Abrir WhatsApp';
    }
    return this.notificacionEnviada ? 'Reenviar mensaje' : 'Enviar mensaje';
  }

  async enviarNotificacionComprador(): Promise<void> {
    if (!this.ultimaVentaSinEmail || !this.ultimaVentaPendingId || this.enviandoNotificacion) {
      return;
    }

    const telefonoRaw = this.telefonoCompradorWhatsApp.trim();
    if (!telefonoRaw) {
      await this.mostrarAlerta('Atención', 'Introduce el teléfono del comprador.');
      return;
    }

    if (!this.notifyAutoEnabled) {
      const normalized = this.normalizarTelefonoWhatsApp(telefonoRaw);
      if (!normalized) {
        await this.mostrarAlerta(
          'Teléfono no válido',
          'Introduce un número con prefijo internacional (ej. 34 para España).'
        );
        return;
      }
      this.abrirWhatsAppManual(normalized, this.buildMensajeWhatsAppSinCodigo());
      return;
    }

    this.enviandoNotificacion = true;
    this.ventasService
      .sendPendingDigitalNotify(this.ultimaVentaPendingId, telefonoRaw)
      .subscribe({
        next: async (res) => {
          this.enviandoNotificacion = false;
          if (res.success) {
            this.notificacionEnviada = true;
            const canal = 'SMS';
            const restantes = res.buyer_sms_sends_remaining ?? 0;
            const extra =
              restantes > 0
                ? ` Puedes reenviar ${restantes} vez más desde el historial.`
                : ' No quedan más reenvíos por SMS para esta venta.';
            await this.mostrarAlerta(
              `${canal} enviado`,
              (res.message || `El comprador recibirá el código y el enlace por ${canal}.`) + extra
            );
            return;
          }
          await this.mostrarAlerta('Error', res.message || 'No se pudo enviar el mensaje.');
        },
        error: async (err) => {
          this.enviandoNotificacion = false;
          const msg = err?.error?.message || 'Error de conexión al enviar el mensaje.';
          await this.mostrarAlerta('Error', msg);
        },
      });
  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
    this.ultimaVentaConEmail = false;
    this.ultimaVentaSinEmail = false;
    this.ultimaVentaPendingId = null;
    this.ultimaVentaRegistrationUrl = null;
    this.telefonoCompradorWhatsApp = '';
    this.notificacionEnviada = false;
    this.enviandoNotificacion = false;
    this.participacionUnidad = '';
    this.rangoDesde = '';
    this.rangoHasta = '';
    this.numeroParticipaciones = 1;
    this.formaPago = null;
    this.clienteEncontrado = null;
  }

  disminuirParticipaciones() {
    if (this.numeroParticipaciones > 1) {
      this.numeroParticipaciones--;
    }
  }

  aumentarParticipaciones() {
    const max = this.tipoParticipacion === 'digitales' ? this.totalDigitalAvailable : this.disponibilidad;
    if (this.numeroParticipaciones < max) {
      this.numeroParticipaciones++;
    }
  }

  formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return '';
    // Si ya es una URL completa, retornarla tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Construir URL desde la API base; entidades/sorteos usan uploads (normalizar sin storage/)
    const apiBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const normalized = imagePath.replace(/^storage\/?/, '');
    return `${apiBaseUrl}/uploads/${normalized}`;
  }

  onLotteryImageError(lottery: any) {
    if (lottery) lottery.image = null;
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
