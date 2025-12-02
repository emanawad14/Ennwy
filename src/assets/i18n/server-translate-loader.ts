import { TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export class ServerTranslateLoader implements TranslateLoader {
  constructor(private i18nDirAbs: string, private suffix: string = '.json') {}

  getTranslation(lang: string): Observable<any> {
    const filePath = join(this.i18nDirAbs, `${lang}${this.suffix}`);
    return new Observable(observer => {
      readFile(filePath, 'utf8')
        .then(txt => { observer.next(JSON.parse(txt)); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }
}
