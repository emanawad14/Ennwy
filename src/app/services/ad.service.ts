import { environment } from '../../environments/environment';
import { endpoints } from '../core/config/endpoints';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdService {
  baseUrl: string = environment.apiBaseUrl;
  getAllAdsByPageUserWithStatus: any;
  constructor(private readonly __http: HttpClient) { }



  getAllAdsByCategoryId(searchBody: any): Observable<any> {

    return this.__http.post(`${this.baseUrl}${endpoints.ads.ads}/${endpoints.ads.allAds}`, searchBody);
  }
  /*
    getAdById(id: number): Observable<any> {
      return this.__http.get(`${this.baseUrl}${endpoints.ads.ads}/${endpoints.ads.adyId}?Id=${id}`);
    }*/


  getAdById(id: number): Observable<any> {
    let data = {
      Id: id
    }
    return this.__http.post(`${this.baseUrl}${endpoints.ads.ads}/${endpoints.ads.adyId}?adId=${id}`, null);
  }


  getuserrecommendationsbyad(userId: string ,catogeryid: string ,title:string , description:string ) : Observable<any> {
  return this.__http.post(
    `${this.baseUrl}${endpoints.userrecommendationbyad}`,
    {
      userId: userId,
      page: 1,
      pageSize: 10,
      catogeryid: catogeryid,
      title: title,
      description: description
    }
  );
}


  getAllAdsByPageUser(userId: string, pageNumber: number, pageSize: number, cityId: string, status: string): Observable<any> {
    let data = {
      userId: userId,
      pageNumber: pageNumber,
      pageSize: pageSize,
      cityId: cityId,
      advertisementStatus: status
    }
    return this.__http.post(`${this.baseUrl}${endpoints.ads.ads}/${endpoints.ads.TheAds}`, data);
  }

  getFlatFieldsByCategoryId(id: number): Observable<any> {
    return this.__http.get(`${this.baseUrl}${endpoints.flatField}?CategoryId=${id}`);
  }


  getfilterFlatFieldsByCategoryId(id: number): Observable<any> {
    return this.__http.get(`${this.baseUrl}${endpoints.flatField}?CategoryId=${id}`);
  }

  adAd(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.ads.ads}/${endpoints.ads.add}`, data);
  }




  LogContact(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.getphone}`, data);
  }


  addchat(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.chat}`, data);
  }


  getuserchat(userId: number): Observable<any> {
    let data = {
      userId: userId
    }
    return this.__http.post(`${this.baseUrl}${endpoints.userchat}?userId=${userId}`, null);
  }

  getchat(chatId: number): Observable<any> {
    let data = {
      chatId: chatId
    }
    return this.__http.post(`${this.baseUrl}${endpoints.getchat}?chatId=${chatId}`, null);
  }


  LogAd(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.logads}`, data);
  }


  adFavorite(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.Favorite}`, data);
  }



  getfavAds(body: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.ads.ads}/${endpoints.ads.favAds}`, body);
  }


  adticket(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.ticketing}`, data);
  }



  getNotification(userId: string, pageNumber: number, pageSize: number): Observable<any> {
    return this.__http.get(
      `${this.baseUrl}${endpoints.Notification}?AppUserId=${userId}&PageNumber=${pageNumber}&PageSize=${pageSize}`
    );
  }


  updateuser(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.saveuser}`, data);
  }

getfilters(searchtext: string, categoryId: number): Observable<any> {
    return this.__http.get(
      `${this.baseUrl}${endpoints.filters}?keyword=${searchtext}&categoryId=${categoryId}`
    );
  }



   getsearchlog(user: string): Observable<any> {


    return this.__http.post(`${this.baseUrl}${endpoints.searchlog}?userId=${user}`, null);
  }


     deletegetsearchlog(id: string): Observable<any> {


    return this.__http.post(`${this.baseUrl}${endpoints.deletesearchlog}?id=${id}`, null);
  }

}
