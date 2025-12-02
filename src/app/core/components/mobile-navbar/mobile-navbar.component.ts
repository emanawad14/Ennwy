import { Component, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SearchComponent } from '../navbar/search/search.component';
import { LocationComponent } from '../navbar/location/location.component';

import Swal from 'sweetalert2';
import { LanguageService } from '../../../services/generic/language.service';
import { key } from '../../config/localStorage';

@Component({
  selector: 'app-mobile-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    SearchComponent,
    LocationComponent,
  ],
  templateUrl: './mobile-navbar.component.html',
  styleUrls: ['./mobile-navbar.component.scss'],
})
export class MobileNavbarComponent {
  language = signal<string>('en');
  userInfo = signal<any>(null);

  firstNameInitial = computed(() => {
    const u = this.userInfo();
    if (!u) return '?';
    const raw = (u.firstName ?? u.fullName ?? u.name ?? u.email ?? '').toString().trim();
    if (!raw) return '?';
    const first = [...raw][0] ?? '?';
    return typeof first === 'string' && (first as any).toUpperCase ? (first as string).toUpperCase() : first;
  });

  isArabic = computed(() => this.language() === 'ar');

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly router: Router,
    private __Router: Router,
    private readonly zone: NgZone, // مهم علشان التنقل بعد SweetAlert
  ) {}

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
    this.getUserData();
  }

  changeLanguage(lang: string): void {
    this.__LanguageService.changeLang(lang);
    localStorage.setItem(key.language, lang);
    if (typeof window !== 'undefined') window.location.reload();
  }

  getUserData(): void {
    const userData = localStorage.getItem(key.userInfo);
    if (!userData) { this.userInfo.set(null); return; }
    try {
      const user = JSON.parse(userData);
      this.userInfo.set(Object.keys(user || {}).length ? user : null);
    } catch {
      this.userInfo.set(null);
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key.userInfo);
        localStorage.removeItem(key.selectedCategory);

      } finally {

        const url = this.__Router.serializeUrl(this.__Router.createUrlTree(['/home']));
        if (typeof window !== "undefined") {
          window.location.replace(url);
        }
      }

    }
  }

  /** الذهاب لصفحة تسجيل الدخول مباشرة */
  async goToLogin(e?: Event): Promise<void> {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    await this.router.navigate(['/auth/login']);
  }

  /** Toast موحّد ثم تحويل لصفحة اللوجن */
  private async showLoginToastAndRedirect(returnUrl?: string): Promise<void> {
    const isAr = this.language() === 'ar';
    await Swal.fire({
      icon: 'info',
      toast: true,
      position: isAr ? 'top-start' : 'top-end',
      timer: 1300,
      showConfirmButton: false,
      title: isAr ? 'من فضلك سجّل الدخول أولًا' : 'Please log in first',
    });
    const extras = returnUrl ? { queryParams: { returnUrl } } : undefined;
    await this.router.navigate(['/auth/login'], extras);
  }

  /** هل الاسم الكامل متوفر؟ */
  private hasFullName(user: any): boolean {
    const fullNameRaw = (user?.fullName ?? '').toString();
    const fullName = fullNameRaw.trim();
    return !!fullName;
  }

  /**
   * لو الاسم ناقص → يعرض تنبيه ويحوّل إلى /edit-profile مع returnUrl
   * يرجّع true لو جاهز يكمل، false لو وقّف علشان يكمّل البيانات.
   */
  private async ensureFullNameOrRedirect(returnUrl: string): Promise<boolean> {
    const user = this.userInfo();
    if (this.hasFullName(user)) return true;

    const isAr = this.language() === 'ar';
    const res = await Swal.fire({
      icon: 'info',
      title: isAr ? 'استكمال البيانات' : 'Complete your profile',
      text: isAr
        ? 'من فضلك أكمل اسمك الكامل قبل نشر إعلان.'
        : 'Please complete your full name before posting an ad.',
      showCancelButton: true,
      confirmButtonText: isAr ? 'تحديث البيانات' : 'Update profile',
      cancelButtonText: isAr ? 'إلغاء' : 'Cancel',
      reverseButtons: isAr,
      allowOutsideClick: false
    });

    if (res.isConfirmed) {
      // مهم: نجري التنقل داخل Angular Zone
      this.zone.run(() => {
        this.router.navigate(['/edit-profile'], {
          queryParams: { returnUrl }
        });
      });
    }

    return false;
  }

  /** Post Ad: يتأكد من اللوجن ثم استكمال البيانات */
  async onPostAdClick(e: Event): Promise<void> {
    e.preventDefault(); e.stopPropagation();

    const returnUrl = '/post-ad';

    // 1) لازم لوجن
    if (!this.userInfo()) {
      await this.showLoginToastAndRedirect(returnUrl);
      return;
    }

    // 2) لازم الاسم الكامل
    if (!(await this.ensureFullNameOrRedirect(returnUrl))) return;

    // 3) كل شيء تمام
    this.router.navigate([returnUrl]);
  }

  /** Chat */
  async onChatClick(e: Event): Promise<void> {
    e.preventDefault(); e.stopPropagation();
    if (this.userInfo()) { this.router.navigate(['/chats-page']); return; }
    await this.showLoginToastAndRedirect('/chats-page');
  }

  /** Notifications */
  async onNotificationsClick(e: Event): Promise<void> {
    e.preventDefault(); e.stopPropagation();
    if (this.userInfo()) { this.router.navigate(['/notifications']); return; }
    await this.showLoginToastAndRedirect('/notifications');
  }
}
