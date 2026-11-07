import React, { useState } from 'react';
import { Product, WeightOption } from '../types';
import { X, Check, ShoppingBag, Plus, Minus, Scale } from 'lucide-react';

interface WeightModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedWeight: string, price: number, qty: number) => void;
  onBuyNow?: (product: Product, selectedWeight: string, price: number, qty: number) => void;
}

export const WeightModal: React.FC<WeightModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow
}) => {
  const [selectedOption, setSelectedOption] = useState<WeightOption>(
    () => product.weights[0] || { weight: product.baseWeight, price: product.price, priceFormatted: product.priceFormatted }
  );
  const [qty, setQty] = useState(1);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onAddToCart(product, selectedOption.weight, selectedOption.price, qty);
    onClose();
  };

  const handleBuyNowClick = () => {
    if (onBuyNow) {
      onBuyNow(product, selectedOption.weight, selectedOption.price, qty);
    } else {
      onAddToCart(product, selectedOption.weight, selectedOption.price, qty);
    }
    onClose();
  };

  const totalPrice = (selectedOption.price * qty).toFixed(3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-150 flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800 font-extrabold text-sm">
            <Scale className="w-4 h-4 text-[#c8102e]" />
            <span>تحديد الوزن والكمية</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-right">
          
          {/* Product Preview */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center shrink-0">
              <img
                src={product.img}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">{product.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.desc}</p>
              <div className="text-sm font-black text-[#c8102e] mt-1">
                {selectedOption.priceFormatted} د.ك
              </div>
            </div>
          </div>

          {/* Weight Options List */}
          <div>
            <label className="block text-xs font-black text-gray-800 mb-2">
              اختر الوزن المطلوب:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {product.weights.map((opt) => (
                <button
                  key={opt.weight}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                    selectedOption.weight === opt.weight
                      ? 'border-[#c8102e] bg-red-50/60 text-[#c8102e] ring-2 ring-[#c8102e]/20 font-black'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{opt.weight}</span>
                    {selectedOption.weight === opt.weight && (
                      <Check className="w-3.5 h-3.5 text-[#c8102e]" />
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold mt-1 text-[#c8102e]">
                    {opt.priceFormatted} د.ك
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Counter */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs font-extrabold text-gray-800">الكمية:</span>
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-1 border border-gray-200">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-7 h-7 rounded-lg bg-white shadow-xs font-bold text-gray-700 flex items-center justify-center hover:bg-gray-200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-base w-6 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="w-7 h-7 rounded-lg bg-white shadow-xs font-bold text-gray-700 flex items-center justify-center hover:bg-gray-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">السعر الإجمالي:</span>
            <div className="text-lg font-black text-[#c8102e]">{totalPrice} د.ك</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleBuyNowClick}
              className="py-3 px-3 bg-[#c8102e] hover:bg-[#a60b24] active:scale-98 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>اطلب الآن (للدفع)</span>
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="py-3 px-3 bg-gray-900 hover:bg-gray-800 active:scale-98 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة للسلة</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
