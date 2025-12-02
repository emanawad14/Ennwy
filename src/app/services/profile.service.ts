import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { endpoints } from '../core/config/endpoints';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  baseUrl: string = environment.apiBaseUrl;
  constructor(private readonly __http: HttpClient) { }

  getAdvertiserByUserId(id: string): Observable<any> {
    return this.__http.get(`${this.baseUrl}${endpoints.advertiserByUserId}?UserId=${id}`);
  }
}
