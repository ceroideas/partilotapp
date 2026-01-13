import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resultados',
  templateUrl: './resultados.page.html',
  styleUrls: ['./resultados.page.scss'],
  standalone: false,
})
export class ResultadosPage implements OnInit {

  resultados: any[] = [];
  rolActual: 'usuario' | 'vendedor' | 'gestor' = 'usuario';

  constructor(private router: Router) { }

  ngOnInit() {
    this.detectarRol();
    this.loadResultados();
  }

  ionViewWillEnter() {
    this.detectarRol();
    this.loadResultados();
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

  loadResultados() {
    try {
      const resultadosGuardados = JSON.parse(localStorage.getItem('resultados') || '[]');
      
      if (resultadosGuardados.length > 0) {
        this.resultados = resultadosGuardados;
      } else {
        // Datos de ejemplo basados en el diseño
        this.resultados = [
          { 
            id: 1,
            numero: 30,
            total: 25,
            fecha: '22/12/25',
            primerPremio: '06.190',
            segundoPremio: '32.730',
            extracciones: ['1', '3', '0'],
            mostrarAcciones: false
          },
          { 
            id: 2,
            numero: 29,
            total: 25,
            fecha: '22/12/25',
            primerPremio: '15.234',
            segundoPremio: '45.678',
            extracciones: ['2', '5', '1'],
            mostrarAcciones: false
          },
          { 
            id: 3,
            numero: 28,
            total: 25,
            fecha: '22/12/25',
            primerPremio: '23.456',
            segundoPremio: '67.890',
            extracciones: ['0', '8', '4'],
            mostrarAcciones: false
          },
          { 
            id: 4,
            numero: 27,
            total: 25,
            fecha: '22/12/25',
            primerPremio: '34.567',
            segundoPremio: '78.901',
            extracciones: ['1', '6', '2'],
            mostrarAcciones: false
          },
          { 
            id: 5,
            numero: 26,
            total: 25,
            fecha: '22/12/25',
            primerPremio: '45.678',
            segundoPremio: '89.012',
            extracciones: ['3', '7', '9'],
            mostrarAcciones: false
          }
        ];
        localStorage.setItem('resultados', JSON.stringify(this.resultados));
      }
    } catch (error) {
      console.error('Error cargando resultados:', error);
      this.resultados = [];
    }
  }

}
