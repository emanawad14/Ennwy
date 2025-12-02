import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { map, Subscription, take, tap, timer } from 'rxjs';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './otp-input.component.html',
  styleUrls: ['./otp-input.component.scss']
})
export class OtpInputComponent {
  @Input() otpLength = 6;
  @Input() autoStartResend = true;
  @Input() resendCooldownSeconds = 30;
  /** نعطّل الأزرار وقت الإرسال */
  @Input() submitting = false;

  @Output() otpSubmit = new EventEmitter<string>();
  @Output() resendRequest = new EventEmitter<void>();

  /** نجبر اتجاه الكونبوننت ككل LTR حتى لو الصفحة RTL */
  @HostBinding('attr.dir') dir = 'ltr';
  @HostBinding('attr.lang') lang = 'en';

  otpControls: FormControl[] = [];
  resendDisabled = true;
  resendCountdown = 0;
  private timerSubscription?: Subscription;

  ngOnInit() {
    this.otpControls = Array.from({ length: this.otpLength }, () => new FormControl(''));
    if (this.autoStartResend) this.startResendTimer();

    setTimeout(() => {
      const first = document.querySelector<HTMLInputElement>('.otp-container input');
      first?.focus();
    }, 0);
  }

  /** تحويل أي أرقام عربية/فارسيّة إلى إنجليزي */
  private normalizeDigits(input: string): string {
    if (!input) return '';
    // Arabic-Indic ٠١٢٣٤٥٦٧٨٩ \u0660-\u0669
    input = input.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
    // Eastern Arabic-Indic ۰۱۲۳۴۵۶۷۸۹ \u06F0-\u06F9
    input = input.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
    return input;
  }

  private lastCharDigitOnly(val: string): string {
    const normalized = this.normalizeDigits(val);
    const last = normalized.slice(-1);
    return /\d/.test(last) ? last : '';
  }

  onKeyUp(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // نظّف القيمة لتكون آخر رقم إنجليزي فقط
    const digit = this.lastCharDigitOnly(input.value);
    input.value = digit;
    this.otpControls[index].setValue(digit);

    // انتقال تلقائي للأمام
    if (digit && index < this.otpLength - 1) {
      const nextInput = input.nextElementSibling as HTMLInputElement | null;
      nextInput?.focus();
    }

    // رجوع للخلف عند Backspace
    if (event.key === 'Backspace' && !digit && index > 0) {
      const prevInput = input.previousElementSibling as HTMLInputElement | null;
      prevInput?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pastedRaw = (event.clipboardData?.getData('text') || '').trim();
    if (!pastedRaw) return;

    // حوّل الأرقام إلى إنجليزي ثم خُد أرقام فقط
    const normalized = this.normalizeDigits(pastedRaw).replace(/\D/g, '');
    if (!normalized) return;

    const digits = normalized.slice(0, this.otpLength);
    for (let i = 0; i < this.otpLength; i++) {
      const d = digits[i] ?? '';
      this.otpControls[i]?.setValue(d);
      const cell = document.querySelectorAll<HTMLInputElement>('.otp-container input')[i];
      if (cell) cell.value = d;
    }
    // فوكس على آخر خلية ممتلئة
    const targetIndex = Math.min(digits.length, this.otpLength) - 1;
    const target = document.querySelectorAll<HTMLInputElement>('.otp-container input')[Math.max(targetIndex, 0)];
    target?.focus();

    event.preventDefault();
  }

  submitOtp() {
    if (this.submitting) return; // منع الضغط المكرر

    const otp = this.otpControls
      .map(c => this.normalizeDigits(String(c.value || '')))
      .join('');

    if (otp.length === this.otpLength && /^\d+$/.test(otp)) {
      this.otpSubmit.emit(otp); // بيتبعت إنجليزي 0-9
    } else {
      alert('Please enter a valid OTP');
    }
  }

  onResend() {
    if (this.resendDisabled || this.submitting) return;
    this.resendRequest.emit();
    this.startResendTimer();
  }

  startResendTimer(): void {
    this.resendDisabled = true;
    const countdown = Math.max(1, this.resendCooldownSeconds);

    this.timerSubscription?.unsubscribe();
    this.timerSubscription = timer(0, 1000).pipe(
      take(countdown + 1),
      map(i => countdown - i),
      tap(secondsLeft => {
        this.resendCountdown = secondsLeft;
        if (secondsLeft === 0) this.resendDisabled = false;
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }
}
