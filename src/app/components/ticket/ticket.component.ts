import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdService } from '../../services/ad.service';
import { key } from '../../core/config/localStorage';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, CommonModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss'
})
export class TicketComponent implements OnInit {
  form!: FormGroup;
  userId = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private __AdService: AdService,
    private router: Router,
    public readonly alertservice: AlertService,

  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem(key.userInfo);
    if (user) {
      const parsed = JSON.parse(user);
      this.userId.set(parsed?.id);
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const { title, description } = this.form.value;

    const payload = {
      title,
      description,
      status: 0,
      userId: this.userId()
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
