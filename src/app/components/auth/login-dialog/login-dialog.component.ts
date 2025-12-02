import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login-dialog',
  imports: [TranslateModule],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss'
})
export class LoginDialogComponent {
  @Output() loginHandler = new EventEmitter();

  constructor(
    private readonly __Router: Router
  ) { }

  login(type: string): void {
    this.__Router.navigate(['/auth/login'], { queryParams: { type: type } });
    this.loginHandler.emit('');
   

  }
  register(): void {
    this.__Router.navigate(['/auth/register']);
    this.loginHandler.emit('');
  }
}
