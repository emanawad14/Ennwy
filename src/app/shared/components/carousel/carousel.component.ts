import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  signal,
  computed,
  TemplateRef,
  ContentChild,
  inject,
  PLATFORM_ID,
} from '@angular/core';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss'
})
export class CarouselComponent implements OnInit, OnDestroy {
  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<any>;

  @Input() items: any[] = [];
  @Input() autoplay = false;
  @Input() interval = 3000; // ms
  @Input() loop = false;

  @Input() numVisibleDefault = 3;
  @Input() breakpoints: { [key: number]: number } = {
    768: 1,
    992: 2,
    1200: 3
  };

  currentIndex = signal(0);
  numVisible  = signal(this.numVisibleDefault);

  private autoplayRef: any = null;

  // SSR guard
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit() {
    // احسب أول مرة
    this.handleResize();

    // events/interval للمتصفح فقط
    if (this.isBrowser) {
      window.addEventListener('resize', this.handleResize, { passive: true });

      if (this.autoplay) {
        this.autoplayRef = setInterval(() => this.slideRight(), this.interval);
      }
    }
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.handleResize);
    }
    if (this.autoplayRef) {
      clearInterval(this.autoplayRef);
      this.autoplayRef = null;
    }
  }

  // خليها arrow علشان تفضل نفس الريفرنس مع add/removeEventListener
  handleResize = () => {
    // وقت السيرفر استخدم قيمة افتراضية واسعة لتختار الـ default
    const width = this.isBrowser ? window.innerWidth : 1920;

    const bp = Object.keys(this.breakpoints)
      .map(n => +n)
      .sort((a, b) => a - b)
      .find(n => width < n);

    this.numVisible.set(
      (bp !== undefined ? this.breakpoints[bp] : this.numVisibleDefault) || this.numVisibleDefault
    );

    // تأكد إن الـ index ما يخرجش برا بعد تغيير عدد العناصر المرئية
    const max = this.maxIndex();
    if (this.currentIndex() > max) this.currentIndex.set(max);
  };

  slideRight() {
    const next = this.currentIndex() + 1;
    if (next + this.numVisible() > this.items.length) {
      this.currentIndex.set(this.loop ? 0 : this.currentIndex());
    } else {
      this.currentIndex.set(next);
    }
  }

  slideLeft() {
    const prev = this.currentIndex() - 1;
    if (this.loop && prev < 0) {
      this.currentIndex.set(Math.max(0, this.items.length - this.numVisible()));
    } else {
      this.currentIndex.set(Math.max(0, prev));
    }
  }

  maxIndex = computed(() =>
    Math.max(0, this.items.length - this.numVisible())
  );

  getTransform(): string {
    // عرض الـ track كنسبة من عدد المرئيات الحالي
    return `translateX(-${(this.currentIndex() * 100) / this.numVisible()}%)`;
    // تأكد إن الـ CSS للـ track عامل width مناسب (مثلاً width: calc(100% * (items.length / numVisible)))
  }
}
