import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { catchError, defer, map, of, switchMap } from 'rxjs';
import { coerceToArrayBuffer, coerceToBase64Url } from '../utils';
import { DeviceLoginStartResponse } from './interfaces';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatInputModule],
  template: `
    <div class="text-3xl">User Login</div>

    <mat-form-field>
      <mat-label>Username</mat-label>
      <input matInput [formControl]="username" />
    </mat-form-field>

    <div>
      <button mat-raised-button color="primary" (click)="login()">Login</button>
    </div>
  `,
})
export class LoginComponent {
  private http = inject(HttpClient);
  private dialogService = inject(DialogService);

  protected username = new FormControl('mike', { nonNullable: true });

  private deviceLoginStartRequest(username: string) {
    return this.http
      .post<DeviceLoginStartResponse>(
        'http://localhost:5295/device-login/start',
        {
          username,
        }
      )
      .pipe(map(this.toPublicKeyCredentialRequestOptions));
  }

  private toPublicKeyCredentialRequestOptions(data: DeviceLoginStartResponse) {
    return {
      ...data,
      challenge: coerceToArrayBuffer(data.challenge),
      allowCredentials: data.allowCredentials.map((credential) => ({
        ...credential,
        id: coerceToArrayBuffer(credential.id),
      })),
    } as PublicKeyCredentialRequestOptions;
  }

  private getDeviceAssertion(options: PublicKeyCredentialRequestOptions) {
    console.log(options);
    return defer(
      () =>
        navigator.credentials.get({
          publicKey: options,
        }) as Promise<PublicKeyCredential>
    ).pipe(map(this.toRequestCredential));
  }

  private toRequestCredential(credential: PublicKeyCredential) {
    return {
      authenticatorAttachment: credential.authenticatorAttachment,
      id: credential.id,
      rawId: coerceToBase64Url(credential.rawId),
      response: {
        authenticatorData: coerceToBase64Url(
          (credential.response as any).authenticatorData
        ),
        clientDataJSON: coerceToBase64Url(credential.response.clientDataJSON),
        signature: coerceToBase64Url((credential.response as any).signature),
        userHandle: coerceToBase64Url((credential.response as any).userHandle),
      },
      type: credential.type,
    };
  }

  private deviceLoginEndRequest(username: string, assertion: object) {
    return this.http.post('http://localhost:5295/device-login/end', {
      username,
      assertion,
    });
  }

  protected login() {
    of(this.username.value)
      .pipe(
        // 1. 從後端取得登入裝置時使用 WebAuthn 需要的設定資訊
        switchMap((username) => this.deviceLoginStartRequest(username)),
        // 2. 使用 WebAuthn API 驗證裝置
        switchMap((options) => this.getDeviceAssertion(options)),
        // 3. 將裝置驗證結果傳回後端
        switchMap((assertion) =>
          this.deviceLoginEndRequest(this.username.value, assertion)
        )
      )
      .subscribe({
        next: (success: any) => {
          console.log(success);
          this.dialogService.openDialog('Login success', 'Welcome', 'done');
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
