import { CategoryCardComponent } from './category-card/category-card.component';
import { ProductCardComponent } from './product-card/product-card.component';
import { HomeSliderComponent } from './home-slider/home-slider.component';
import { HomeCardComponent } from './home-card/home-card.component';
import { Component, signal, OnInit, OnDestroy, Inject, PLATFORM_ID, makeStateKey, TransferState } from '@angular/core';
import { HomeService } from '../../services/home.service';
import { LanguageService } from '../../services/generic/language.service';
import { ITopCategories } from '../../core/interfaces/home';
import { TranslateModule } from '@ngx-translate/core';
import { UtilityService } from '../../services/generic/utility.service';
import { SortAdsComponent } from "../region/sort-ads/sort-ads.component";
import { NoDataComponent } from '../../shared/components/no-data/no-data.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

// تعريف الـ State Keys
const ACTIVE_CATEGORIES_KEY = makeStateKey<any>('active_categories');
const TOP_CATEGORIES_ADS_KEY = makeStateKey<any>('top_categories_ads');
const BANNERS_KEY = makeStateKey<any>('banners');

@Component({
  selector: 'app-home',
  imports: [CommonModule, HomeSliderComponent, CategoryCardComponent, ProductCardComponent, HomeCardComponent, TranslateModule, SortAdsComponent, NoDataComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  language = signal<string>('');
  searchKeyword = signal<string>('');
  cityId = signal<string>('');
  sortType = signal<string>('');
  topCategoriesAds = signal<ITopCategories[]>([]);
  activeCategories = signal<any>([]);

  categories = signal<{ id: number, name: string }[]>([
    { id: 1, name: 'Cars for Sale' },
    { id: 1, name: 'Cars for Rent' },
  ]);

  searches = signal<{ id: number, name_L1: string }[]>([
    { id: 1, name_L1: 'Find Cars for Sale in Cairo' },
    { id: 1, name_L1: 'Find Cars for Sale in Alexandria' },
    { id: 1, name_L1: 'Find Cars for Sale in Giza' },
  ]);

  isLoading = signal<boolean>(false);
  private subscriptions: Subscription = new Subscription();
  private isBrowser: boolean;
  private dataLoaded = false;
  private originalData: any[] = [];

rescueId: number|null|undefined;

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __UtilityService: UtilityService,
    private readonly __homeService: HomeService,
    private readonly route: ActivatedRoute,
    private readonly transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());

    // نستخدم البيانات من الـ Resolver أو الـ TransferState
    this.loadInitialData();

    this.getSearchValue();
    this.getCityId();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadInitialData(): void {
    if (this.dataLoaded) return;

    // نجرب نجيب البيانات من الـ Resolver أولاً
    this.route.data.subscribe(data => {
      if (data['homeData'] && data['homeData'].activeCategories) {
        this.setDataFromResolver(data['homeData']);
        this.dataLoaded = true;
        return;
      }
    });

    // إذا مفيش بيانات من الـ Resolver، نجرب الـ TransferState
    if (this.isBrowser) {
      if (this.transferState.hasKey(ACTIVE_CATEGORIES_KEY)) {
        const activeCategories = this.transferState.get(ACTIVE_CATEGORIES_KEY, null);
        const topCategoriesAds = this.transferState.get(TOP_CATEGORIES_ADS_KEY, null);

        if (activeCategories) {
          this.activeCategories.set(activeCategories?.data || activeCategories);
        }
        if (topCategoriesAds) {
          const data = topCategoriesAds?.data || topCategoriesAds;
          this.processAndSetTopCategories(data);
          this.originalData = [...data]; // نخزن نسخة من البيانات الأصلية
        }
        this.dataLoaded = true;
        return;
      }
    }

    // إذا مفيش بيانات لا من Resolver ولا من TransferState، نعمل API calls
    if (!this.dataLoaded) {
      this.getActiveCategories();
      this.getTopCategoriesAds();
      this.dataLoaded = true;
    }
  }

  private setDataFromResolver(homeData: any): void {
    if (homeData.activeCategories) {
      this.activeCategories.set(homeData.activeCategories?.data || homeData.activeCategories);
    }
    if (homeData.topCategoriesAds) {
      const data = homeData.topCategoriesAds?.data || homeData.topCategoriesAds;
      this.processAndSetTopCategories(data);
      this.originalData = [...data]; // نخزن نسخة من البيانات الأصلية
    }
  }

  getSearchValue(): void {
    const searchSub = this.__UtilityService.navbarSearch
      .pipe(
        debounceTime(800), // ينتظر 800ms بعد آخر كلمة
        distinctUntilChanged() // ما يعملش call إذا القيمة متغيرتش
      )
      .subscribe((key: string) => {
        this.searchKeyword.set(key);
        this.getTopCategoriesAds(); // نرجع للطريقة الأصلية
      });
    this.subscriptions.add(searchSub);
  }

  getCityId(): void {
    const citySub = this.__UtilityService.cityId.subscribe((id: string) => {
      this.cityId.set(id);
      this.getTopCategoriesAds(); // نرجع للطريقة الأصلية
    });
    this.subscriptions.add(citySub);
  }

  getActiveCategories(): void {
    this.isLoading.set(true);
    this.__homeService.getActiveCategories().subscribe({
      next: (res: any) => {
        this.activeCategories.set(res?.data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
      }
    });
  }

  sort(type: string): void {
    this.sortType.set(type);
    this.getTopCategoriesAds(); // نرجع للطريقة الأصلية
  }

  getTopCategoriesAds(): void {
    // إذا مفيش search أو filter، نستخدم البيانات الأصلية من الكاش
    if (!this.searchKeyword() && !this.cityId() && !this.sortType() && this.originalData.length > 0) {
      this.processAndSetTopCategories(this.originalData);
      return;
    }

    this.isLoading.set(true);
    this.__homeService.getTopCatAds(this.searchKeyword(), this.cityId(), this.sortType()).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        const all = res?.data || [];

   
        if (!this.searchKeyword() && !this.cityId() && !this.sortType()) {
          this.originalData = [...all];
        }

        const order = [13, 19, 17, 15, 3, 29, 5, 6, 28, 12];

        const sorted = all.sort((a: any, b: any) => {
          const aIndex = order.indexOf(a.categoryId);
          const bIndex = order.indexOf(b.categoryId);
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });

        this.topCategoriesAds.set(sorted);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private processAndSetTopCategories(data: any[]): void {
    const all = data || [];

    const order = [13, 19, 17, 15, 3, 29, 5, 6, 28, 12];

    const sorted = all.sort((a: any, b: any) => {
      const aIndex = order.indexOf(a.categoryId);
      const bIndex = order.indexOf(b.categoryId);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    this.topCategoriesAds.set(sorted);
  }
}