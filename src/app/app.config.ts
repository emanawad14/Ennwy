import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { httpInterceptor } from './core/interceptor/http.interceptor';
import { UniversalTranslateLoaderBrowser } from './universal-translate-loader.browser';
import { decryptInterceptor } from './decrypt.interceptor';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new UniversalTranslateLoaderBrowser(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([httpInterceptor, decryptInterceptor]), withFetch()),

    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],  // فقط HttpClient
        },
        defaultLanguage: 'en',
      })
    ),
  ],
};
