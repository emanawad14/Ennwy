import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
  imports: [TranslateModule, CommonModule]
})
export class ContactUsComponent {
  constructor(private router: Router) {}

  openEmail(): void {
    if (typeof window !== "undefined") {
    window.location.href = 'mailto:info@ennwy.com';
}
   
  }

  callNumber(): void {
    if (typeof window !== "undefined") {
    window.location.href = 'tel:+963114390';
}
   
  }

  reportProblem(): void {
     this.router.navigate(['/ticket']);
    
  }
}
