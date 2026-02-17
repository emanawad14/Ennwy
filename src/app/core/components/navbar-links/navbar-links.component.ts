import { Component, signal, inject, effect, computed } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MoreCategoryDropMenuComponent } from './drop-menu copy/more-category-drop-menu.component';
import { LanguageService } from './../../../services/generic/language.service';
import { DropMenuComponent } from './drop-menu/drop-menu.component';
import { HomeService } from '../../../services/home.service';
import { TranslateModule } from '@ngx-translate/core';
import { ILink } from '../../interfaces/nav';
import { CommonModule } from '@angular/common';
import { CategoryCardComponent } from '../../../components/home/category-card/category-card.component';

@Component({
  selector: 'app-navbar-links',
  standalone: true,
  imports: [DropMenuComponent, TranslateModule, MoreCategoryDropMenuComponent, CommonModule, CategoryCardComponent],
  templateUrl: './navbar-links.component.html',
  styleUrl: './navbar-links.component.scss'
})
export class NavbarLinksComponent {
  language = signal<string>('en');
  categories = signal<ILink[]>([]);
  isLoading = signal<boolean>(false);
  isMobile = signal(false);
  activeCategories = signal<any[]>([]);
  displayCategories = computed(() =>
    (this.activeCategories()?.length ?? 0) > 0 ? this.activeCategories() : this.categories()
  );
  mobileDisplayCategories = computed(() =>
    (this.displayCategories() || []).filter((item: any) => !this.isAllCategory(item))
  );


  private breakpointObserver = inject(BreakpointObserver);

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __homeService: HomeService,
  ) {
    effect(() => {
      this.breakpointObserver.observe([Breakpoints.Handset])
        .subscribe(result => {
          this.isMobile.set(result.matches);
        });
    });
  }

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
    this.getCategories();
     this.getActiveCategories();
  }

  getCategories(): void {
    this.isLoading.set(true);
    this.__homeService.getCategories().subscribe({
      next: ((res: any) => {
        const data = res?.data?.filter((item: ILink) => item.parentId === null);
        this.categories.set(data);
        this.isLoading.set(false);
      }),
      error: () => this.isLoading.set(false)
    });
  }



  getActiveCategories(): void {
  this.__homeService.getActiveCategories().subscribe(res => {
    this.activeCategories.set(res?.data || []);
  });
}

  getCategoryName(item: ILink): string {
    return this.language() === 'en' ? (item?.name_L1 || item?.name || '') : (item?.name || item?.name_L1 || '');
  }

  getMobileChildren(item: any): any[] {
    const children = Array.isArray(item?.children) ? item.children : [];
    return children.filter((child: any) => !this.isAllCategory(child));
  }

  private isAllCategory(item: any): boolean {
    const ar = (item?.name || '').toString().trim();
    const en = (item?.name_L1 || '').toString().trim().toLowerCase();
    return ar === 'الكل' || ar.startsWith('الكل ') || ar.includes('الكل في')
      || en === 'all' || en.startsWith('all ') || en.startsWith('all in');
  }

}
