import { Routes } from '@angular/router';
import { RenderMode } from '@angular/ssr';
import { authChildrenRoutes } from './components/auth/auth.routes'; // لو عندك ملف راوتس داخلي للأوث

export const routes: Routes = [
  // توافقية مع روابط قديمة فيها بادئة لغة
  { path: 'en-US', redirectTo: 'home', pathMatch: 'full',/*data: { renderMode: RenderMode.Server }*/ },
  { path: 'en', redirectTo: 'home', pathMatch: 'full',/*data: { renderMode: RenderMode.Server }*/ },
  { path: 'ar', redirectTo: 'home', pathMatch: 'full',/*data: { renderMode: RenderMode.Server }*/ },
  { path: 'en-US/home', redirectTo: 'home',/*data: { renderMode: RenderMode.Server }*/ },
  { path: 'en/home', redirectTo: 'home',/*data: { renderMode: RenderMode.Server }*/ },
  { path: 'ar/home', redirectTo: 'home',/*data: { renderMode: RenderMode.Server }*/ },

  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'ad/:id',
    loadComponent: () => import('./components/ad/ad.component').then(c => c.AdComponent),
   data: { renderMode: RenderMode.Server }
  },

  {
    path: 'advertiser-profile/:id',
    loadComponent: () => import('./components/advertiser-profile/advertiser-profile.component')
      .then(c => c.AdvertiserProfileComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(c => c.ProfileComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'profile-ads',
    loadComponent: () => import('./components/profile-ads/profile-ads.component').then(c => c.ProfileadsComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'changepassword',
    loadComponent: () => import('./components/changepassword/changepassword.component')
      .then(c => c.ChangePasswordComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'fav-ads',
    loadComponent: () => import('./components/fav-ads/fav-ads.component').then(c => c.favadsComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'chats-page',
    loadComponent: () => import('./components/chats-page/chats-page.component').then(c => c.ChatsPageComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'notifications',
    loadComponent: () => import('./components/notifications/notifications.component')
      .then(c => c.NotificationsPageComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'ticket',
    loadComponent: () => import('./components/ticket/ticket.component').then(c => c.TicketComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'helpsupport',
    loadComponent: () => import('./components/helpsupport/helpsupport.component').then(c => c.helpsupportComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'terms-and-conditions',
    loadComponent: () => import('./components/terms-and-conditions/terms-and-conditions.component')
      .then(c => c.TermsAndConditionsComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'contact-us',
    loadComponent: () => import('./components/contact-us/contact-us.component').then(c => c.ContactUsComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'edit-profile',
    loadComponent: () => import('./components/edit-profile/edit-profile.component').then(c => c.EditProfileComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'ads/:id/:ad',
    loadComponent: () => import('./components/region/ads.component').then(c => c.AdsComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth.component').then(c => c.AuthComponent),
    children: authChildrenRoutes,
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'post-ad',
    loadComponent: () => import('./components/post-ad/post-ad.component').then(c => c.PostAdComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'sell-ad/:id',
    loadComponent: () => import('./components/post-ad/sell-ad/sell-ad.component').then(c => c.SellAdComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'motors',
    loadComponent: () => import('./components/motors/motors.component').then(c => c.MotorsComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  {
    path: 'properties',
    loadComponent: () => import('./components/properties/properties.component').then(c => c.PropertiesComponent),
   /*data: { renderMode: RenderMode.Server }*/
  },

  // fallback
  { path: '**', redirectTo: 'home',/*data: { renderMode: RenderMode.Server }*/ },
];
