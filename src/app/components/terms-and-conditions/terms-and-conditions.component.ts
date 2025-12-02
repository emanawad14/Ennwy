import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdService } from '../../services/ad.service';
import { LanguageService } from '../../services/generic/language.service';
import { ProfileService } from '../../services/profile.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.html',
  styleUrl: './terms-and-conditions.component.scss', // ✅ أضف هذا لو لم يكن موجود
  standalone: true,
  imports: [TranslateModule, CommonModule]
})
export class TermsAndConditionsComponent {
  sectionKeys = [
    'accept',
    'account',
    'usage',
    'content',
    'interactions',
    'privacy',
    'modifications',
    'termination',
    'law'
  ];

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __ProfileService: ProfileService,
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __AdService: AdService,
  ) { }
}
