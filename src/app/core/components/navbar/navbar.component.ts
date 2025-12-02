import { Component, signal, NgZone } from '@angular/core';
import { Router, RouterModule, NavigationExtras } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';

import { LanguageService } from '../../../services/generic/language.service';
import { UtilityService } from '../../../services/generic/utility.service';
import { UserInfoComponent } from './user-info/user-info.component';
import { LocationComponent } from './location/location.component';
import { SearchComponent } from './search/search.component';

const STORAGE_USER_KEY = 'EnnwyUserInfo'; // <-- المفتاح المطلوب

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    LocationComponent,
    SearchComponent,
    UserInfoComponent,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  language = signal<string>('en');
  userInfo = signal<any>(null);

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __UtilityService: UtilityService,
    private readonly __Router: Router,
    private readonly zone: NgZone // مهم للتنقل بعد SweetAlert
  ) {}

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
    this.getUserData();
  }

  changeLanguage(lang: string): void {
    this.__LanguageService.changeLang(lang);
    localStorage.setItem('language', lang);
    window.location.reload();
  }

  /** جلب بيانات المستخدم من localStorage: EnnwyUserInfo */
  getUserData(): void {
    const userData = localStorage.getItem(STORAGE_USER_KEY);
    if (!userData) {
      this.userInfo.set(null);
      return;
    }
    try {
      const user = JSON.parse(userData);
      const isEmpty = !user || Object.keys(user).length === 0;
      this.userInfo.set(isEmpty ? null : user);
    } catch {
      this.userInfo.set(null);
    }
  }

  onCityChanged(cityId: string): void {
    this.__UtilityService.cityId.next(cityId);
  }

  /** فتح صفحة اللوجن وتمرير returnUrl */
  goToLogin(returnUrl?: string): void {
    const extras: NavigationExtras = returnUrl ? { queryParams: { returnUrl } } : {};
    this.__Router.navigate(['/auth/login'], extras);
  }

  /** رابط اللوجن */
  goToLoginLink(): void {
    this.goToLogin();
  }

  /** تأكيد اللوجن قبل المتابعة */
  private async requireLoginGuard(returnUrl?: string): Promise<boolean> {
    if (this.userInfo()) return true;

    const isAr = this.language() === 'ar';
    const res = await Swal.fire({
      icon: 'warning',
      title: isAr ? 'تسجيل الدخول مطلوب' : 'Login required',
      text: isAr ? 'يجب تسجيل الدخول أولاً للمتابعة.' : 'You need to log in to continue.',
      showCancelButton: true,
      confirmButtonText: isAr ? 'تسجيل الدخول' : 'Log in',
      cancelButtonText: isAr ? 'إلغاء' : 'Cancel',
      reverseButtons: isAr,
      confirmButtonColor: '#d33',
      allowOutsideClick: false
    });

    if (res.isConfirmed) this.goToLogin(returnUrl);
    return false;
  }

  /**
   * التحقق من أن fullName موجود (بعد trim).
   * لو فاضي → فتح SweetAlert، ثم التنقّل إلى edit-profile داخل Angular Zone.
   */
  private async ensureFullNameOrRedirect(returnUrl: string): Promise<boolean> {
    const user = this.userInfo();
    const fullNameRaw = (user?.fullName ?? '').toString();
    const fullName = fullNameRaw.trim();

    if (fullName) return true;

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
      // مهم: نجري التنقل داخل Angular Zone لضمان عمل Router بشكل فوري
      this.zone.run(() => {
        this.__Router.navigate(['/edit-profile'], {
          queryParams: { returnUrl }
        });
      });
    }

    return false;
  }


  async onPostAdClick(): Promise<void> {
    const returnUrl = '/post-ad';


    if (!(await this.requireLoginGuard(returnUrl))) return;


    if (!(await this.ensureFullNameOrRedirect(returnUrl))) return;


    this.__Router.navigate([returnUrl]);
  }


  async onChatClick(evt: Event): Promise<void> {
    evt.preventDefault();
    if (!(await this.requireLoginGuard('/chats-page'))) return;
    this.__Router.navigate(['/chats-page']);
  }


  async onNotificationsClick(evt: Event): Promise<void> {
    evt.preventDefault();
    if (!(await this.requireLoginGuard('/notifications'))) return;
    this.__Router.navigate(['/notifications']);
  }
}
