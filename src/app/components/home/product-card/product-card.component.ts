import { UtilityService } from './../../../services/generic/utility.service';
import { Component, input, signal } from '@angular/core';
import { LanguageService } from '../../../services/generic/language.service';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterModule, TranslateModule,CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  language = signal<string>('en');

  product = input<any>();
  isNew = input<boolean>(false);
  isVillas = input<boolean>(false);
  isFavoritePage = input<boolean>(false); // ✅ مضاف لتحديد سياق المفضلة

  constructor(
    private readonly __LanguageService: LanguageService,
    protected readonly __UtilityService: UtilityService
  ) {}

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
  }


  getPhotoUrl(): string {
const photos = this.product()?.photos;

  
  if (!photos) return 'images/default-image.webp';

  // لو الصور عبارة عن string
  if (typeof photos === 'string') return photos;

  // لو الصور عبارة عن array
  if (Array.isArray(photos) && photos.length > 0) return photos[0];

  return 'images/default-image.webp';
}

onImageError(event: Event): void {
  (event.target as HTMLImageElement).src = 'images/default-image.webp';
}

}
