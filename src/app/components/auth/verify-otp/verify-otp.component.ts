import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { OtpInputComponent } from './otp-input/otp-input.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

const STORAGE_USER_KEY = 'EnnwyUserInfo';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, OtpInputComponent, TranslateModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOtpComponent implements OnInit {
  private subscriptions = signal<Subscription[]>([]);
  username = signal<string>('');
  isLoading = signal<boolean>(false);
  returnUrl = signal<string>('');

  // Debug (اختياري)
  debug = signal<boolean>(false);
  lastResponse = signal<any>(null);
  lastError = signal<any>(null);

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _auth: AuthService,
    private readonly _router: Router,
  ) {}

  ngOnInit(): void {
    this._route.queryParams.subscribe((param) => {
      this.username.set(String(param?.['username'] || '').trim());
      this.returnUrl.set(String(param?.['returnUrl'] || '').trim());
      const dbg = String(param?.['debug'] || '').trim().toLowerCase();
      this.debug.set(dbg === '1' || dbg === 'true');
    });
  }

  private formatUserNameForBackend(raw: string): string {
    const v = (raw || '').trim();
    if (v.startsWith('+')) return v;
    return '+2' + v; // عدّل حسب كود البلد لو لزم
  }

  private mapServerMessage(msg?: string): string {
    switch ((msg || '').toLowerCase()) {
      case 'invalidotpcode': return 'رمز التحقق غير صحيح';
      case 'otpexpired':     return 'انتهت صلاحية رمز التحقق، أعد الإرسال من فضلك';
      default:               return msg || 'تعذر التحقق من الرمز';
    }
  }

  verifyOtp(otp: string) {
    if (this.isLoading()) return; // منع ضغط مكرر
    this.isLoading.set(true);
    this.lastResponse.set(null);
    this.lastError.set(null);

    // افتح لودر بدون await
    Swal.fire({
      title: 'جاري التحقق...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      backdrop: true
    });

    const data = {
      userName: this.formatUserNameForBackend(this.username()),
      code: otp
    };

    console.log('[VerifyOtp] Request:', data);

    const sb = this._auth.verifyOtp(data)
      .pipe(
        finalize(() => {
          // يتنفّذ دايمًا سواء success أو error
          this.isLoading.set(false);
          Swal.close();
        })
      )
      .subscribe({
        next: async (res: any) => {
          console.log('[VerifyOtp] Response:', res);
          this.lastResponse.set(res);

          if (!res?.success || !res?.data) {
            const msg = this.mapServerMessage(res?.message);
            await Swal.fire({
              icon: 'error',
              title: 'فشل التحقق',
              text: msg,
              confirmButtonText: 'حسنًا'
            });
            return;
          }

          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.data));
          } catch (e) {
            console.warn('[VerifyOtp] localStorage write failed:', e);
          }

          await Swal.fire({
            icon: 'success',
            title: 'تم التحقق بنجاح',
            showConfirmButton: false,
            timer: 20000
          });

          const target = this.returnUrl();
          if (target) this._router.navigateByUrl(target);
          else this._router.navigate(['/home']);
        },
        error: async (err: any) => {
          console.error('[VerifyOtp] Error:', err);
          this.lastError.set(err);

          const apiMsg = err?.error?.message || err?.message;
          const msg = this.mapServerMessage(apiMsg);

          await Swal.fire({
            icon: 'error',
            title: 'فشل التحقق',
            text: msg,
            confirmButtonText: 'حسنًا'
          });
        }
      });

    this.subscriptions().push(sb);
  }

  resendOtp() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.lastError.set(null);

    // نقدر نعرض لودر صغير أو Toast، هنا هنسيبه بدون لودر عام
    const data = {
      userName: this.formatUserNameForBackend(this.username()),
    };

    console.log('[ResendOtp] Request:', data);

    const sb = this._auth.reSendOtp(data)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: async (res: any) => {
          console.log('[ResendOtp] Response:', res);
          this.lastResponse.set(res);
          await Swal.fire({
            icon: 'success',
            title: 'تم إرسال كود جديد',
            timer: 900,
            showConfirmButton: false
          });
        },
        error: async (err: any) => {
          console.error('[ResendOtp] Error:', err);
          this.lastError.set(err);
          const apiMsg = err?.error?.message || err?.message;
          const msg = this.mapServerMessage(apiMsg);
          await Swal.fire({
            icon: 'error',
            title: 'تعذر الإرسال',
            text: msg,
            confirmButtonText: 'حسنًا'
          });
        }
      });

    this.subscriptions().push(sb);
  }

  ngOnDestroy(): void {
    this.subscriptions()?.forEach(sb => sb?.unsubscribe());
  }
}
