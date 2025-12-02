import { Component, ElementRef, input, signal, ViewChild } from '@angular/core';

@Component({
  selector: 'app-beds',
  imports: [],
  templateUrl: './beds.component.html',
  styleUrl: './beds.component.scss'
})
export class BedsComponent {
  @ViewChild('dropdownToggle', { static: true }) dropdownToggle!: ElementRef;

  placeholder = input<string>('');
  beds = signal<number[]>([1, 2, 3, 4, 5, 6]);
  bedsValue = signal<any>([]);
  baths = signal<number[]>([1, 2, 3, 4, 5]);
  bathsValue = signal<number[]>([]);


  onBedChange(event: Event, item: any): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.bedsValue();

    if (checked && !current.includes(item)) {
      this.bedsValue.set([...current, item]);
    } else if (!checked) {
      this.bedsValue.set(current.filter((i: number) => i !== item));
    }
  }
  onBathChange(event: Event, item: any): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.bathsValue();

    if (checked && !current.includes(item)) {
      this.bathsValue.set([...current, item]);
    } else if (!checked) {
      this.bathsValue.set(current.filter((i: number) => i !== item));
    }
  }

  onApply(): void {
    // Handle logic as needed, then close the dropdown
    this.dropdownToggle.nativeElement.classList.remove('show');
  }

  onReset(): void {
    this.bedsValue.set([]);
    this.bathsValue.set([]);
  }
}
