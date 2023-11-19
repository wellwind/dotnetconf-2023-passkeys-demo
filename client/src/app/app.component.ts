import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, MatToolbarModule, MatDividerModule],
  template: `
    <mat-toolbar color="primary">
      <span>Passkeys Demo</span>
    </mat-toolbar>

    <div class="w-full mt-6 text-center text-lg">
      <span class="underline text-indigo-500 cursor-pointer"
        ><a routerLink="/login">Login</a></span
      >
      <span class="mx-2">|</span>
      <span class="underline text-indigo-500 cursor-pointer"
        ><a routerLink="/device-register">Device Register</a></span
      >
    </div>

    <div class="w-full mt-6 text-center">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {}
