import { Component, input, signal, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from "../product-card/product-card.component";

@Component({
  selector: 'app-home-card',
  standalone: true,
  imports: [RouterModule, TranslateModule, CommonModule],
  templateUrl: './home-card.component.html',
  styleUrl: './home-card.component.scss'
})
export class HomeCardComponent {
  title = input.required<string>();
  categoryId = input.required<number>();

  isMobile = signal(false);
  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    effect(() => {
      this.breakpointObserver.observe([Breakpoints.Handset])
        .subscribe(result => {
          this.isMobile.set(result.matches);
        });
    });
  }
}
