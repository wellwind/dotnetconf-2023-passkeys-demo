import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialog = inject(MatDialog);

  openDialog(message: string, title: string, icon: string) {
    this.dialog.open(DialogComponent, {
      data: {
        message,
        title,
        icon,
      },
    });
  }
}
