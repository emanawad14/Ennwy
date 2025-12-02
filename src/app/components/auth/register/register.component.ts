import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  // نفس أسلوب اللوجن: نضيف NgSelectComponent و CommonModule في imports
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, RouterModule, NgSelectComponent, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit, OnDestroy {
  private subscriptions = signal<Subscription[]>([]);

  registerForm!: FormGroup;
  showEye = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  countriesPhoneCode = signal<any[]>([]);
  // العلم الحالي (نفس اللوجن)
  currentFlag = signal<string>('images/auth/flag_uae.gif');

  // أطوال الأرقام حسب الدولة (بعد حذف الصفر من البداية)
  private phoneLenByDialCode: Record<string, number> = {
    '+20': 10, '+965': 8, '+974': 8, '+963': 9, '+971': 9
  };

  // خريطة صور الأعلام (نفس فكرة اللوجن)
  private flagFileByDialCode: Record<string, string> = {
    '+971': 'flag_uae.gif',
    '+963': 'flag_syria.gif',
    '+974': 'flag_qatar.gif',
    '+965': 'flag_kuwait.gif',
    '+20' : 'flag_egypt.gif'
  };

  constructor(
    private readonly __AuthService: AuthService,
    private readonly __Router: Router,
    private fb: FormBuilder,
  ) {
    // الشاشة تعرض فقط: code + phone + password
    this.registerForm = this.fb.group(
      { code: [null], phone: ['', [Validators.required]], password: ['', [Validators.required]] },
      { updateOn: 'blur' }
    );
  }

  get formControls(): any { return this.registerForm?.controls; }

  ngOnInit(): void {
    // جلب أكواد الدول من نفس المصدر المستخدم في اللوجن
    const list = this.__AuthService.getCountriesPhoneCode?.() || [];
    // نزود dial المحسوبة (زي اللوجن)
    const prepared = list.map((x: any) => ({ ...x, dial: this.normalizeDialCode(x?.code) }));
    this.countriesPhoneCode.set(prepared);

    // افتراضي: سوريا أو أول عنصر (زي اللوجن)
    const defaultSyria =
      prepared.find((x: any) =>
        String(x?.code || '').includes('963') || String(x?.id) === '69' || /syria/i.test(String(x?.name || ''))
      ) ?? prepared[0] ?? null;

    this.registerForm.get('code')?.setValue(defaultSyria);
    this.updateFlagFromForm();   // ضبط العلم الابتدائي

    // فاليديشن الطول
    this.applyPhoneValidators();

    // أي تغيير في كود الدولة يحدّث العلم + يعيد ضبط الفاليديشن
    const codeSub = this.registerForm.get('code')?.valueChanges.subscribe(() => {
      this.applyPhoneValidators();
      this.updateFlagFromForm();
    });
    const phoneSub = this.registerForm.get('phone')?.valueChanges.subscribe(() => this.applyPhoneValidators());
    if (codeSub) this.subscriptions().push(codeSub);
    if (phoneSub) this.subscriptions().push(phoneSub);
  }

  ngOnDestroy(): void { this.subscriptions()?.forEach(sb => sb?.unsubscribe()); }

  // ===== Helpers (مطابقة أسلوب اللوجن) =====
  private normalizeDialCode(raw: any): string {
    const digits = String(raw ?? '').replace(/[^\d]/g, '');
    return digits ? `+${digits}` : '';
  }
  private normalizeLocalPhone(raw: any): string {
    const digitsOnly = String(raw ?? '').replace(/[^\d]/g, '');
    const noLeadingZeros = digitsOnly.replace(/^0+/, '');
    return noLeadingZeros || digitsOnly;
  }
  private requiredLen(): number | null {
    const dialRaw = this.registerForm?.value?.code?.code; // نخزن object زي اللوجن
    const dial = this.normalizeDialCode(dialRaw);
    return this.phoneLenByDialCode[dial] ?? null;
  }
  private phoneByCountryValidator(): ValidatorFn {
    return (control: AbstractControl) => {
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
    const ctl = this.registerForm.get('phone'); if (!ctl) return;
    const validators: any[] = [Validators.required, this.phoneByCountryValidator()];
    ctl.setValidators(validators);
    ctl.updateValueAndValidity({ emitEvent: false });
  }

  // تحديث العلم (نفس منطق اللوجن: نقرأ code.code)
  private updateFlagFromForm(): void {
    const dial = this.normalizeDialCode(this.registerForm?.value?.code?.code);
    const file = this.flagFileByDialCode[dial] || 'flag_uae.gif';
    this.currentFlag.set(`images/auth/${file}`);
  }

  togglePassword(): void { this.showEye.update((show) => !show); }
  clearValidationErrors(control: AbstractControl): void { control.markAsPending(); }

  // بناء userName من الهاتف + الكود المختار (لو حبيت تستخدمه مستقبلاً)
  private buildPhoneUsername(): string {
    const dialCodeRaw = this.registerForm?.value?.code?.code; // object.code
    const dialCode = this.normalizeDialCode(dialCodeRaw);
    const phoneRaw = this.registerForm?.value?.phone;
    const phone = this.normalizeLocalPhone(phoneRaw);
    return `${dialCode}${phone}`;
  }

  // نفس منطق الارسال اللي بتستعمله في مشروعك (عدلّه حسب باك إندك)
  register(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.isLoading.set(true);

    // payload بسيط: userName/phoneNumber من الهاتف؛ ولو عندك حقول إلزامية أخرى زوّدها
    const userName = this.buildPhoneUsername();
    const data = {
      userName,                 // مثال: +9639xxxxxxxx
      email: '',                // فاضي (لو مش مطلوب)
      fullName: '',             // فاضي (لو مش مطلوب)
      password: this.registerForm?.value?.password,
      phoneNumber: userName,    // نفس الـ userName
      systemUserId: ''
    };

    const registerSub: Subscription = this.__AuthService.register(data).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        const msg = res?.message || res?.data?.message || 'تم إنشاء الحساب بنجاح';
        if (res?.data) {
          Swal.fire({ icon: 'success', title: msg, confirmButtonText: 'حسنًا' })
            .then(() => this.__Router.navigate(['/auth/verify-otp'], { queryParams: { username: userName } }));
        } else {
          Swal.fire({ icon: 'error', title: msg || 'تعذّر إنشاء الحساب.', confirmButtonText: 'حسنًا' });
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const errMsg = err?.error?.message || err?.error?.Message || err?.message || 'حدث خطأ أثناء إنشاء الحساب.';
        Swal.fire({ icon: 'error', title: errMsg, confirmButtonText: 'حسنًا' });
      }
    });

    this.subscriptions().push(registerSub);
  }
}
