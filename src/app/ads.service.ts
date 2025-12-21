import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdsService {
  private http = inject(HttpClient);
  private baseUrl = 'https://ennwy.com:8007/api/Ads';

  getAdByIdLite(adId: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/GetAdByIdLite?adId=${adId}`,
      {},
      { headers: { 'X-API-KEY': '123' } }
    );
  }
}
