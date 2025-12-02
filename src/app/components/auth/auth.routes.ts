import { Routes } from '@angular/router';

export const authChildrenRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent),
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./verify-otp/verify-otp.component').then(c => c.VerifyOtpComponent),
  },
  {
    path: 'forget-password',
    loadComponent: () => import('./forget-password/forget-password.component').then(c => c.ForgetPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(c => c.ResetPasswordComponent),
  }
]
