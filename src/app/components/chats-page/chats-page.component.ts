import { CommonModule } from '@angular/common';
import { Component, signal, computed, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdService } from '../../services/ad.service';
import { key } from '../../core/config/localStorage';

@Component({
  selector: 'app-chats-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule, FormsModule],
  templateUrl: './chats-page.component.html',
  styleUrls: ['./chats-page.component.scss']
})
export class ChatsPageComponent implements OnDestroy {
  chats = signal<any[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  meId = signal<string | null>(null);

  selected = signal<any | null>(null);
  chatDetail = signal<any | null>(null);
  chatLoading = signal<boolean>(false);
  chatError = signal<string | null>(null);

  query = signal<string>('');
  newMessage = signal<string>('');

  /** وضع الموبايل: list | detail */
  mobileMode = signal<'list' | 'detail'>('list');

  @ViewChild('messagesArea') private messagesArea?: ElementRef<HTMLDivElement>;
  private refreshTimer: any = null;

  constructor(private adService: AdService) { }

  get dir(): 'rtl' | 'ltr' {
    return (document?.documentElement?.getAttribute('dir') as any) || 'ltr';
  }
  private isMobile(): boolean {
    try { return  typeof window!==undefined? window.matchMedia('(max-width: 991.98px)').matches :false; }
    catch { return (window as any)?.innerWidth <= 991; }
  }

  ngOnInit(): void {
    const raw = localStorage.getItem(key.userInfo);
    const me = raw ? JSON.parse(raw) : null;
    const myId = me?.id ?? me?.userId ?? me?.UserId ?? me?.ID ?? null;
    if (!myId) { this.error.set('No user logged in.'); return; }

    this.meId.set(String(myId));
    this.fetchChats(String(myId), false);
    this.startAutoRefresh(String(myId));
  }
  ngOnDestroy(): void { this.clearAutoRefresh(); }

  private fetchChats(userId: string, keepSelection = false): void {
    const currentSelected = this.selected();
    const currentSelectedId = currentSelected ? this.extractChatId(currentSelected) : null;

    this.adService.getuserchat(userId as any).subscribe({
      next: (res: any) => {
        const items =
          (Array.isArray(res?.data) ? res.data : null) ??
          (Array.isArray(res) ? res : []) ?? [];
        this.chats.set(items);

        if (keepSelection && currentSelectedId) {
          const updatedRef = items.find((it: any) => this.extractChatId(it) === currentSelectedId) || currentSelected;
          this.selected.set(updatedRef);
        } else if (!keepSelection) {
          this.selected.set(null);
          this.chatDetail.set(null);
          this.mobileMode.set('list');
        }
      },
      error: () => this.error.set('Failed to load chats')
    });
  }

  private loadChat(chatId: string, silent = false): void {
    if (!silent) this.chatLoading.set(true);
    const shouldStickBottom = this.isNearBottom();

    this.adService.getchat(chatId as any).subscribe({
      next: (res: any) => {
        const detail = res?.data ?? res ?? {};
        this.chatDetail.set(detail);
        if (!silent) this.chatLoading.set(false);
        if (shouldStickBottom) this.scrollToBottom();
      },
      error: () => {
        this.chatError.set('Failed to load chat details');
        if (!silent) this.chatLoading.set(false);
      }
    });
  }

  private startAutoRefresh(userId: string): void {
    this.clearAutoRefresh();
    this.refreshTimer = setInterval(() => {
      this.fetchChats(userId, true);
      const chatId = this.extractChatId(this.selected());
      if (chatId) this.loadChat(chatId, true);
    }, 40000);
  }
  private clearAutoRefresh(): void {
    if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; }
  }

  public scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
  private isNearBottom(threshold = 120): boolean {
    const el = this.messagesArea?.nativeElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.chats();
    return this.chats().filter((c) => {
      const name = c?.otherUserName || c?.sellerName || c?.buyerName || '';
      const adTitle = c?.adTitle || c?.adTitile || '';
      return String(name).toLowerCase().includes(q) || String(adTitle).toLowerCase().includes(q);
    });
  });
  trackByIndex = (i: number) => i;

  private extractChatId(chat: any): string | null {
    const raw = chat?.id ?? chat?.chatId ?? chat?.ChatId ?? chat?.chatID ?? null;
    return raw == null ? null : String(raw);
  }
  private senderIdOf(m: any): string | null {
    const raw = m?.senderId ?? m?.fromUserId ?? m?.userId ?? null;
    return raw == null ? null : String(raw);
  }

  isMine(m: any): boolean {
    const me = this.meId(); if (!me) return false;
    const sid = this.senderIdOf(m);
    return !!sid && String(sid) === String(me);
  }
  isRead(m: any): boolean { return m?.isRead === true; }

  pick(chat: any): void {
    this.selected.set(chat);
    this.chatDetail.set(null);
    this.chatError.set(null);

    const chatId = this.extractChatId(chat);
    if (!chatId) { this.chatError.set('Invalid chat id'); return; }
    this.loadChat(chatId, false);
    if (this.isMobile()) this.mobileMode.set('detail');
  }
  backToList(): void { this.mobileMode.set('list'); }

  contactName(chat: any): string {
    return chat?.otherUserName || chat?.sellerName || chat?.buyerName || '—';
  }
  lastMessage(chat: any): string {
    return chat?.lastMessage?.message || chat?.lastMessage || chat?.message || '';
  }
  lastTime(chat: any): string {
    return chat?.lastMessage?.timestamp || chat?.lastMessageTime || chat?.timeAgo || '';
  }
  avatar(chat: any): string | null {
    return chat?.adPhoto || chat?.sellerImageurl || chat?.buyerNameImageurl || chat?.photo || chat?.avatar || null;
  }

  messages(): any[] {
    const d = this.chatDetail();
    return (
      (Array.isArray(d?.messages) && d.messages) ||
      (Array.isArray(d?.data?.messages) && d.data.messages) ||
      (Array.isArray(d?.result?.messages) && d.result.messages) ||
      (Array.isArray(d) ? d : []) ||
      []
    );
  }
  messageText(m: any): string { return m?.message ?? m?.text ?? (typeof m === 'string' ? m : ''); }
  messageImage(m: any): string | null { return m?.imageUrl ?? m?.photo ?? m?.attachmentUrl ?? null; }

  adId(): string | null {
    const s = this.selected();
    return s?.advertisementId ?? s?.adId ?? null;
  }
  adTitle(): string {
    const s = this.selected();
    return s?.adTitle ?? s?.adTitile ?? '';
  }
  language(): 'ar' | 'en' {
    const dir = document?.documentElement?.getAttribute('dir') || (document as any)?.dir || 'ltr';
    return dir === 'rtl' ? 'ar' : 'en';
  }
  adTitleForRoute(): string {
    const s = this.selected();
    if (!s) return '';
    if (this.language() === 'ar') {
      return s.adTitle ?? s.adTitile ?? s.title ?? '';
    } else {
      return s.adTitle_L1 ?? s.title_L1 ?? s.adTitle ?? s.adTitile ?? '';
    }
  }
  slug(v?: string | null): string {
    if (!v) return '';
    return String(v)
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '')
      .trim().replace(/\s+/g, '-').toLowerCase();
  }

  sendMessage(): void {
    const msg = this.newMessage().trim();
    if (!msg || !this.selected()) return;
    const chat = this.selected();
    const adId = chat?.advertisementId || chat?.adId;
    const sellerId = chat?.sellerId;
    const buyerId = chat?.buyerId;
    const senderId = this.meId();
    const data = { adId, sellerId, buyerId, senderId, message: msg };

    this.adService.addchat(data).subscribe({
      next: () => {
        const updated = [
          ...this.messages(),
          { message: msg, senderId, timestamp: new Date().toISOString(), isRead: false }
        ];
        this.chatDetail.set({ ...this.chatDetail(), messages: updated });
        this.newMessage.set('');
        this.scrollToBottom();
        this.fetchChats(this.meId()!, true);
        const chatIdNow = this.extractChatId(this.selected());
        if (chatIdNow) this.loadChat(chatIdNow, true);
      },
      error: () => alert('Failed to send message')
    });
  }
}
