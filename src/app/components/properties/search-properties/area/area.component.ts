import { Component, ElementRef, input, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-area',
  imports: [FormsModule],
  templateUrl: './area.component.html',
  styleUrl: './area.component.scss'
})
export class AreaComponent {
  @ViewChild('dropdownToggle', { static: true }) dropdownToggle!: ElementRef;

  placeholder = input<string>('');
  valueType = input<string>('');
  min = signal<number | null>(null);
  max = signal<number | null>(null);


  onApply(): void {
    // Handle logic as needed, then close the dropdown
    this.dropdownToggle.nativeElement.classList.remove('show');
  }

  onReset(): void {
    this.min.set(null);
    this.max.set(null);
  }
}
