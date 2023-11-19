import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DialogData } from './dialog-data';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h1 mat-dialog-title>{{ data.title }}</h1>
    <div mat-dialog-content>
      <div class="flex flex-row items-center">
        <mat-icon>{{ data.icon }}</mat-icon>
        <p class="!m-0 !ml-2">{{ data.message }}</p>
      </div>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Ok</button>
    </div>
  `
})
export class DialogComponent {
  protected data: DialogData = inject(MAT_DIALOG_DATA);
}
