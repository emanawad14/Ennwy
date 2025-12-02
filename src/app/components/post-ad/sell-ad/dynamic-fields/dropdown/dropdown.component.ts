import { LanguageService } from './../../../../../services/generic/language.service';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  Output
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DropdownComponent),
    multi: true
  }]
})
export class DropdownComponent implements ControlValueAccessor {
  @Input() options: any[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() key: string = 'label';
  @Output() selectionChange = new EventEmitter<any>();

  selectedValue: any = null;
  isOpen = false;
  filter = '';

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(
    private readonly __LanguageService: LanguageService,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.placeholder = this.__LanguageService?.translateText('placeholder.select');
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.filter = '';
  }

  selectOption(option: any): void {
    this.selectedValue = option; // 👈 استخدم الكائن كامل
    this.emitChange();
    this.isOpen = false;
  }

  clearSelection(): void {
    this.selectedValue = null;
    this.emitChange();
  }

  writeValue(value: any): void {
    this.selectedValue = value;
    this.emitChange(); // ✅ لحل مشكلة الربط مع Reactive Form
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  emitChange(): void {
    this.onChange(this.selectedValue); // ✅ مرر الكائن الكامل
    this.selectionChange.emit(this.selectedValue);
  }

  get selectedLabel(): string {
    return this.selectedValue?.[this.key] || '';
  }

  get filteredOptions(): any[] {
    return this.options.filter(opt =>
      opt[this.key]?.toLowerCase().includes(this.filter.toLowerCase())
    );
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement): void {
    if (!this.eRef.nativeElement.contains(target)) {
      this.isOpen = false;
      this.onTouched();
    }
  }
}
