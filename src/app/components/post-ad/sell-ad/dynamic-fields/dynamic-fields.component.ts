import {
  Component,
  EventEmitter,
  Output,
  input,
  signal,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { LanguageService } from '../../../../services/generic/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dynamic-fields',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, NgSelectModule, CommonModule],
  templateUrl: './dynamic-fields.component.html',
  styleUrl: './dynamic-fields.component.scss'
})
export class DynamicFieldsComponent implements OnInit {
  language = signal<string>('en');

  // عناصر الحقول: { id, attribute, name, isMandatory, valueType, choices, isDependent, dependentId, filteredChoices }
  fields = input<any[]>([]);
  form!: FormGroup;

  @Output() submitFields = new EventEmitter<any[]>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly __LanguageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.language.set(this.__LanguageService.getLanguage());
    this.form = this.buildForm();

    // طبعّن IDs كلها كنصوص
    const normalizeChoices = (arr: any[] = []) =>
      arr.map(c => ({ ...c, id: String(c.id) }));

    this.fields().forEach(field => {
      field.choices = normalizeChoices(field.choices || []);

      if (field.isDependent && field.dependentId) {
        const parentAttr = this.fields().find(f => f.id === field.dependentId);
        const parentControl = this.form.get(parentAttr?.attribute);

        parentControl?.valueChanges.subscribe((parentValue: any) => {
          const p = parentValue != null ? String(parentValue) : null;
          field.filteredChoices = (field.choices || []).filter(
            (ch: any) => String(ch.parentId ?? '') === String(p ?? '')
          );
          // صفّر قيمة الطفل
          this.form.get(field.attribute)?.setValue(field.valueType === 'enum_multiple' ? [] : null);
        });

        const initial = this.form.get(parentAttr?.attribute)?.value;
        field.filteredChoices = (field.choices || []).filter(
          (ch: any) => String(ch.parentId ?? '') === String(initial ?? '')
        );
      } else {
        field.filteredChoices = [...(field.choices || [])];
      }
    });

    // ابعت القيم عند صلاحية النموذج
    this.form.valueChanges.subscribe(values => {
      if (this.form.valid) {
        this.submitFields.emit(this.prepareFields(values));
      } else {
        this.submitFields.emit([]);
      }
    });
  }

  // ====== بحث ذكي عربي/إنجليزي ======
  private norm(s: any): string {
    if (s == null) return '';
    let t = String(s).toLowerCase().trim();
    t = t.replace(/[آأإ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
    t = t.replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '');
    t = t.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ');
    return t;
  }

  searchFn = (term: string, item: any): boolean => {
    const q = this.norm(term);
    if (!q) return true;
    const h = [this.norm(item?.label), this.norm(item?.name), this.norm(item?.value), this.norm(item?.keywords)]
      .filter(Boolean).join(' ');
    return h.includes(q);
  };

  // مقارنة IDs + trackBy
  compareIds = (a: any, b: any) => String(a) === String(b);
  trackById = (_: number, item: any) => item?.id;

  private buildForm(): FormGroup {
    const group: Record<string, any> = {};
    this.fields().forEach(attr => {
      const validators = attr.isMandatory ? [Validators.required] : [];
      let def: any = null;
      if (attr.valueType === 'enum_multiple') def = [] as string[];
      group[attr.attribute] = this.fb.control(def, validators);
    });
    return this.fb.group(group);
  }

  private prepareFields(formValues: any): any[] {
    const out: any[] = [];
    this.fields().forEach(attr => {
      const v = formValues[attr.attribute];
      let choises: (number | string)[] = [];
      if (attr.valueType === 'enum') {
        choises = v != null && v !== '' ? [v] : [];
      } else if (attr.valueType === 'enum_multiple') {
        choises = Array.isArray(v) ? v : [];
      }
      out.push({
        flatFieldId: attr.id,
        valueString: attr.valueType === 'string' ? (v || '') : '',
        valueNumber: (attr.valueType === 'float' || attr.valueType === 'integer')
          ? (v !== null && v !== undefined ? Number(v) || 0 : 0)
          : 0,
        choises
      });
    });
    return out;
  }

  updateValue(event: Event): void {
    const el = event.target as HTMLInputElement;
    const name = el.getAttribute('formControlName');
    if (name && this.form.contains(name)) {
      const num = el.value === '' ? null : +el.value;
      this.form.get(name)?.setValue(num);
    }
  }

  // ====== اختَر الكل / امسح الكل (ون-كليك) ======

  /** يختار كل العناصر المتاحة لهذا الحقل مرة واحدة (المتاحة = filteredChoices) */
  selectAll(attr: any): void {
    const control = this.form.get(attr.attribute);
    if (!control) return;
    const allIds = (attr.filteredChoices || []).map((x: any) => String(x.id));
    control.setValue(allIds); // دفعة واحدة
    control.markAsDirty();
    control.updateValueAndValidity({ emitEvent: true });
  }

  /** لو عايز تختار كل الخيارات بغض النظر عن الفلترة التابعة، استخدم دي */
  selectAllAbsolute(attr: any): void {
    const control = this.form.get(attr.attribute);
    if (!control) return;
    const allIds = (attr.choices || []).map((x: any) => String(x.id));
    control.setValue(allIds);
    control.markAsDirty();
    control.updateValueAndValidity({ emitEvent: true });
  }

  clearAll(attr: any): void {
    const control = this.form.get(attr.attribute);
    if (!control) return;
    control.setValue([]);
    control.markAsDirty();
    control.updateValueAndValidity({ emitEvent: true });
  }
}
