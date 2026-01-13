import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestor-devolucion',
  templateUrl: './gestor-devolucion.page.html',
  styleUrls: ['./gestor-devolucion.page.scss'],
  standalone: false,
})
export class GestorDevolucionPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

}

