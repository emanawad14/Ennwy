import { Component, effect, input, signal } from '@angular/core';
import { LanguageService } from '../../../services/generic/language.service';
import { Router } from '@angular/router';
import { key } from '../../../core/config/localStorage';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ad-categories',
  imports: [CommonModule],
  templateUrl: './ad-categories.component.html',
  styleUrl: './ad-categories.component.scss'
})
export class AdCategoriesComponent {
  language = signal<string>('');
  categories = input<any>();
  selectedCategoryId = input<number>();
  categoryId = signal<number | undefined>(0);
  subCategories = signal<any>({});
  subCategoryId = signal<number>(0);
  secondSubCategory = signal<any>({});
  secondSubCategoryId = signal<number>(0);

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __Router: Router,
  ) { }

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
    const selectedId = this.selectedCategoryId();
    this.categoryId.set(selectedId);

    // ✅ نتحقق إذا الفئة الرئيسية ليس لها children
    const mainCategory = this.categories().find((cat: any) => cat.id == selectedId);
    if (mainCategory && (!mainCategory.children || mainCategory.children.length === 0)) {
      // لو ملهاش subcategories → نعمل set مباشرة
      this.setCategory(mainCategory.id);
      this.__Router.navigate(['/sell-ad', mainCategory.id]);
    } else if (selectedId !== undefined) {
      this.selectCategory(+selectedId);
    }
  }

  selectCategory(id: number): void {
    this.categoryId.set(id);
    const index = this.categories().findIndex((el: any) => el.id == id);
    this.subCategories.set(this.categories()[index]?.children);
    if (this.subCategories()?.length == 0) {
      this.sellAd(id);
    }
  }

  selectSubCategory(id: number): void {
    this.subCategoryId.set(id);
    const index = this.subCategories().findIndex((el: any) => el.id == id);
    this.secondSubCategory.set(this.subCategories()[index]?.children);
    if (this.secondSubCategory()?.length == 0) {
      this.sellAd(id);
    }
  }

  sellAd(id: number): void {
    this.__Router.navigate(['/sell-ad', id]);
    const index = this.subCategories().findIndex((el: any) => el.id == this.subCategoryId());
    const idx = this.secondSubCategory().findIndex((el: any) => el.id == this.secondSubCategoryId());
    this.setCategory(id, this.language() == 'ar' ? this.subCategories()[index]?.name : this.subCategories()[index]?.name_L1, this.language() == 'ar' ? this.secondSubCategory()[idx]?.name : this.secondSubCategory()[idx]?.name_L1);
  }

  setCategory(id: number, subCategory?: string, secondSubCategory?: string): void {
    const index = this.categories().findIndex((el: any) => el.id == this.categoryId());
    const obj = {
      image: this.categories()[index]?.image,
      categoryId: id,
      category: this.language() == 'ar' ? this.categories()[index]?.name : this.categories()[index]?.name_L1,
      subCategory: subCategory,
      secondSubCategory: secondSubCategory
    };
    localStorage.setItem(key.selectedCategory, JSON.stringify(obj));
  }
}
