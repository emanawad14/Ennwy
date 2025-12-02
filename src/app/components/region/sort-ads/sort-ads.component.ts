import { Component, EventEmitter, Output, signal, OnDestroy, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-sort-ads',
  standalone: true,
  imports: [TranslateModule, CommonModule],
  templateUrl: './sort-ads.component.html',
  styleUrl: './sort-ads.component.scss'
})
export class SortAdsComponent implements OnInit, OnDestroy {
  type = signal<string>('newest');
  title = signal<string>('newlyListed');

  @Output() sortHandler = new EventEmitter<string>();

  // اخفي المكوّن في الصفحة الرئيسية
  private subs = new Subscription();
  isHidden = false;
  private hiddenRoutes = ['/', '/home']; // عدّل لو عندك لاندينج تانية

  // نتتبع آخر categoryId عشان نعرف إذا اتغيّرت الفئة
  private prevCategoryId: string | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const handleRoute = (url: string) => {
      const clean = this.normalizeUrl(url);
      // إخفاء الcomponent في الهوم
      this.isHidden = this.hiddenRoutes.some(p => clean === p || clean.startsWith(p + '/'));

      // لو داخل ads/:id/... استخرج الـ id
      const currentId = this.extractCategoryId(clean);

      // لو id اتغير → اعمل Reset للترتيب وابعت "newest" للـ API
      if (currentId !== this.prevCategoryId) {
        this.prevCategoryId = currentId;
        if (currentId) {
          this.resetToNewestAndEmit();
        }
      }
    };

    // أول مرة
    handleRoute(this.router.url);

    // على كل تنقّل ناجح
    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => handleRoute(e.urlAfterRedirects ?? e.url))
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // === Helpers ===
  private normalizeUrl(url: string): string {
    let u = (url || '').split('?')[0].split('#')[0];
    if (u.endsWith('/') && u !== '/') u = u.slice(0, -1);
    return u || '/';
  }

  // نتوقع مسار بالشكل: /ads/:id أو /ads/:id/:slug
  private extractCategoryId(path: string): string | null {
    const m = path.match(/^\/ads\/([^\/?#]+)/i);
    return m ? decodeURIComponent(m[1]) : null;
  }

  private resetToNewestAndEmit(): void {
    this.title.set('newlyListed');
    this.type.set('newest');
    // ابعت للـ Parent علشان يستدعي الـ API بـ newest
    this.sortHandler.emit('newest');
  }

  // === UI Actions ===
  sort(type: string, name: string): void {
    this.title.set(name);
    this.type.set(type);
    this.sortHandler.emit(type);
  }

  checkType(type: string): boolean {
    return type !== this.type();
  }
}
