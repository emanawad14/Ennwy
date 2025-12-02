

import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// اسم الكوكي اللي هتخزن فيه المفتاح/التوكن
const API_KEY_COOKIE = 'apiKey';
const TOKEN_COOKIE = 'token'; // لو بتخزّنه في كوكي برضه

function readCookie(name: string, cookieStr: string): string | null {
  const m = cookieStr.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const reqCtx = inject(REQUEST, { optional: true }) as any; // موجود بس في SSR

  // 1) اقرأ من الكوكي (يدعم SSR والمتصفح)
  let cookieStr = '';
  if (isBrowser) {
    cookieStr = document.cookie || '';
  } else {
    cookieStr = (reqCtx?.headers?.cookie as string) || '';
  }

  let apiKey = '123';//readCookie(API_KEY_COOKIE, cookieStr) || null;
  let token = readCookie(TOKEN_COOKIE, cookieStr) || null;

  // 2) كحل إضافي في المتصفح فقط: حاول من localStorage لو مفيش في الكوكي
  if (isBrowser && !token) {
    try {
      const userInfoString = globalThis.localStorage?.getItem('EnnwyUserInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        token = userInfo?.token || null;
      }
    } catch { }
  }
  // if (isBrowser && !apiKey) {
  //   try { apiKey = globalThis.localStorage?.getItem('apiKey') ?? null; } catch {}
  // }

  // 3) جهّز الهيدرز (عدّل الأسماء حسب المطلوب من الـ backend)
  const headersConfig: Record<string, string> = {
    'Accept': 'application/json',
    'X-Encrypt-Response': 'true'
  };

  // لو عندك ثابت لازم يتبعت مع كل طلب
  if (apiKey) {
    headersConfig['X-API-KEY'] = apiKey;  // أو 'x-api-key' حسب السيرفر
  } else {
    // fallback ثابت لو لازم (مش مفضل في الإنتاج)
    // headersConfig['X-API-KEY'] = '123';
  }

  if (token) {
    headersConfig['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({ setHeaders: headersConfig });
  return next(cloned);
};
