import {
  Component, input, signal, AfterViewInit, ViewChild, ElementRef, effect, computed
} from '@angular/core';
import { IAdDetails } from '../../../core/interfaces/ad';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/generic/language.service';
import { UtilityService } from '../../../services/generic/utility.service';
import { AdService } from '../../../services/ad.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ad-card',
  standalone: true,
  imports: [TranslateModule, RouterModule, CommonModule],
  templateUrl: './ad-card.component.html',
  styleUrl: './ad-card.component.scss'
})
export class AdCardComponent implements AfterViewInit {
  language = signal<string>('en');
  ad = input<IAdDetails>({} as IAdDetails);
  isLoggedIn = false;
  userId: string | null = null;

  // حالات الأزرار
  calling = false;
  sendingChat = false;

  // لودر الصورة
  imgLoaded = signal<boolean>(false);

  // رابط الصورة + cache-buster علشان نجبر المتصفح يعيد التحميل
  photoUrl = computed(() => {
    const src = this.ad()?.photos || 'assets/images/default-image.webp';
    const ver = `${this.ad()?.id ?? ''}-${this.displayDate ?? ''}`;
    const sep = src.includes('?') ? '&' : '?';
    return `${src}${sep}v=${encodeURIComponent(ver)}`;
  });

  // مودال الدردشة
  chatMessage = signal<string>('');
  @ViewChild('chatModalRef') chatModalRef?: ElementRef<HTMLDivElement>;
  private chatModal?: any; // bootstrap.Modal

  constructor(
    private readonly __LanguageService: LanguageService,
    protected readonly __UtilityService: UtilityService,
    private readonly __AdService: AdService,
    private readonly __Router: Router
  ) {
    // لما الإعلان يتغيّر (بسبب الباجينيشن أو الفلاتر) صفّر حالة الصورة
    effect(() => {
      this.photoUrl();
      this.imgLoaded.set(false);
    });
  }

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());

    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('EnnwyUserInfo');
      if (userData) {
        const user = JSON.parse(userData);
        this.userId = user?.id ?? user?.userId ?? user?.UserId ?? null;
        this.isLoggedIn = !!this.userId;
      }
    }
  }

  ngAfterViewInit(): void {
    // تهيئة Bootstrap Modal لو متاح
    queueMicrotask(() => {
      const mEl = this.chatModalRef?.nativeElement;
      if ((window as any).bootstrap && mEl) {
        this.chatModal = new (window as any).bootstrap.Modal(mEl);
      }
    });
  }

  // ========= التنقّل عند الضغط على الكارد =========
  onCardClick(ev: Event): void {
    const id = this.ad()?.id;
    if (!id) return;
    this.__Router.navigate(['/ad', id]);
  }

  // ========== إدارة حالة تحميل الصورة ==========
  onImgLoad(): void {
    this.imgLoaded.set(true);
  }

  onImgError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/images/default-image.webp';
    this.imgLoaded.set(true); // مهما حصل، اخفي اللودر
  }

  // ================= المفضلة =================
  toggleFavorite(): void {
    if (!this.userId || !this.ad()?.id) return;

    const payload = { userId: this.userId, advertisementId: this.ad().id };

    this.__AdService.adFavorite(payload).subscribe({
      next: () => {
        this.ad().isFavorite = !this.ad().isFavorite;
        Swal.fire({
          icon: 'success',
          toast: true,
          position: 'top-start',
          timer: 1000,
          showConfirmButton: false,
          title: this.ad().isFavorite
            ? 'تمت الإضافة إلى المفضلة ✅'
            : 'تمت الإزالة من المفضلة ❌'
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'حدث خطأ',
          text: 'لم يتم حفظ التغيير، حاول مرة أخرى.',
          confirmButtonText: 'حسنًا'
        });
      }
    });
  }

  // ================= Helpers اتصال/دردشة =================
  private onlyDigits(v: string): string {
    return (v || '').replace(/\D+/g, '').replace(/^00/, '');
  }

  /** حاول تجيب sellerId: من الكارد، ولو مش موجود هات تفاصيل الإعلان */
  private fetchSellerId(adId: number, currentSellerId?: string | null, done?: (seller: string|null)=>void): void {
    if (currentSellerId) { done?.(currentSellerId); return; }
    this.__AdService.getAdById(adId).subscribe({
      next: (res: any) => {
        const seller = res?.data?.userId ?? null;
        done?.(seller);
      },
      error: () => done?.(null)
    });
  }

  /**
   * LogContact -> جلب الرقم -> تنفيذ الإجراء (اتصال)
   * مع معالجة حالة عدم وجود sellerId داخل الكارد.
   */
  private ensurePhoneThen(action: (digits: string) => void): void {
    const adv = this.ad();
    const advertisementId = adv?.id;
    if (!advertisementId || this.calling) return;

    this.calling = true;

    this.fetchSellerId(advertisementId, adv?.userId, (sellerId) => {
      if (!sellerId) { this.calling = false; return; }

      this.__AdService.LogContact({
        userId: sellerId,
        advertisementId,
        contactMethod: 2
      }).subscribe({
        next: (res: any) => {
          const apiNumber =
            (typeof res?.data === 'string' && res.data) ||
            res?.data?.phoneNumber ||
            res?.phoneNumber ||
            adv?.phoneNumber ||
            '';

          const digits = this.onlyDigits(apiNumber);
          if (digits) action(digits);
          this.calling = false;
        },
        error: () => { this.calling = false; }
      });
    });
  }

  /** اتصال مباشر */
  onCall(): void {
    this.ensurePhoneThen((digits) => {
      if (typeof window !== "undefined") {
        window.location.href = `tel:${digits}`;
      }
    });
  }

  // ====== فتح مودال الدردشة
  onOpenChat(): void {
    if (!this.isLoggedIn) {
      Swal.fire({
        icon: 'info',
        toast: true,
        position: 'top-start',
        timer: 2000,
        showConfirmButton: false,
        title: 'من فضلك سجّل الدخول أولًا'
      });
      return;
    }
    if (this.chatModal) this.chatModal.show();
  }

  // ====== إرسال رسالة الدردشة عبر API addchat
  sendChat(): void {
    const msg = this.chatMessage().trim();
    if (!msg) return;

    const a = this.ad();
    const adId = a?.id;
    if (!adId || !this.userId) return;

    // تأكد من sellerId ثم ابعت
    this.fetchSellerId(adId, a?.userId, (sellerId) => {
      if (!sellerId) return;

      const payload = {
        adId,
        sellerId,
        buyerId: this.userId,
        senderId: this.userId,
        message: msg
      };

      this.sendingChat = true;
      this.__AdService.addchat(payload).subscribe({
        next: () => {
          this.sendingChat = false;
          this.chatMessage.set('');
          if (this.chatModal) this.chatModal.hide();

          Swal.fire({
            icon: 'success',
            toast: true,
            position: 'top-start',
            timer: 2000,
            showConfirmButton: false,
            title: this.language() === 'ar' ? 'تم إرسال الرسالة ✅' : 'Message sent ✅'
          });
        },
        error: () => {
          this.sendingChat = false;
          Swal.fire({
            icon: 'error',
            toast: true,
            position: 'top-start',
            timer: 2000,
            showConfirmButton: false,
            title: this.language() === 'ar' ? 'تعذّر إرسال الرسالة' : 'Failed to send'
          });
        }
      });
    });
  }

  getAdTitleSlug(): string {
    const title = this.language() == 'ar' ? this.ad()?.title : this.ad()?.title_L1;
    if (!title) return '';
    return title.replace(/\s+/g, '_');
  }

  // ================= صيغ مساعدة =================
  getPurposeKey(purpose: string | undefined): string {
    if (!purpose) return '';
    switch (purpose.toLowerCase()) {
      case 'rent': return 'for_rent';
      case 'sale': return 'for_sale';
      case 'wanted': return 'wanted';
      default: return purpose;
    }
  }

  get displayDate(): string {
    return this.ad()?.approvedDateTime ?? this.ad()?.created ?? '';
    // بنستخدمها كجزء من cache-buster كمان
  }
}
