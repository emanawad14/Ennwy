import {
  Component, signal, ElementRef, ViewChild, OnDestroy, OnInit, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { LanguageService } from '../../../../services/generic/language.service';
import { AdService } from '../../../../services/ad.service';
import { key } from '../../../../core/config/localStorage';

type SuggestionRow = {
  categoryId: number | null;
  categoryNameArabic?: string;
  categoryNameEnglish?: string;
  suggestions?: Array<{ combinedWord: string; frequency: number }>;
};
type SuggestionItem = { text: string; frequency: number };
type SuggestionGroup = {
  categoryId: number | null;
  categoryNameAr?: string;
  categoryNameEn?: string;
  total: number;
  items: SuggestionItem[];
};

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  language = signal<string>('en');

  @ViewChild('search', { static: false }) searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('wrap',   { static: false }) wrapRef?: ElementRef<HTMLDivElement>;

  open = signal<boolean>(false);
  loading = signal<boolean>(false);
  groups = signal<SuggestionGroup[]>([]);
  lastQuery = signal<string>('');
  ddStyle = signal<{left:string; top:string; width:string}>({left:'0px', top:'0px', width:'0px'});

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  
  private hiddenRoutes: string[] = [
    '/chats-page','/post-ad','/profile','/edit-profile','/notifications','/changepassword',
    '/terms-and-conditions','/contact-us','/helpsupport','/ticket','/sell-ad','/properties'
  ];
  isHidden = false;

  adsLink: any[] = ['/ads'];

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly router: Router,
    private readonly __AdService: AdService
  ) {}

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
    this.isHidden = this.hiddenRoutes.some(p => (this.router.url || '').split('?')[0].startsWith(p));
    this.adsLink = this.detectAdsLink(this.router.config);
    this.setupSearchOnType();
  }

  ngOnDestroy(): void { 
    this.searchSubscription?.unsubscribe();
    this.searchSubject.complete();
  }

  private setupSearchOnType(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          this.close();
          return [];
        }
        this.loading.set(true);
        this.open.set(true);
        this.positionDropdown();
        return (this.__AdService as any).getfilters(query, null);
      })
    ).subscribe({
      next: (res: any) => this.handleSearchResponse(res),
      error: () => { 
        this.loading.set(false); 
        this.groups.set([]); 
      }
    });
  }

  onSearchInput(ev: any): void {
    const query = (ev?.target?.value || '').toString().trim();
    this.lastQuery.set(query);
    if (query && query.length > 1) {
      this.searchSubject.next(query);
    } else {
      this.close();
    }
  }

  onSearch(rawVal: any): void {
    const q = (rawVal ?? '').toString().trim();
    if (!q) { 
      this.close(); 
      return; 
    }
    this.navigateToAds(q, null);
    this.clearSearch(); // ← تفريغ الحقل بعد البحث
  }

  onPick(g: SuggestionGroup, it: SuggestionItem): void {
    const keyword = it?.text || this.lastQuery();
    const categoryId = g?.categoryId || null;

    if (categoryId) {
      this.saveCategoryToStorage(categoryId);
    }

    this.navigateToAds(keyword, categoryId);
    this.clearSearch(); // ← تفريغ الحقل بعد اختيار اقتراح
  }

  private navigateToAds(keyword: string, categoryId: number | null): void {
    const qp: any = { keyword };
    if (categoryId) qp['categoryId'] = categoryId;
    this.router.navigate(this.adsLink, { queryParams: qp });
  }

  private saveCategoryToStorage(categoryId: number): void {
    try {
      const stored = localStorage.getItem(key.adsCategories);
      const obj = stored ? JSON.parse(stored) : {};
      localStorage.setItem(key.adsCategories, JSON.stringify({ 
        title: obj?.title, 
        list: obj?.list, 
        id: categoryId 
      }));
    } catch {}
  }

  private handleSearchResponse(res: any): void {
    const rows: SuggestionRow[] = Array.isArray(res?.data) ? res.data : [];
    const groups: SuggestionGroup[] = rows.map((row) => {
      const items: SuggestionItem[] = (row?.suggestions || [])
        .map(s => ({ text: String(s?.combinedWord || '').trim(), frequency: Number(s?.frequency || 0) }))
        .filter(x => !!x.text)
        .sort((a, b) => b.frequency - a.frequency);
      
      const total = items.reduce((acc, it) => acc + (it.frequency || 0), 0);
      return {
        categoryId: row?.categoryId ?? null,
        categoryNameAr: row?.categoryNameArabic || '',
        categoryNameEn: row?.categoryNameEnglish || '',
        total,
        items: items.slice(0, 10)
      };
    }).filter(g => g.items.length > 0);

    this.groups.set(groups);
    this.loading.set(false);

    if (!groups.length && this.lastQuery()) {
      setTimeout(() => {
        if (this.groups().length === 0 && this.lastQuery()) this.close();
      }, 1000);
    }
  }

  private clearSearch(): void {
    this.lastQuery.set('');
    this.groups.set([]);
    this.open.set(false);
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.value = '';
    }
  }

  close(): void {
    this.open.set(false);
    this.loading.set(false);
    this.groups.set([]);
  }

  private positionDropdown(): void {
    const el = this.searchInput?.nativeElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.ddStyle.set({
      left: `${r.left}px`,
      top: `${r.bottom + 4}px`,
      width: `${r.width}px`
    });
  }

  @HostListener('window:resize') onResize() { 
    if (this.open()) this.positionDropdown(); 
  }
  
  @HostListener('window:scroll') onScroll() { 
    if (this.open()) this.positionDropdown(); 
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const host = this.wrapRef?.nativeElement;
    const target = e.target as HTMLElement;
    if (host && target && !host.contains(target)) this.close();
  }

  trackByGroup = (_: number, g: SuggestionGroup) => `${g.categoryId}-${g.categoryNameAr || g.categoryNameEn || ''}`;
  trackByItem  = (_: number, i: SuggestionItem)  => i.text;

  private detectAdsLink(routes: Routes): any[] {
    const hasPlainAds = this.walk(routes, r => r.path === 'ads' && !/[:]/.test(r.path ?? ''));
    return hasPlainAds ? ['/ads'] : ['/ads', 0, 'all'];
  }
  
  private walk(routes: Routes, pred: (r:any)=>boolean): boolean {
    for (const r of routes) {
      if (pred(r)) return true;
      if (r.children && this.walk(r.children, pred)) return true;
      if (r.loadChildren) continue;
    }
    return false;
  }
}
