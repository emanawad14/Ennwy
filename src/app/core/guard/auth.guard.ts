import { CanActivateFn, Router } from '@angular/router';
import { key } from '../config/localStorage';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  let userData: any = {};

  if (typeof window !== 'undefined') {
    try {
      userData = JSON.parse(localStorage.getItem(key.userInfo) || '{}');
    } catch (e) {
      console.warn('⚠️ فشل في قراءة بيانات المستخدم من localStorage:', e);
    }
  }

  if (userData?.token) {
    return true;
  } else {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};
