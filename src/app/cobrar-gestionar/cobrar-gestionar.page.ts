import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-cobrar-gestionar',
  templateUrl: './cobrar-gestionar.page.html',
  styleUrls: ['./cobrar-gestionar.page.scss'],
  standalone: false,
})
export class CobrarGestionarPage implements OnInit {

  participaciones: any[] = [];
  participacionesSeleccionadas: Set<number> = new Set();
  modoCobro: boolean = false;
  modoDonacion: boolean = false;
  
  // Datos para modales
  mostrarModalDatos: boolean = false;
  mostrarModalCuenta: boolean = false;
  mostrarModalConfigDonacion: boolean = false;
  mostrarMensajeExito: boolean = false;
  
  datosPersonales = {
    nombre: '',
    apellidos: '',
    nif: ''
  };
  
  numeroCuenta: string = '';
  importeTotal: number = 0;
  
  // Para configuración de donación
  importeDonacion: number = 0;
  importeCodigo: number = 0;
  porcentajeDonacion: number = 50;
  
  tipoMensaje: 'cobro' | 'donacion' | 'codigo' = 'cobro';
  codigoRecarga: string = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.loadParticipaciones();
  }

  ionViewWillEnter() {
    this.loadParticipaciones();
    this.resetSeleccion();
  }

  loadParticipaciones() {
    try {
      const participacionesGuardadas = JSON.parse(localStorage.getItem('participaciones') || '[]');
      
      // Filtrar solo participaciones que pueden ser cobradas/donadas (no caducadas, no cobradas)
      this.participaciones = participacionesGuardadas.filter((p: any) => {
        return p.estado !== 'cobrada' && p.estado !== 'caducada' && p.estado !== 'donada';
      });

      // Si no hay participaciones, agregar datos de ejemplo
      if (this.participaciones.length === 0) {
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
            numero: '40083',
            entidad: 'CSIF-Rioja',
            fechaSorteo: '22/12/25',
            importeTotal: 25.00,
            estado: 'activa',
            imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          },
          { 
            id: 3, 
            numero: '60089',
            entidad: 'Peña Rondalosa',
            fechaSorteo: '22/12/25',
            importeTotal: 5.00,
            estado: 'activa',
            imagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        ];
        localStorage.setItem('participaciones', JSON.stringify([...participacionesGuardadas, ...this.participaciones]));
      }
    } catch (error) {
      console.error('Error cargando participaciones:', error);
      this.participaciones = [];
    }
  }

  resetSeleccion() {
    this.participacionesSeleccionadas.clear();
    this.modoCobro = false;
    this.modoDonacion = false;
    this.importeTotal = 0;
  }

  iniciarCobro() {
    this.modoCobro = true;
    this.modoDonacion = false;
    this.resetSeleccion();
  }

  iniciarDonacion() {
    this.modoDonacion = true;
    this.modoCobro = false;
    this.resetSeleccion();
  }

  toggleSeleccion(participacionId: number) {
    if (this.participacionesSeleccionadas.has(participacionId)) {
      this.participacionesSeleccionadas.delete(participacionId);
    } else {
      this.participacionesSeleccionadas.add(participacionId);
    }
    this.calcularImporteTotal();
  }

  estaSeleccionada(participacionId: number): boolean {
    return this.participacionesSeleccionadas.has(participacionId);
  }

  calcularImporteTotal() {
    this.importeTotal = Array.from(this.participacionesSeleccionadas)
      .reduce((total, id) => {
        const participacion = this.participaciones.find(p => p.id === id);
        return total + (participacion?.importeTotal || 0);
      }, 0);
  }

  async continuarCobro() {
    if (this.participacionesSeleccionadas.size === 0) {
      const alert = await this.alertController.create({
        header: 'Selección requerida',
        message: 'Por favor, selecciona al menos una participación para cobrar.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.mostrarModalDatos = true;
  }

  async continuarDonacion() {
    if (this.participacionesSeleccionadas.size === 0) {
      const alert = await this.alertController.create({
        header: 'Selección requerida',
        message: 'Por favor, selecciona al menos una participación para donar.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Configurar importes iniciales (50% cada uno)
    this.importeDonacion = this.importeTotal * 0.5;
    this.importeCodigo = this.importeTotal * 0.5;
    this.mostrarModalConfigDonacion = true;
  }

  cerrarModalDatos() {
    this.mostrarModalDatos = false;
    this.datosPersonales = { nombre: '', apellidos: '', nif: '' };
  }

  async guardarDatos() {
    if (!this.datosPersonales.nombre || !this.datosPersonales.apellidos || !this.datosPersonales.nif) {
      const alert = await this.alertController.create({
        header: 'Datos incompletos',
        message: 'Por favor, completa todos los campos requeridos.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.mostrarModalDatos = false;
    
    if (this.modoCobro) {
      this.mostrarModalCuenta = true;
    }
  }

  cerrarModalCuenta() {
    this.mostrarModalCuenta = false;
    this.numeroCuenta = '';
  }

  async procesarCobro() {
    if (!this.numeroCuenta || this.numeroCuenta.length < 10) {
      const alert = await this.alertController.create({
        header: 'Cuenta inválida',
        message: 'Por favor, introduce un número de cuenta válido.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Actualizar estado de participaciones
    const participaciones = JSON.parse(localStorage.getItem('participaciones') || '[]');
    Array.from(this.participacionesSeleccionadas).forEach(id => {
      const index = participaciones.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        participaciones[index].estado = 'cobrada';
        participaciones[index].fechaCobro = new Date().toISOString();
        participaciones[index].numeroCuenta = this.numeroCuenta;
      }
    });
    localStorage.setItem('participaciones', JSON.stringify(participaciones));

    // Guardar en historial
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');
    historial.unshift({
      id: Date.now(),
      tipo: 'cobro',
      fecha: new Date().toISOString(),
      participaciones: Array.from(this.participacionesSeleccionadas).map(id => 
        this.participaciones.find(p => p.id === id)
      ),
      importeTotal: this.importeTotal
    });
    localStorage.setItem('historial', JSON.stringify(historial));

    this.mostrarModalCuenta = false;
    this.tipoMensaje = 'cobro';
    this.mostrarMensajeExito = true;
    this.resetSeleccion();
    this.loadParticipaciones();
  }

  cerrarModalConfigDonacion() {
    this.mostrarModalConfigDonacion = false;
  }

  actualizarPorcentajes(event: any) {
    const porcentaje = event.detail.value;
    this.porcentajeDonacion = porcentaje;
    this.importeDonacion = (this.importeTotal * porcentaje) / 100;
    this.importeCodigo = this.importeTotal - this.importeDonacion;
  }

  async procesarDonacion() {
    this.mostrarModalConfigDonacion = false;
    
    // Si se dona algo, pedir datos personales
    if (this.importeDonacion > 0) {
      this.mostrarModalDatos = true;
      return;
    }
    
    // Si solo se genera código, procesar directamente
    await this.generarCodigoRecarga();
  }

  async generarCodigoRecarga() {
    // Generar código de recarga aleatorio
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 10; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    this.codigoRecarga = codigo;

    // Actualizar estado de participaciones
    const participaciones = JSON.parse(localStorage.getItem('participaciones') || '[]');
    Array.from(this.participacionesSeleccionadas).forEach(id => {
      const index = participaciones.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        if (this.importeDonacion > 0) {
          participaciones[index].estado = 'donada';
        }
        participaciones[index].codigoRecarga = this.codigoRecarga;
        participaciones[index].fechaDonacion = new Date().toISOString();
      }
    });
    localStorage.setItem('participaciones', JSON.stringify(participaciones));

    // Guardar en historial
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');
    historial.unshift({
      id: Date.now(),
      tipo: this.importeDonacion > 0 ? 'donacion' : 'codigo',
      fecha: new Date().toISOString(),
      participaciones: Array.from(this.participacionesSeleccionadas).map(id => 
        this.participaciones.find(p => p.id === id)
      ),
      importeDonacion: this.importeDonacion,
      importeCodigo: this.importeCodigo,
      codigoRecarga: this.codigoRecarga
    });
    localStorage.setItem('historial', JSON.stringify(historial));

    // Mostrar mensaje de éxito
    if (this.importeDonacion > 0) {
      this.tipoMensaje = 'donacion';
      this.mostrarMensajeExito = true;
    } else {
      this.tipoMensaje = 'codigo';
      this.mostrarMensajeExito = true;
    }

    this.resetSeleccion();
    this.loadParticipaciones();
  }

  async omitirDatos() {
    this.mostrarModalDatos = false;
    await this.generarCodigoRecarga();
  }

  async enviarDatos() {
    if (!this.datosPersonales.nombre || !this.datosPersonales.apellidos || !this.datosPersonales.nif) {
      const alert = await this.alertController.create({
        header: 'Datos incompletos',
        message: 'Por favor, completa todos los campos requeridos.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.mostrarModalDatos = false;
    await this.generarCodigoRecarga();
  }

  cerrarMensajeExito() {
    this.mostrarMensajeExito = false;
    this.datosPersonales = { nombre: '', apellidos: '', nif: '' };
    this.numeroCuenta = '';
    this.codigoRecarga = '';
  }

  volver() {
    this.resetSeleccion();
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
