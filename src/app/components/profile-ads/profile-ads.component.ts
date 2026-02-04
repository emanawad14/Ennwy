import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { LanguageService } from '../../services/generic/language.service';
import { ProfileService } from '../../services/profile.service';
import { AdService } from '../../services/ad.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { key } from '../../core/config/localStorage';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProductCardComponent } from '../home/product-card/product-card.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { UtilityService } from '../../services/generic/utility.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-ads',
  standalone: true,
  imports: [
    ProductCardComponent,
    PaginatorComponent,
    TranslateModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './profile-ads.component.html',
  styleUrl: './profile-ads.component.scss'
})
export class ProfileadsComponent implements OnInit, OnDestroy {
  language = signal<string>('en');
  userId = signal<string>('');
  profileDetails = signal<any>({});
  isLoading = signal<boolean>(false);
  searchText = signal<string>('');

  ads = signal<any>([]);
  totalAds = signal<number>(0);
  countInPage = signal<number>(0);

  pageNumber = signal<number>(1);
  pageSize   = signal<number>(6); // ✅ ثابت: 6 عناصر/صفحة

  cityId = signal<string>('');
  advertisementStatus = signal<string>(''); // '' = الكل

  private searchSubscription!: Subscription;

  statusTabs = [
    { label: 'status.all', value: '' },
    { label: 'status.new', value: '0' },
    { label: 'status.inReview', value: '1' },
    { label: 'status.approved', value: '2' },
    { label: 'status.rejected', value: '3' },
    { label: 'status.paused', value: '4' },
    { label: 'status.expired', value: '5' },
    { label: 'status.deleted', value: '6' }
  ];
  translate: any;

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __ProfileService: ProfileService,
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __AdService: AdService,
    private readonly __UtilityService: UtilityService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.getProfileData();

    // البحث من الـ navbar داخل صفحة profile-ads فقط
    this.searchSubscription = this.__UtilityService.navbarSearch.subscribe((val: string) => {
      if (this.router.url.includes('/profile-ads')) {
        this.searchText.set(val || '');
        this.pageNumber.set(1);
        this.getAllAdsByPageUser();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  get firstLetter() {
    return this.profileDetails().fullName?.charAt(0)?.toUpperCase();
  }

  getProfileData(): void {
    const user = localStorage.getItem(key.userInfo);
    if (user) {
      const parsed = JSON.parse(user);
      this.profileDetails.set(parsed);
      this.userId.set(parsed.id);
      this.getAllAdsByPageUser();
    }
  }

  getAllAdsByPageUser(): void {
    this.isLoading.set(true);
    this.__UtilityService.setGlobalLoading(true); // ✅ يشغّل اللودر العام (الـ overlay)

    const body = {
      pageNumber: this.pageNumber(),
      pageSize:   this.pageSize(), // ✅ دايمًا 6
      searchKeyword: this.searchText() || null,
      categoryId: null,
      sortType: null,
      subDistrictId: this.cityId() || null,     // غيّرها لـ cityId لو الـ API مختلف
      advertisementStatus: this.advertisementStatus(),
      flatfieldChoices: [],
      priceFrom: null,
      priceTo: null,
      byUserId: null,
      userId: this.userId() || null,
      loginUser: this.userId() || null
    };

    this.__AdService.getAllAdsByCategoryId(body)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.__UtilityService.setGlobalLoading(false); // ✅ يطفي اللودر العام
        })
      )
      .subscribe({
        next: (res: any) => {
          const dataList = res?.data?.data ?? res?.data?.items ?? res?.items ?? [];
          const total =
            res?.data?.totalCount ??
            res?.data?.totalRecords ??
            res?.totalCount ??
            res?.total ??
            dataList.length;

          // ❌ ما نقصّش هنا — السيرفر بيرجع 6 حسب pageSize
          this.ads.set(dataList);
          this.totalAds.set(Number(total) || 0);
          this.countInPage.set(dataList.length);
        },
        error: (err: any) => {
          console.error('Error fetching ads:', err);
        }
      });
  }

  getStartIndex(): number {
    if (!this.totalAds()) return 0;
    return (this.pageNumber() - 1) * this.pageSize() + (this.ads()?.length ? 1 : 0);
  }

  getEndIndex(): number {
    if (!this.totalAds()) return 0;
    const end = (this.pageNumber() - 1) * this.pageSize() + this.ads().length;
    return Math.min(end, this.totalAds());
  }

  filterAdsByCity(id: any): void {
    this.pageNumber.set(1);
    this.cityId.set(id || '');
    this.getAllAdsByPageUser();
  }

  filterByStatus(status: string): void {
    this.pageNumber.set(1);
    this.advertisementStatus.set(status || ''); // '' = الكل
    this.getAllAdsByPageUser();
  }

  // ✅ paginator: غيّر الصفحة فقط — واللودر هيشتغل تلقائي من جوه getAllAdsByPageUser
  onPageChange(ev: { page: number; pageSize: number }): void {
    this.pageNumber.set(ev.page);
    this.getAllAdsByPageUser();
  }

  openAdHighlightSwal(ad: any, event: MouseEvent) {
  // منع تنفيذ التنقل عند الضغط على النجمة
  event.stopPropagation();
  event.preventDefault();

  if (!this.userId()) {
    Swal.fire('خطأ', 'يجب تسجيل الدخول أولاً', 'error');
    return;
  }

  Swal.fire({
    title: 'تمييز الإعلان',
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
        adId: ad.id,
        userNotes: result.value,
        subscriptionType: 1 // 1 = تمييز إعلان
      };

      this.__ProfileService.addLog(data).subscribe({
        next: (res: any) => {
          Swal.fire('تم', 'تم إرسال طلب تمييز الإعلان بنجاح', 'success');
        },
        error: (err: any) => {
          Swal.fire('خطأ', 'حدث خطأ أثناء إرسال الطلب', 'error');
        }
      });
    }
  });
}


}
