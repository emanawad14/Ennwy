import { LocationComponent } from '../../core/components/navbar/location/location.component';
import { ProductCardComponent } from '../home/product-card/product-card.component';
import { LanguageService } from '../../services/generic/language.service';
import { ProfileService } from '../../services/profile.service';
import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdService } from '../../services/ad.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { TranslateModule } from '@ngx-translate/core';
import { AdCardComponent } from "../region/ad-card/ad-card.component";
import { UtilityService } from '../../services/generic/utility.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-advertiser-profile',
  standalone: true,
  imports: [PaginatorComponent, TranslateModule, AdCardComponent],
  templateUrl: './advertiser-profile.component.html',
  styleUrl: './advertiser-profile.component.scss'
})
export class AdvertiserProfileComponent implements OnInit, OnDestroy {
  language = signal<string>('en');
  searchText = signal<string>('');
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
  private searchSubscription!: Subscription;

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __ProfileService: ProfileService,
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __AdService: AdService,
    private readonly __UtilityService: UtilityService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.__ActivatedRoute.params.subscribe((param: any) => {
      const id = param.id;
      this.userId.set(id);
      this.getAdvertiserByUserId();
    });

    this.__ActivatedRoute.queryParams.subscribe((query) => {
      const keyword = query['keyword'];
      if (keyword) {
        this.searchText.set(keyword);
      }
      this.getAllAdsByPageUser();
    });

    // Listen to navbarSearch
    this.searchSubscription = this.__UtilityService.navbarSearch.subscribe((val: string) => {
      const currentUrl = this.router.url;
      if (currentUrl.includes('/advertiser-profile/')) {
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

  getAdvertiserByUserId(): void {
    this.isLoading.set(true);
    this.__ProfileService.getAdvertiserByUserId(this.userId()).subscribe({
      next: ((res: any) => {
        this.profileDetails.set(res?.data);
        this.isLoading.set(false);
      }),
      error: ((err: any) => {
        this.isLoading.set(false);
      })
    });
  }

  getAllAdsByPageUser(): void {
    this.isLoading.set(true);

    const body = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchKeyword: this.searchText() || null,
      categoryId: null,
      sortType: null,
      subDistrictId: this.cityId() || null,
      flatfieldChoices: [],
      priceFrom: null,
      priceTo: null,
      byUserId: this.userId(),
      userId: null,
      loginUser: this.userId()
    };

    this.__AdService.getAllAdsByCategoryId(body).subscribe({
      next: (res: any) => {
        this.ads.set(res?.data?.data || []);
        this.totalAds.set(res?.data?.totalCount || 0);
        this.countInPage.set(res?.data?.countInPage || 0);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching ads:', err);
        this.isLoading.set(false);
      }
    });
  }

  getCount(): number {
    return Math.round(this.totalAds() / 5);
  }

  filterAdsByCity(id: any): void {
    this.pageNumber.set(1);
    this.pageSize.set(5);
    this.cityId.set(id);
    this.getAllAdsByPageUser();
  }

  onPageChange(ev: { page: number, pageSize: number }): void {
    this.pageNumber.set(ev.page);
    this.pageSize.set(ev.pageSize);
    this.getAllAdsByPageUser();
  }
}