import { map } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';

export const decryptInterceptor: HttpInterceptorFn = (req, next) => {
  const key = '3jqlYW+jHs38PuRp45mjSw1smYojVVKZFuyS8PaoPuDfCyl/uYpz6QoNPzidDMaV';

  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        const body: any = event.body;
        if (body?.data) {
          try {
            const decrypted = decrypt(body.data, key);
            const parsed = JSON.parse(decrypted);
            return event.clone({ body: parsed });
          } catch (e) {
            console.error('❌ فشل فك التشفير:', e);
          }
        }
      }
      return event;
    })
  );
};

function decrypt(encryptedText: string, key: string): string {
  const keyBytes = CryptoJS.enc.Utf8.parse(key.padEnd(32).substring(0, 32));
  const iv = CryptoJS.enc.Utf8.parse('\0'.repeat(16));
  const decrypted = CryptoJS.AES.decrypt(encryptedText, keyBytes, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}
