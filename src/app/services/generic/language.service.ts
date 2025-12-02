import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private platformId = inject(PLATFORM_ID);

  constructor(private readonly translate: TranslateService) { }

  isRtlLanguage(lang: string): boolean {
    return lang === 'ar';
  }

  changeLang(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);

    const dir = this.isRtlLanguage(lang) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }

  setLanguage(): void {
    let lang = 'en';

    if (typeof window !== 'undefined') {
      lang = localStorage.getItem('lang') || navigator.language?.split('-')[0] || 'en';
      localStorage.setItem('lang', lang);

      const dir = this.isRtlLanguage(lang) ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
    }

    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
  }

  getLanguage(): string {
   
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('lang') || 'en';
    }
    // ✅ لو في SSR أو Node.js
    return 'en';
  }

  translateText(text: string): string {
    return this.translate.instant(text);
  }
}
