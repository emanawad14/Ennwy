import { Component, EventEmitter, Input, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IUser } from '../../../core/interfaces/ad';

@Component({
  selector: 'app-ad-owner-card',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './ad-owner-card.component.html',
  styleUrls: ['./ad-owner-card.component.scss']
})
export class AdOwnerCardComponent implements OnChanges {
  @Input({ required: true }) user!: IUser;

  // Events للأب
  @Output() revealPhone = new EventEmitter<void>();
  @Output() call = new EventEmitter<void>();
  @Output() whatsapp = new EventEmitter<void>();
  @Output() chat = new EventEmitter<void>();   // 👈 جديد

  // حالة إظهار الرقم داخل الطفل
  showNumber = signal<boolean>(false);
  imageBroken = signal<boolean>(false);
  readonly fallbackAvatar = 'images/95028257-800x600.jpg';

  get firstLetter(): string {
    return this.user?.fullName?.charAt(0)?.toUpperCase() ?? '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) this.imageBroken.set(false);
  }

  onAvatarError(): void {
    this.imageBroken.set(true);
  }

  // "عضو منذ" (user.createDate: "16-07-2025 18:29:52")
  formatCreateDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const [day, month, yearTime] = dateStr.split('-');
      const [year, time] = (yearTime || '').split(' ');
      const date = new Date(`${year}-${month}-${day}T${time}`);
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } catch { return ''; }
  }

  /** زر الهاتف: أول ضغطة تكشف الرقم، والضغط مرة أخرى (على الرقم نفسه) يتصل */
  onPhoneClick(): void {
    if (!this.showNumber()) {
      this.revealPhone.emit();
      this.showNumber.set(true);
    } else {
      this.call.emit();
    }
  }

  onWhatsAppClick(): void { this.whatsapp.emit(); }

  // 👇 زر الدردشة
  onChatClick(): void { this.chat.emit(); }
}
