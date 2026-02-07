import { NavbarLinksComponent } from './core/components/navbar-links/navbar-links.component';
import { HeaderComponent } from './core/components/header/header.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { FooterComponent } from './core/components/footer/footer.component';
import {
  Router,
  RouterOutlet,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { Component, signal, OnInit, OnDestroy, DoCheck, HostListener } from '@angular/core';
import { MobileNavbarComponent } from './core/components/mobile-navbar/mobile-navbar.component';
import { LanguageService } from './services/generic/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { filter, Subscription } from 'rxjs';
import { UtilityService } from './services/generic/utility.service';
import { HomeSliderComponent } from "./components/home/home-slider/home-slider.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MobileNavbarComponent,
    NavbarLinksComponent,
    HeaderComponent,
    NavbarComponent,
    FooterComponent,
    TranslateModule,
    HomeSliderComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy, DoCheck {
  title = 'ennwy';

  shouldNavbar = signal<boolean>(true);
  shouldRender = signal<boolean>(false);

  showSearchAndCategory = signal<boolean>(false);

  showNavExtras = signal<boolean>(false);



  /** ✅ Unified loader: router + data */
  isNavigating = signal<boolean>(false);
  private navSub = new Subscription();

  private routerBusy = false;
  private dataBusy = false;

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __Router: Router,
    private readonly __UtilityService: UtilityService
  ) {}

  ngOnInit(): void {
    this.__LanguageService.setLanguage();

    // Router transitions
    this.navSub.add(
      this.__Router.events
        .pipe(
          filter(
            (e) =>
              e instanceof NavigationStart ||
              e instanceof NavigationEnd ||
              e instanceof NavigationCancel ||
              e instanceof NavigationError
          )
        )
        .subscribe((e) => {
          this.routerBusy = e instanceof NavigationStart;
          this.updateOverlay();
        })
    );

    // Global data loading from anywhere in the app
    this.navSub.add(
      this.__UtilityService.globalLoading.subscribe((v) => {
        this.dataBusy = !!v;
        this.updateOverlay();
      })
    );
  }

  private updateOverlay(): void {
    this.isNavigating.set(this.routerBusy || this.dataBusy);
  }
ngDoCheck(): void {
  const url = this.__Router.url;

  // يظهر search + categories بس في home و ads
  if (
    url === '/' ||
    url.includes('home') ||
    url.includes('ads')
  ) {
    this.showNavExtras.set(true);
  } else {
    this.showNavExtras.set(false);
  }

  if (url.includes('auth')) {
    this.shouldRender.set(false);
  } else {
    this.shouldRender.set(true);
  }
}


  ngOnDestroy(): void {
    this.navSub.unsubscribe();
  }






  hideSlider = false;

  @HostListener('window:scroll', [])
  onScroll() {
    const scrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

    // أول ما نتحرك من فوق
    this.hideSlider = scrollTop > 50;
  }






 
  

}
