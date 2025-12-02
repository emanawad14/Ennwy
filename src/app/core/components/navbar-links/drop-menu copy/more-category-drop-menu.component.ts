import { Component, input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '../../../../services/generic/language.service';
import { ILink } from '../../../interfaces/nav';
import { key } from '../../../config/localStorage';

@Component({
  selector: 'app-more-category-drop-menu',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './more-category-drop-menu.component.html',
  styleUrl: './more-category-drop-menu.component.scss'
})
export class MoreCategoryDropMenuComponent {
  // اللغة
  language = signal<string>('en');

  // === Inputs ===
  title = input<string>('More');
  list = input<ILink[]>([]);
  /** عدد الفئات المعروضة فوق (لو ما استخدمتش excludeIds) */
  topCount = input<number>(6);
  /** IDs الفئات المعروضة فوق (يغلب على topCount لو متوفر) */
  excludeIds = input<number[]>([]);

  // === State ===
  selectedItem = signal<ILink | null>(null); // العنصر الذي له sub لعرضه يمين
  activeNum = signal<number>(0);

  // === Derived ===
  remainingList = computed<ILink[]>(() => {
    const items = this.list() ?? [];
    if (!Array.isArray(items) || items.length === 0) return [];
    const ids = this.excludeIds() ?? [];
    if (ids.length > 0) {
      const set = new Set<number>(ids);
      return items.filter(it => it?.id != null && !set.has(it.id));
    }
    const count = Math.max(0, this.topCount() ?? 0);
    return items.slice(count);
  });

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
    effect(() => {
      const rem = this.remainingList();
      if (rem.length > 0) { this.selectedItem.set(null); this.activeNum.set(0); }
      else { this.selectedItem.set(null); this.activeNum.set(-1); }
    });
  }

  // هل للعنصر أطفال؟
  hasChildren = (item?: ILink | null): boolean =>
    !!item && Array.isArray(item.children) && item.children.length > 0;

  // hover على عنصر رئيسي: إن كان له sub اعرضه، وإلا اخفِ العمود اليمين
  hoverMain(index: number, item: ILink): void {
    this.activeNum.set(index);
    if (this.hasChildren(item)) {
      this.selectedItem.set(item);
    } else {
      this.selectedItem.set(null);
    }
  }

  // تخزين الفئة المختارة
  storeCategory(title: any, list: any, id?: number): void {
    if (id == null) return;
    localStorage.setItem(key.adsCategories, JSON.stringify({ title, list, id }));
  }

  // تنقل برمجي مضمون لنفس مسار الساب
  goToCategory(id?: number, nameAr?: string, nameEn?: string, ev?: Event): void {
    if (id == null) return;
    ev?.preventDefault();
    ev?.stopPropagation();
    this.storeCategory(this.title(), this.list(), id);
    const name = (this.language() === 'ar' ? nameAr : nameEn) || '';
    this.router.navigate(['/ads', id, name]);
  }
}
