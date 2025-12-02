import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { key } from '../../../config/localStorage';
import { Component } from '@angular/core';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.scss'
})
export class UserInfoComponent {

  constructor(private __Router: Router) {}

  logout(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key.userInfo);
        localStorage.removeItem(key.selectedCategory);
      } finally {
        const url = this.__Router.serializeUrl(this.__Router.createUrlTree(['/home']));
        window.location.replace(url);
      }
    }
  }
}
