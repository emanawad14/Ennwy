import { Component, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LanguageService } from '../../../../services/generic/language.service';
import { key } from '../../../config/localStorage';

@Component({
  selector: 'app-drop-menu',
  imports: [RouterModule, CommonModule],
  templateUrl: './drop-menu.component.html',
  styleUrl: './drop-menu.component.scss'
})
export class DropMenuComponent implements OnInit {
  language = signal<string>('en');

  // عنوان القائمة
  title = input<string>();
  // الـ ID الخاص بالعنوان (الفئة الرئيسية)
  titleId = input<number | null>(null);

  width = input<string>();
  list = input<any>();
  megaMenu = input<boolean>(false);

  showChildDropdown = signal<boolean>(false);
  hoveredItemId = signal<number | null>(null);

  constructor(
    private readonly __LanguageService: LanguageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
  }

  toggleMenu(show: boolean): void {
    this.showChildDropdown.set(show);
  }

  setHoveredItem(id: number | null): void {
    this.hoveredItemId.set(id);
  }

  storeCategory(title: any, list: any, id: number | null): void {
    const data = { title, list, id };
    localStorage.setItem(key.adsCategories, JSON.stringify(data));
  }

  // ضغط على العنوان الرئيسي (الرابط أعلى القائمة)
  handleHeaderClick(event: Event): void {
    const id = this.titleId();
    if (id == null) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.storeCategory(this.title(), this.list(), id);
  }

  // ضغط على عناصر القائمة
  handleItemClick(event: Event, title: any, list: any, item: any, isTopLevel: boolean = false): void {
    const hasKids = this.hasChildren(item);

    if (hasKids && !isTopLevel) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.storeCategory(title, list, item?.id);
    this.navigateToAds(item);
  }

  hasChildren(item: any): boolean {
    return item?.children && Array.isArray(item.children) && item.children.length > 0;
  }

  getHeaderRoute(): any[] | null {
    const id = this.titleId();
    if (id == null) return null;
    return ['/ads', id, this.slugify(this.title() ?? '')];
  }

  getAdsRoute(item: any, allowParents: boolean = false): any[] | null {
    if (!this.hasChildren(item) || allowParents) {
      return ['/ads', item?.id, this.getSlug(item)];
    }
    return null;
  }

  getSlug(item: any): string {
    return this.language() === 'ar' ? (item?.name ?? '') : (item?.name_L1 ?? '');
  }

  getItemName(item: any): string {
    return this.language() === 'en' ? (item?.name_L1 ?? '') : (item?.name ?? '');
  }

  navigateToAds(item: any): void {
    const route = this.getAdsRoute(item, true);
    if (route) {
      this.router.navigate(route);
    }
  }

  toggleDropdown(): void {
    this.showChildDropdown.set(!this.showChildDropdown());
  }

  private slugify(text: string): string {
    return (text || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')        
      .replace(/[^\w\-ء-ي]+/g, '')  
      .replace(/\-\-+/g, '-')        
      .replace(/^-+/, '')           
      .replace(/-+$/, '');           
  }
  checkSubmenuPosition(event: MouseEvent) {
  const menu = event.target as HTMLElement;
  const rect = menu.getBoundingClientRect();


  if (rect.right > window.innerWidth) {
    menu.classList.add("reverse");
  } else {
    menu.classList.remove("reverse");
  }
}

}
