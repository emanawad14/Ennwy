import {
  Component,
  Input,
  forwardRef,
  OnInit
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

@Component({
  selector: 'app-dynamic-range',
  templateUrl: './dynamic-range.component.html',
  styleUrls: ['./dynamic-range.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamicRangeComponent),
      multi: true
    }
  ]
})
export class DynamicRangeComponent implements ControlValueAccessor, OnInit {
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;

  value = 0;
  thumbPosition = 0;

  private onChange = (value: number) => { };
  private onTouched = () => { };

  ngOnInit(): void {
    this.updateThumbPosition(this.value);
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = +input.value;
    this.updateThumbPosition(this.value);
    this.onChange(this.value);
    this.onTouched();
  }

  updateThumbPosition(value: number): void {
    const range = this.max - this.min;
    this.thumbPosition = ((value - this.min) / range) * 100;
  }

  // ControlValueAccessor methods
  writeValue(value: number): void {
    this.value = value ?? this.min;
    this.updateThumbPosition(this.value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Optional: implement if needed
  }
}
