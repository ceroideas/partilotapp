import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-escaner',
  templateUrl: './escaner.page.html',
  styleUrls: ['./escaner.page.scss'],
  standalone: false,
})
export class EscanerPage implements OnInit {

  modoEscaneo: boolean = true;
  ticketEscaneado: any = null;
  imagenTicket: string | null = null;

  constructor(
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.modoEscaneo = true;
  }

  async scanQR() {
    // TODO: Implementar escáner QR real con plugin de Capacitor
    // Por ahora simulamos el escaneo
    this.modoEscaneo = false;
    
    // Simular datos del ticket escaneado - puedes cambiar esto para probar diferentes casos
    // Caso 1: Sin premio
    this.ticketEscaneado = {
      numero: '60089',
      entidad: 'Peña Rondalosa',
      fechaSorteo: '22/12/25',
      importeJugado: 5.00,
      donativo: 1.00,
      importeTotal: 6.00,
      numeroParticipacion: '1/0001',
      numeroReferencia: '0000000000000000000',
      premio: 0.00,
      tipo: 'social' // 'social' o 'nacional'
    };
    
    // Para probar con premio, descomenta esto:
    // this.ticketEscaneado = {
    //   numero: '60089',
    //   entidad: 'Lotería Nacional',
    //   fechaSorteo: '22/12/25',
    //   importeJugado: 20.00,
    //   donativo: 0.00,
    //   importeTotal: 20.00,
    //   numeroParticipacion: '1/0001',
    //   numeroReferencia: '0000000000000000000',
    //   premio: 20.00,
    //   tipo: 'nacional'
    // };
    
    this.imagenTicket = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  async digitalizar() {
    if (!this.ticketEscaneado) return;

    try {
      // Guardar participación
      const participacion = {
        id: Date.now(),
        numero: this.ticketEscaneado.numero,
        entidad: this.ticketEscaneado.entidad,
        fechaSorteo: this.ticketEscaneado.fechaSorteo,
        importeJugado: this.ticketEscaneado.importeJugado,
        donativo: this.ticketEscaneado.donativo,
        importeTotal: this.ticketEscaneado.importeTotal,
        numeroParticipacion: this.ticketEscaneado.numeroParticipacion,
        numeroReferencia: this.ticketEscaneado.numeroReferencia,
        imagen: this.imagenTicket,
        estado: 'activa',
        fechaDigitalizacion: new Date().toISOString()
      };

      const participaciones = JSON.parse(localStorage.getItem('participaciones') || '[]');
      participaciones.push(participacion);
      localStorage.setItem('participaciones', JSON.stringify(participaciones));

      // Guardar en historial
      const historial = JSON.parse(localStorage.getItem('historial') || '[]');
      historial.unshift({
        id: Date.now(),
        tipo: 'digitalizacion',
        fecha: new Date().toISOString(),
        participacion: participacion
      });
      localStorage.setItem('historial', JSON.stringify(historial));

      const alert = await this.alertController.create({
        header: 'Digitalización exitosa',
        message: 'La participación ha sido guardada en tu cartera.',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigate(['/tabs/tab1']); // Ir a cartera
            }
          }
        ]
      });
      await alert.present();
    } catch (error) {
      console.error('Error digitalizando:', error);
      this.mostrarAlerta('Error', 'No se pudo digitalizar la participación.');
    }
  }

  async gestionarPremio() {
    if (!this.ticketEscaneado || !this.ticketEscaneado.premio || this.ticketEscaneado.premio === 0) return;

    // Navegar a gestión de premio
    this.router.navigate(['/cobrar-gestionar']);
  }

  volverAEscanear() {
    this.modoEscaneo = true;
    this.ticketEscaneado = null;
    this.imagenTicket = null;
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
