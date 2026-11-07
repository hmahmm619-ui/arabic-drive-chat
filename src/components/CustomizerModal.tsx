import React, { useState } from 'react';
import { Product, SheepCustomization } from '../types';
import { X, Check, Scissors, Home, Shield, Sparkles } from 'lucide-react';

interface CustomizerModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, customization: SheepCustomization, qty: number) => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState<'حي' | 'مذبوح'>('مذبوح');
  const [homeSlaughter, setHomeSlaughter] = useState<'نعم' | 'لا'>('لا');
  const [cuttingType, setCuttingType] = useState<SheepCustomization['cuttingType']>('ثلاجة');
  const [packaging, setPackaging] = useState<SheepCustomization['packaging']>('أكياس حفظ طازجة');
  const [includeHeadAndTrotters, setIncludeHeadAndTrotters] = useState(true);
  const [includeOffal, setIncludeOffal] = useState(true);
  const [removeExcessFat, setRemoveExcessFat] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const customization: SheepCustomization = {
      condition,
      homeSlaughter,
      cuttingType,
      packaging,
      includeHeadAndTrotters,
      includeOffal,
      removeExcessFat,
      specialNotes
    };
    onConfirm(product, customization, qty);
    onClose();
  };

  const totalPrice = (product.price * qty).toFixed(3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-emerald-200 shrink-0">
              <img
                src={product.img}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/photo_5895582972092551142_w_745e482e.jpg';
                }}
              />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">{product.name}</h3>
              <p className="text-xs text-emerald-700 font-semibold">
                السعر: {product.priceFormatted} د.ك / {product.unit || 'حبة'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Options */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          
          {/* Sheep Condition */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-gray-900 flex items-center gap-1.5">
                <span>حالة الخروف / الذبيحة</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-500">اختر حالة الاستلام</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCondition('مذبوح')}
                className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                  condition === 'مذبوح'
                    ? 'border-[#173e32] bg-emerald-50/70 text-[#173e32] ring-2 ring-[#173e32]/20 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold">مذبوح طازج</span>
                  {condition === 'مذبوح' && <Check className="w-4 h-4 text-emerald-700" />}
                </div>
                <span className="text-[11px] text-gray-500 font-normal">
                  صافي لحم من 15 إلى 18 كجم
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('حي')}
                className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                  condition === 'حي'
                    ? 'border-[#173e32] bg-emerald-50/70 text-[#173e32] ring-2 ring-[#173e32]/20 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold">حي (بدون ذبح)</span>
                  {condition === 'حي' && <Check className="w-4 h-4 text-emerald-700" />}
                </div>
                <span className="text-[11px] text-gray-500 font-normal">
                  توصيل الخروف حياً بسيارة مخصصة
                </span>
              </button>
            </div>
          </div>

          {/* Home Slaughter Option */}
          {condition === 'مذبوح' && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-amber-800" />
                  <span>الذبح في منزل صاحب الطلب</span>
                </label>
                <span className="text-[11px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                  خدمة اختيارية مجانية
                </span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                هل ترغب بحضور القصاب المعتمد لذبح الخروف مباشرة أمامك في فناء منزلك؟
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setHomeSlaughter('نعم')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    homeSlaughter === 'نعم'
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-100/50'
                  }`}
                >
                  نعم، أرغب بالذبح في منزلي
                </button>
                <button
                  type="button"
                  onClick={() => setHomeSlaughter('لا')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    homeSlaughter === 'لا'
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-100/50'
                  }`}
                >
                  لا، ذبح في المسلخ المعتمد
                </button>
              </div>
            </div>
          )}

          {/* Cutting Type */}
          {condition === 'مذبوح' && (
            <div>
              <label className="font-bold text-gray-900 flex items-center gap-1.5 mb-2">
                <Scissors className="w-4 h-4 text-emerald-700" />
                <span>طريقة التقطيع المرغوبة</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'ثلاجة', label: 'تقطيع ثلاجة', desc: 'قطع متوسطة مناسبة' },
                  { id: 'مفصل', label: 'تفصيل مفاصل', desc: 'على المفاصل الطبيعية' },
                  { id: 'أرباع', label: '4 أرباع كاملة', desc: 'مناسب للتخزين' },
                  { id: 'أنصاف', label: 'أنصاف (نصفين)', desc: 'للولائم والمناسبات' },
                  { id: 'شواء', label: 'تقطيع شواء', desc: 'ريش وقطع مشاوي' },
                  { id: 'قطع صغيرة', label: 'قطع صغيرة', desc: 'للإيدامات والكبسات' },
                ].map((cut) => (
                  <button
                    key={cut.id}
                    type="button"
                    onClick={() => setCuttingType(cut.id as any)}
                    className={`p-2.5 rounded-xl border text-right transition ${
                      cuttingType === cut.id
                        ? 'border-[#173e32] bg-emerald-50 text-[#173e32] font-bold ring-1 ring-[#173e32]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{cut.label}</div>
                    <div className="text-[10px] text-gray-500 font-normal">{cut.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Packaging Type */}
          {condition === 'مذبوح' && (
            <div>
              <label className="font-bold text-gray-900 block mb-2">نوع التغليف</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'أكياس حفظ طازجة',
                  'أطباق مفرغة الهواء',
                  'عادي'
                ].map((pack) => (
                  <button
                    key={pack}
                    type="button"
                    onClick={() => setPackaging(pack as any)}
                    className={`py-2 px-2.5 rounded-xl border text-center text-xs transition font-semibold ${
                      packaging === pack
                        ? 'border-[#173e32] bg-emerald-50 text-[#173e32] font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pack}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra Addons (Head, Trotters, Offal) */}
          {condition === 'مذبوح' && (
            <div className="border border-gray-100 rounded-xl p-3.5 space-y-2.5 bg-gray-50/50">
              <span className="text-xs font-bold text-gray-800 block">الملحقات المجانية والخيارات:</span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeHeadAndTrotters}
                  onChange={(e) => setIncludeHeadAndTrotters(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600 h-4 w-4 accent-[#173e32]"
                />
                <span className="text-xs text-gray-700">تضمين الرأس والكراعين (منظفة ومسلوقة)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeOffal}
                  onChange={(e) => setIncludeOffal(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600 h-4 w-4 accent-[#173e32]"
                />
                <span className="text-xs text-gray-700">تضمين الكبدة، القلب والأحشاء طازجة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={removeExcessFat}
                  onChange={(e) => setRemoveExcessFat(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600 h-4 w-4 accent-[#173e32]"
                />
                <span className="text-xs text-gray-700">إزالة الشحم والدهون الزائدة قدر الإمكان</span>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="font-bold text-gray-800 block text-xs mb-1.5">
              ملاحظات وتوصيات خاصة للقصاب (اختياري)
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="مثال: يرجى تقسيم اللحم على 4 أكياس، عزل لحم المفروم على جنب..."
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none min-h-[60px]"
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="font-bold text-gray-900 text-sm">الكمية المطلوبة:</span>
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-1.5">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-7 h-7 rounded-lg bg-white shadow-xs font-bold text-emerald-900 flex items-center justify-center hover:bg-gray-200"
              >
                -
              </button>
              <span className="font-extrabold text-base w-6 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="w-7 h-7 rounded-lg bg-white shadow-xs font-bold text-emerald-900 flex items-center justify-center hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-gray-500 font-medium">الإجمالي لهذا المنتج:</div>
            <div className="text-lg font-black text-[#173e32]">{totalPrice} د.ك</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold text-xs hover:bg-gray-100 transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 bg-[#173e32] hover:bg-[#102c23] text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> تأكيد وإضافة للسلة
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
