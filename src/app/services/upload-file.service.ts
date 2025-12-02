import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { endpoints } from '../core/config/endpoints';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadFileService {
  baseUrl: string = environment.apiBaseUrl;
  attachPhotosToAd: any;
  constructor(private readonly __http: HttpClient) { }

  uploadFile(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.uploadFormFile}`, data);
  }
}
