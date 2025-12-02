import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, Output } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LanguageService } from '../../../../../services/generic/language.service';
import { TranslateModule } from '@ngx-translate/core';

interface DropdownOption {
  [key: string]: string;
  value: any;
}

@Component({
  selector: 'app-dropdown-multi-select',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './dropdown-multi-select.component.html',
  styleUrl: './dropdown-multi-select.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DropdownMultiSelectComponent),
    multi: true
  }]
})
export class DropdownMultiSelectComponent {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() key: string = 'label';
  @Output() selectionChange = new EventEmitter<any[]>();

  selectedValues: any[] = [];
  isOpen = false;
  filter = '';

  onChange = (_: any) => { };
  onTouched = () => { };

  constructor(
    private readonly __LanguageService: LanguageService,
    private eRef: ElementRef) { }

  ngOnInit(): void {
    this.placeholder = this.__LanguageService?.translateText('placeholder.select');
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.filter = '';
  }

  writeValue(values: any[]): void {
    this.selectedValues = Array.isArray(values) ? values : [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (!this.eRef.nativeElement.contains(target)) {
      this.isOpen = false;
      this.onTouched();
    }
  }

  isSelected(option: DropdownOption): boolean {
    return this.selectedValues.includes(option.value);
  }

  onCheckboxChange(option: DropdownOption, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (!Array.isArray(this.selectedValues)) {
      this.selectedValues = [];
    }

    if (checked) {
      if (!this.selectedValues.includes(option.value)) {
        this.selectedValues.push(option.value);
      }
    } else {
      this.selectedValues = this.selectedValues.filter(v => v !== option.value);
    }

    this.emitChange();
  }


  selectAll() {
    this.selectedValues = this.filteredOptions.map(o => o[this.key]);
    this.emitChange();
  }

  clearAll() {
    this.selectedValues = [];
    this.emitChange();
  }

  emitChange() {
    this.onChange(this.selectedValues);
    this.selectionChange.emit(this.selectedValues);
  }

  get selectedLabels(): string {
    return this.options
      .filter(opt => this.selectedValues.includes(opt.value))
      .map(opt => opt[this.key])
      .join(', ') || '';
  }

  get filteredOptions(): DropdownOption[] {
    return this.options.filter(opt =>
      opt[this.key].toLowerCase().includes(this.filter.toLowerCase())
    );
  }
}
