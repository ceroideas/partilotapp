import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestor-participaciones',
  templateUrl: './gestor-participaciones.page.html',
  styleUrls: ['./gestor-participaciones.page.scss'],
  standalone: false,
})
export class GestorParticipacionesPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

}
