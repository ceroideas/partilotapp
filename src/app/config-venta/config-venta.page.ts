import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-config-venta',
  templateUrl: './config-venta.page.html',
  styleUrls: ['./config-venta.page.scss'],
  standalone: false,
})
export class ConfigVentaPage implements OnInit {

  precioPorDefecto: number = 5.00;
  descuentoCantidad: number = 0;
  aceptaEfectivo: boolean = true;
  aceptaTarjeta: boolean = true;
  aceptaTransferencia: boolean = false;
  notificarVentas: boolean = true;
  notificarCobros: boolean = true;

  constructor(private alertController: AlertController) { }

  ngOnInit() {
    this.cargarConfiguracion();
  }

  cargarConfiguracion() {
    try {
      const config = JSON.parse(localStorage.getItem('configVenta') || '{}');
      
      if (Object.keys(config).length > 0) {
        this.precioPorDefecto = config.precioPorDefecto || 5.00;
        this.descuentoCantidad = config.descuentoCantidad || 0;
        this.aceptaEfectivo = config.aceptaEfectivo !== undefined ? config.aceptaEfectivo : true;
        this.aceptaTarjeta = config.aceptaTarjeta !== undefined ? config.aceptaTarjeta : true;
        this.aceptaTransferencia = config.aceptaTransferencia || false;
        this.notificarVentas = config.notificarVentas !== undefined ? config.notificarVentas : true;
        this.notificarCobros = config.notificarCobros !== undefined ? config.notificarCobros : true;
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }

  async guardarConfiguracion() {
    try {
      const config = {
        precioPorDefecto: this.precioPorDefecto,
        descuentoCantidad: this.descuentoCantidad,
        aceptaEfectivo: this.aceptaEfectivo,
        aceptaTarjeta: this.aceptaTarjeta,
        aceptaTransferencia: this.aceptaTransferencia,
        notificarVentas: this.notificarVentas,
        notificarCobros: this.notificarCobros
      };

      localStorage.setItem('configVenta', JSON.stringify(config));

      const alert = await this.alertController.create({
        header: 'Configuración guardada',
        message: 'Tus preferencias han sido guardadas correctamente.',
        buttons: ['OK']
      });
      await alert.present();
    } catch (error) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo guardar la configuración. Intenta nuevamente.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

}
