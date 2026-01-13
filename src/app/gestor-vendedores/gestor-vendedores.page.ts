import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestor-vendedores',
  templateUrl: './gestor-vendedores.page.html',
  styleUrls: ['./gestor-vendedores.page.scss'],
  standalone: false,
})
export class GestorVendedoresPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

}

