import React, { useState } from 'react';
import { ShoppingBag, Search, Heart, User, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenSearch?: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  cartCount,
  wishlistCount,
  onOpenSearch,
  onOpenCart,
  onOpenAccount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (tab: string) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-150 shadow-xs h-18 sm:h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          
          {/* Left Action Icons (Profile, Cart with red badge, Wishlist, Search) */}
          <div className="flex items-center gap-2 sm:gap-3.5 order-1">
            
            {/* User Profile Button */}
            <button
              type="button"
              onClick={onOpenAccount}
              className="p-1.5 text-gray-800 hover:text-[#c8102e] transition rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              title="تسجيل الدخول / حسابي"
              aria-label="حسابي وسجل الطلبات"
            >
              <User className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>

            {/* Shopping Cart with Red Circle Badge */}
            <button
              type="button"
              onClick={onOpenCart}
              className="p-1.5 text-gray-800 hover:text-[#c8102e] transition rounded-full hover:bg-gray-100 relative cursor-pointer"
              title="سلة المشتريات"
              aria-label="سلة المشتريات"
            >
              <ShoppingBag className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#c8102e] text-white text-[11px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Wishlist Heart */}
            <button
              type="button"
              onClick={() => handleLinkClick('wishlist')}
              className="p-1.5 text-gray-800 hover:text-[#c8102e] transition rounded-full hover:bg-gray-100 relative cursor-pointer"
              title="المفضلة"
              aria-label="المفضلة"
            >
              <Heart className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Search */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-1.5 text-gray-800 hover:text-[#c8102e] transition rounded-full hover:bg-gray-100 cursor-pointer"
              title="بحث"
              aria-label="بحث"
            >
              <Search className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 order-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => handleLinkClick('contact')}
              className={`transition cursor-pointer ${
                currentTab === 'contact' ? 'text-[#c8102e] font-black' : 'text-gray-700 hover:text-[#c8102e]'
              }`}
            >
              تواصل معنا
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('about')}
              className={`transition cursor-pointer ${
                currentTab === 'about' ? 'text-[#c8102e] font-black' : 'text-gray-700 hover:text-[#c8102e]'
              }`}
            >
              من نحن
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('products')}
              className={`transition cursor-pointer ${
                currentTab === 'products' ? 'text-[#c8102e] font-black' : 'text-gray-700 hover:text-[#c8102e]'
              }`}
            >
              المنتجات
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('categories')}
              className={`transition cursor-pointer ${
                currentTab === 'categories' ? 'text-[#c8102e] font-black' : 'text-gray-700 hover:text-[#c8102e]'
              }`}
            >
              الأقسام
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('home')}
              className={`transition cursor-pointer ${
                currentTab === 'home' ? 'text-[#c8102e] font-black' : 'text-gray-700 hover:text-[#c8102e]'
              }`}
            >
              الرئيسية
            </button>
          </nav>

          {/* Right: Official Delmon Rooster Logo */}
          <div className="flex items-center gap-3 order-3">
            <button
              type="button"
              onClick={() => handleLinkClick('home')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="h-10 sm:h-12 flex items-center">
                <img
                  src="/assets/brand/delmon-lockup.png"
                  alt="دلمون للدواجن Delmon Poultry"
                  className="h-9 sm:h-11 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/brand/delmon-mark.png';
                  }}
                />
              </div>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-700 hover:text-[#c8102e] rounded-lg cursor-pointer"
              aria-label="القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 mr-auto p-5 text-right">
            <div className="flex items-center justify-between pb-4 border-b border-gray-150 mb-4">
              <img
                src="/assets/brand/delmon-lockup.png"
                alt="دلمون للدواجن"
                className="h-8 object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Status in Drawer */}
            <div className="mb-4 pb-4 border-b border-gray-150">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAccount();
                }}
                className="w-full bg-red-50 hover:bg-red-100 p-3 rounded-2xl flex items-center gap-3 text-right transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#c8102e] text-white flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-xs text-gray-900">
                    تسجيل الدخول / حسابي
                  </div>
                  <div className="text-[10px] text-gray-500">
                    تفعيل الحساب وعرض سجل الطلبات
                  </div>
                </div>
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {[
                { id: 'home', label: 'الرئيسية' },
                { id: 'categories', label: 'الأقسام' },
                { id: 'products', label: 'المنتجات' },
                { id: 'cart', label: 'سلة المشتريات' },
                { id: 'about', label: 'من نحن' },
                { id: 'contact', label: 'تواصل معنا' },
                { id: 'how-to-order', label: 'طريقة الطلب' },
                { id: 'returns', label: 'سياسة الاسترجاع' },
                { id: 'terms', label: 'الشروط والأحكام' },
                { id: 'privacy', label: 'سياسة الخصوصية' },
              ].map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleLinkClick(link.id)}
                  className={`w-full text-right py-2.5 px-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                    currentTab === link.id ? 'bg-red-50 text-[#c8102e]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-150">
              <p className="text-xs text-gray-500 mb-1">طلب مباشر واستفسار (الكويت):</p>
              <a
                href="tel:+96522208282"
                className="text-xs font-bold text-[#c8102e] hover:underline"
                dir="ltr"
              >
                +965 22208282
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
