import { Component, forwardRef, Input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  imports: [FormsModule],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true
    }
  ]
})
export class InputFieldComponent {
  @Input() type: 'string' | 'number' = 'string';
  @Input() placeholder: string = '';
  @Input() label: string = '';
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;

  value: string | number = '';
  onChange = (_: any) => { };
  onTouched = () => { };

  writeValue(val: any): void {
    this.value = val ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  updateValue(val: any) {
    this.value = this.type === 'number' ? +val : val;
    this.onChange(this.value);
  }
}
