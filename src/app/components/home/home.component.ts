import { CategoryCardComponent } from './category-card/category-card.component';
import { ProductCardComponent } from './product-card/product-card.component';
import { HomeSliderComponent } from './home-slider/home-slider.component';
import { HomeCardComponent } from './home-card/home-card.component';
import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { HomeService } from '../../services/home.service';
import { LanguageService } from '../../services/generic/language.service';
import { ITopCategories } from '../../core/interfaces/home';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilityService } from '../../services/generic/utility.service';
import { SortAdsComponent } from '../region/sort-ads/sort-ads.component';
import { NoDataComponent } from '../../shared/components/no-data/no-data.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { key } from '../../core/config/localStorage';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HomeSliderComponent,
    CategoryCardComponent,
    ProductCardComponent,
    HomeCardComponent,
    TranslateModule,
    SortAdsComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  /* =======================
        Signals
  ======================= */
  language = signal<string>('');
  searchKeyword = signal<string>('');
  cityId = signal<string>('');
  sortType = signal<string>('');
  topCategoriesAds = signal<ITopCategories[]>([]);
  activeCategories = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  // 👈 اليوزر
  userId = signal<string | null>(null);

  // 👈 علشان HTML (قسم البحث الشائع المخفي)
  searches = signal<{ id: number; name_L1: string }[]>([
    { id: 1, name_L1: 'Find Cars for Sale in Cairo' },
    { id: 2, name_L1: 'Find Cars for Sale in Alexandria' },
    { id: 3, name_L1: 'Find Cars for Sale in Giza' }
  ]);

  private subscriptions = new Subscription();
  private isBrowser: boolean;

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __UtilityService: UtilityService,
    private readonly __homeService: HomeService,
    private readonly translateService: TranslateService,
    @Inject(PLATFORM_ID) platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /* =======================
        Lifecycle
  ======================= */
  ngOnInit(): void {
    const currentLang = this.translateService.currentLang || this.__LanguageService.getLanguage();
    this.language.set(currentLang || 'en');
    this.subscriptions.add(
      this.translateService.onLangChange.subscribe(event => {
        this.language.set(event.lang || 'en');
      })
    );

    // ✅ نجيب بيانات اليوزر
    this.getUserData();

    this.getActiveCategories();
    this.getTopCategoriesAds();
    this.getSearchValue();
    this.getCityId();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /* =======================
        USER DATA
  ======================= */
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

  /* =======================
        Filters
  ======================= */
  getSearchValue(): void {
    const sub = this.__UtilityService.navbarSearch
      .pipe(debounceTime(800), distinctUntilChanged())
      .subscribe(key => {
        this.searchKeyword.set(key);
        this.getTopCategoriesAds();
      });

    this.subscriptions.add(sub);
  }

  getCityId(): void {
    const sub = this.__UtilityService.cityId.subscribe(id => {
      this.cityId.set(id);
      this.getTopCategoriesAds();
    });

    this.subscriptions.add(sub);
  }

  sort(type: string): void {
    this.sortType.set(type);
    this.getTopCategoriesAds();
  }

  /* =======================
        Categories
  ======================= */
  getActiveCategories(): void {
    this.__homeService.getActiveCategories().subscribe(res => {
      this.activeCategories.set(res?.data || []);
    });
  }

  /* =======================
        ⭐ CORE LOGIC ⭐
  ======================= */
  getTopCategoriesAds(): void {

    this.isLoading.set(true);

    /* ===== Logged In User ===== */
    if (this.isLoggedIn()) {

      this.__homeService
        .getuserrecommendations(this.userId()!)
        .subscribe({
          next: res => {
            this.isLoading.set(false);

            // ✅ تحويل الـ API response
            const adaptedData = this.adaptRecommendationsResponse(res);
            console.log("Recommadtion",res );
            

            this.topCategoriesAds.set(adaptedData);
          },
          error: () => this.isLoading.set(false)
        });

      return; // ⛔ مهم جدًا
    }

    /* ===== Guest ===== */
    this.__homeService
      .getTopCatAds(this.searchKeyword(), this.cityId(), this.sortType())
      .subscribe({
        next: res => {
          this.isLoading.set(false);
          this.processAndSetTopCategories(res?.data || []);
        },
        error: () => this.isLoading.set(false)
      });
  }

  /* =======================
        Adapter (المهم)
  ======================= */
  private adaptRecommendationsResponse(res: any): any[] {

    // حسب رد الـ API الحقيقي
    const products = res?.data?.data || [];

    if (!products.length) return [];

    return [
      {
        categoryId: -1, // dummy
        name: 'مقترح لك',
        name_L1: 'Recommended for you',
        list: products
      }
    ];
  }

  /* =======================
        Sorting (Guest)
  ======================= */
  private processAndSetTopCategories(data: any[]): void {
    const order = [13, 19, 17, 15, 3, 29, 5, 6, 28, 12];

    const sorted = [...data].sort((a, b) => {
      const aIndex = order.indexOf(a.categoryId);
      const bIndex = order.indexOf(b.categoryId);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    this.topCategoriesAds.set(sorted);
  }
}
