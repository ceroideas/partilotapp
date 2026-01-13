import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestor-pago',
  templateUrl: './gestor-pago.page.html',
  styleUrls: ['./gestor-pago.page.scss'],
  standalone: false,
})
export class GestorPagoPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

}

