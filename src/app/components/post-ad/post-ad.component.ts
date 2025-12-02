import { SelectAdCategoryComponent } from './select-ad-category/select-ad-category.component';
import { LanguageService } from '../../services/generic/language.service';
import { HomeService } from '../../services/home.service';
import { TranslateModule } from '@ngx-translate/core';
import { Component, signal } from '@angular/core';
import { AdCategoriesComponent } from './ad-categories/ad-categories.component';

@Component({
  selector: 'app-post-ad',
  imports: [TranslateModule, SelectAdCategoryComponent, AdCategoriesComponent],
  templateUrl: './post-ad.component.html',
  styleUrl: './post-ad.component.scss'
})
export class PostAdComponent {
  language = signal<string>('');

  activeCategories = signal<any>([]);
  categoryId = signal<number>(0);
  isLoading = signal<boolean>(false);

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __homeService: HomeService,
  ) { }


  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage())
    this.getActiveCategories();
  }

  getActiveCategories(): void {
    this.isLoading.set(true);
    this.__homeService.getActiveCategories().subscribe({
      next: ((res: any) => {
        this.activeCategories.set(res?.data);
        this.isLoading.set(false);
      }),
      error: ((err: any) => {
        this.isLoading.set(false);
      })
    })
  }

  selectCategory(id: number): void {
    this.categoryId.set(id);
  }
}
