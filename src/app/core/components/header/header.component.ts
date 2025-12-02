import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private loc: Location, private router: Router) {}

  goBack(): void {
    // لو فيه تاريخ سابق في النافذة ارجع
    if (window.history.length > 1) {
      this.loc.back();
    } else {
      // مفيش تاريخ: رجّع المستخدم للهوم (أو أي مسار تختاره)
      this.router.navigateByUrl('/');
    }
  }
}
