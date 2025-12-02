import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { patterns } from '../../../core/config/patterns';
import { ConfirmPasswordValidator } from '../../../core/config/confirm-password-validator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private subscriptions = signal<Subscription[]>([]);

  resetPasswordForm!: FormGroup;
  showEye = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  /** جاي من شاشة "نسيت كلمة المرور" عبر query param */
  username = signal<string>('');

  constructor(
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __AuthService: AuthService,
    private readonly __Router: Router,
    private fb: FormBuilder,
  ) {
    this.resetPasswordForm = this.fb.group(
      {
        /** الكود (OTP) */
        code: ['', {
          // 6 أرقام (غيرت الباترن لو عندك شرط مختلف)
          validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
          updateOn: 'blur'
        }],
        password: ['', {
          validators: [Validators.required, Validators.pattern(patterns?.password)],
          updateOn: 'blur'
        }],
        confirmPassword: ['', {
          validators: [Validators.required, Validators.pattern(patterns?.password)],
          updateOn: 'blur'
        }],
      },
      { validators: ConfirmPasswordValidator.MatchPassword }
    );
  }

  get formControls(): any { return this.resetPasswordForm?.controls; }

  ngOnInit(): void {
    // اقرا اليوزرنيم المبعوت من شاشة forget-password
    const sub = this.__ActivatedRoute.queryParamMap.subscribe((qp) => {
      const u = (qp.get('username') || '').trim();
      this.username.set(u);
    });
    this.subscriptions().push(sub);
  }

  togglePassword(): void {
    this.showEye.update((show) => !show);
  }

  clearValidationErrors(control: AbstractControl): void {
    control.markAsPending();
  }

  resetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    // لو مفيش username (دخل مباشرة على الصفحة) رجّعه
    if (!this.username()) {
      alert('لا يوجد مستخدم محدد. من فضلك اطلب رمز التحقق مرة أخرى.');
      this.__Router.navigate(['/auth/forget-password']);
      return;
    }

    this.isLoading.set(true);

    const data = {
      userName: this.username(),
      newPassword: this.resetPasswordForm.value.password,
      code: this.resetPasswordForm.value.code   // ← من الحقل الجديد
    };

    const sub = this.__AuthService.resetPassword(data).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res?.data) this.__Router.navigate(['/auth/login']);
      },
      error: () => { this.isLoading.set(false); }
    });

    this.subscriptions().push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions()?.forEach((sb) => (sb ? sb.unsubscribe() : null));
  }
}
