import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { LanguageService } from '../../services/generic/language.service';
import { ProfileService } from '../../services/profile.service';
import { AdService } from '../../services/ad.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { key } from '../../core/config/localStorage';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProductCardComponent } from '../home/product-card/product-card.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { Subscription } from 'rxjs';
import { UtilityService } from '../../services/generic/utility.service';

@Component({
  selector: 'app-fav-ads',
  standalone: true,
  imports: [
    ProductCardComponent,
    PaginatorComponent,
    TranslateModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './fav-ads.component.html',
  styleUrl: './fav-ads.component.scss'
})
export class favadsComponent implements OnInit, OnDestroy {
  language = signal<string>('en');
  userId = signal<string>('');
  profileDetails = signal<any>({});
  isLoading = signal<boolean>(false);

  ads = signal<any>([]);
  totalAds = signal<number>(0);
  countInPage = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(5);
  cityId = signal<string>('');
  advertisementStatus = signal<string>('');
  searchText = signal<string>(''); // ✅ استقبل كلمة البحث من الـ navbar

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
    this.userId.set(this.profileDetails()?.id);
    this.getAllAdsByPageUser();

    // ✅ لو الكلمة جت من الـ navbar واليوزر واقف على صفحة fav-ads بس
    this.searchSubscription = this.__UtilityService.navbarSearch.subscribe((val: string) => {
      if (this.router.url.includes('/fav-ads')) {
        this.searchText.set(val);
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
      this.profileDetails.set(JSON.parse(user));
    }
  }

  getAllAdsByPageUser(): void {
    this.isLoading.set(true);

    const body = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      cityId: this.cityId() || null,
      advertisementStatus: this.advertisementStatus() || null,
      searchKeyword: this.searchText() || null,   // ✅ كلمة البحث
      categoryId: null,
      subDistrictId: null,
      flatfieldChoices: [],
      priceFrom: null,
      priceTo: null,
      byUserId: null,
      userId: this.userId() || null,              // ✅ userId
      loginUser: this.userId() || null,           // ✅ loginUser
      sortby: null,
      districtId: null
    };

    this.__AdService.getfavAds(body).subscribe({
      next: (res: any) => {
        this.ads.set(res?.data?.data || []);
        this.totalAds.set(res?.data?.totalCount || 0);
        this.countInPage.set(res?.data?.countInPage || 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getCount(): number {
    return Math.round(this.totalAds() / this.pageSize());
  }

  filterAdsByCity(id: any): void {
    this.pageNumber.set(1);
    this.cityId.set(id);
    this.getAllAdsByPageUser();
  }

  filterByStatus(status: string): void {
    this.pageNumber.set(1);
    this.advertisementStatus.set(status);
    this.getAllAdsByPageUser();
  }

  onPageChange(ev: { page: number; pageSize: number }): void {
    this.pageNumber.set(ev.page);
    this.pageSize.set(ev.pageSize);
    this.getAllAdsByPageUser();
  }
}
