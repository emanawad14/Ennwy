import { Component, EventEmitter, Output, input } from '@angular/core';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent {
  visible = input<boolean>(false);
  title = input<string>('');
  showHeader = input<boolean>(true);
  @Output() visibleChange = new EventEmitter<boolean>();

  close() {
    this.visibleChange.emit(false);
  }
}
