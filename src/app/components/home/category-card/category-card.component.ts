import {
  Component, input, signal, Inject, PLATFORM_ID,
  AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../../services/generic/language.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';

type CategoryItem = {
  id: number | string;
  name?: string;     // عربي
  name_L1?: string;  // إنجليزي
  parentId?: number | string;
  children?: CategoryItem[];
};

declare global { interface Window { bootstrap?: any; } }

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [TranslateModule, RouterModule, CommonModule],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss'
})
export class CategoryCardComponent implements AfterViewInit, OnDestroy {
  language = signal<string>('en');

  showIcon = input<boolean>();
  title = input<string>('');
  icon = input<string>('');
  items = input<CategoryItem[]>([]);
  index = input<number>(0);

  // لو الأب بعث parentId صريح لمسار "الكل في ..."
  parentId = input<number | string | null | undefined>(null);

  @ViewChild('offcanvasRef') offcanvasRef!: ElementRef<HTMLElement>;
  private backdropEl: HTMLElement | null = null;
  private isBrowser = false;

  // حالة التصفّح الهرمي للموبايل
  path: CategoryItem[] = []; // من الجذر حتى الحالي
  get depth(): number { return this.path.length; }

  constructor(
    private readonly __LanguageService: LanguageService,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private zone: NgZone
  ) { this.isBrowser = isPlatformBrowser(this.platformId); }

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
  }

  /* ===== أسماء وروابط ===== */
  label = (item: CategoryItem | null | undefined): string => {
    if (!item) return '';
    return this.language() === 'ar'
      ? (item.name ?? '')
      : (item.name_L1 ?? item.name ?? '');
  };

  allInLabel(): string {
    // لبطاقة الديسكتوب: استخدم أول عنصر أو عنوان الكرت
    const first = this.items()?.[0] ?? null;
    const base = this.label(first) || this.title();
    return this.language() === 'ar' ? `الكل في ${base}` : `All in ${base}`;
  }

  allInRoute(): any[] | null {
    const first = this.items()?.[0] ?? null;
    const id = this.parentId() ?? first?.parentId ?? first?.id ?? null;
    if (id == null) return null;
    const slugSource = this.label(first) || this.title();
    return ['/ads', id, this.slugify(slugSource)];
  }

  currentTitle(): string {
    if (this.depth === 0) return this.title() || (this.items()?.[0] ? this.label(this.items()[0]) : '');
    return this.label(this.path[this.depth - 1]);
  }

  currentList(): CategoryItem[] {
    if (this.depth === 0) return this.items() || [];
    return this.path[this.depth - 1]?.children || [];
  }

  currentAllInRoute(): any[] | null {
    if (this.depth === 0) return this.allInRoute();
    const cur = this.path[this.depth - 1];
    if (!cur?.id) return null;
    return ['/ads', cur.id, this.label(cur)];
  }

  currentAllInLabel(): string {
    const t = this.currentTitle();
    return this.language() === 'ar' ? `الكل في ${t}` : `All in ${t}`;
  }

  hasChildren = (item: CategoryItem | null | undefined) =>
    !!(item && item.children && item.children.length);

  goDeeper(item: CategoryItem): void {
    if (!this.hasChildren(item)) return;
    this.path.push(item);
  }

  goBack(): void {
    if (this.depth > 0) this.path.pop();
  }

  trackById = (_: number, item: CategoryItem) => String(item?.id);

  private slugify(text: string): string {
    return (text || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-ء-ي]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /* ====== Offcanvas ====== */
  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.zone.runOutsideAngular(() => {
      const el = this.offcanvasRef?.nativeElement;
      if (el && el.parentElement !== document.body) document.body.appendChild(el);
      if (el && !el.id) el.id = this.offcanvasId;
    });
  }

  ngOnDestroy(): void { this.closeFallback(); }

  get offcanvasId(): string {
    const firstId = this.items()?.[0]?.id ?? '0';
    const idx = this.index() ?? '0';
    return `offcanvas-${firstId}-${idx}`;
  }

  openOffcanvas(ev: Event): void {
    ev.preventDefault();
    if (!this.isBrowser) return;

    // ابدأ من الجذر كل مرة
    this.path = [];

    const el = document.getElementById(this.offcanvasId) || this.offcanvasRef?.nativeElement;
    if (!el) return;
    try {
      const BS = (window as any).bootstrap;
      if (BS?.Offcanvas) {
        const inst = BS.Offcanvas.getOrCreateInstance(el, { backdrop: true, scroll: true });
        inst.show(); return;
      }
    } catch {}
    this.showFallback(el);
  }

  private showFallback(el: HTMLElement): void {
    el.classList.add('show');
    el.style.visibility = 'visible';
    el.style.transform = 'none';
    this.backdropEl = document.createElement('div');
    this.backdropEl.className = 'offcanvas-backdrop fade show';
    document.body.appendChild(this.backdropEl);
    document.body.style.overflow = 'hidden';
    const closeBtn = el.querySelector('[data-bs-dismiss="offcanvas"], .btn-close') as HTMLElement | null;
    const onClose = () => this.closeFallback();
    closeBtn?.addEventListener('click', onClose, { once: true });
    this.backdropEl.addEventListener('click', onClose, { once: true });
  }

  private closeFallback(): void {
    const el = document.getElementById(this.offcanvasId);
    if (el) { el.classList.remove('show'); el.style.visibility = ''; el.style.transform = ''; }
    if (this.backdropEl) { try { document.body.removeChild(this.backdropEl); } catch {} this.backdropEl = null; }
    document.body.style.overflow = '';
  }
}
