import { Component, signal, inject, effect } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MoreCategoryDropMenuComponent } from './drop-menu copy/more-category-drop-menu.component';
import { LanguageService } from './../../../services/generic/language.service';
import { DropMenuComponent } from './drop-menu/drop-menu.component';
import { HomeService } from '../../../services/home.service';
import { TranslateModule } from '@ngx-translate/core';
import { ILink } from '../../interfaces/nav';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar-links',
  standalone: true,
  imports: [DropMenuComponent, TranslateModule, MoreCategoryDropMenuComponent,CommonModule],
  templateUrl: './navbar-links.component.html',
  styleUrl: './navbar-links.component.scss'
})
export class NavbarLinksComponent {
  language = signal<string>('en');
  categories = signal<ILink[]>([]);
  isLoading = signal<boolean>(false);
  isMobile = signal(false);

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
}
