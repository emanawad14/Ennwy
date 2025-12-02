// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformServer } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { TranslateLoader } from '@ngx-translate/core';
// import { Observable, of } from 'rxjs';

// @Injectable()
// export class UniversalTranslateLoader implements TranslateLoader {
//   constructor(
//     private http: HttpClient,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   getTranslation(lang: string): Observable<any> {
//     if (isPlatformServer(this.platformId)) {
//       // ⬇️ على السيرفر نقرأ الملف مباشرة من fs
//       const fs = require('fs');
//       const path = require('path');
//       const filePath = path.join(process.cwd(), 'dist/browser/i18n/', `${lang}.json`);

//       if (fs.existsSync(filePath)) {
//         const fileData = fs.readFileSync(filePath, 'utf8');
//         return of(JSON.parse(fileData));
//       } else {
//         return of({});
//       }
//     } else {
//       // ⬇️ في المتصفح نستعمل HttpClient عادي
//       return this.http.get(`/i18n/${lang}.json`);
//     }
//   }
// }
