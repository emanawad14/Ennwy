// ====== IAdDetails (مطابق للـ API الجديد) ======
export interface IAdDetails {
  id: number;
  adsNumber: string;
  activStatus: boolean;
  purpose: string; // "for-sale" | "for-rent" ...
  price: number;
  priceInUSD: number;
  title: string;
  title_L1: string;
  description: string;
  description_L1: string;
  slug?: string | null;
  slug_L1?: string | null;
  keywords?: string | null;

  // تواريخ وموقع
  locationName?: string;
  locationName_L1?: string;
  created?: string;
  approvedDateTime: string;
  longitude: string;
  latitude: string;

  // الاتصال والحالة
  contactMethod: number;
  isFavorite: boolean;
  isNegotiable: boolean;
  advertisementStatus: number;
  addressDetails?: string | null;
  cityId?: string | null;
  districtId?: number | null;
  rating: number;
  sold: boolean;

  // ✅ صور كسلسلة روابط
  photos: string[];

  // ✅ حقول الخصائص
  flatFields: IFlatField[];

  // ✅ بيانات المعلن جاية على مستوى الإعلان
  userDisplayName: string;
  userPhoto: string;        // قد يكون Base URL أو URL كامل
  userId: string;
  userCreateData: string;

  // بعض الـ APIs قد ترجع رقم هاتف على مستوى الإعلان
  phoneNumber?: string;
}

export interface IFlatField {
  flatFieldId: number;
  name: string;
  name_L1?: string | null;
  attribute: string;
  valueString?: string;
  valueNumber?: number;
  choiceName?: string | null;
  choiceName_L1?: string | null;
  valueType: 'enum' | 'enum_multiple' | 'string' | 'integer' | 'float' | string;
}

// ====== IUser (للاستخدام داخل كارت المالك فقط) ======
export interface IUser {
  id: string;               // userId من الإعلان
  fullName: string;         // userDisplayName
  createDate: string;       // userCreateData
  userImageUrl: string;     // userPhoto
  phoneNumber?: string;     // يرجع من LogContact أو الإعلان
}
