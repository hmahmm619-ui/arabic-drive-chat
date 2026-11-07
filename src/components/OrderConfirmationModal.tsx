import React from 'react';
import { CompletedOrder } from '../types';
import { CheckCircle2, Phone, MessageSquare, Printer, MapPin, Clock, ArrowRight } from 'lucide-react';

interface OrderConfirmationModalProps {
  order: CompletedOrder;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Success Header Banner */}
        <div className="bg-linear-to-b from-[#b3141c] via-[#d8212a] to-[#990f16] text-white p-6 sm:p-7 text-center relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-3 border border-white/40 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-bold">
            تم استلام وتأكيد طلبك بنجاح ✅
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-2">شكراً لطلبك من دلمون الكويت للدواجن</h2>
          <p className="text-xs text-red-100 mt-1">
            رقم الطلب المعتمد:{' '}
            <span className="font-mono font-bold text-white tracking-wider text-sm">
              #{order.orderId}
            </span>
          </p>
        </div>

        {/* Invoice Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Status Tracker */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-emerald-700" />
              <div>
                <div className="font-extrabold text-gray-900 text-xs">موعد التوصيل المتوقع:</div>
                <div className="text-[11px] text-emerald-800">خلال 40 إلى 60 دقيقة في سيارة نقل مبردة</div>
              </div>
            </div>
            <span className="text-xs font-black bg-emerald-700 text-white px-2.5 py-1 rounded-lg">
              {order.status}
            </span>
          </div>

          {/* Delivery & Customer Info */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
            <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5 border-b border-gray-200 pb-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>تفاصيل المستلم والتوصيل (دولة الكويت)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <span className="text-gray-400 block text-[10px]">الاسم:</span>
                <span className="font-bold text-gray-900">{order.customer.name}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">رقم الهاتف:</span>
                <span className="font-bold text-gray-900" dir="ltr">+965 {order.customer.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 block text-[10px]">العنوان:</span>
                <span className="font-bold text-gray-900">
                  {order.customer.governorate} — {order.customer.street}
                </span>
              </div>
              {order.customer.notes && (
                <div className="col-span-2 text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px]">
                  <strong>ملاحظة للطلب:</strong> {order.customer.notes}
                </div>
              )}
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 text-xs flex justify-between">
              <span>المنتج / الذبيحة</span>
              <span>السعر الإجمالي</span>
            </div>
            <div className="divide-y divide-gray-100 p-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-2 flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{item.product.name}</span>
                    {item.selectedWeight && (
                      <span className="text-gray-500 mr-1">({item.selectedWeight})</span>
                    )}
                    <span className="text-gray-400 mr-1.5">(× {item.qty})</span>
                    {item.customization && (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {item.customization.condition} • تقطيع: {item.customization.cuttingType}
                        {item.customization.homeSlaughter === 'نعم' && ' • ذبح منزلي'}
                      </div>
                    )}
                  </div>
                  <span className="font-extrabold text-[#173e32]">
                    {((item.price || item.product.price) * item.qty).toFixed(3)} د.ك
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Total Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>قيمة المنتجات:</span>
              <span className="font-bold">{order.subtotal.toFixed(3)} د.ك</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>رسوم التوصيل المبرد:</span>
              <span className="text-emerald-700 font-bold">مجاناً (0.000 د.ك)</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold pt-1.5 border-t border-gray-200">
              <span>المبلغ المدفوع إلكترونياً (كي نت — KNET):</span>
              <span className="text-sm font-extrabold">{order.depositPaid.toFixed(3)} د.ك</span>
            </div>
            {order.remainingDue > 0 && (
              <div className="flex justify-between text-amber-900 font-bold">
                <span>المتبقي للدفع عند الاستلام:</span>
                <span className="text-sm font-black">{order.remainingDue.toFixed(3)} د.ك</span>
              </div>
            )}
            <div className="text-[10px] text-gray-400 pt-1">
              وسيلة الدفع: {order.paymentMethod} (بطاقة تنتهي بـ {order.cardLast4 || '****'})
            </div>
          </div>

          {/* Contact Support Hotline */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-blue-900">هل تحتاج مساعدة أو تعديل على الطلب؟</div>
              <div className="text-blue-700 text-[11px]">فريق خدمة عملاء دلمون الكويت متاح دائماً</div>
            </div>
            <div className="flex gap-2">
              <a
                href="https://wa.me/96522208282"
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl flex items-center gap-1 font-bold text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" /> واتساب
              </a>
              <a
                href="tel:+96522208282"
                className="bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-xl flex items-center gap-1 font-bold text-xs"
              >
                <Phone className="w-3.5 h-3.5" /> اتصال
              </a>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 border border-gray-300 bg-white hover:bg-gray-100 rounded-xl font-bold text-xs text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> طباعة الإيصال
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#d8212a] hover:bg-[#b8141d] text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>العودة للمتجر الرئيسي</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

      </div>
    </div>
  );
};
