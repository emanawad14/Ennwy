import { LocationComponent } from '../../core/components/navbar/location/location.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ProductCardComponent } from '../home/product-card/product-card.component';
import { LanguageService } from '../../services/generic/language.service';
import { ProfileService } from '../../services/profile.service';
import { Component, OnInit, signal } from '@angular/core';
import { AdService } from '../../services/ad.service';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { key } from '../../core/config/localStorage';
import { RouterModule } from '@angular/router'; // ✅ إضافة هذا السطر لحل خطأ routerLink

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule // ✅ ضروري للـ routerLink
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  language = signal<string>('en');
  userId = signal<string>('');
  profileDetails = signal<any>({});
  isLoading = signal<boolean>(false);

  ads = signal<any>([]);
  totalAds = signal<number>(0);
  countInPage = signal<number>(0);
  isLoadingAds = signal<boolean>(false);

  pageNumber = signal<number>(1);
  pageSize = signal<number>(5);
  cityId = signal<string>('');

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __ProfileService: ProfileService,
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __AdService: AdService,
  ) { }

  ngOnInit(): void {
    this.getProfileData();
    this.userId.set(this.profileDetails()?.id);
   
  }

  get firstLetter() {
    return this.profileDetails().fullName?.charAt(0)?.toUpperCase();
  }

  getProfileData(): void {
    const user = localStorage.getItem(key.userInfo);
    if (user) {
      this.profileDetails.set(JSON.parse(user));
    }
  }

  

  getCount(): number {
    return Math.round(this.totalAds() / 5);
  }



}
