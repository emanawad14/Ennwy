import { UtilityService } from './../../services/generic/utility.service';
import { BreadcrumbComponent } from '../region/breadcrumb/breadcrumb.component';
import { AdOwnerCardComponent } from './ad-owner-card/ad-owner-card.component';
import { LanguageService } from '../../services/generic/language.service';
import { DomSanitizer, SafeResourceUrl, Meta, Title } from '@angular/platform-browser';
import { AdService } from '../../services/ad.service';
import { IAdDetails, IFlatField, IUser } from '../../core/interfaces/ad';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, computed, signal, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { key } from '../../core/config/localStorage';
import { generateSeoFromDescription } from './seo.util';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ad',
  standalone: true,
  imports: [BreadcrumbComponent, AdOwnerCardComponent, TranslateModule, CommonModule, RouterModule],
  templateUrl: './ad.component.html',
  styleUrls: ['./ad.component.scss']
})
export class AdComponent implements AfterViewInit {
  language = signal<string>('en');
  breadcrumbList = signal<{ name: string; routerLink?: string }[]>([]);
  adDetails = signal<IAdDetails>({} as IAdDetails);
  isLoading = signal<boolean>(false);

  public mapError = false;
  mapUrl!: SafeResourceUrl;

  selectedImageUrl: string = '';
  currentAdId!: number;
  private loggedOnce = false;

  currentSlide = signal(0);
  @ViewChild('mobileCarousel', { static: false }) mobileCarousel?: ElementRef<HTMLElement>;

  isPhoneRevealed = signal(false);
  phoneNumber: string | null = null;
  private fetchingPhone = false;

  chatMessage = signal<string>('');
  sendingChat = signal<boolean>(false);
  @ViewChild('chatModalRef') chatModalRef?: ElementRef<HTMLDivElement>;
  private chatModal?: any;

  private metaService = inject(Meta);

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __ActivatedRoute: ActivatedRoute,
    public readonly __UtilityService: UtilityService,
    private readonly __AdService: AdService,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private meta: Meta,
    private titleService: Title,
    private readonly __Router: Router
  ) {
    this.breadcrumbList().push({
      name: this.__LanguageService.translateText('home'),
      routerLink: '/'
    });
  }

  get currentLang(): string { return this.translate.currentLang; }

  ngOnInit(): void {
    this.__ActivatedRoute.params.subscribe((param: any) => {
      const id = Number(param.id);
      this.currentAdId = id;
      this.breadcrumbList().push({ name: param?.title });
      this.getAdById(id);
      this.language.set(this.__LanguageService.getLanguage());
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      const el = this.mobileCarousel?.nativeElement;
      if (el) {
        el.addEventListener('slid.bs.carousel', () => {
          const items = Array.from(el.querySelectorAll('.carousel-item'));
          const idx = items.findIndex((it) => it.classList.contains('active'));
          this.currentSlide.set(idx >= 0 ? idx : 0);
        });
      }

      const mEl = this.chatModalRef?.nativeElement;
      if ((window as any).bootstrap && mEl) {
        this.chatModal = new (window as any).bootstrap.Modal(mEl);
      }
    });
  }

  private updateMapFromAdDetails(): void {
    const lat = this.adDetails()?.latitude;
    const lng = this.adDetails()?.longitude;
    if (lat && lng) {
      const url = `https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${lat},${lng}&zoom=14`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.mapError = false;
    } else {
      this.mapError = true;
    }
  }

  private updateSEO(ad: any): void {
    const seo = generateSeoFromDescription(ad.description || ad.title);
    this.titleService.setTitle(ad.title);
    this.metaService.updateTag({ name: 'description', content: ad.description });
    this.metaService.updateTag({ name: 'keywords', content: seo.keywords.join(', ') });
    if (ad.photos?.length) {
      this.metaService.updateTag({ property: 'og:image', content: this.convertToSeoImage(ad.photos[0]) });
    }
    this.metaService.updateTag({ property: 'og:title', content: ad.title });
    this.metaService.updateTag({ property: 'og:description', content: ad.description });
    this.metaService.updateTag({ name: 'slug', content: seo.slug });
  }

  getAdById(id: number): void {
    this.isLoading.set(true);
    this.__AdService.getAdById(id).subscribe({
      next: (res: any) => {
        const data = res?.data;
        const mapped: IAdDetails = {
          ...data,
          photos: Array.isArray(data?.photos) ? data.photos : [],
          flatFields: Array.isArray(data?.flatFields) ? data.flatFields : []
        } as IAdDetails;

        this.adDetails.set(mapped);
        this.updateMapFromAdDetails();
        this.updateSEO(mapped);
        this.isLoading.set(false);
        this.logAdView();
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  private logAdView(): void {
    if (this.loggedOnce) return;
    const raw = localStorage.getItem(key.userInfo);
    if (!raw) return;

    try {
      const user = JSON.parse(raw);
      const userId = user?.id ?? user?.userId ?? user?.UserId ?? user?.ID ?? null;
      if (!userId || !this.currentAdId) return;

      this.__AdService.LogAd({ userId, advertisementId: this.currentAdId }).subscribe({
        next: () => (this.loggedOnce = true),
        error: () => { }
      });
    } catch { }
  }

  private hasValue(ff: IFlatField): boolean {
    const hasNum = typeof ff.valueNumber === 'number' && ff.valueNumber > 0;
    const hasStr = typeof ff.valueString === 'string' && ff.valueString.trim() !== '';
    const hasChoice = typeof ff.choiceName === 'string' && ff.choiceName.trim() !== '';
    const hasChoiceL1 = typeof ff.choiceName_L1 === 'string' && ff.choiceName_L1?.trim() !== '';
    return hasNum || hasStr || hasChoice || hasChoiceL1;
  }

  featuredDetails = computed(() =>
    (this.adDetails()?.flatFields || []).filter(ff =>
      !['الكماليات', 'الإضافات', 'Add-ons', 'Extras'].includes(ff.name?.trim() || '') && this.hasValue(ff)
    )
  );

  featuredSpecs = computed(() =>
    (this.adDetails()?.flatFields || []).filter(ff =>
      !['الكماليات', 'الإضافات', 'Add-ons', 'Extras'].includes(ff.name?.trim() || '') && this.hasValue(ff)
    )
  );

  getExtras(): IFlatField[] {
    const list = (this.adDetails()?.flatFields || []);
    return list.filter(ff =>
      (ff.attribute === 'extra_features' || ['الكماليات', 'إضافات', 'Add-ons', 'Extras'].includes(ff.name?.trim() || ''))
      && this.hasValue(ff)
    );
  }

  getAmenityIcon(label: string): string {
    const iconsMap: { [k: string]: string } = {
      'شرفة': 'bi-house-door',
      'أجهزة المطبخ': 'bi-refrigerator',
      'أمن': 'bi-shield-lock',
      'عداد كهرباء': 'bi-lightning-charge',
      'عداد مياه': 'bi-droplet',
      'مسموح بالحيوانات الاليفة': 'bi-paw',
      'أسانسير': 'bi bi-arrow-down-up',
      'تدفئة وتكييف مركزي': 'bi bi-wind',
      'Air Conditioner': 'bi bi-wind',
      'انترنت': 'bi bi-wifi',
      'Internet': 'bi bi-wifi',
      'غسالة': 'bi bi-droplet-half',
      'Washing Machine': 'bi bi-droplet-half',
      'سخان': 'bi bi-fire',
      'Heater': 'bi bi-fire',
      'Furnished': 'bi-sofa',
      'Kitchen Appliances': 'bi-refrigerator',
      'Balcony': 'bi-house-door',
      'Electric Meter': 'bi-lightning-charge',
      'Water Meter': 'bi-droplet',
      'Security': 'bi-shield-lock',
      'Pets Allowed': 'bi-paw',
      'Elevator': 'bi bi-arrow-down-up'
    };
    return iconsMap[label?.trim()] || 'bi-check-circle';
  }

  getFeatureIcon(key: string): string {
    const iconsMap: { [k: string]: string } = {
      'النوع': 'bi bi-house',
      'المساحة': 'bi bi-aspect-ratio',
      'غرف نوم': 'bi bi-door-closed',
      'الحمامات': 'bi bi-droplet-half',
      'مفروش': 'bi bi-house',
      'معدل الإيجار': 'bi bi-calendar-week',
      'الدور': 'bi bi-building',
      'الموقع': 'bi bi-geo-alt',
      'الواجهة': 'bi bi-compass',
      'عدد الطوابق': 'bi bi-layers',
      'عدد الشقق': 'bi bi-grid-1x2',
      'المساحة (م٢)': 'bi bi-aspect-ratio',
      'Area': 'bi bi-aspect-ratio',
      'نوع الوقود': 'bi bi-fuel-pump',
      'Fuel Type': 'bi bi-fuel-pump',
      'الحالة': 'bi bi-check-circle',
      'الماركة': 'bi bi-car-front-fill',
      'ناقل الحركة': 'bi bi bi-gear',
      'Transmission': 'bi bi bi-gear',
      'سنة الصنع': 'bi bi-calendar',
      'Year': 'bi bi-calendar',
      'كيلومترات': 'bi bi-speedometer2',
      'Mileage': 'bi bi-speedometer2',
      'عدد الملاك': 'bi bi-people',
      'Owners': 'bi bi-people',
      'Condition': 'bi bi-check-circle',
      'سعة المحرك': 'bi bi-speedometer',
      'Engine Capacity': 'bi bi-speedometer',
      'عدد الأبواب': 'bi bi-door-open',
      'Doors': 'bi bi-door-open',
      'الدفع': 'bi bi-gear-wide-connected',
      'Drive': 'bi bi-gear-wide-connected'
    };
    return 'bi ' + (iconsMap[key?.trim()] || 'bi-check-circle');
  }

  // ======== Utils للأزرار فوق الصور / داخل المودال ========
  eat(e: Event): void { if (e) { e.preventDefault(); e.stopPropagation(); } }
  onShareFromImage(e: Event): void { this.eat(e); this.onShare(); }
  onFavFromImage(e: Event): void { this.eat(e); this.toggleFavorite('image'); }

  private getAdOwnerUserId(): string | null {
    const ad = this.adDetails();
    return ad?.userId ?? null;
  }

  private userAgent = navigator.userAgent || '';
  private isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(this.userAgent);
  }

  private onlyDigits(v: string): string {
    return v.replace(/\D+/g, '').replace(/^00/, '');
  }

  private ensurePhoneThen(action: () => void): void {
    if (this.phoneNumber) { action(); return; }
    if (this.fetchingPhone) return;

    const userId = this.getAdOwnerUserId();
    if (!userId || !this.currentAdId) return;

    this.fetchingPhone = true;
    this.__AdService.LogContact({
      userId,
      advertisementId: this.currentAdId,
      contactMethod: 2
    }).subscribe({
      next: (res: any) => {
        const apiNumber =
          (typeof res?.data === 'string' && res.data) ||
          res?.data?.phoneNumber ||
          res?.phoneNumber ||
          null;

        this.phoneNumber = apiNumber || this.adDetails()?.phoneNumber || null;
        this.isPhoneRevealed.set(!!this.phoneNumber);
        this.fetchingPhone = false;

        if (this.phoneNumber) action();
      },
      error: () => { this.fetchingPhone = false; }
    });
  }

  onRevealPhone(): void { this.ensurePhoneThen(() => {}); }

  callNumber(): void {
    this.ensurePhoneThen(() => {
      const digits = this.onlyDigits(this.phoneNumber!);
      if (typeof window !== 'undefined') window.location.href = `tel:${digits}`;
    });
  }

  openWhatsApp(): void {
    this.ensurePhoneThen(() => {
      const digits = this.onlyDigits(this.phoneNumber!);
      const url = this.isMobileDevice() ? `whatsapp://send?phone=${digits}` : `https://wa.me/${digits}`;
      if (typeof window !== 'undefined') window.open(url, this.isMobileDevice() ? '_self' : '_blank');
    });
  }

  // =========================
  // ✅ Chat with login guard
  // =========================
  private isLoggedIn(): boolean {
    try {
      const raw = localStorage.getItem(key.userInfo);
      if (!raw) return false;
      const user = JSON.parse(raw);
      return !!user && Object.keys(user).length > 0;
    } catch {
      return false;
    }
  }

  private async requireLoginForChat(): Promise<boolean> {
    if (this.isLoggedIn()) return true;

    const isAr = this.language() === 'ar';
    await Swal.fire({
      icon: 'warning',
      title: isAr ? 'تسجيل الدخول مطلوب' : 'Login required',
      text: isAr ? 'يرجى تسجيل الدخول لبدء محادثة مع المعلن.' : 'Please log in to start a chat with the seller.',
      showCancelButton: true,
      confirmButtonText: isAr ? 'تسجيل الدخول' : 'Log in',
      cancelButtonText: isAr ? 'إلغاء' : 'Cancel',
      reverseButtons: isAr,
      confirmButtonColor: '#d33'
    });
    // مجرد تنبيه – من غير تحويل تلقائي
    return false;
  }

  onOpenChat(): void {
    this.requireLoginForChat().then((ok) => {
      if (!ok) return;
      if (this.chatModal) this.chatModal.show();
    });
  }

  sendChat(): void {
    const msg = this.chatMessage().trim();
    if (!msg) return;

    const ad = this.adDetails();
    const adId = ad?.id;
    const sellerId = ad?.userId;

    const raw = localStorage.getItem(key.userInfo);
    const me = raw ? JSON.parse(raw) : null;
    const myId = me?.id ?? me?.userId ?? me?.UserId ?? me?.ID ?? null;

    if (!adId || !sellerId || !myId) return;

    const payload = { adId, sellerId, buyerId: myId, senderId: myId, message: msg };

    this.sendingChat.set(true);
    this.__AdService.addchat(payload).subscribe({
      next: () => {
        this.sendingChat.set(false);
        this.chatMessage.set('');
        if (this.chatModal) this.chatModal.hide();
      },
      error: () => { this.sendingChat.set(false); }
    });
  }

  get adOwnerUser(): IUser {
    const ad = this.adDetails();
    return {
      id: ad?.userId,
      fullName: ad?.userDisplayName,
      createDate: ad?.userCreateData,
      userImageUrl: ad?.userPhoto,
      phoneNumber: this.phoneNumber || ad?.phoneNumber || ''
    } as IUser;
  }

  private convertToSeoImage(url: string): string {
    let newUrl = url.replace('/Files/', '/Images/');
    newUrl = newUrl.replace(/\.[a-zA-Z0-9]+$/, '.jpg');
    return newUrl;
  }

  openPopup(imageUrl: string) { this.selectedImageUrl = imageUrl; }

  // ===================== المفضلة =====================
  private getCurrentUserId(): string | null {
    try {
      const raw = localStorage.getItem(key.userInfo);
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u?.id ?? u?.userId ?? u?.UserId ?? u?.ID ?? null;
    } catch { return null; }
  }

  /** origin اختياري: 'image' | 'modal' | 'card' للتمييز بس */
  toggleFavorite(origin?: 'image'|'modal'|'card'): void {
    const ad = this.adDetails();
    const adId = ad?.id;
    const userId = this.getCurrentUserId();
    if (!adId) return;

    if (!userId) {
      const isAr = this.language() === 'ar';
      Swal.fire({
        icon: 'info',
        toast: true,
        position: isAr ? 'top-start' : 'top-end',
        timer: 1500,
        showConfirmButton: false,
        title: isAr ? 'من فضلك سجّل الدخول أولًا' : 'Please log in first'
      });
      // بدون انتقال للّوجن
      return;
    }

    const payload = { userId, advertisementId: adId };
    this.__AdService.adFavorite(payload).subscribe({
      next: () => {
        this.adDetails.update((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
        const isFav = this.adDetails()?.isFavorite;
        Swal.fire({
          icon: 'success',
          toast: true,
          position: 'top-start',
          timer: 1000,
          showConfirmButton: false,
          title: isFav
            ? (this.language() === 'ar' ? 'تمت الإضافة إلى المفضلة ✅' : 'Added to favorites ✅')
            : (this.language() === 'ar' ? 'تمت الإزالة من المفضلة ❌' : 'Removed from favorites ❌')
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: this.language() === 'ar' ? 'حدث خطأ' : 'Error',
          text: this.language() === 'ar' ? 'لم يتم حفظ التغيير، حاول مرة أخرى.' : 'Could not save your change. Please try again.',
          confirmButtonText: this.language() === 'ar' ? 'حسنًا' : 'OK'
        });
      }
    });
  }

  // ===================== المشاركة =====================
  onShare(): void {
    const ad = this.adDetails();
    const isAr = this.language() === 'ar';
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const title = (isAr ? ad?.title : ad?.title_L1) || ad?.title || 'Ad';
    const text = isAr ? `شاهد هذا الإعلان على Ennwy: ${title}` : `Check out this ad on Ennwy: ${title}`;

    if (navigator && (navigator as any).share) {
      (navigator as any).share({ title, text, url: shareUrl }).catch(() => {});
      return;
    }

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);
    const links = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    };

    const html = `
      <div class="d-flex flex-column gap-2">
        <a class="btn btn-outline-success w-100" href="${links.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="btn btn-outline-primary w-100" href="${links.facebook}" target="_blank" rel="noopener">Facebook</a>
        <a class="btn btn-outline-info w-100" href="${links.twitter}" target="_blank" rel="noopener">Twitter (X)</a>
        <a class="btn btn-outline-secondary w-100" href="${links.telegram}" target="_blank" rel="noopener">Telegram</a>
        <button id="copyLinkBtn" class="btn btn-dark w-100">${isAr ? 'نسخ الرابط' : 'Copy Link'}</button>
      </div>
    `;

    Swal.fire({
      icon: 'info',
      title: isAr ? 'مشاركة الإعلان' : 'Share Ad',
      html,
      showConfirmButton: false,
      didOpen: () => {
        const btn = document.getElementById('copyLinkBtn');
        if (btn) {
          btn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(shareUrl);
              Swal.update({ html, icon: 'success', title: isAr ? 'تم نسخ الرابط' : 'Link copied' });
              setTimeout(() => Swal.close(), 900);
            } catch {
              Swal.update({ icon: 'error', title: isAr ? 'تعذّر النسخ' : 'Copy failed' });
            }
          });
        }
      }
    });
  }
}
