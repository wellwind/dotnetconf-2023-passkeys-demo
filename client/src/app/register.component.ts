import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { defer, map, of, switchMap } from 'rxjs';
import { coerceToArrayBuffer, coerceToBase64Url } from '../utils';
import { RegisterStartResponse } from './interfaces';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatInputModule],
  template: `
    <div class="text-3xl">Device Register</div>

    <mat-form-field>
      <mat-label>Username</mat-label>
      <input matInput [formControl]="username" />
    </mat-form-field>

    <div>
      <button mat-raised-button color="primary" (click)="register()">
        Register
      </button>
    </div>
  `,
})
export class RegisterComponent {
  private http = inject(HttpClient);
  private dialogService = inject(DialogService);

  protected username = new FormControl('mike', { nonNullable: true });

  private registerDeviceStartRequest(username: string) {
    return this.http
      .post<RegisterStartResponse>(
        'http://localhost:5295/device-register/start',
        {
          username,
        }
      )
      .pipe(map(this.toPublicKeyCredentialCreationOptions));
  }

  private toPublicKeyCredentialCreationOptions(
    data: RegisterStartResponse
  ): PublicKeyCredentialCreationOptions {
    return {
      ...data,
      user: {
        ...data.user,
        id: coerceToArrayBuffer(data.user.id),
      },
      challenge: coerceToArrayBuffer(data.challenge),
      excludeCredentials: data.excludeCredentials.map((credential) => ({
        ...credential,
        id: coerceToArrayBuffer(credential.id),
      })),
    };
  }

  private generateCredential(options: PublicKeyCredentialCreationOptions) {
    console.log(options);
    return defer(
      () =>
        navigator.credentials.create({
          publicKey: options,
        }) as Promise<PublicKeyCredential>
    ).pipe(map(this.toRegisterCredential));
  }

  private toRegisterCredential(credential: PublicKeyCredential) {
    return {
      id: credential.id,
      rawId: coerceToBase64Url(credential.rawId),
      type: credential.type,
      extends: credential.getClientExtensionResults(),
      response: {
        attestationObject: coerceToBase64Url(
          (credential.response as any).attestationObject
        ),
        clientDataJSON: coerceToBase64Url(credential.response.clientDataJSON),
      },
    };
  }

  private registerDeviceEndRequest(username: string, credential: object) {
    return this.http.post('http://localhost:5295/device-register/end', {
      username,
      credential,
    });
  }

  protected register() {
    of(this.username.value)
      .pipe(
        // 1. 從後端取得註冊裝置時使用 WebAuthn 需要的設定資訊
        switchMap((username) => this.registerDeviceStartRequest(username)),
        // 2. 使用 WebAuthn API 註冊裝置
        switchMap((option) => this.generateCredential(option)),
        // 3. 將裝置註冊資訊傳回後端
        switchMap((credential: object) =>
          this.registerDeviceEndRequest(this.username.value, credential)
        )
      )
      .subscribe({
        next: (result) => {
          console.log(result);
          this.dialogService.openDialog('Register success', 'success', 'done');
        },
        error: (error) => {
          console.error(error);
          if (error.name === 'NotAllowedError') {
            this.dialogService.openDialog(
              'cancel or timed out',
              'Fail',
              'error'
            );
          } else if (error instanceof HttpErrorResponse) {
            this.dialogService.openDialog(error.error.message, 'Fail', 'error');
          } else {
            this.dialogService.openDialog('Unknown error', 'Fail', 'error');
          }
        },
      });
  }
}
