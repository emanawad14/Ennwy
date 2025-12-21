import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // توافقية مع روابط قديمة فيها بادئة لغة
  { path: 'en-US', renderMode: RenderMode.Client },
  { path: 'en', renderMode: RenderMode.Client },
  { path: 'ar', renderMode: RenderMode.Client },
  { path: 'en-US/home', renderMode: RenderMode.Client },
  { path: 'en/home', renderMode: RenderMode.Client },
  { path: 'ar/home', renderMode: RenderMode.Client },

  { path: 'home', renderMode: RenderMode.Client },
  { path: 'ad/:id', renderMode: RenderMode.Server },
  { path: 'advertiser-profile/:id', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'profile-ads', renderMode: RenderMode.Client },
  { path: 'changepassword', renderMode: RenderMode.Client },
  { path: 'fav-ads', renderMode: RenderMode.Client },
  { path: 'chats-page', renderMode: RenderMode.Client },
  { path: 'notifications', renderMode: RenderMode.Client },
  { path: 'ticket', renderMode: RenderMode.Client },
  { path: 'helpsupport', renderMode: RenderMode.Client },
  { path: 'terms-and-conditions', renderMode: RenderMode.Client },
  { path: 'contact-us', renderMode: RenderMode.Client },
  { path: 'edit-profile', renderMode: RenderMode.Client },
  { path: 'ads/:id/:ad', renderMode: RenderMode.Client },

  { path: 'auth', renderMode: RenderMode.Client },
  { path: 'post-ad', renderMode: RenderMode.Client },
  { path: 'sell-ad/:id', renderMode: RenderMode.Client },
  { path: 'motors', renderMode: RenderMode.Client },
  { path: 'properties', renderMode: RenderMode.Client },

  // fallback
  { path: '**', renderMode: RenderMode.Client },
];
