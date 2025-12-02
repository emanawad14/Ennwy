import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdService } from '../../services/ad.service';
import { AuthService } from '../../services/auth.service';
import { key } from '../../core/config/localStorage';

export interface NotifItem {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  isRead: boolean;
}

@Component({
  standalone: true,
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, DatePipe]
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  // ✅ Paginator state
  pageNumber = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];

  // data
  notifications: NotifItem[] = [];
  totalCount = 0;

  // ui
  isLoading = false;
  lang: 'ar' | 'en' = (localStorage.getItem('lang') as any) || 'ar';

  // ❌ لم نعد نستخدم الـ infinite scroll مع paginator
  private io?: IntersectionObserver;
  private subs = new Subscription();
  @ViewChild('bottomAnchor', { static: false }) bottomAnchor!: ElementRef<HTMLDivElement>;

  constructor(private api: AdService, private auth: AuthService) {}

  ngOnInit(): void {
    this.fetch(); // أول صفحة
  }

  ngAfterViewInit(): void {
    // intentionally empty (no infinite scroll with paginator)
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.subs.unsubscribe();
  }

  // ===== Helpers =====
  trackById(_i: number, item: NotifItem): string { return item.id; }
  titleText() { return this.lang === 'ar' ? 'الإشعارات' : 'Notifications'; }
  back(): void { history.back(); }
  markAsRead(item: NotifItem): void { if (!item.isRead) item.isRead = true; }

  private getUserId(): string {
    const raw = localStorage.getItem(key.userInfo);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const id =
          this.pickId(u) ?? this.pickId(u?.user) ?? this.pickId(u?.profile) ?? this.pickId(u?.data);
        if (id) return id;
      } catch {}
    }
    return this.auth?.userProfileData?.id || localStorage.getItem('userId') || '';
  }
  private pickId(obj: any): string | null {
    if (!obj) return null;
    const c = [obj.id, obj.userId, obj.userID, obj.UserId, obj.UserID, obj.appUserId, obj.AppUserId];
    const f = c.find(v => v !== undefined && v !== null && v !== '');
    return f != null ? String(f) : null;
  }

  // ===== Pagination getters =====
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }
  get fromItem(): number {
    if (!this.totalCount) return 0;
    return (this.pageNumber - 1) * this.pageSize + 1;
  }
  get toItem(): number {
    return Math.min(this.totalCount, this.pageNumber * this.pageSize);
  }
  get visiblePages(): number[] {
    const max = 5;
    const total = this.totalPages;
    let start = Math.max(1, this.pageNumber - 2);
    let end = Math.min(total, start + max - 1);
    start = Math.max(1, end - max + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // ===== Actions =====
  changePageSize(size: number) {
    this.pageSize = Number(size);
    this.pageNumber = 1;
    this.fetch();
  }
  goToPage(p: number) {
    const page = Math.min(Math.max(1, p), this.totalPages);
    if (page === this.pageNumber) return;
    this.pageNumber = page;
    this.fetch();
  }

  private fetch(): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.isLoading = true;
    const sub = this.api.getNotification(userId, this.pageNumber, this.pageSize).subscribe({
      next: (res: any) => {
        // الشكل: res.data = { data: [...], totalCount, page, pageSize }
        const payload = res?.data;
        const rows = payload?.data ?? [];
        this.totalCount = Number(payload?.totalCount ?? 0);

        // NOTE: مع الباجينشن بنستبدل القائمة بدل الإضافة
        this.notifications = rows.map((n: any) => this.mapApiToItem(n));
      },
      error: (err) => console.error('Notifications error:', err),
      complete: () => (this.isLoading = false),
    });
    this.subs.add(sub);
  }

  private mapApiToItem(n: any): NotifItem {
    const isAr = this.lang === 'ar';
    const title = isAr ? (n.titile ?? n.titileEn ?? 'إشعار') : (n.titileEn ?? n.titile ?? 'Notification');
    const body  = isAr ? (n.description ?? n.descriptionEn ?? '') : (n.descriptionEn ?? n.description ?? '');
    return {
      id: String(n.id),
      title,
      body,
      createdAt: this.parseApiDate(n.created),
      isRead: !!n.isReaded
    };
  }

  private parseApiDate(s: string | null | undefined): Date {
    if (!s) return new Date();
    const [datePart, timePart = '00:00:00'] = s.split(' ');
    const [dd, MM, yyyy] = datePart.split('-').map(Number);
    const [hh, mm, ss] = timePart.split(':').map(Number);
    return new Date(yyyy || 1970, (MM || 1) - 1, dd || 1, hh || 0, mm || 0, ss || 0);
  }
}
