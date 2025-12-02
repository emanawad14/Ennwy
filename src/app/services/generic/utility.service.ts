import { Subject, BehaviorSubject } from 'rxjs';
import { LanguageService } from './language.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  navbarSearch = new Subject<string>();
  cityId = new Subject<string>();

  // ✅ لودر عام لعمليات جلب البيانات (غير لودر الراوتر)
  globalLoading = new BehaviorSubject<boolean>(false);
  setGlobalLoading(val: boolean) { this.globalLoading.next(val); }

  constructor(
    private readonly __LanguageService: LanguageService
  ) { }

  timeAgoFun(dateString: string): string {
    const [day, month, yearAndTime] = dateString.split('-');
    const [year, time] = yearAndTime.split(' ');
    const [hours, minutes, seconds] = time.split(':');

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds)
    );

    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) return `${secondsAgo} ${this.__LanguageService.translateText('secondsAgo')}`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo} ${this.__LanguageService.translateText('minutesAgo')}`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo} ${this.__LanguageService.translateText('hoursAgo')}`;
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo < 30) return `${daysAgo} ${this.__LanguageService.translateText('daysAgo')}`;
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) return `${monthsAgo} ${this.__LanguageService.translateText('monthsAgo')}`;
    const yearsAgo = Math.floor(monthsAgo / 12);
    return `${yearsAgo} ${this.__LanguageService.translateText('yearsAgo')}`;
  }
}
