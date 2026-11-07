export interface WeightOption {
  weight: string;
  price: number;
  priceFormatted: string;
}

export interface Product {
  id: string;
  name: string;
  desc: string;
  baseWeight: string; // e.g. "600 جم" or "500 جم"
  price: number; // base price in KWD
  priceFormatted: string;
  img: string;
  category: 
    | 'whole-chicken'
    | 'cuts-fillet'
    | 'wings-legs'
    | 'marinated'
    | 'giblets'
    | 'special-free-range'
    | 'special-deals'
    | 'livestock';
  categoryLabel: string;
  isAvailable: boolean; // false for "نفد المخزون"
  isOffer?: boolean;
  isNew?: boolean;
  weights: WeightOption[];
  unit?: string;
  badge?: string;
  isLivestock?: boolean;
  rating?: number;
  reviewsCount?: number;
}

export interface SheepCustomization {
  condition: 'حي' | 'مذبوح';
  homeSlaughter: 'نعم' | 'لا';
  cuttingType: 'مفصل' | 'ثلاجة' | 'أرباع' | 'أنصاف' | 'شواء' | 'مفروم' | 'قطع صغيرة';
  packaging: 'أطباق مفرغة الهواء' | 'أكياس حفظ طازجة' | 'عادي';
  includeHeadAndTrotters: boolean;
  includeOffal: boolean;
  removeExcessFat: boolean;
  specialNotes?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedWeight: string;
  price: number;
  qty: number;
  customization?: SheepCustomization;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  governorate: string;
  street: string;
  building: string;
  notes?: string;
  area?: string;
  address?: string;
  paymentOption: 'full' | 'partial';
  paymentMethod: 'knet' | 'benefit' | 'visa' | 'mastercard' | 'cod';
}

export interface CompletedOrder {
  orderId: string;
  date: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  depositPaid: number;
  remainingDue: number;
  total: number;
  paymentMethod: string;
  cardLast4?: string;
  cardBank?: string;
  status: 'تم الاستلام' | 'قيد التجهيز' | 'جاري التوصيل' | string;
}
