import {
  Component, EventEmitter, Output, signal, OnDestroy, OnInit, input, computed, ViewChild, ElementRef
} from '@angular/core';
import { LanguageService } from '../../../services/generic/language.service';
import { AdService } from '../../../services/ad.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { key } from '../../../core/config/localStorage';
import { Subject, combineLatest, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { UtilityService } from '../../../services/generic/utility.service';
import { HomeService } from '../../../services/home.service';

type RangeVal = { start: number | null; end: number | null };
export type Option = { id: number; label: string };

type CityLite = { id: string; nameAr: string; nameEn: string };

type FlatField = {
  id: number;
  attribute: string;
  name?: string;
  name_L1?: string;
  valueType: string;
  choices?: any[];
  choises?: any[];
  isDependent?: boolean;
  dependentId?: number | null;
  dependentAttr?: string | null;
  dependentAttrLabel?: string | null;
  _allChoices?: any[];
  filteredChoices?: any[];
};

export type MobileChip = {
  key: string;
  type: 'price' | 'range' | 'choice' | 'text';
  fieldId?: number;
  attr?: string;
  label: string;
  options?: Option[];
  selectedIds?: number[];
  range?: { start: number | null; end: number | null };
  text?: string;
  displayName?: string;
};

@Component({
  selector: 'app-filter-ads',
  standalone: true,
  imports: [TranslateModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './filter-ads.component.html',
  styleUrls: ['./filter-ads.component.scss']
})
export class FilterAdsComponent implements OnInit, OnDestroy {
  @ViewChild('filterContainer', { static: false }) filterContainer!: ElementRef;

  enabled = input<boolean>(false);
  language = signal<string>('en');

  flatFields = signal<FlatField[]>([]);
  categories = signal<any>({});
  id = signal<number>(0);
  isLoading = signal<boolean>(false);
  isApplyingFilters = signal<boolean>(false);

  visibleChoicesCount = signal<Record<string, number>>({});

  priceMin = signal<number | null>(null);
  priceMax = signal<number | null>(null);
  priceError = signal<string | null>(null);

  rangeValues = signal<Record<string, RangeVal>>({});
  choiceValues = signal<Record<string, number[]>>({});
  textValues  = signal<Record<string, string>>({});

  @Output() filtersChange = new EventEmitter<any[]>();
  @Output() chipsChange = new EventEmitter<MobileChip[]>();
  @Output() cityChange = new EventEmitter<string | null>();
  @Output() categoryChange = new EventEmitter<number>();

  private destroy$ = new Subject<void>();
  private lastCategoryFetched: number | null = null;

  cities = signal<CityLite[]>([]);
  citiesLoading = signal<boolean>(false);
  selectedCityId = signal<string | null>(null);

  private childrenByParentAttr: Record<string, string[]> = {};
  private readonly CHILD_KEYS = ['children','list','subCategories','subs','items'];

  visibleSubcatsCount = signal<number>(10);

  // إضافة إشارة جديدة للتحقق من وجود category id
  hasCategoryId = signal<boolean>(false);

  // تعديل دالة subcategories لجمع جميع الفئات الفرعية بجميع المستويات
  readonly subcategories = computed<any[]>(() => {
    const cats = this.categories();
    const currentId = this.id();
    
    if (!currentId || !cats) return [];
    
    const roots =
      Array.isArray((cats as any).list) ? (cats as any).list :
      Array.isArray((cats as any).children) ? (cats as any).children :
      Array.isArray(cats as any) ? (cats as any) : [];
    
    // جمع جميع الفئات الفرعية بجميع المستويات
    const allSubcategories: any[] = [];
    const collectAllSubcategories = (nodes: any[]) => {
      if (!Array.isArray(nodes)) return;
      
      nodes.forEach(node => {
        allSubcategories.push(node);
        const children = this.getChildrenArray(node);
        if (children.length > 0) {
          collectAllSubcategories(children);
        }
      });
    };
    
    const currentNode = this.findNodeById(roots, currentId);
    if (currentNode) {
      const immediateChildren = this.getChildrenArray(currentNode);
      collectAllSubcategories(immediateChildren);
    }
    
    return allSubcategories;
  });

  readonly currentLangIsAr = computed(() => this.language() === 'ar');

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __AdService: AdService,
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly __UtilityService: UtilityService,
    private readonly __HomeService: HomeService
  ) {
    this.language.set(__LanguageService.getLanguage());
  }

  ngOnInit(): void { this.setupStreams(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private setupStreams(): void {
    this.getCategories();
    this.loadCities();
    this.hydrateSelectedCityId();

    this.__UtilityService.navbarSearch
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getCategories());

    combineLatest([this.__ActivatedRoute.paramMap, this.__ActivatedRoute.queryParams])
      .pipe(
        map(([pm, qp]) => {
          const id = Number(pm.get('id')) || 0;
          const minQ = qp['priceFrom'];
          const maxQ = qp['priceTo'];
          const pf = minQ !== undefined && minQ !== '' ? Number(minQ) : null;
          const pt = maxQ !== undefined && maxQ !== '' ? Number(maxQ) : null;
          const rawCity = qp['cityId'] ?? qp['CityId'];
          const cityId = (rawCity !== undefined && rawCity !== null && rawCity !== '') ? String(rawCity) : null;

          const qpCategory = qp['categoryId'] ?? qp['subCategoryId'] ?? null;
          const categoryIdFromQP = qpCategory ? Number(qpCategory) : null;

          return { id, pf, pt, cityId, categoryIdFromQP };
        }),
        distinctUntilChanged((a, b) =>
          a.id === b.id && a.pf === b.pf && a.pt === b.pt && a.cityId === b.cityId && a.categoryIdFromQP === b.categoryIdFromQP
        ),
        tap(s => {
          this.getCategories();
          const effectiveId = s.categoryIdFromQP || s.id;
          
          // تحديث حالة وجود category id
          this.hasCategoryId.set(!!effectiveId && effectiveId > 0);
          
          if (effectiveId) this.id.set(effectiveId);

          this.priceMin.set(s.pf);
          this.priceMax.set(s.pt);
          this.selectedCityId.set(s.cityId);
          this.cityChange.emit(s.cityId);
          this.visibleSubcatsCount.set(10);
        }),
        switchMap(() => {
          const currentId = this.id();
          const hasCategory = this.hasCategoryId();
          
          // إذا مفيش category id حقيقي، ماينفعش نعمل dynamic fields
          if (!hasCategory) { 
            this.resetFields(); 
            this.isApplyingFilters.set(false);
            return of(null); 
          }
          
          this.isLoading.set(true);
          return this.__AdService.getfilterFlatFieldsByCategoryId(currentId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => { 
          if (res) this.handleFlatFieldsResponse(res, this.id()); 
          this.isApplyingFilters.set(false);
        },
        error: (err) => { 
          this.resetFields(); 
          this.isLoading.set(false);
          this.isApplyingFilters.set(false);
          console.error('Error in filter setup:', err);
        }
      });
  }

  private resetFields(): void {
    this.flatFields.set([]);
    this.visibleChoicesCount.set({});
    this.rangeValues.set({});
    this.choiceValues.set({});
    this.textValues.set({});
    this.childrenByParentAttr = {};
  }

  getCategories(): void {
    try {
      const categories = localStorage.getItem(key.adsCategories);
      if (!categories) return;
      const obj = JSON.parse(categories);
      this.categories.set(obj);
      if (typeof obj?.id === 'number') this.id.set(obj.id);
    } catch {}
  }

  private getChildrenArray(node: any): any[] {
    for (const k of this.CHILD_KEYS) {
      const v = node?.[k];
      if (Array.isArray(v)) return v;
    }
    return [];
  }

  private findNodeById(list: any[], targetId: number): any | undefined {
    const q = Array.isArray(list) ? [...list] : [];
    while (q.length) {
      const n = q.shift();
      if (!n) continue;
      if (Number(n?.id) === Number(targetId)) return n;
      q.push(...this.getChildrenArray(n));
    }
    return undefined;
  }

  catLabel(cat: any): string {
    return this.language() === 'ar'
      ? (cat?.nameAr ?? cat?.titleAr ?? cat?.name ?? cat?.title ?? '')
      : (cat?.nameEn ?? cat?.titleEn ?? cat?.name_L1 ?? cat?.title ?? cat?.name ?? '');
  }

  goToSubcategory(subId: number): void {
    if (!subId) return;
    this.id.set(subId);
    this.visibleSubcatsCount.set(10);
    this.storeCategory(subId, false);

    this.router.navigate([], {
      relativeTo: this.__ActivatedRoute,
      queryParams: { categoryId: subId },
      queryParamsHandling: 'merge'
    });

    this.categoryChange.emit(subId);
  }

  private handleFlatFieldsResponse(res: any, categoryId: number): void {
    this.lastCategoryFetched = categoryId;

    const raw: FlatField[] = (res?.data || []) as FlatField[];
    const id2attr: Record<number, string> = {};
    raw.forEach((f: any) => { id2attr[f.id] = f?.attribute || `attr_${f.id}`; });

    this.childrenByParentAttr = {};

    const data: FlatField[] = raw.map((f: any) => {
      const allChoices =
        (Array.isArray(f?.choices) ? f.choices : Array.isArray(f?.choises) ? f.choises : []) || [];
      const ff: FlatField = {
        ...f,
        attribute: f?.attribute || `attr_${f.id}`,
        _allChoices: [...allChoices],
        filteredChoices: [...allChoices]
      };
      if (ff.isDependent && ff.dependentId) {
        ff.dependentAttr = id2attr[ff.dependentId] || null;
        ff.dependentAttrLabel = null;
      }
      return ff;
    });

    data.forEach((f) => {
      if (f.isDependent && f.dependentAttr) {
        const parent = data.find(p => p.attribute === f.dependentAttr);
        f.dependentAttrLabel = this.language() === 'ar'
          ? (parent?.name ?? '')
          : (parent?.name_L1 ?? parent?.name ?? '');
        if (!this.childrenByParentAttr[f.dependentAttr]) this.childrenByParentAttr[f.dependentAttr] = [];
        this.childrenByParentAttr[f.dependentAttr].push(f.attribute);
        f.filteredChoices = [];
      }
    });

    this.flatFields.set(data);

    const ranges: Record<string, RangeVal> = {};
    const choices: Record<string, number[]> = {};
    const texts:   Record<string, string>   = {};
    const vis:     Record<string, number>   = {};

    data.forEach((f: any) => {
      const attr = f?.attribute;
      if (!attr) return;
      if (this.isNumericField(f)) ranges[attr] = { start: null, end: null };
      else if (this.isListField(f)) { choices[attr] = []; vis[attr] = 5; }
      else texts[attr] = '';
    });

    this.rangeValues.set(ranges);
    this.choiceValues.set(choices);
    this.textValues.set(texts);
    this.visibleChoicesCount.set({ ...vis });

    Object.keys(this.childrenByParentAttr).forEach(parentAttr => this.updateDependentsFor(parentAttr));

    this.isLoading.set(false);
  }

  isNumericField(f: any): boolean {
    const t = (f?.valueType || '').toLowerCase();
    return t === 'integer' || t === 'float' || t === 'number';
  }

  isListField(f: any): boolean {
    const t = (f?.valueType || '').toLowerCase();
    return (Array.isArray(f?.choises) && f.choises.length > 0) ||
           (Array.isArray(f?.choices) && f.choices.length > 0) ||
           t === 'enum' || t === 'enum_multiple';
  }

  hasParentSelection(field: FlatField): boolean {
    if (!field?.isDependent || !field?.dependentAttr) return true;
    const sel = this.choiceValues()[field.dependentAttr] || [];
    return sel.length > 0;
  }

  labelOf(item: any): string {
    return this.language() === 'ar'
      ? (item?.label ?? item?.name ?? '')
      : (item?.label_L1 ?? item?.name_L1 ?? item?.name ?? '');
  }

  choiceIdOf(c: any): number {
    const raw = c?.id ?? c?.attribute ?? c;
    return Number.isFinite(Number(raw)) ? Number(raw) : -1;
  }

  private getFieldByAttr(attr: string): FlatField | undefined {
    return this.flatFields().find(f => f.attribute === attr);
  }

  getChoicesFor(field: FlatField): any[] {
    const src = (field?.filteredChoices && field.filteredChoices.length
      ? field.filteredChoices
      : (Array.isArray(field?.choices) ? field.choices
        : Array.isArray(field?.choises) ? field.choises : []));
    return Array.isArray(src) ? src : [];
  }

  getVisibleCount(attr: string): number {
    const map = this.visibleChoicesCount();
    const v = map ? map[attr] : undefined;
    return (typeof v === 'number' && v > 0) ? v : 5;
  }

  showMore(attr: string, total: number): void {
    const cur = this.visibleChoicesCount();
    const next = Math.min((cur?.[attr] || 5) + 5, total || 0);
    this.visibleChoicesCount.set({ ...(cur || {}), [attr]: next });
  }

  private updateDependentsFor(parentAttr: string): void {
    const parentField = this.getFieldByAttr(parentAttr);
    if (!parentField) return;

    const selectedParentIds = (this.choiceValues()[parentAttr] || [])
      .filter((x: any) => typeof x === 'number' && !isNaN(x));

    const childrenAttrs = this.childrenByParentAttr[parentAttr] || [];
    if (!childrenAttrs.length) return;

    const fieldsCopy = [...this.flatFields()];

    childrenAttrs.forEach(childAttr => {
      const child = fieldsCopy.find(f => f.attribute === childAttr);
      if (!child) return;

      const source = Array.isArray(child._allChoices) ? child._allChoices : [];
      const filtered = selectedParentIds.length
        ? source.filter((ch: any) => selectedParentIds.includes(Number(ch?.parentId)))
        : [];

      child.filteredChoices = filtered;

      const curSel = this.choiceValues()[childAttr] || [];
      const allowedSet = new Set(filtered.map((c: any) => this.choiceIdOf(c)));
      const nextSel = curSel.filter((id: number) => allowedSet.has(id));
      if (nextSel.length !== curSel.length) {
        this.choiceValues.update(m => ({ ...m, [childAttr]: nextSel }));
      }

      const v = this.visibleChoicesCount();
      const newMax = filtered.length || 0;
      const current = v?.[childAttr] || 5;
      if (current > newMax) {
        this.visibleChoicesCount.set({ ...(v || {}), [childAttr]: Math.min(current, newMax) });
      }

      if (this.childrenByParentAttr[childAttr]) {
        this.updateDependentsFor(childAttr);
      }
    });

    this.flatFields.set(fieldsCopy);
  }

  storeCategory(id: number, withGlobalLoader = true): void {
    const data = { title: this.categories()?.title, list: this.categories()?.list, id };
    localStorage.setItem(key.adsCategories, JSON.stringify(data));
    if (withGlobalLoader) this.__UtilityService.setGlobalLoading(true);
  }

  setMin(val: any): void { this.priceMin.set(val === '' || val == null ? null : Number(val)); }
  setMax(val: any): void { this.priceMax.set(val === '' || val == null ? null : Number(val)); }

  applyPrice(): void {
    const min = this.priceMin(), max = this.priceMax();
    if (min !== null && max !== null && min > max) {
      this.priceError.set(this.language() === 'ar'
        ? 'الحد الأدنى أكبر من الحد الأقصى'
        : 'Min price cannot be greater than Max price');
      return;
    }
    this.priceError.set(null);

    this.router.navigate([], {
      relativeTo: this.__ActivatedRoute,
      queryParams: { priceFrom: min ?? null, priceTo: max ?? null },
      queryParamsHandling: 'merge'
    });
  }

  onRangeChange(attr: string, part: 'start' | 'end', raw: any): void {
    const n = (raw === '' || raw == null) ? null : Number(raw);
    const num = (n !== null && !isNaN(n)) ? n : null;
    this.rangeValues.update(map => ({
      ...map, [attr]: { ...(map?.[attr] ?? { start: null, end: null }), [part]: num }
    }));
  }

  onToggleChoice(attr: string, id: number, checked: boolean): void {
    if (id === -1) return;
    this.choiceValues.update(map => {
      const cur = map?.[attr] ? [...map[attr]] : [];
      const i = cur.indexOf(id);
      if (checked && i === -1) cur.push(id);
      if (!checked && i > -1) cur.splice(i, 1);
      return { ...(map || {}), [attr]: cur };
    });

    if (this.childrenByParentAttr[attr]?.length) {
      this.updateDependentsFor(attr);
    }
  }

  onTextChange(attr: string, val: string): void {
    this.textValues.update(map => ({ ...(map || {}), [attr]: val }));
  }

  applyAllFilters(): void {
    this.isApplyingFilters.set(true);
    
    try {
      const queryParams: any = {};
      
      if (this.priceMin() !== null) {
        queryParams['priceFrom'] = this.priceMin();
      }
      if (this.priceMax() !== null) {
        queryParams['priceTo'] = this.priceMax();
      }

      setTimeout(() => {
        this.router.navigate([], {
          relativeTo: this.__ActivatedRoute,
          queryParams: queryParams,
          queryParamsHandling: 'merge'
        }).then((success) => {
          this.emitFiltersAndChips();
          this.isApplyingFilters.set(false);
        }).catch((error) => {
          console.error('Navigation error:', error);
          this.emitFiltersAndChips();
          this.isApplyingFilters.set(false);
        });
      }, 0);

    } catch (error) {
      console.error('Error in applyAllFilters:', error);
      this.emitFiltersAndChips();
      this.isApplyingFilters.set(false);
    }
  }

  setChoices(attr: string, ids: number[]): void {
    this.choiceValues.update(m => ({ ...(m || {}), [attr]: [...ids] }));
    if (this.childrenByParentAttr[attr]?.length) this.updateDependentsFor(attr);
  }

  setRange(attr: string, start: number | null, end: number | null): void {
    this.rangeValues.update(m => ({ ...(m || {}), [attr]: { start, end } }));
  }

  setText(attr: string, value: string): void {
    this.textValues.update(m => ({ ...(m || {}), [attr]: value }));
  }

  setPrice(min: number | null, max: number | null): void {
    this.priceMin.set(min);
    this.priceMax.set(max);
  }

  clearChip(chip: MobileChip): void {
    if (chip.type === 'price') { this.setPrice(null, null); return; }
    if (chip.type === 'range' && chip.attr) { this.setRange(chip.attr, null, null); return; }
    if (chip.type === 'choice' && chip.attr) { this.setChoices(chip.attr, []); return; }
    if (chip.type === 'text' && chip.attr) { this.setText(chip.attr, ''); return; }
  }

  clearChoices(attr: string): void { this.setChoices(attr, []); }

  clearAll(): void {
    this.priceMin.set(null); 
    this.priceMax.set(null);
    this.router.navigate([], {
      relativeTo: this.__ActivatedRoute,
      queryParams: { priceFrom: null, priceTo: null },
      queryParamsHandling: 'merge'
    });

    const ranges: Record<string, RangeVal> = {};
    const choices: Record<string, number[]> = {};
    const texts:   Record<string, string>   = {};
    (this.flatFields() || []).forEach((f: any) => {
      const attr = f?.attribute; if (!attr) return;
      if (this.isNumericField(f)) ranges[attr] = { start: null, end: null };
      else if (this.isListField(f)) choices[attr] = [];
      else texts[attr] = '';
    });
    this.rangeValues.set(ranges);
    this.choiceValues.set(choices);
    this.textValues.set(texts);

    Object.keys(this.childrenByParentAttr).forEach(p => this.updateDependentsFor(p));

    this.emitFiltersAndChips();
  }

  emitFiltersAndChips(): void {
    try {
      const payload: any[] = [];
      const chips: MobileChip[] = [];
      const ranges = this.rangeValues();
      const choices = this.choiceValues();
      const texts = this.textValues();

      if (this.priceMin() !== null || this.priceMax() !== null) {
        const lbl = this.language() === 'ar'
          ? `السعر: ${this.priceMin() ?? '—'} - ${this.priceMax() ?? '—'}`
          : `Price: ${this.priceMin() ?? '—'} - ${this.priceMax() ?? '—'}`;
        chips.push({ key: 'price', type: 'price', label: lbl, range: { start: this.priceMin(), end: this.priceMax() } });
      }

      (this.flatFields() || []).forEach(f => {
        const id = f?.id; const attr = f?.attribute;
        if (!attr || !id) return;
        const name = this.language() === 'ar' ? (f?.name ?? '') : (f?.name_L1 ?? f?.name ?? '');

        if (this.isNumericField(f)) {
          const rv = ranges?.[attr];
          const hasStart = typeof rv?.start === 'number';
          const hasEnd   = typeof rv?.end   === 'number';

          if (hasStart && hasEnd) {
            payload.push({
              flatFieldId: id, isChoise: false, choises: [],
              isRange: true, rangeStart: rv!.start, rangeEnd: rv!.end,
              isValue: false, value: null
            });
            chips.push({
              key: `range:${id}`, type: 'range', fieldId: id, attr,
              label: `${name}: ${rv!.start} - ${rv!.end}`,
              range: { start: rv!.start, end: rv!.end },
              displayName: name
            });
          }
        } else if (this.isListField(f)) {
          const arr = (choices?.[attr] || []).filter((v: any) => typeof v === 'number' && !isNaN(v));
          const options: Option[] = this.getChoicesFor(f)
            .map((c: any) => ({ id: this.choiceIdOf(c), label: this.labelOf(c) }))
            .filter((o: Option) => o.id !== -1);

          if (arr.length > 0) {
            payload.push({
              flatFieldId: id, isChoise: true, choises: arr,
              isRange: false, rangeStart: 0, rangeEnd: 0,
              isValue: false, value: null
            });

            const selectedLabels = arr
              .map(cid => options.find(o => o.id === cid)?.label)
              .filter(Boolean) as string[];

            const label =
              selectedLabels.length <= 2
                ? `${name}: ${selectedLabels.join(', ')}`
                : `${name}: ${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;

            chips.push({
              key: `choice:${id}`, type: 'choice', fieldId: id, attr,
              label, options, selectedIds: arr, displayName: name
            });
          }
        } else {
          const txt = (texts?.[attr] ?? '').toString().trim();
          if (txt) {
            payload.push({
              flatFieldId: id, isChoise: false, choises: [],
              isRange: false, rangeStart: 0, rangeEnd: 0,
              isValue: true, value: txt
            });
            chips.push({
              key: `text:${id}`, type: 'text', fieldId: id, attr,
              label: `${name}: ${txt}`, text: txt, displayName: name
            });
          }
        }
      });

      this.filtersChange.emit(payload);
      this.chipsChange.emit(chips);
      
    } catch (error) {
      console.error('Error emitting filters:', error);
    } finally {
      setTimeout(() => {
        this.isApplyingFilters.set(false);
      }, 100);
    }
  }

  private loadCities(): void {
    this.citiesLoading.set(true);
    this.__HomeService.getCountries().subscribe({
      next: (res: any) => {
        const citiesRaw: any[] = Array.isArray(res?.data?.[0]?.cities) ? res.data[0].cities : [];
        const norm: CityLite[] = citiesRaw.map((x: any) => ({
          id: String(x?.id ?? ''),
          nameAr: x?.nameAr ?? x?.arabicName ?? x?.name ?? '',
          nameEn: x?.nameEn ?? x?.englishName ?? x?.name_L1 ?? x?.title ?? x?.name ?? ''
        })).filter((c: CityLite) => !!c.id);
        norm.sort((a, b) => (a.nameAr || a.nameEn).localeCompare(b.nameAr || b.nameEn, 'ar'));
        this.cities.set(norm);
        this.citiesLoading.set(false);
      },
      error: () => { this.cities.set([]); this.citiesLoading.set(false); }
    });
  }

  private hydrateSelectedCityId(): void {
    const qp = this.__ActivatedRoute.snapshot.queryParamMap;
    const raw = qp.get('cityId') ?? qp.get('CityId');
    const val = raw && raw !== '' ? raw : null;
    this.selectedCityId.set(val);
    this.cityChange.emit(val);
  }

  onSelectCity(cityId: string | null): void {
    this.selectedCityId.set(cityId);
    this.router.navigate([], {
      relativeTo: this.__ActivatedRoute,
      queryParams: { cityId: cityId ?? null },
      queryParamsHandling: 'merge'
    });
    this.cityChange.emit(cityId);
    this.emitFiltersAndChips();
  }

  clearCity(): void { this.onSelectCity(null); }
}