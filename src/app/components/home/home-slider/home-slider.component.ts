import { HomeService } from '../../../services/home.service';
import { Component, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // ⬅️ أضف RouterModule
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../../../core/components/navbar/search/search.component';


declare const bootstrap: any;

@Component({
  selector: 'app-home-slider',
  standalone: true,
  // ⬅️ اضف الـ imports هنا
  imports: [CommonModule, RouterModule, SearchComponent],
  templateUrl: './home-slider.component.html',
  styleUrls: ['./home-slider.component.scss']
})
export class HomeSliderComponent implements AfterViewInit {
  @ViewChild('carousel') carouselRef!: ElementRef;

  banners = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  private bsCarousel: any | null = null;

  constructor(
    private readonly __homeService: HomeService,
    private readonly __router: Router
  ) {}

  ngOnInit(): void {
    this.getBanner();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.initCarousel());
  }

  private initCarousel(): void {
    const el = this.carouselRef?.nativeElement;
    if (!el || typeof bootstrap?.Carousel !== 'function') return;

    this.bsCarousel?.dispose?.();

    this.bsCarousel = new bootstrap.Carousel(el, {
      interval: 3000,
      ride: 'carousel',
      pause: 'hover',
      wrap: true,
      touch: true
    });

    this.bsCarousel.cycle();
  }

  getBanner(): void {
    this.isLoading.set(true);
    this.__homeService.getBanner().subscribe({
      next: (res: any) => {
        this.banners.set(res?.data || []);
        this.isLoading.set(false);
        setTimeout(() => this.initCarousel(), 0);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private extractLink(item: any): string | null {
    return item?.action || item?.link || item?.url || item?.image?.link || null;
  }

  isExternal(href: string | null | undefined): boolean {
    return !!href && /^https?:\/\//i.test(href);
  }

  getHref(item: any): string | null {
    const href = this.extractLink(item);
    return href || null;
  }

  onBannerClick(ev: Event, item: any): void {
    const href = this.extractLink(item);
    if (!href) {
      ev.preventDefault();
      console.warn('No link found for banner item:', item);
      return;
    }
    if (!this.isExternal(href)) {
      ev.preventDefault();
      this.__router.navigate([href]);
    }
  }
}
