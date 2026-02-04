import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdService } from '../../services/ad.service';
import { UtilityService } from '../../services/generic/utility.service';
import { key } from '../../core/config/localStorage';
import { finalize } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-searchlog',
  standalone: true,
  imports: [CommonModule,TranslateModule,
    RouterModule
    ],
  templateUrl: './searchlog.component.html',
  styleUrl: './searchlog.component.scss'
})
export class SearchlogComponent implements OnInit {

  userId = signal<string>('');
  searchLogs = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  constructor(
    private readonly __AdService: AdService,
    private readonly __UtilityService: UtilityService
  ) {}

  ngOnInit(): void {
    this.getUserData();
  }

  // ✅ نفس طريقة ProfileadsComponent
  getUserData(): void {
    const user = localStorage.getItem(key.userInfo);
    if (!user) return;

    const parsed = JSON.parse(user);
    this.userId.set(parsed.id);

    // أول ما اليوزر ييجي → نجيب الـ search log
    this.getSearchLog();
  }

  getSearchLog(): void {
    this.isLoading.set(true);
    this.__UtilityService.setGlobalLoading(true);

    this.__AdService.getsearchlog(this.userId())
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.__UtilityService.setGlobalLoading(false);
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('Search log response:', res);
          this.searchLogs.set(res?.data || []);
        },
        error: (err: any) => {
          console.error('Search log error:', err);
        }
      });
  }
  deleteSearchLog(id: string): void {
  if (!id) return;

  // تأكيد قبل الحذف
  if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;

  this.isLoading.set(true);
  this.__UtilityService.setGlobalLoading(true);

  this.__AdService.deletegetsearchlog(id)
    .pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.__UtilityService.setGlobalLoading(false);
      })
    )
    .subscribe({
      next: (res: any) => {
        // حذف العنصر من الواجهة فوراً
        this.searchLogs.set(this.searchLogs().filter(log => log.id !== id));
      },
      error: (err: any) => {
        console.error('حذف السجل فشل:', err);
      }
    });
}

}
