import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/generic/language.service';
import { HomeService } from '../../../../services/home.service';
import { Component, signal, computed, EventEmitter, Output, input, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FormsModule } from '@angular/forms';
import { Router, Routes } from '@angular/router';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule],
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent {
  showLocation = signal<boolean>(false);
  language = signal<string>('en');
  countries = signal<any[]>([]);
  data = signal<any[]>([]); // كل المدن
  isLoading = signal<boolean>(false);
  selectedCountry = signal<any>('');
  selectedItemName = signal<any>('');
  selectedItemKey = signal<string>('');
  secondSelectedItemKey = signal<string>('');
  cityName = signal<string>('');
  searchText = signal<string>('');
  isMobile = signal(false);

  placeholder = input<string>('');
  @Output() changeCity = new EventEmitter();

  private breakpointObserver = inject(BreakpointObserver);
  private adsLink: any[] = ['/ads'];

  filteredData = computed(() => {
    const text = (this.searchText() || '').toLowerCase().trim();
    const list = this.data() || [];
    if (!text) return list;
    return list.filter(city =>
      ((this.language() === 'en' ? city?.nameEn : city?.nameAr) || '')
        .toLowerCase()
        .includes(text)
    );
  });

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __homeService: HomeService,
    private readonly router: Router
  ) {
    effect(() => {
      this.breakpointObserver.observe([Breakpoints.Handset])
        .subscribe(result => this.isMobile.set(result.matches));
    });
  }

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
    this.adsLink = this.detectAdsLink(this.router.config);
    // ✅ حمّل البلاد والمدن أول ما الكومبوننت يفتح
    this.getCountries();
  }

  getCountries(): void {
    this.isLoading.set(true);
    this.__homeService.getCountries().subscribe({
      next: (res: any) => {
        const countries = Array.isArray(res?.data) ? res.data : [];
        this.countries.set(countries);

        // ✅ اجمع كل المدن من كل الدول (أضمن ما تبقاش الليست فاضية)
        const allCities = countries.flatMap((c: any) => Array.isArray(c?.cities) ? c.cities : []);
        this.data.set(allCities);

        // لو عايز أول دولة فقط، بدّل السطر اللي فوق بـ:
        // const firstCountry = countries[0];
        // this.data.set(firstCountry?.cities || []);

        // إعدادات عرض افتراضية
        const firstCountry = countries[0];
        this.selectedItemKey.set('cities');
        this.secondSelectedItemKey.set('districts');
        this.selectedCountry.set(firstCountry || '');
        this.selectedItemName.set(
          this.language() === 'en'
            ? (firstCountry?.nameEn || '')
            : (firstCountry?.nameAr || '')
        );
        this.cityName.set('');
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectCity(city: any): void {
    this.selectedCountry.set(city);
    this.searchText.set('');
    this.changeCity.emit(city);

    const raw = city?.id ?? city?.cityId ?? city?.CityId;
    const cid = (raw !== undefined && raw !== null && raw !== '' && !Number.isNaN(Number(raw)))
      ? Number(raw)
      : null;

    this.router.navigate(this.adsLink, {
      queryParams: cid !== null ? { cityId: cid } : {},
      queryParamsHandling: 'merge'
    });
  }

  onDropdownOpen(): void {
    if (!this.countries().length || !this.data().length) this.getCountries();
    this.searchText.set('');
  }

  private detectAdsLink(routes: Routes): any[] {
    const hasPlainAds = this.walkRoutes(routes, (r) => r.path === 'ads' && !/[:]/.test(r.path ?? ''));
    if (hasPlainAds) return ['/ads'];
    return ['/ads', 0, 'all'];
  }

  private walkRoutes(routes: Routes, pred: (r: any) => boolean): boolean {
    for (const r of routes) {
      if (pred(r)) return true;
      if (r.children && this.walkRoutes(r.children, pred)) return true;
      if (r.loadChildren) continue;
    }
    return false;
  }
}
