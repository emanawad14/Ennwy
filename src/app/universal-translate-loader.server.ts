import { Injectable } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UniversalTranslateLoaderServer implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    const filePath = path.join(process.cwd(), 'dist/browser/i18n/', `${lang}.json`);
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return of(JSON.parse(fileData));
    }
    return of({});
  }
}
