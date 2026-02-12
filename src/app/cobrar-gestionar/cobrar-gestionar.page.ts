import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { CarteraService } from '../core/services/cartera.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-cobrar-gestionar',
  templateUrl: './cobrar-gestionar.page.html',
  styleUrls: ['./cobrar-gestionar.page.scss'],
  standalone: false,
})
export class CobrarGestionarPage implements OnInit {

  participaciones: any[] = [];
  participacionesSeleccionadas: Set<number> = new Set();
  modoCobro = true;
  modoDonacion = false;
  loading = false;
  
  // Modales como action sheets
  mostrarModalDatos = false;
  mostrarModalCuenta = false;
  mostrarModalConfigDonacion = false;
  mostrarMensajeExito = false;
  
  datosPersonales = {
    nombre: '',
    apellidos: '',
    nif: ''
  };
  
  datosGuardados = false; // Flag para saber si los datos fueron guardados
  
  ibanFormateado = '';
  importeTotal = 0;
  
  // Para configuración de donación
  importeDonacion: number = 0;
  importeCodigo: number = 0;
  porcentajeDonacion: number = 50;
  
  tipoMensaje: 'cobro' | 'donacion' | 'codigo' = 'cobro';
  codigoRecarga: string = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private carteraService: CarteraService
  ) { }

  ngOnInit() {
    this.loadParticipaciones();
  }

  ionViewWillEnter() {
    this.loadParticipaciones();
    this.resetSeleccion();
  }

  loadParticipaciones() {
    this.loading = true;
    this.carteraService.getCobrables().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && Array.isArray(res.participations)) {
          this.participaciones = res.participations;
          return;
        }
        this.participaciones = [];
      },
      error: () => {
        this.loading = false;
        this.participaciones = [];
      }
    });
  }

  resetSeleccion() {
    this.participacionesSeleccionadas.clear();
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

  toggleSeleccion(participacion: any, event?: Event) {
    event?.stopPropagation();
    const id = participacion.id;
    const antes = this.participacionesSeleccionadas.size;
    if (this.participacionesSeleccionadas.has(id)) {
      this.participacionesSeleccionadas.delete(id);
    } else {
      this.participacionesSeleccionadas.add(id);
    }
    this.calcularImporteTotal();
    if (antes === 0 && this.participacionesSeleccionadas.size >= 1) {
      this.mostrarModalDatos = true;
    }
  }

  estaSeleccionada(participacionId: number): boolean {
    return this.participacionesSeleccionadas.has(participacionId);
  }

  calcularImporteTotal() {
    this.importeTotal = Array.from(this.participacionesSeleccionadas)
      .reduce((total, id) => {
        const p = this.participaciones.find(x => x.id === id);
        return total + (p?.premio ?? p?.importeTotal ?? 0);
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
    // Solo resetear los datos si NO fueron guardados (se canceló)
    if (!this.datosGuardados) {
      this.datosPersonales = { nombre: '', apellidos: '', nif: '' };
    }
    this.datosGuardados = false; // Resetear el flag
  }

  /** Validar NIF/NIE/DNI/CIF español (misma lógica que backend) */
  validarDocumentoEspanol(documento: string): boolean {
    if (!documento || documento.trim() === '') return false;
    
    const doc = documento.trim().toUpperCase();
    
    // Intentar validar como NIF, NIE, DNI o CIF
    return this.validarNif(doc) 
        || this.validarNie(doc) 
        || this.validarDni(doc)
        || this.validarCif(doc);
  }

  /** Validar NIF (8 dígitos + 1 letra) */
  private validarNif(documento: string): boolean {
    if (!/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(documento)) {
      return false;
    }
    const number = documento.substring(0, 8);
    const letter = documento.substring(8, 9);
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const expectedLetter = letters[parseInt(number) % 23];
    return letter === expectedLetter;
  }

  /** Validar NIE (X/Y/Z + 7 dígitos + 1 letra) */
  private validarNie(documento: string): boolean {
    if (!/^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(documento)) {
      return false;
    }
    const firstChar = documento[0];
    const number = documento.substring(1, 8);
    const letter = documento.substring(8, 9);
    const replaceMap: { [key: string]: string } = { 'X': '0', 'Y': '1', 'Z': '2' };
    const fullNumber = replaceMap[firstChar] + number;
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const expectedLetter = letters[parseInt(fullNumber) % 23];
    return letter === expectedLetter;
  }

  /** Validar DNI (igual que NIF) */
  private validarDni(documento: string): boolean {
    return this.validarNif(documento);
  }

  /** Validar CIF (1 letra + 7 dígitos + 1 letra/dígito) */
  private validarCif(documento: string): boolean {
    if (!/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(documento)) {
      return false;
    }
    const firstChar = documento[0];
    const number = documento.substring(1, 8);
    const control = documento[8];
    const letters = 'JABCDEFGHI';
    
    const checkStandard = this.cifControlDigit(number, [0, 2, 4, 6]);
    const validStandard = control === String(checkStandard) || control === letters[checkStandard];
    
    // A, B, E, H: solo dígito numérico
    if (['A', 'B', 'E', 'H'].includes(firstChar)) {
      return control === String(checkStandard);
    }
    
    // G: número o letra; y variante con doble solo 0,2,4
    if (firstChar === 'G') {
      const checkAlternate = this.cifControlDigit(number, [0, 2, 4]);
      const validAlternate = control === String(checkAlternate) || control === letters[checkAlternate];
      return validStandard || validAlternate;
    }
    
    // Resto: letra de control
    return control === letters[checkStandard];
  }

  /** Calcula el dígito de control CIF */
  private cifControlDigit(number: string, doublePositions: number[]): number {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(number[i], 10);
      if (doublePositions.includes(i)) {
        const doubled = digit * 2;
        sum += Math.floor(doubled / 10) + (doubled % 10);
      } else {
        sum += digit;
      }
    }
    return (10 - (sum % 10)) % 10;
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

    // Validar NIF/NIE/DNI/CIF antes de continuar
    const nifLimpio = this.datosPersonales.nif.trim().toUpperCase();
    if (!this.validarDocumentoEspanol(nifLimpio)) {
      const alert = await this.alertController.create({
        header: 'NIF/NIE no válido',
        message: 'El campo NIF/NIE no es un NIF, NIE, DNI o CIF válido.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Marcar que los datos fueron guardados antes de cerrar
    this.datosGuardados = true;
    this.mostrarModalDatos = false;
    
    if (this.modoCobro) {
      this.mostrarModalCuenta = true;
    }
  }

  cerrarModalCuenta() {
    this.mostrarModalCuenta = false;
    this.ibanFormateado = '';
  }

  cerrarModalConfigDonacion() {
    this.mostrarModalConfigDonacion = false;
  }

  /** Formatear IBAN con espacios: 12 1234 1234 12 1234567890 (sin ES, está como addon) */
  formatearIban(val: string): string {
    const digits = val.replace(/\D/g, '').slice(0, 22);
    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 10));
    if (digits.length > 10) parts.push(digits.slice(10, 12));
    if (digits.length > 12) parts.push(digits.slice(12, 22));
    return parts.join(' ');
  }

  onIbanInput(event: any) {
    const raw = event?.detail?.value ?? event?.target?.value ?? this.ibanFormateado ?? '';
    const val = String(raw).replace(/\D/g, '').slice(0, 22);
    this.ibanFormateado = this.formatearIban(val);
  }

  /** Validar IBAN español (24 caracteres ES + 22 dígitos, MOD-97-10) */
  validarIbanEspanol(iban: string): boolean {
    const limpio = iban.toUpperCase().replace(/\s/g, '').trim();
    if (!limpio.startsWith('ES') || limpio.length !== 24) return false;
    const digitos = limpio.slice(2);
    if (!/^\d+$/.test(digitos)) return false;
    const rearranged = limpio.slice(4) + limpio.slice(0, 4);
    let numeric = '';
    for (let i = 0; i < rearranged.length; i++) {
      const c = rearranged[i];
      if (/[A-Z]/.test(c)) numeric += (c.charCodeAt(0) - 55);
      else numeric += c;
    }
    let remainder = 0;
    for (let i = 0; i < numeric.length; i++) {
      remainder = (remainder * 10 + parseInt(numeric[i], 10)) % 97;
    }
    return remainder === 1;
  }

  async procesarCobro() {
    // Añadir "ES" al inicio si no está presente (ya que está como addon visual)
    const ibanSinEspacios = this.ibanFormateado.replace(/\s/g, '').trim();
    const ibanLimpio = ibanSinEspacios.startsWith('ES') ? ibanSinEspacios : 'ES' + ibanSinEspacios;
    if (!ibanLimpio || ibanLimpio.length !== 24) {
      const alert = await this.alertController.create({
        header: 'IBAN incompleto',
        message: 'Introduce los 22 dígitos del número de cuenta (ES está incluido).',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
    if (!this.validarIbanEspanol(ibanLimpio)) {
      const alert = await this.alertController.create({
        header: 'IBAN no válido',
        message: 'El IBAN no es correcto. Comprueba los dígitos de control.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const ids = Array.from(this.participacionesSeleccionadas);
    this.carteraService.registrarCobro({
      participation_ids: ids,
      nombre: this.datosPersonales.nombre.trim(),
      apellidos: this.datosPersonales.apellidos.trim(),
      nif: this.datosPersonales.nif.trim().toUpperCase(),
      iban: ibanLimpio,
      importe_total: this.importeTotal
    }).subscribe({
      next: () => {
        // Cerrar el modal de IBAN
        this.mostrarModalCuenta = false;
        this.ibanFormateado = '';
        this.tipoMensaje = 'cobro';
        this.resetSeleccion();
        // Recargar participaciones para reflejar el nuevo estado "cobrada"
        this.loadParticipaciones();
        // Notificar a la cartera principal para que recargue
        this.carteraService.notifyParticipacionesChanged();
        this.mostrarMensajeExito = true;
      },
      error: async (err) => {
        const msg = err.error?.message || 'No se pudo registrar el cobro.';
        const alert = await this.alertController.create({
          header: 'Error',
          message: msg,
          buttons: ['OK']
        });
        await alert.present();
      }
    });
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
    } else {
      this.tipoMensaje = 'codigo';
    }

    this.resetSeleccion();
    this.loadParticipaciones();
    this.mostrarMensajeExito = true;
  }

  cerrarMensajeExito() {
    this.mostrarMensajeExito = false;
    this.datosPersonales = { nombre: '', apellidos: '', nif: '' };
    this.ibanFormateado = '';
    this.codigoRecarga = '';
    this.datosGuardados = false; // Resetear el flag
    // Recargar participaciones para asegurar que se refleje el nuevo estado
    this.loadParticipaciones();
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return path.startsWith('storage/') ? `${base}/${path}` : `${base}/storage/${path}`;
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
