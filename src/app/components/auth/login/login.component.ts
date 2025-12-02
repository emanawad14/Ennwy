import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from './../../../services/auth.service';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { key } from '../../../core/config/localStorage';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, RouterModule, NgSelectComponent, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private subscriptions = signal<Subscription[]>([]);
  type = signal<string>('phone');

  loginForm!: FormGroup;
  showEye = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  countriesPhoneCode = signal<any[]>([]);
  otpSent = signal<boolean>(false);

  // العلم الحالي لعرضه بجانب الـ ng-select
  currentFlag = signal<string>('images/auth/flag_uae.gif');

  private phoneLenByDialCode: Record<string, number> = {
    '+20': 10, '+965': 8, '+974': 8, '+963': 9, '+971': 9
  };

  // ربط كود الاتصال بملف الـ GIF في مسارك
  private flagFileByDialCode: Record<string, string> = {
    '+971': 'flag_uae.gif',
    '+963': 'flag_syria.gif',
    '+974': 'flag_qatar.gif',
    '+965': 'flag_kuwait.gif',
    '+20' : 'flag_egypt.gif'
  };

  constructor(
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __AuthService: AuthService,
    private readonly __Router: Router,
    private fb: FormBuilder,
    private readonly alertservice: AlertService,
  ) {
    this.loginForm = this.fb.group(
      { code: [null], email: ['', [Validators.required]], password: ['', [Validators.required]], otp: [''] },
      { updateOn: 'blur' },
    );
  }

  get formControls(): any { return this.loginForm?.controls; }

  ngOnInit(): void {
    const qpSub = this.__ActivatedRoute.queryParamMap.subscribe((params) => {
      this.type.set(params.get('type') || 'phone');
      this.applyPhoneValidators();
    });
    this.subscriptions().push(qpSub);

    // أكواد الدول
    const list = this.__AuthService.getCountriesPhoneCode() || [];
    const prepared = list.map((x: any) => ({ ...x, dial: this.normalizeDialCode(x?.code) }));
    this.countriesPhoneCode.set(prepared);

    // افتراضي: سوريا أو أول عنصر
    const defaultSyria =
      prepared.find((x: any) =>
        String(x?.code || '').includes('963') || String(x?.id) === '69' || /syria/i.test(String(x?.name || ''))
      ) ?? prepared[0] ?? null;

    this.loginForm.get('code')?.setValue(defaultSyria);
    this.updateFlagFromForm(); // ضبط العلم الابتدائي

    this.applyPhoneValidators();

    // أي تغيير في كود الدولة يحدّث العلم
    const codeSub = this.loginForm.get('code')?.valueChanges.subscribe(() => {
      this.applyPhoneValidators();
      this.updateFlagFromForm();
    });
    const phoneSub = this.loginForm.get('email')?.valueChanges.subscribe(() => this.applyPhoneValidators());
    if (codeSub) this.subscriptions().push(codeSub);
    if (phoneSub) this.subscriptions().push(phoneSub);
  }

  // helper لضبط العلم الحالي
  private updateFlagFromForm(): void {
    const dial = this.normalizeDialCode(this.loginForm?.value?.code?.code);
    const file = this.flagFileByDialCode[dial] || 'flag_uae.gif';
    this.currentFlag.set(`images/auth/${file}`);
  }

  togglePassword(): void { this.showEye.update((show) => !show); }
  clearValidationErrors(control: AbstractControl): void { control.markAsPending(); }

  private normalizeDialCode(raw: any): string {
    const digits = String(raw ?? '').replace(/[^\d]/g, '');
    return digits ? `+${digits}` : '';
  }

  private normalizeLocalPhone(raw: any): string {
    const digitsOnly = String(raw ?? '').replace(/[^\d]/g, '');
    const noLeadingZeros = digitsOnly.replace(/^0+/, '');
    return noLeadingZeros || digitsOnly;
  }

  requiredLen(): number | null {
    const dialRaw = this.loginForm?.value?.code?.code;
    const dial = this.normalizeDialCode(dialRaw);
    return this.phoneLenByDialCode[dial] ?? null;
  }

  private phoneByCountryValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (this.type() !== 'phone') return null;
      if (!control.value) return { required: true };
      const need = this.requiredLen();
      if (!need) return null;
      const normalized = this.normalizeLocalPhone(control.value);
      if (normalized.length !== need) return { phoneLength: { required: need, actual: normalized.length } };
      if (!/^\d+$/.test(String(control.value).replace(/[^\d]/g, ''))) return { digitsOnly: true };
      return null;
    };
  }

  private applyPhoneValidators(): void {
    const ctl = this.loginForm.get('email'); if (!ctl) return;
    const validators: any[] = [Validators.required];
    if (this.type() === 'phone') validators.push(this.phoneByCountryValidator());
    ctl.setValidators(validators);
    ctl.updateValueAndValidity({ emitEvent: false });
  }

  private buildPhoneUsername(): string {
    const dialCodeRaw = this.loginForm?.value?.code?.code;
    const dialCode = this.normalizeDialCode(dialCodeRaw);
    const phoneRaw = this.loginForm?.value?.email;
    const phone = this.normalizeLocalPhone(phoneRaw);
    return `${dialCode}${phone}`;
  }

  private extractMessage(res: any): string | null {
    return res?.message || res?.data?.message || res?.statusMessage || null;
  }

  login(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isLoading.set(true);

    const userName = this.type() === 'phone'
      ? this.buildPhoneUsername()
      : String(this.loginForm?.value?.email ?? '').trim();

    const data = { userName, password: this.loginForm?.value?.password, toggleLoginRegister: true };

    const loginSub: Subscription = this.__AuthService.login(data).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        const apiMsg = this.extractMessage(res);
        if (res?.success === false) { this.alertservice.errorMessage(apiMsg || 'تعذّر تسجيل الدخول.'); return; }
        if (res?.data && typeof window !== 'undefined') {
          localStorage.setItem(key.userInfo, JSON.stringify(res?.data));
          this.alertservice.successMessage(apiMsg || 'تم تسجيل الدخول بنجاح ✅');
          this.__Router.navigate(['/home']);
          return;
        }
        this.alertservice.errorMessage(apiMsg || 'لم يتم استلام بيانات المستخدم.');
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const errMsg = err?.error?.message || err?.error?.Message || err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.';
        this.alertservice.errorMessage(errMsg);
      }
    });

    this.subscriptions().push(loginSub);
  }

  ngOnDestroy(): void { this.subscriptions()?.forEach(sb => sb?.unsubscribe()); }
}
