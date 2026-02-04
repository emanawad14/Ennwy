import { LocationComponent } from '../../core/components/navbar/location/location.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ProductCardComponent } from '../home/product-card/product-card.component';
import { LanguageService } from '../../services/generic/language.service';
import { ProfileService } from '../../services/profile.service';
import { Component, OnInit, signal } from '@angular/core';
import { AdService } from '../../services/ad.service';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { key } from '../../core/config/localStorage';
import { RouterModule } from '@angular/router'; // ✅ إضافة هذا السطر لحل خطأ routerLink
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule // ✅ ضروري للـ routerLink
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  language = signal<string>('en');
  userId = signal<string>('');
  profileDetails = signal<any>({});
  isLoading = signal<boolean>(false);

  ads = signal<any>([]);
  totalAds = signal<number>(0);
  countInPage = signal<number>(0);
  isLoadingAds = signal<boolean>(false);

  pageNumber = signal<number>(1);
  pageSize = signal<number>(5);
  cityId = signal<string>('');
  isBrowser: any;

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __ProfileService: ProfileService,
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __AdService: AdService,
  ) { }

  ngOnInit(): void {
    this.getProfileData();
    this.userId.set(this.profileDetails()?.id);

  }

  get firstLetter() {
    return this.profileDetails().fullName?.charAt(0)?.toUpperCase();
  }

  getProfileData(): void {
    const user = localStorage.getItem(key.userInfo);
    if (user) {
      this.profileDetails.set(JSON.parse(user));
    }
  }



  getCount(): number {
    return Math.round(this.totalAds() / 5);
  }

   getUserData(): void {
    if (!this.isBrowser) return;

    const user = localStorage.getItem(key.userInfo);
    if (!user) return;

    const parsed = JSON.parse(user);
    this.userId.set(parsed.id);
  }

  private isLoggedIn(): boolean {
    return !!this.userId();
  }
  
openAccountHighlightSwal() {
  // أولاً: جلب بيانات المستخدم من localStorage
 if (!this.userId()) {
    Swal.fire('خطأ', 'يجب تسجيل الدخول أولاً', 'error');
    return;
  }

  const user = this.userId();

  // فتح Swal
  Swal.fire({
    title: 'تمييز الحساب',
    input: 'text',
    inputLabel: 'ملاحظة',
    inputPlaceholder: 'اكتب ملاحظتك هنا',
    showCancelButton: true,
    confirmButtonText: 'تم',
    cancelButtonText: 'إلغاء',
    preConfirm: (note) => {
      if (!note) {
        Swal.showValidationMessage('الملاحظة مطلوبة');
      }
      return note;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const data = {
        userId: this.userId(),  // جلب id من localStorage
        userNotes: result.value,
        subscriptionType: 0 // 0 = تمييز حساب
      };

      this.__ProfileService.addLog(data).subscribe({
        next: (res: any) => {
          Swal.fire('تم', 'تم إرسال طلب تمييز الحساب بنجاح', 'success');
        },
        error: (err: any) => {
          Swal.fire('خطأ', 'حدث خطأ أثناء إرسال الطلب', 'error');
        }
      });
    }
  });
}


}
