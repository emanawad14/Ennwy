import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, EMPTY, Subject, Subscription, of, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  finalize,
  map,
  switchMap,
  tap,
  filter as rxFilter,
  debounceTime,
  takeUntil,
} from 'rxjs/operators';

import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/generic/language.service';
import { UtilityService } from '../../services/generic/utility.service';
import { AdService } from '../../services/ad.service';

import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { FilterAdsComponent, MobileChip } from './filter-ads/filter-ads.component';
import { SortAdsComponent } from './sort-ads/sort-ads.component';
import { AdCardComponent } from './ad-card/ad-card.component';

import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { key } from '../../core/config/localStorage';

type CategoryNode = {
  id: number;
  nameEn?: string;
  nameAr?: string;
  name?: string;
  title?: string;
  children?: CategoryNode[];
};

@Component({
  selector: 'app-ads',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    AdCardComponent,
    SortAdsComponent,
    FilterAdsComponent,
    PaginatorComponent,
    TranslateModule
  ],
  templateUrl: './ads.component.html',
  styleUrl: './ads.component.scss'
})
export class AdsComponent implements OnInit, OnDestroy {
  language = signal<string>('en');

  title = signal<string>('');
  ads = signal<any>([]);
  categoryId = signal<number>(0);
  totalAds = signal<number>(0);
  countInPage = signal<number>(0);
  isLoading = signal<boolean>(false);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  sortType = signal<string>('');
  searchText: string = '';

  cityId = signal<string | null>(null);

  flatfieldChoices = signal<any[]>([]);
  chips = signal<MobileChip[]>([]);

  priceFrom = signal<number | null>(null);
  priceTo = signal<number | null>(null);

  @ViewChildren(FilterAdsComponent) filterCmps!: QueryList<FilterAdsComponent>;
  @ViewChild('topRef') topRef?: ElementRef<HTMLElement>;

  breadcrumbList = signal<{ name: string, routerLink?: string }[]>([]);

  private routeSub!: Subscription;
  private searchSub!: Subscription;
  private filtersChangeSub!: Subscription;

  private lastRequestKey: string | null = null;
  private isFetching = false;

  isMobile = signal(false);
  private filtersChange$ = new Subject<any[]>();
  private destroy$ = new Subject<void>();

  private categoriesCache: CategoryNode[] | null = null;

  private synonyms: Record<string, string[]> = {
    'سياره': ['سياره','سيارات','عربيه','عربيات','car','cars','auto','vehicle','vehicles'],
    'موبايل': ['موبايل','جوال','هواتف','موبايلات','phone','phones','mobile','mobiles','smartphone','smartphones'],
    'عقار': ['عقار','عقارات','real estate','property','properties','house','home','apartment','flat'],
    'اثاث': ['اثاث','موبيليا','furniture','sofa','table','chair'],
    'الكترونيات': ['الكترونيات','electronics','tv','television','laptop','computer','pc'],
    'ملابس': ['ملابس','clothes','clothing','fashion','apparel'],
    'العاب': ['العاب','toy','toys','game','games'],
  };

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __AdService: AdService,
    public readonly __UtilityService: UtilityService,
    private readonly router: Router,
    private readonly viewport: ViewportScroller,
    private readonly bp: BreakpointObserver,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit(): void {
    this.bp.observe([Breakpoints.Handset, '(max-width: 991.98px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => this.isMobile.set(r.matches));

    this.setupRouteListener();
    this.setupSearchListener();
    this.setupFiltersListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouteListener(): void {
    this.routeSub = combineLatest([this.__ActivatedRoute.params, this.__ActivatedRoute.queryParams])
      .pipe(
        map(([params, query]) => {
          const idFromUrl = Number(params?.['id']) || 0;
          const qpCat = query['categoryId'] ? Number(query['categoryId']) : null;
          const effectiveCat = (qpCat ?? idFromUrl) || 0;

          const title = params?.['ad'] ?? '';
          const keywordParam = (query['keyword'] ?? query['q'] ?? '').toString();

          const pf = query['priceFrom'] !== undefined && query['priceFrom'] !== '' ? Number(query['priceFrom']) : null;
          const pt = query['priceTo'] !== undefined && query['priceTo'] !== '' ? Number(query['priceTo']) : null;

          const rawCity = (query['cityId'] ?? query['CityId']);
          const qCityId = (rawCity !== undefined && rawCity !== null && rawCity !== '')
            ? String(rawCity)
            : null;

          return { effectiveCat, qpCat, title, keyword: keywordParam, pf, pt, qCityId };
        }),
        distinctUntilChanged((a, b) =>
          a.effectiveCat === b.effectiveCat &&
          a.qpCat === b.qpCat &&
          a.title === b.title &&
          a.keyword === b.keyword &&
          a.pf === b.pf &&
          a.pt === b.pt &&
          a.qCityId === b.qCityId
        ),
        tap(s => {
          this.title.set(s.title);
          this.categoryId.set(s.effectiveCat);
          this.searchText = s.keyword;
          this.priceFrom.set(s.pf);
          this.priceTo.set(s.pt);
          this.cityId.set(s.qCityId);
          this.pageNumber.set(1);
          this.breadcrumbList.set([
            { name: this.__LanguageService.translateText('home'), routerLink: '/' },
            { name: s.title || 'all' }
          ]);
        }),
        switchMap(() => this.fetchAds$(undefined, false)) // false = ليس من الفلاتر
      )
      .subscribe({
        next: (res) => this.applyAdsResponse(res),
        error: () => this.isLoading.set(false)
      });
  }

  private setupSearchListener(): void {
    this.searchSub = this.__UtilityService.navbarSearch.pipe(
      rxFilter(() => this.router.url.includes('/ads')),
      debounceTime(500),
      map(v => (v ?? '').toString().trim()),
      distinctUntilChanged(),
      tap(q => {
        this.router.navigate([], {
          relativeTo: this.__ActivatedRoute,
          queryParams: { keyword: q || null, page: 1 },
          queryParamsHandling: 'merge'
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private setupFiltersListener(): void {
    this.filtersChangeSub = this.filtersChange$.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(payload => {
        this.flatfieldChoices.set(payload || []);
        this.pageNumber.set(1);
      }),
      switchMap(() => this.fetchAds$(undefined, true)), // true = من الفلاتر
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => this.applyAdsResponse(res),
      error: () => this.isLoading.set(false)
    });
  }

  // من FilterAdsComponent
  onFiltersChange(payload: any[]): void {
    if (this.isFetching) return;
    this.filtersChange$.next(payload || []);
  }

  onChipsChange(chips: MobileChip[]): void {
    this.chips.set(chips || []);
  }

  removeChip(chip: MobileChip): void {
    this.filterCmps?.forEach(c => c.clearChip(chip));
  }

  sort(type: string): void {
    this.sortType.set(type);
    this.pageNumber.set(1);
    this.reload();
  }

  onPageChange(ev: { page: number, pageSize: number }): void {
    this.pageNumber.set(ev.page);
    this.pageSize.set(ev.pageSize);
    this.forceScrollToTop();
    this.reload();
  }

  // ===== فئة من الكلمة =====
  private resolveBestCategory$(keyword: string): Observable<{ id: number; nameAr?: string; nameEn?: string } | null> {
    const q = (keyword || '').trim();
    if (!q) return of(null);
    return this.loadCategories$().pipe(
      map(tree => {
        const match = this.findBestNode(tree, q);
        if (!match) return null;
        return { id: match.id, nameAr: match.nameAr || match.name, nameEn: match.nameEn || match.title };
      })
    );
  }

  private loadCategories$(): Observable<CategoryNode[]> {
    if (this.categoriesCache) return of(this.categoriesCache);
    const fromLocal = this.loadCategoriesFromLocal();
    if (fromLocal.length) {
      this.categoriesCache = fromLocal;
      return of(fromLocal);
    }

    const svc: any = this.__AdService as any;
    const fn = svc.getCategoriesTree || svc.getAllCategories || svc.getCategories;
    if (typeof fn === 'function') {
      return (fn.call(svc) as Observable<any>).pipe(
        map((list: any) => this.normalizeCategoriesFromApi(list)),
        tap((norm: CategoryNode[]) => this.categoriesCache = norm)
      );
    }
    return of([]);
  }

  private loadCategoriesFromLocal(): CategoryNode[] {
    try {
      const raw = localStorage.getItem(key.adsCategories);
      if (!raw) return [];
      const obj = JSON.parse(raw);
      const list = Array.isArray(obj?.list) ? obj.list : [];
      const mapNode = (n: any): CategoryNode => ({
        id: Number(n?.id) || 0,
        nameAr: n?.name ?? '',
        nameEn: n?.name_L1 ?? '',
        children: Array.isArray(n?.children) ? n.children.map(mapNode)
          : Array.isArray(n?.subCategories) ? n.subCategories.map(mapNode)
            : []
      });
      return list.map(mapNode);
    } catch {
      return [];
    }
  }

  private normalizeCategoriesFromApi(list: any): CategoryNode[] {
    const mapNode = (n: any): CategoryNode => {
      const nameEn = n?.nameEn ?? n?.titleEn ?? n?.name_L1 ?? n?.name ?? n?.title ?? '';
      const nameAr = n?.nameAr ?? n?.titleAr ?? n?.arabicName ?? n?.name ?? '';
      const children = Array.isArray(n?.children)
        ? n.children.map(mapNode)
        : Array.isArray(n?.subCategories)
          ? n.subCategories.map(mapNode)
          : [];
      return { id: Number(n?.id) || 0, nameEn, nameAr, children };
    };
    const arr = Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []);
    return arr.map(mapNode);
  }

  private findParentAndSiblings(tree: CategoryNode[], id: number): { parentName?: string; siblings?: any[] } | null {
    let result: { parentName?: string; siblings?: any[] } | null = null;
    const dfs = (nodes: CategoryNode[], parent?: CategoryNode) => {
      for (const n of nodes) {
        if (n.id === id) {
          result = {
            parentName: parent ? (parent.nameAr || parent.nameEn || parent.name || parent.title) : 'all',
            siblings: parent ? (parent.children || []) : nodes
          };
          return true;
        }
        if (dfs(n.children || [], n)) return true;
      }
      return false;
    };
    dfs(tree);
    return result;
  }

  private normalizeText(t: string): string {
    if (!t) return '';
    let s = t.toString().trim().toLowerCase();
    s = s.replace(/[آأإ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
    s = s.replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC-\u06DF-\u06E8\u06EA-\u06ED]/g, '');
    s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    return s;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  private scoreMatch(query: string, candidate: string): number {
    const q = this.normalizeText(query);
    const c = this.normalizeText(candidate);
    if (!q || !c) return 0;
    if (q === c) return 100;
    if (c.startsWith(q)) return 92;
    if (c.includes(q)) return 80;
    const dist = this.levenshtein(q, c);
    const maxLen = Math.max(q.length, c.length);
    const sim = 1 - dist / Math.max(1, maxLen);
    return Math.round(sim * 70);
  }

  private findBestNode(tree: CategoryNode[], keyword: string): CategoryNode | null {
    let best: CategoryNode | null = null;
    let bestScore = 0;
    const visit = (node: CategoryNode) => {
      const names = [node.nameEn || '', node.nameAr || '', node.name || '', node.title || ''].filter(Boolean);
      let nodeScore = 0;
      for (const n of names) nodeScore = Math.max(nodeScore, this.scoreMatch(keyword, n));

      for (const base in this.synonyms) {
        const baseNorm = this.normalizeText(base);
        const alts = this.synonyms[base].map(x => this.normalizeText(x));
        if (alts.includes(this.normalizeText(keyword))) {
          for (const n of names) nodeScore = Math.max(nodeScore, this.scoreMatch(baseNorm, n));
        }
      }

      if (nodeScore > bestScore) {
        bestScore = nodeScore;
        best = node;
      }
      (node.children || []).forEach(visit);
    };
    tree.forEach(visit);
    return bestScore >= 65 ? best : null;
  }

  // ====== API ======
  private fetchAds$(overrideCategoryId?: number | null, isFilterChange: boolean = false): Observable<any> {
    if (this.isFetching) {
      return EMPTY;
    }

    const qp = this.__ActivatedRoute.snapshot.queryParamMap;
    const qpCategory = qp.get('categoryId');
    const qpCatNum = qpCategory ? Number(qpCategory) : null;

    const effectiveCategoryId =
      overrideCategoryId !== undefined
        ? overrideCategoryId
        : (qpCatNum ?? (this.categoryId() || null));

    const rawCity = qp.get('cityId') ?? qp.get('CityId');
    const city = (rawCity !== null && rawCity !== '')
      ? String(rawCity)
      : this.cityId();

    // 🔥 إذا كان التغيير من الفلاتر، نجعل searchKeyword = null
    const searchKeyword = isFilterChange ? null : (this.searchText || null);

    const body: any = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchKeyword: searchKeyword, // 🔥 التغيير هنا
      categoryId: effectiveCategoryId,
      subCategoryId: qpCatNum ?? null,
      sortBy: this.sortType(),
      cityId: city,
      CityId: city,
      subDistrictId: null,
      flatfieldChoices: this.flatfieldChoices(),
      priceFrom: this.priceFrom(),
      priceTo: this.priceTo(),
      byUserId: null,
      userId: null,
      loginUser: null
    };

    const keyPayload = JSON.stringify(body);
    if (this.lastRequestKey === keyPayload) {
      return EMPTY;
    }
    this.lastRequestKey = keyPayload;

    this.isFetching = true;
    this.isLoading.set(true);
    this.__UtilityService.setGlobalLoading(true);

    return this.__AdService.getAllAdsByCategoryId(body)
      .pipe(
        finalize(() => {
          this.isFetching = false;
          this.isLoading.set(false);
          this.__UtilityService.setGlobalLoading(false);
        })
      );
  }

  private applyAdsResponse(res: any) {
    const list = res?.data?.data || [];
    const total = res?.data?.totalCount ?? 0;

    if ((total === 0 || list.length === 0) && 
        (this.categoryId() ?? 0) > 0 && 
        (this.searchText || '').trim() &&
        !this.isFetching) {
      
      setTimeout(() => {
        if (!this.isFetching) {
          this.lastRequestKey = null;
          this.fetchAds$(null, false).subscribe({
            next: (r2) => this.applyAdsResponse(r2),
            error: () => this.isLoading.set(false)
          });
        }
      }, 100);
      return;
    }

    this.ads.set(list);
    this.totalAds.set(total);
    this.countInPage.set(res?.data?.countInPage || list.length || 0);
    this.forceScrollToTop();
  }

  private reload() {
    if (this.isFetching) return;
    
    this.fetchAds$(undefined, false).subscribe({
      next: (res) => this.applyAdsResponse(res),
      error: () => this.isLoading.set(false)
    });
  }

  private findScrollParent(el: HTMLElement | null): HTMLElement | null {
    let node: HTMLElement | null = el;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      const overflowY = style.overflowY;
      const canScroll = /(auto|scroll|overlay)/.test(overflowY);
      if (canScroll && node.scrollHeight > node.clientHeight) return node;
      node = node.parentElement;
    }
    return null;
  }

  private forceScrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    setTimeout(() => {
      const el = this.topRef?.nativeElement || document.getElementById('ads-top') || undefined;
      const parent = el ? this.findScrollParent(el) : null;

      let tries = 0;
      const doScroll = () => {
        tries++;
        if (parent) {
          try {
            parent.scrollTo({ top: 0, behavior: 'smooth' });
          } catch {
            parent.scrollTop = 0;
          }
        }
        if (el) {
          try {
            el.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
          } catch {
            el.scrollIntoView(true);
          }
        }
        try {
          this.viewport.scrollToAnchor('ads-top');
        } catch { }
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' as ScrollBehavior });
        } catch { }
        (document.documentElement || document.body).scrollTop = 0;
        document.body.scrollTop = 0;

        if (tries < 2) {
          requestAnimationFrame(doScroll);
        }
      };

      requestAnimationFrame(doScroll);
    }, 50);
  }
}