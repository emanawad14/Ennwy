import { Component, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { LanguageService } from '../../../services/generic/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownComponent } from './dynamic-fields/dropdown/dropdown.component';
import { HomeService } from '../../../services/home.service';
import { AlertService } from '../../../services/alert.service';
import { UploadFileService } from '../../../services/upload-file.service';
import { CommonModule } from '@angular/common';
import { key } from '../../../core/config/localStorage';
import { AdService } from '../../../services/ad.service';
import { DynamicFieldsComponent } from './dynamic-fields/dynamic-fields.component';
import { UtilityService } from '../../../services/generic/utility.service';

@Component({
  selector: 'app-sell-ad',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicFieldsComponent,
    DropdownComponent,
    CommonModule
  ],
  templateUrl: './sell-ad.component.html',
  styleUrl: './sell-ad.component.scss'
})
export class SellAdComponent implements OnInit {
  language = signal<string>('en');
  userInfo: any;

  category = signal<any>({});
  isLoading = signal<boolean>(false);
  isLoadingFields = signal<boolean>(false);
  flatFields = signal<any[]>([]);
  cities = signal<any[]>([]);
  photos = signal<any[]>([]);
  adsFlatFieldsData = signal<any[]>([]);
  uploadedImgs = signal<any[]>([]);

  draggedIndex: number | null = null;

  adForm!: FormGroup;

  private readonly MAX_FILE_MB = 5;
  private readonly MAX_TOTAL_MB = 20;
  private readonly ALLOWED_TYPES = ['image/png', 'image/jpeg'];

  constructor(
    private readonly __LanguageService: LanguageService,
    private readonly __ActivatedRoute: ActivatedRoute,
    private readonly __homeService: HomeService,
    private readonly __AdService: AdService,
    private readonly uploadservice: UploadFileService,
    public readonly alertservice: AlertService,
    private readonly fb: FormBuilder,
    private readonly __Router: Router,
    private readonly __UtilityService: UtilityService
  ) {
    this.adForm = fb.group(
      {
        condition: [''],
        type: [''],
        title: ['', [Validators.required, Validators.minLength(5)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
        location: ['', [Validators.required]],
        price: [''],
        priceInUSD: [''],
        negotiable: [''],
        exchange: [''],
        free: [''],
        name: ['', [Validators.required]],
        phone: ['', [Validators.required]],
        // contact أزيل من الواجهة، ولن نستخدمه
      },
      { validators: [this.requireAnyPrice()] }
    );
  }

  ngOnInit(): void {
    this.getCategory();
    this.getUserInfo();
    this.getCountries();

    this.__ActivatedRoute.params.subscribe((param: any) => {
      const id = param.id;
      this.getFlatFieldsByCategoryId(id);
    });

    this.adForm.get('price')?.valueChanges.subscribe(() => this.adForm.updateValueAndValidity({ emitEvent: false }));
    this.adForm.get('priceInUSD')?.valueChanges.subscribe(() => this.adForm.updateValueAndValidity({ emitEvent: false }));
  }

  get formControls(): any {
    return this.adForm?.controls;
  }

  getUserInfo(): void {
    const user = localStorage.getItem(key.userInfo);
    if (user) {
      this.userInfo = JSON.parse(user);
    }
  }

  getCategory(): void {
    const category = localStorage.getItem(key.selectedCategory);
    if (category) {
      this.category.set(JSON.parse(category));
    }
  }

  private bytesToMB(bytes: number): number {
    return bytes / (1024 * 1024);
  }

  private currentTotalSizeMB(): number {
    return this.uploadedImgs().reduce((sum, img: any) => {
      const size = img?.file?.size ?? 0;
      return sum + this.bytesToMB(size);
    }, 0);
  }

  private sanitizeNumberInput(raw: any): string {
    return String(raw ?? '')
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');
  }

  onPriceInput(key: 'price' | 'priceInUSD'): void {
    const ctl = this.adForm.get(key);
    if (!ctl) return;
    const sanitized = this.sanitizeNumberInput(ctl.value);
    if (sanitized !== ctl.value) ctl.setValue(sanitized, { emitEvent: false });
    this.adForm.updateValueAndValidity({ emitEvent: false });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    const errors: string[] = [];
    const nextImgs = [...this.uploadedImgs()];
    let addedCount = 0;

    let totalMB = this.currentTotalSizeMB();

    for (const file of files) {
      const typeOk = this.ALLOWED_TYPES.includes(file.type);
      const fileMB = this.bytesToMB(file.size);
      const perFileOk = fileMB <= this.MAX_FILE_MB;

      if (!typeOk) {
        errors.push(`الملف "${file.name}" غير مسموح. المسموح: PNG, JPG, JPEG.`);
        continue;
      }
      if (!perFileOk) {
        errors.push(`الملف "${file.name}" يتجاوز ${this.MAX_FILE_MB}MB.`);
        continue;
      }

      if (totalMB + fileMB > this.MAX_TOTAL_MB) {
        errors.push(`لا يمكن إضافة "${file.name}" لأن إجمالي حجم الصور سيتجاوز ${this.MAX_TOTAL_MB}MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        nextImgs.push({ file, base64Image: reader.result as string, name: file.name });
        addedCount++;
        if (addedCount === files.filter(f => this.ALLOWED_TYPES.includes(f.type) && this.bytesToMB(f.size) <= this.MAX_FILE_MB).length) {
          this.uploadedImgs.set(nextImgs);
          this.photos.set(nextImgs);
        }
      };
      reader.readAsDataURL(file);

      totalMB += fileMB;
    }

    if (errors.length) {
      this.alertservice.errorMessage(errors.join('\n'));
    }

    input.value = '';
  }

  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex = index;
  }

  onDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === index) return;

    const draggedItem = this.uploadedImgs()[this.draggedIndex];
    const updated = [...this.uploadedImgs()];
    updated.splice(this.draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    this.uploadedImgs.set(updated);
    this.photos.set(updated);
    this.draggedIndex = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  removeImage(index: number): void {
    const updated = [...this.uploadedImgs()];
    updated.splice(index, 1);
    this.uploadedImgs.set(updated);
    this.photos.set(updated);
  }

  async uploadImagesAfterAd(): Promise<string[] | null> {
    if (!this.photos() || this.photos().length === 0) return null;

    const uploadPromises = this.photos().map((img: any) => {
      const formData = new FormData();
      formData.append('file', img.file);
      formData.append('AddSignature', 'true');
      return this.uploadservice.uploadFile(formData).toPromise();
    });

    try {
      const responses = await Promise.all(uploadPromises);
      return responses.map(res => res?.data).filter((id: string) => !!id);
    } catch (error: any) {
      console.error('فشل رفع الصور:', error);
      this.alertservice.errorMessage('فشل رفع الصور: ' + (error?.error?.errorMessage || error.message || ''));
      return null;
    }
  }

  changeLocation(e: any): void {
    this.adForm.get('location')?.setValue(e);
  }

  getFlatFieldsByCategoryId(id: number): void {
    this.isLoadingFields.set(true);
    this.__AdService.getFlatFieldsByCategoryId(id).subscribe({
      next: (res: any) => {
        const fields = res?.data.map((f: any) => ({
          ...f,
          attribute: `attr_${f.id}`,
          inputType: (f.valueType === 'float' || f.valueType === 'integer') &&
                     (!f.choices || f.choices.length === 0) ? 'range' : 'input',
          minValue: f.minValue ?? 0,
          maxValue: f.maxValue ?? 100,
          isDependent: f.isDependent,
          dependentId: f.dependentId,
          choices: f.choices || [],
          filteredChoices: f.choices ? [...f.choices] : [],
          // (19) enum_multiple يسمح بتعدد الاختيارات
          allowMultiple: String(f.valueType || '').toLowerCase() === 'enum_multiple'
        }));

        fields.forEach((field: any) => {
          if (field.isDependent && field.dependentId) {
            const parentControlName = `attr_${field.dependentId}`;
            const childControlName = `attr_${field.id}`;

            const parentField = fields.find((pf: any) => pf.id === field.dependentId);
            if (parentField) {
              const parentAttr = this.adForm.get(parentControlName);
              parentAttr?.valueChanges.subscribe((parentValue: string) => {
                const filteredChoices = field.choices.filter(
                  (choice: any) => choice.parentId?.toString() === parentValue?.toString()
                );
                field.filteredChoices = filteredChoices;
                this.adForm.get(childControlName)?.setValue('');
              });
            }

            const parentValue = this.adForm.get(parentControlName)?.value;
            field.filteredChoices = field.choices.filter(
              (choice: any) => choice.parentId?.toString() === parentValue?.toString()
            );
          }
        });

        this.flatFields.set(fields);
        this.isLoadingFields.set(false);
      },
      error: () => {
        this.isLoadingFields.set(false);
      }
    });
  }

  clearValidationErrors(control: AbstractControl): void {
    control.markAsPending();
  }

  getCountries(): void {
    this.isLoading.set(true);
    this.__homeService.getCountries().subscribe({
      next: (res: any) => {
        this.cities.set(res?.data[0]?.cities);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private requireAnyPrice() {
    return (group: FormGroup): ValidationErrors | null => {
      const liraRaw = String(group.get('price')?.value ?? '').trim();
      const usdRaw  = String(group.get('priceInUSD')?.value ?? '').trim();

      const lira = parseFloat(this.sanitizeNumberInput(liraRaw)) || 0;
      const usd  = parseFloat(this.sanitizeNumberInput(usdRaw)) || 0;

      if ((isNaN(lira) || lira <= 0) && (isNaN(usd) || usd <= 0)) {
        return { priceRequired: true };
      }
      return null;
    };
  }

  private preSubmitValidate(): boolean {
    const formValue = this.adForm.value;

    if (!formValue.title || !formValue.description) {
      this.alertservice.errorMessage('الرجاء إدخال العنوان والوصف.');
      this.adForm.markAllAsTouched();
      return false;
    }

    if (this.adForm.errors?.['priceRequired']) {
      this.alertservice.errorMessage('الرجاء إدخال السعر.');
      return false;
    }

    if (!formValue.location || !formValue.location.id) {
      this.alertservice.errorMessage('يرجى اختيار المدينة.');
      return false;
    }

    if (!this.photos() || this.photos().length === 0) {
      this.alertservice.errorMessage('الصور مطلوبة. الرجاء رفع صورة واحدة على الأقل.');
      return false;
    }

    const tooBig = this.photos().find((x: any) => this.bytesToMB(x?.file?.size ?? 0) > this.MAX_FILE_MB);
    if (tooBig) {
      this.alertservice.errorMessage(`يوجد صورة تتجاوز ${this.MAX_FILE_MB}MB.`);
      return false;
    }

    const totalMB = this.currentTotalSizeMB();
    if (totalMB > this.MAX_TOTAL_MB) {
      this.alertservice.errorMessage(`إجمالي حجم الصور يتجاوز ${this.MAX_TOTAL_MB}MB.`);
      return false;
    }

    const badType = this.photos().find((x: any) => !this.ALLOWED_TYPES.includes(x?.file?.type));
    if (badType) {
      this.alertservice.errorMessage('نوع صورة غير مسموح. المسموح فقط: PNG, JPG, JPEG.');
      return false;
    }

    return true;
  }

  async postAd(): Promise<void> {
    this.__UtilityService.setGlobalLoading(true);
    this.isLoading.set(true);

    try {
      if (!this.preSubmitValidate()) {
        this.isLoading.set(false);
        this.__UtilityService.setGlobalLoading(false);
        return;
      }

      const priceStr = this.sanitizeNumberInput(this.adForm.value.price);
      const priceUsdStr = this.sanitizeNumberInput(this.adForm.value.priceInUSD);

      const price = priceStr ? parseFloat(priceStr) : 0;
      const priceInUSD = priceUsdStr ? parseFloat(priceUsdStr) : 0;

      const uploaded = await this.uploadImagesAfterAd();
      if (!uploaded || uploaded.length === 0) {
        this.alertservice.errorMessage('فشل رفع الصور. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
        this.__UtilityService.setGlobalLoading(false);
        return;
      }
      const photoIds = uploaded.map((id: string) => ({ photoId: id }));

      // (17) تنظيف الحقول الديناميكية: تجاهل القيم الصفرية
      const rawFields = this.adsFlatFieldsData() || [];
      const cleanedFields = (rawFields as any[]).map(f => {
        const copy = { ...f };
        if (copy.isRange) {
          const s = Number(copy.rangeStart ?? 0);
          const e = Number(copy.rangeEnd ?? 0);
          copy.rangeStart = s > 0 ? s : null;
          copy.rangeEnd   = e > 0 ? e : null;
        }
        if (copy.isValue) {
          // لو القيمة رقمية 0 -> null، لو نص "0" -> null
          const asNumber = Number(copy.value);
          if (!isNaN(asNumber)) {
            copy.value = asNumber > 0 ? asNumber : null;
          } else if (typeof copy.value === 'string' && copy.value.trim() === '0') {
            copy.value = null;
          }
        }
        return copy;
      }).filter(f =>
        (f.isChoise && Array.isArray(f.choises)) ||
        (f.isRange && (f.rangeStart != null || f.rangeEnd != null)) ||
        (f.isValue && f.value != null && f.value !== '')
      );

      const formValue = this.adForm.value;

      const adModel = {
        price: price,
        priceInUSD: priceInUSD,
        title: formValue.title,
        description: formValue.description,
        description_L1: formValue.description,
        longitude: '0.0',
        latitude: '0.0',
        categoryId: this.category().categoryId,
        userId: this.userInfo?.id,
        userDisplayName: this.userInfo?.fullName || '',
        phoneNumber: this.userInfo?.phoneNumber || '',
        contactMethod: 2, // (18) إجبارية: إرسال "دردشة" دائمًا
        photos: photoIds,
        adsFlatFields: cleanedFields,
        cityId: formValue.location.id
      };

      this.__AdService.adAd(adModel).subscribe({
        next: () => {
          this.alertservice.successMessage('تم إنشاء الإعلان ورفع الصور بنجاح.');
          this.adForm.reset();
          this.photos.set([]);
          this.uploadedImgs.set([]);
          this.__Router.navigate(['/profile-ads']);
          this.isLoading.set(false);
          this.__UtilityService.setGlobalLoading(false);
        },
        error: (err: any) => {
          console.error('فشل في إرسال الإعلان:', err);
          this.alertservice.errorMessage('حدث خطأ أثناء إرسال الإعلان.');
          this.isLoading.set(false);
          this.__UtilityService.setGlobalLoading(false);
        }
      });
    } catch (err: any) {
      console.error('Unexpected error:', err);
      this.alertservice.errorMessage('حدث خطأ أثناء تنفيذ العملية: ' + err.message);
      this.isLoading.set(false);
      this.__UtilityService.setGlobalLoading(false);
    } finally {
      if (this.isLoading()) {
        this.isLoading.set(false);
        this.__UtilityService.setGlobalLoading(false);
      }
    }
  }
  clearAllImages(): void {
  // لو مفيش صور خلاص
  if (!this.uploadedImgs()?.length && !this.photos()?.length) {
    this.alertservice.errorMessage('لا توجد صور لِإزالتها.');
    return;
  }

  // تأكيد بسيط (اختياري)
  const ok = confirm('هل تريد حذف كل الصور المرفوعة والبدء من جديد؟');
  if (!ok) return;

  // فضّي كل الحالات المرتبطة بالصور
  this.uploadedImgs.set([]);
  this.photos.set([]);
  this.draggedIndex = null;

  // فضّي قيمة input=file (علشان يسمح تاني برفع نفس الملفات لو حبيت)
  const fileEl = document.getElementById('upload') as HTMLInputElement | null;
  if (fileEl) fileEl.value = '';

  // رسالة نجاح بسيطة
  this.alertservice.successMessage('تم حذف كل الصور. يمكنك رفع صور جديدة الآن.');
}

}
