import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdService } from '../../services/ad.service';
import { key } from '../../core/config/localStorage';
import { AlertService } from '../../services/alert.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-helpsupport',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, CommonModule, FormsModule],
  templateUrl: './helpsupport.component.html',
  styleUrl: './helpsupport.component.scss'
})
export class helpsupportComponent implements OnInit {
  form!: FormGroup;
  userId = signal<string>('');
  selectedCountry: any;

  countries = [
    { name: 'سوريا', code: '+963' },
    { name: 'مصر', code: '+20' },
    { name: 'السعودية', code: '+966' },
    { name: 'الإمارات', code: '+971' },
    { name: 'الأردن', code: '+962' }
  ];

  constructor(
    private fb: FormBuilder,
    private __AdService: AdService,
    private router: Router,
    public readonly alertservice: AlertService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      phone: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required]
    });

    const user = localStorage.getItem(key.userInfo);
    if (user) {
      const parsed = JSON.parse(user);
      this.userId.set(parsed?.id);

      // If phone exists, separate country code from number
      const storedPhone = parsed?.phone;
      if (storedPhone) {
        const match = this.extractCountryCode(storedPhone);
        if (match) {
          this.selectedCountry = this.countries.find(c => c.code === match.code) || this.countries[0];
          this.form.patchValue({ phone: match.localNumber });
        }
      }
    }

    // fallback if not set
    if (!this.selectedCountry) {
      this.selectedCountry = this.countries[0];
    }
  }

  extractCountryCode(phone: string): { code: string; localNumber: string } | null {
    for (let country of this.countries) {
      if (phone.startsWith(country.code)) {
        return {
          code: country.code,
          localNumber: phone.slice(country.code.length).trim()
        };
      }
    }
    return null;
  }

  onCountryChange(): void {
    // Reset phone if needed on country switch
  }

  submit(): void {
    if (this.form.invalid) return;

    const { title, description, phone } = this.form.value;
    const fullPhone = this.selectedCountry.code + phone;

    const payload = {
      title,
      description,
      status: 0,
      userId: this.userId(),
      phone: fullPhone
    };

    this.__AdService.adticket(payload).subscribe({
      next: () => {
        this.alertservice.successMessage('✅ تم إرسال البلاغ بنجاح');
        this.router.navigate(['/contact-us']);
      },
      error: () => {
        this.alertservice.errorMessage('❌ حدث خطأ أثناء إرسال البلاغ');
      }
    });
  }
}
