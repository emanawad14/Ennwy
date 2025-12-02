import { Component, EventEmitter, input, Output, signal } from '@angular/core';
import { LanguageService } from '../../../services/generic/language.service';

@Component({
  selector: 'app-select-ad-category',
  imports: [],
  templateUrl: './select-ad-category.component.html',
  styleUrl: './select-ad-category.component.scss'
})
export class SelectAdCategoryComponent {
  language = signal<string>('');
  categories = input<any>();

  @Output() onSelectCategory = new EventEmitter<number>();

  constructor(
    private readonly __LanguageService: LanguageService,
  ) { }

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage())
  }

  selectCategory(item: any): void {
    this.onSelectCategory.emit(item.id);
  }
}
