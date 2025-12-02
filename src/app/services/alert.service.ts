import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core'; // Import TranslateService

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  infoMessage(arg0: string) {
    throw new Error('Method not implemented.');
  }

  constructor(private translateService: TranslateService) { }

  // Confirm Message
  confirmMessage(title: string, approveBtn: string, cancelBtn: string, confirmFun: () => void): void {
    Swal.fire({
      title: `<h1><b>Are you sure?</b></h1>`,
      html: `<h5><b>${title}</b></h5>`,
      icon: "warning",
      width: 400,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "orange",
      confirmButtonText: `<b>${approveBtn}</b>`,
      cancelButtonText: `<b>${cancelBtn}</b>`,
      iconColor: "orange"
    }).then((result) => {
      if (result.isConfirmed) {
        confirmFun();
      }
    });
  }

  // Success Message
  successMessage(title: string): void {
    const position = this.translateService.currentLang === 'ar' ? 'top-start' : 'top-end'; // Check language

    const Toast = Swal.mixin({
      toast: true,
      position: position,  // Set position based on language
      showConfirmButton: false,
      timer: 3000,
      width: 400,
      background: '#4BB543',
      color: "white",
      iconColor: "white",
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
      customClass: {
        timerProgressBar: 'progressuccessnew'
      }
    });

    Toast.fire({
      icon: "success",
      title: `<h5><b>${title}</b></h5>`
    });
  }

  // Error Message
  errorMessage(title: string): void {
    const position = this.translateService.currentLang === 'ar' ? 'top-start' : 'top-end'; // Check language

    const Toast = Swal.mixin({
      toast: true,
      position: position,  // Set position based on language
      showConfirmButton: false,
      timer: 3000,
      background: 'rgb(189,54,47)',
      color: "white",
      iconColor: "white",
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
      customClass: {
        timerProgressBar: 'progressuccessnew'
      }
    });

    Toast.fire({
      icon: "error",
      title: `<h5><b>${title}</b></h5>`
    });
  }
}
