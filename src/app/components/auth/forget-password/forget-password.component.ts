import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, NgSelectComponent],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent {
  private subscriptions = signal<Subscription[]>([]);

  forgetPasswordForm!: FormGroup;
  isLoading = signal<boolean>(false);

  countriesPhoneCode = signal<any[]>([]);

  /** أطوال الرقم (بعد حذف أصفار البداية) لكل دولة */
  private phoneLenByDialCode: Record<string, number> = {
    '+20': 10,  // مصر
    '+965': 8,  // الكويت
    '+974': 8,  // قطر
    '+963': 9,  // سوريا
    '+971': 9   // الإمارات
  };

  constructor(
    private readonly __AuthService: AuthService,
    private readonly __Router: Router,
    private fb: FormBuilder,
  ) {
    this.forgetPasswordForm = this.fb.group(
      {
        code: [null],                 // كود الدولة (ng-select item)
        phone: ['', [Validators.required]] // رقم الهاتف المحلي
      },
      { updateOn: 'blur' }
    );
  }

  get formControls(): any { return this.forgetPasswordForm?.controls; }

  ngOnInit(): void {
    // جلب أكواد الدول
    const list = this.__AuthService.getCountriesPhoneCode() || [];
    this.countriesPhoneCode.set(list);

    // الافتراضي: سوريا (+963)
    const defaultSyria =
      list.find((x: any) =>
        String(x?.code || '').includes('963') ||
        String(x?.id) === '69' ||
        /syria/i.test(String(x?.name || ''))
      ) ?? list[0] ?? null;
    this.forgetPasswordForm.get('code')?.setValue(defaultSyria);

    // حقن الفاليديشِن الديناميكي حسب الدولة + التحديث عند التغيير
    this.applyPhoneValidators();
    const codeSub = this.forgetPasswordForm.get('code')?.valueChanges.subscribe(() => this.applyPhoneValidators());
    const phoneSub = this.forgetPasswordForm.get('phone')?.valueChanges.subscribe(() => this.applyPhoneValidators());
    if (codeSub) this.subscriptions().push(codeSub);
    if (phoneSub) this.subscriptions().push(phoneSub);
  }

  clearValidationErrors(control: AbstractControl): void {
    control.markAsPending();
  }

  /** تنظيف كود الدولة: أرقام فقط وإضافة + مرة واحدة */
  private normalizeDialCode(raw: any): string {
    const digits = String(raw ?? '').replace(/[^\d]/g, '');
    return digits ? `+${digits}` : '';
  }

  /** تنظيف الهاتف: أرقام فقط ثم حذف كل الأصفار من البداية */
  private normalizeLocalPhone(raw: any): string {
    const digitsOnly = String(raw ?? '').replace(/[^\d]/g, '');
    const noLeadingZeros = digitsOnly.replace(/^0+/, '');
    return noLeadingZeros || digitsOnly;
  }

  /** طول مطلوب حسب الدولة المختارة */
  private requiredLen(): number | null {
    const dialRaw = this.forgetPasswordForm?.value?.code?.code;
    const dial = this.normalizeDialCode(dialRaw);
    return this.phoneLenByDialCode[dial] ?? null;
  }

  /** فاليديشِن ديناميكي لطول الموبايل حسب الدولة */
  private phoneByCountryValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return { required: true };

      const need = this.requiredLen();
      if (!need) return null; // دولة غير معرفة في الجدول: لا نتحقق من الطول

      const normalized = this.normalizeLocalPhone(control.value);
      if (!/^\d+$/.test(String(control.value).replace(/[^\d]/g, ''))) {
        return { digitsOnly: true };
      }
      if (normalized.length !== need) {
        return { phoneLength: { required: need, actual: normalized.length } };
      }
      return null;
    };
  }

  /** إعادة حقن الفاليديشِن على حقل الهاتف */
  private applyPhoneValidators(): void {
    const ctl = this.forgetPasswordForm.get('phone');
    if (!ctl) return;
    ctl.setValidators([Validators.required, this.phoneByCountryValidator()]);
    ctl.updateValueAndValidity({ emitEvent: false });
  }

  /** بناء userName بالشكل +<code><local> بعد إزالة أصفار البداية */
  private buildPhoneUsername(): string {
    const dialCodeRaw = this.forgetPasswordForm?.value?.code?.code;
    const dialCode = this.normalizeDialCode(dialCodeRaw);
    const phoneRaw = this.forgetPasswordForm?.value?.phone;
    const phone = this.normalizeLocalPhone(phoneRaw);
    return `${dialCode}${phone}`;
  }

  requestPasswordReset(): void {
    if (this.forgetPasswordForm.invalid) {
      this.forgetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const data = { userName: this.buildPhoneUsername() };

    const sub = this.__AuthService.requestPasswordReset(data).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res?.data) {
          this.__Router.navigate(
            ['/auth/reset-password'],
            { queryParams: { username: data.userName } }
          );
        }
      },
      error: () => { this.isLoading.set(false); }
    });
    this.subscriptions().push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions()?.forEach((sb) => sb ? sb.unsubscribe() : null);
  }
}
