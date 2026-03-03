import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertModalService } from '../../services/alert-modal.service';

@Component({
  selector: 'app-alert-modal',
  templateUrl: './alert-modal.component.html',
  styleUrls: ['./alert-modal.component.scss'],
  standalone: false
})
export class AlertModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  title = '';
  message = '';
  private sub?: Subscription;

  constructor(public alertModal: AlertModalService) {}

  ngOnInit(): void {
    this.sub = this.alertModal.current.subscribe((v) => {
      this.isOpen = v !== null;
      this.title = v?.title ?? '';
      this.message = v?.message ?? '';
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  cerrar(): void {
    this.alertModal.dismiss();
  }
}
