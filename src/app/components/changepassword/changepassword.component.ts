import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { key } from '../../core/config/localStorage';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './changepassword.component.html'
})
export class ChangePasswordComponent implements OnInit {
  form: FormGroup;
  userId = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private __auth: AuthService,
    public readonly alertservice: AlertService,
    private readonly __Router: Router,
  ) {
    this.form = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    });
  }

ngOnInit(): void {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(key.userInfo);
    if (user) {
      const parsedUser = JSON.parse(user);
      this.userId.set(parsedUser?.id || '');
    }
  }
}


  submit(): void {
    if (this.form.invalid) return;

    const { currentPassword, newPassword, confirmNewPassword } = this.form.value;

    if (newPassword !== confirmNewPassword) {
      this.alertservice.errorMessage('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
     
    
      return;
    }

    const payload = {
      currentPassword,
      newPassword,
      confirmNewPassword,
      userId: this.userId()
    };

    this.__auth.userChangePassword(payload).subscribe({
      next: () => {

         this.alertservice.successMessage('تم تغيير كلمة المرور بنجاح ✅');
          this.__Router.navigate(['/profile']);
      },
      error: (err) => {
         this.alertservice.errorMessage('حدث خطأ أثناء تغيير كلمة المرور');
       
        console.error(err);
      }
    });
  }
}