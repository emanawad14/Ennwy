import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta, } from '@angular/platform-browser';
import { AdsService } from '../ads.service';
import { TransferState, makeStateKey } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
const AD_KEY = makeStateKey<any>('ad-data');

@Component({
  selector: 'app-ad-details',
  templateUrl: './ad-detail.component.html',
  styleUrl: './ad-detail.component.css',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
})
export class AdDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adsService = inject(AdsService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private state = inject(TransferState);

  ad: any;
  loading = true;

  ngOnInit(): void {
    const adId = Number(this.route.snapshot.paramMap.get('id'));
    const savedData = this.state.get(AD_KEY, null);

    if (savedData) {
      this.setAd(savedData);
    } else {
      this.adsService.getAdByIdLite(adId).subscribe({
        next: (res) => {
          this.setAd(res.data);
          this.state.set(AD_KEY, res.data);
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
        }
      });
    }
  }

  private setAd(ad: any): void {
    this.ad = ad;
    this.loading = false;

    // 🟢 Meta Tags for SEO
    this.titleService.setTitle(this.ad.title);
    this.metaService.updateTag({ name: 'description', content: this.ad.description });
    this.metaService.updateTag({ name: 'keywords', content: this.ad.keywords ?? this.ad.title });

    if (this.ad.photos?.length) {
      this.metaService.updateTag({ property: 'og:image', content: this.convertToSeoImage(this.ad.photos[0]) });
    }
    this.metaService.updateTag({ property: 'og:title', content: this.ad.title });
    this.metaService.updateTag({ property: 'og:description', content: this.ad.description });
  }
  private convertToSeoImage(url: string): string {
    // 1. استبدال Files بـ Images
    let newUrl = url.replace('/Files/', '/Images/');

    // 2. تغيير أي امتداد موجود (.png, .jpeg, .webp ...) إلى .jpg
    newUrl = newUrl.replace(/\.[a-zA-Z0-9]+$/, '.jpg');
    return newUrl;
  }
}
