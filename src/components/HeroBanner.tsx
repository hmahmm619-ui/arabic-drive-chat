import React from 'react';
import { ArrowLeft, Truck, Leaf } from 'lucide-react';

interface HeroBannerProps {
  onShopClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopClick }) => {
  return (
    <div className="relative overflow-hidden select-none bg-[#c61d23] text-white" dir="rtl">
      {/* Authentic Original Delmon Poultry Hero Banner (Matching image_fbf04509.png) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-10 sm:py-14 min-h-[380px] sm:min-h-[430px] flex items-center justify-between">
        
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 z-10">
          
          {/* Right Column: Original Delmon Headlines & CTA */}
          <div className="flex-1 text-right space-y-4 sm:space-y-5">
            
            {/* Pill Badge: طازج */}
            <div className="inline-flex items-center gap-1.5 bg-white/18 text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full">
              <Leaf className="w-3.5 h-3.5 text-white" />
              <span>طازج</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-tight leading-[1.15] text-white">
              دجاج المزرعة من دلمون
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-2xl font-bold text-white/95 leading-relaxed">
              يصل إلى بابك في الكويت
            </p>

            {/* Action Row: Dark Shop Button & Delivery Info */}
            <div className="pt-3 flex flex-wrap items-center gap-4 sm:gap-6">
              
              {/* Dark Slate Pill CTA Button (Exact match: تسوق الآن ←) */}
              <button
                onClick={onShopClick}
                className="bg-[#3b434b] hover:bg-[#2d343b] active:scale-95 text-white px-7 py-3 sm:py-3.5 rounded-full font-extrabold text-sm sm:text-base shadow-lg transition flex items-center gap-3 cursor-pointer"
              >
                <span>تسوق الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Delivery info */}
              <div className="flex items-center gap-2 text-white text-xs sm:text-sm font-bold">
                <Truck className="w-4 h-4 text-white" />
                <span>توصيل لجميع مناطق الكويت</span>
              </div>

            </div>

          </div>

          {/* Left Column: Official High-Res Delmon Farm Chicken Bag inside Subtle Red Card */}
          <div className="w-full md:w-auto flex justify-center items-center shrink-0">
            <div className="relative w-64 h-72 sm:w-[370px] sm:h-[360px] rounded-[28px] bg-[#c11b21] shadow-[0_12px_36px_rgba(0,0,0,0.18)] flex items-center justify-center p-3">
              <img
                src="/assets/products/whole-chicken.png"
                alt="دجاج المزرعة من دلمون - دجاج طازج"
                className="w-full h-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)] hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
