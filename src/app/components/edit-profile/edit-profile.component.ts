import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';

const STORAGE_USER_KEY = 'EnnwyUserInfo';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent {
  saving = signal(false);
  apiError = signal<string | null>(null);
  returnUrl: string | null = null;

  profileForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {

    this.profileForm = this.fb.group({
      phoneNumber: [''],
      otherPhoneNumber: [''],
      fullName: ['', [Validators.required, Validators.minLength(2)]], // <-- مطلوب
      address: [''],
      gender: [null as 0 | 1 | null],     // 0 ذكر - 1 أنثى
      userType: ['Person' as 'Person' | 'Store']
    });
  }

  ngOnInit(): void {

    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');


    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        this.profileForm.patchValue({
          phoneNumber: user?.phoneNumber ?? '',
          otherPhoneNumber: user?.otherPhoneNumber ?? '',
          fullName: (user?.fullName ?? '').toString().trim(),
          address: user?.address ?? '',
          gender: typeof user?.gender === 'number' ? user.gender : null,
          userType: user?.userType ?? 'Person'
        });
      } catch {}
    }
  }


  get fullNameCtrl(): AbstractControl | null {
    return this.profileForm.get('fullName');
  }

  onGenderChange(val: 0 | 1): void {
    this.profileForm.patchValue({ gender: val });
  }

  onUserTypeChange(val: 'Person' | 'Store'): void {
    this.profileForm.patchValue({ userType: val });
  }


  async saveProfile(): Promise<void> {
    this.apiError.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      await Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'من فضلك املأ الاسم الكامل.'
      });
      return;
    }


    const payload = {
      ...this.profileForm.value,
      fullName: (this.profileForm.value['fullName'] ?? '').toString().trim()
    };

    try {
      this.saving.set(true);


      await this.simulateApiUpdate(payload);


      const raw = localStorage.getItem(STORAGE_USER_KEY);
      const prevUser = raw ? JSON.parse(raw) : {};
      const updated = { ...prevUser, ...payload };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));

      await Swal.fire({
        icon: 'success',
        title: 'تم الحفظ',
        text: 'تم تحديث بياناتك بنجاح.'
      });


      if (this.returnUrl) {
        this.router.navigateByUrl(this.returnUrl);
      } else {

      }

    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'حدث خطأ غير متوقع';
      this.apiError.set(msg);
    } finally {
      this.saving.set(false);
    }
  }


  private simulateApiUpdate(_: any): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 600));
  }
}
