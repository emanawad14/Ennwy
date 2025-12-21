import { mergeApplicationConfig, ApplicationConfig, Provider } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { UniversalTranslateLoaderServer } from './universal-translate-loader.server';
import { provideHttpClient } from '@angular/common/http';

const translateProvider: Provider = {
  provide: TranslateLoader,
  useClass: UniversalTranslateLoaderServer
};

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
    provideHttpClient(),           // مهم للـ TranslateModule
    translateProvider              // إضافة loader الخاص بالسيرفر
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
