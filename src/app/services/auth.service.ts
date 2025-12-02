import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { endpoints } from '../core/config/endpoints';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  baseUrl: string = environment.apiBaseUrl;
  userProfileData: any;
  constructor(private readonly __http: HttpClient) { }

  login(data: {
    "userName": string,
    "password": string,
    "toggleLoginRegister": boolean
  }): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.auth.auth}/${endpoints.auth.login}`, data);
  }

  register(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.auth.auth}/${endpoints.auth.register}`, data);
  }

  verifyOtp(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.auth.auth}/${endpoints.auth.verifyOtp}`, data);
  }

  reSendOtp(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.auth.auth}/${endpoints.auth.reSendOtp}`, data);
  }

  requestPasswordReset(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.auth.auth}/${endpoints.auth.requestPasswordReset}`, data);
  }

  resetPassword(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.auth.auth}/${endpoints.auth.resetPassword}`, data);
  }
sendOtpViaWhatsApp(data: { userName: string }): Observable<any> {
  return this.__http.post(`${this.baseUrl}/auth/send-otp-whatsapp`, data);
}



  userChangePassword(data: any): Observable<any> {
    return this.__http.post(`${this.baseUrl}${endpoints.auth.auth}/${endpoints.auth.ChangePassword}`, data);
  }


 getCountriesPhoneCode(): { id: number, name: string, code: string }[] {
    return [
    //  { id: 1, name: "Afghanistan", code: "+93" },
    //  { id: 2, name: "Albania", code: "+355" },
    //  { id: 3, name: "Algeria", code: "+213" },
    //  { id: 4, name: "American Samoa", code: "+1-684" },
     // { id: 5, name: "Andorra", code: "+376" },
     // { id: 6, name: "Angola", code: "+244" },
      //{ id: 7, name: "Argentina", code: "+54" },
     // { id: 8, name: "Armenia", code: "+374" },
     // { id: 9, name: "Australia", code: "+61" },
     // { id: 10, name: "Austria", code: "+43" },
      ////{ id: 11, name: "Bahrain", code: "+973" },
      //{ id: 12, name: "Bangladesh", code: "+880" },
      //{ id: 13, name: "Belgium", code: "+32" },
    //  { id: 14, name: "Belize", code: "+501" },
     // { id: 15, name: "Benin", code: "+229" },
     // { id: 16, name: "Bhutan", code: "+975" },
     // { id: 17, name: "Bolivia", code: "+591" },
     // { id: 18, name: "Brazil", code: "+55" },
     // { id: 19, name: "Canada", code: "+1" },
     // { id: 20, name: "China", code: "+86" },
    //  { id: 21, name: "Colombia", code: "+57" },
     // { id: 22, name: "Costa Rica", code: "+506" },
     // { id: 23, name: "Croatia", code: "+385" },
     // { id: 24, name: "Cuba", code: "+53" },
     // { id: 25, name: "Czech Republic", code: "+420" },
     // { id: 26, name: "Denmark", code: "+45" },
      { id: 27, name: "Egypt", code: "+20" },
     // { id: 28, name: "Estonia", code: "+372" },
     // { id: 29, name: "Finland", code: "+358" },
     // { id: 30, name: "France", code: "+33" },
    //  { id: 31, name: "Germany", code: "+49" },
     // { id: 32, name: "Greece", code: "+30" },
     // { id: 33, name: "Hong Kong", code: "+852" },
     // { id: 34, name: "Hungary", code: "+36" },
     // { id: 35, name: "India", code: "+91" },
     // { id: 36, name: "Indonesia", code: "+62" },
     // { id: 37, name: "Iran", code: "+98" },
     // { id: 38, name: "Iraq", code: "+964" },
     // { id: 39, name: "Ireland", code: "+353" },
     // { id: 41, name: "Italy", code: "+39" },
     // { id: 42, name: "Japan", code: "+81" },
     // { id: 43, name: "Kenya", code: "+254" },
      { id: 44, name: "Kuwait", code: "+965" },
     // { id: 45, name: "Lebanon", code: "+961" },
    //  { id: 46, name: "Libya", code: "+218" },
     // { id: 47, name: "Malaysia", code: "+60" },
    //  { id: 48, name: "Mexico", code: "+52" },
     // { id: 49, name: "Morocco", code: "+212" },
     // { id: 50, name: "Netherlands", code: "+31" },
     // { id: 51, name: "New Zealand", code: "+64" },
     // { id: 52, name: "Nigeria", code: "+234" },
    //  { id: 53, name: "Norway", code: "+47" },
   // //  { id: 54, name: "Pakistan", code: "+92" },
   //   { id: 55, name: "Philippines", code: "+63" },
   // //  { id: 56, name: "Poland", code: "+48" },
    //  { id: 57, name: "Portugal", code: "+351" },
      { id: 58, name: "Qatar", code: "+974" },
    //  { id: 59, name: "Romania", code: "+40" },
    //  { id: 60, name: "Russia", code: "+7" },
   //   { id: 61, name: "Saudi Arabia", code: "+966" },
    //  { id: 62, name: "Singapore", code: "+65" },
    //  { id: 63, name: "South Africa", code: "+27" },
     // { id: 64, name: "South Korea", code: "+82" },
    //  { id: 65, name: "Spain", code: "+34" },
    //  { id: 66, name: "Sudan", code: "+249" },
   //   { id: 67, name: "Sweden", code: "+46" },
    //  { id: 68, name: "Switzerland", code: "+41" },
      { id: 69, name: "Syria", code: "+963" },
    //  { id: 70, name: "Thailand", code: "+66" },
     // { id: 71, name: "Tunisia", code: "+216" },
     // { id: 72, name: "Turkey", code: "+90" },
    //  { id: 73, name: "Ukraine", code: "+380" },
      { id: 74, name: "United Arab Emirates", code: "+971" },
     // { id: 75, name: "United Kingdom", code: "+44" },
     // { id: 76, name: "United States", code: "+1" },
      //{ id: 77, name: "Vietnam", code: "+84" },
     // { id: 78, name: "Yemen", code: "+967" }
    ];
  }
}
