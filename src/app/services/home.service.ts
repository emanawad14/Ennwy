// src/app/services/home.service.ts
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, share } from 'rxjs/operators';
import { endpoints } from '../core/config/endpoints';

@Injectable({ providedIn: 'root' })
export class HomeService {
  baseUrl: string = environment.apiBaseUrl;

  // in-flight dedup (بدون كاش بعد الانتهاء)
  private countriesReq$?: Observable<any>;
  private districtsReq$ = new Map<string, Observable<any>>();
  private subDistrictsReq$ = new Map<string, Observable<any>>();

  constructor(private readonly __http: HttpClient) {}

  // --------- Categories / Banner (زي ما هي) ----------
  getCategories(): Observable<any> {
    return this.__http.get(`${this.baseUrl}${endpoints.categories}`);
  }

  getBanner(): Observable<any> {
    return this.__http.get(`${this.baseUrl}${endpoints.banner}`);
  }

  getTopCatAds(searchKeyword: string, cityId: string, sortby?: string): Observable<any> {
    return this.__http.post(
      `${this.baseUrl}${endpoints.ads.ads}/${endpoints.ads.topCatAds}`,
      { searchKeyword, cityId, pageNumber: 1, pageSize: 5, sortby }
    );
  }



  getuserrecommendations(userId: string): Observable<any> {
  return this.__http.post(
    `${this.baseUrl}${endpoints.userrecommendation}`,
    {
      userId: userId,
      page: 1,
      pageSize: 50
    }
  );
}



  getActiveCategories(): Observable<any> {
    return this.__http.get(`${this.baseUrl}${endpoints.activeCategories}`);
  }

  // ---------------- Countries (de-dup) ----------------
  /** يمنع تكرار النداء لنفس اللحظة، وبعد انتهاء الrequest يتصفر المؤشر */
  getCountries(): Observable<any> {
    if (!this.countriesReq$) {
      this.countriesReq$ = this.__http
        .get(`${this.baseUrl}${endpoints.country}`)
        .pipe(
          // مشاركة نفس الrequest لو اتعمل أكتر من subscribe متزامن
          share(),
          // بعد انتهاء الrequest نلغي المؤشر: لا كاش
          finalize(() => {
            this.countriesReq$ = undefined;
          })
        );
    }
    return this.countriesReq$;
  }

  // ------------- Districts (per id de-dup) -------------
  getDistricts(id: string): Observable<any> {
    const key = id ?? '';
    let obs = this.districtsReq$.get(key);
    if (!obs) {
      obs = this.__http
        .get(`${this.baseUrl}${endpoints.district}?Id=${encodeURIComponent(key)}`)
        .pipe(
          share(),
          finalize(() => {
            this.districtsReq$.delete(key);
          })
        );
      this.districtsReq$.set(key, obs);
    }
    return obs;
  }

  // ----------- SubDistricts (per id de-dup) ------------
  getSubDistricts(id: string): Observable<any> {
    const key = id ?? '';
    let obs = this.subDistrictsReq$.get(key);
    if (!obs) {
      obs = this.__http
        .get(`${this.baseUrl}${endpoints.subDistrict}?Id=${encodeURIComponent(key)}`)
        .pipe(
          share(),
          finalize(() => {
            this.subDistrictsReq$.delete(key);
          })
        );
      this.subDistrictsReq$.set(key, obs);
    }
    return obs;
  }
}
