import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterModule,TranslateModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
   language = signal<string>('en');
  items = input<{ name: string,name_L1?:string, routerLink?: string }[]>([]);
}
