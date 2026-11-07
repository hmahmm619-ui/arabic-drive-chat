import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

export type SortOption = 'latest' | 'price-asc' | 'price-desc' | 'name-asc';

interface SidebarFilterProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onlyOffers: boolean;
  onOnlyOffersChange: (checked: boolean) => void;
  onlyInStock: boolean;
  onOnlyInStockChange: (checked: boolean) => void;
  onReset: () => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  sortBy,
  onSortChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onlyOffers,
  onOnlyOffersChange,
  onlyInStock,
  onOnlyInStockChange,
  onReset
}) => {
  return (
    <aside className="bg-white rounded-2xl border border-gray-150 p-5 shadow-2xs space-y-6 text-right select-none" dir="rtl">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#c8102e]" />
          <span>تصفية</span>
        </h3>
      </div>

      {/* Sorting options */}
      <div>
        <h4 className="font-extrabold text-gray-800 text-xs mb-2.5">ترتيب حسب</h4>
        <div className="space-y-1.5 text-xs font-semibold">
          {[
            { id: 'latest', label: 'الأحدث' },
            { id: 'price-asc', label: 'السعر: من الأقل' },
            { id: 'price-desc', label: 'السعر: من الأعلى' },
            { id: 'name-asc', label: 'الاسم: أ - ي' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSortChange(opt.id as SortOption)}
              className={`w-full text-right py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-between ${
                sortBy === opt.id
                  ? 'text-[#c8102e] font-black bg-red-50/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{opt.label}</span>
              {sortBy === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e]"></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h4 className="font-extrabold text-gray-800 text-xs mb-2">نطاق السعر</h4>
        <div className="flex items-center gap-2" dir="ltr">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="من"
            className="w-full h-10 px-2.5 text-center text-xs font-bold border border-gray-200 rounded-xl focus:border-[#c8102e] focus:outline-none"
          />
          <span className="text-gray-400 font-bold">—</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="إلى"
            className="w-full h-10 px-2.5 text-center text-xs font-bold border border-gray-200 rounded-xl focus:border-[#c8102e] focus:outline-none"
          />
        </div>
        <p className="text-[11px] text-gray-400 font-medium mt-1 text-center" dir="ltr">
          0.800 - 3.900 د.ك
        </p>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2.5 pt-1 border-t border-gray-100 text-xs font-bold text-gray-800">
        <label className="flex items-center justify-between cursor-pointer">
          <span>العروض فقط</span>
          <input
            type="checkbox"
            checked={onlyOffers}
            onChange={(e) => onOnlyOffersChange(e.target.checked)}
            className="w-4 h-4 rounded text-[#c8102e] accent-[#c8102e] cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span>المتوفر فقط</span>
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => onOnlyInStockChange(e.target.checked)}
            className="w-4 h-4 rounded text-[#c8102e] accent-[#c8102e] cursor-pointer"
          />
        </label>
      </div>

      {/* Clear Filter button */}
      <div className="pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
          <span>مسح التصفية</span>
        </button>
      </div>

    </aside>
  );
};
