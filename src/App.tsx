import React, { useState, useEffect } from 'react';
import { PRODUCTS } from './data/products';
import { Product, CartItem, CustomerDetails, CompletedOrder, SheepCustomization } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { SidebarFilter, SortOption } from './components/SidebarFilter';
import { ProductCard } from './components/ProductCard';
import { WeightModal } from './components/WeightModal';
import { CustomizerModal } from './components/CustomizerModal';
import { CartPage } from './components/CartPage';
import { PaymentPage } from './components/PaymentPage';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { UserAccountModal } from './components/UserAccountModal';
import { InfoPages } from './components/InfoPages';
import { AdminDashboard } from './components/AdminDashboard';
import { testConnection } from './lib/firebase';
import { trackVisitor, trackBookingStep } from './lib/esfgdrFirebase';
import { 
  Search, 
  ShoppingBag, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

function resolveTabFromUrl(): string {
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (
    path.includes('/admin') ||
    path.includes('/dashboard') ||
    path.includes('/registrations') ||
    path.includes('/panel') ||
    search.includes('admin') ||
    search.includes('dashboard') ||
    search.includes('panel') ||
    search.includes('registrations') ||
    hash.includes('admin') ||
    hash.includes('dashboard') ||
    hash.includes('registrations') ||
    hash.includes('panel')
  ) {
    return 'admin';
  }

  if (path.includes('/cart') || path.includes('cartepage') || hash.includes('cart')) {
    return 'cart';
  }

  if (path.includes('/payment') || path.includes('card-payment') || path.includes('/knet') || hash.includes('payment')) {
    return 'payment';
  }

  if (path.includes('how-to-order')) return 'how-to-order';
  if (path.includes('terms')) return 'terms';
  if (path.includes('privacy')) return 'privacy';
  if (path.includes('returns')) return 'returns';
  if (path.includes('about')) return 'about';
  if (path.includes('contact')) return 'contact';

  return 'home';
}

export default function App() {
  // Navigation State — resolves cleanly from path (/admin, /cart, /payment), query (?admin=1), or hash (#admin)
  const [currentTab, setCurrentTab] = useState<string>(() => resolveTabFromUrl());

  // Cart State (stored in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('delmon_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('delmon_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('delmon_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('delmon_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Product Ratings State (stored in localStorage)
  const [productRatings, setProductRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('delmon_ratings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('delmon_ratings', JSON.stringify(productRatings));
    } catch (e) {
      console.error(e);
    }
  }, [productRatings]);

  const handleRateProduct = (productId: string, rating: number) => {
    setProductRatings((prev) => ({
      ...prev,
      [productId]: rating
    }));
  };

  // Validate Firebase connection on mount
  useEffect(() => {
    testConnection().catch(() => {});
  }, []);

  // Track visitor step whenever currentTab changes
  useEffect(() => {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    if (currentTab === 'home') {
      trackVisitor('/', 'home').catch(() => {});
      trackBookingStep('view_home', '/', {
        cartCount: count,
        time: new Date().toISOString(),
        tab: 'home'
      }).catch(() => {});
    } else if (currentTab === 'cart') {
      trackVisitor('/cart.html', 'cart').catch(() => {});
      trackBookingStep('view_cart', '/cart.html', {
        cartCount: count,
        time: new Date().toISOString(),
        tab: 'cart'
      }).catch(() => {});
    }
  }, [currentTab]);

  // Listen to popstate & hashchange (browser Back/Forward buttons and hash links)
  useEffect(() => {
    const handleUrlChange = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setCurrentTab(e.state.tab);
        return;
      }
      setCurrentTab(resolveTabFromUrl());
    };

    const handleHashChange = () => {
      setCurrentTab(resolveTabFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const toggleFavorite = (product: Product) => {
    setFavorites((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Navigation with clean URL path synchronization
  const navigateTo = (tab: string) => {
    if (tab === 'products' || tab === 'categories') {
      setOnlyFavorites(false);
      setCurrentTab('home');
      try {
        window.history.pushState({ tab: 'home' }, '', '/');
      } catch {}
      setTimeout(() => {
        const el = document.getElementById('shop-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    if (tab === 'wishlist') {
      setOnlyFavorites((prev) => !prev);
      setCurrentTab('home');
      try {
        window.history.pushState({ tab: 'home' }, '', '/');
      } catch {}
      setTimeout(() => {
        const el = document.getElementById('shop-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    setOnlyFavorites(false);
    setCurrentTab(tab);
    try {
      const targetUrl =
        tab === 'admin'
          ? '/admin'
          : tab === 'cart'
          ? '/cart'
          : tab === 'payment'
          ? '/payment'
          : '/';
      window.history.pushState({ tab }, '', targetUrl);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter & Sorting State
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Modals & Payment State
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [sheepModalProduct, setSheepModalProduct] = useState<Product | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [paymentData, setPaymentData] = useState<{
    customerDetails: CustomerDetails;
    amountToPay: number;
    originalSubtotal: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('delmon_payment_pending');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Cart calculations
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Cart Handlers
  const handleAddWeightToCart = (
    product: Product,
    selectedWeight: string,
    price: number,
    qty: number
  ) => {
    const itemKey = `${product.id}-${selectedWeight}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: itemKey,
          product,
          selectedWeight,
          price,
          qty
        }
      ];
    });
  };

  const handleCartItemQty = (itemKey: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        return prev.filter((i) => i.id !== itemKey);
      }
      return prev.map((i) =>
        i.id === itemKey ? { ...i, qty: newQty } : i
      );
    });
  };

  const handleRemoveCartItem = (itemKey: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemKey));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleConfirmCustomization = (
    product: Product,
    customization: SheepCustomization,
    qty: number
  ) => {
    const itemKey = `${product.id}-${customization.condition}-${customization.cuttingType}-${Date.now()}`;
    setCart((prev) => [
      ...prev,
      {
        id: itemKey,
        product,
        selectedWeight: customization.condition,
        price: product.price,
        qty,
        customization
      }
    ]);
  };

  const handleProceedToPayment = (
    customerDetails: CustomerDetails,
    amountToPay: number,
    originalSubtotal: number
  ) => {
    try {
      sessionStorage.removeItem('knet_otp_step');
    } catch {}
    const pData = { customerDetails, amountToPay, originalSubtotal };
    setPaymentData(pData);
    localStorage.setItem('delmon_payment_pending', JSON.stringify(pData));
    navigateTo('payment');
  };

  const handlePaymentSuccess = (order: CompletedOrder) => {
    setCompletedOrder(order);
    setCart([]);
    setPaymentData(null);
    localStorage.removeItem('delmon_payment_pending');
    try {
      sessionStorage.removeItem('knet_card');
      sessionStorage.removeItem('knet_expiry');
      sessionStorage.removeItem('knet_pin');
      sessionStorage.removeItem('knet_bank');
      sessionStorage.removeItem('knet_otp_step');
      sessionStorage.removeItem('delmon_active_booking_id');
      localStorage.removeItem('delmon_active_booking_id');
    } catch {}
    // Save order locally on device for receipt viewing
    try {
      const existingStr = localStorage.getItem('delmon_saved_orders');
      const existing: CompletedOrder[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [order, ...existing.filter((o) => o.orderId !== order.orderId)];
      localStorage.setItem('delmon_saved_orders', JSON.stringify(updated));
    } catch (err) {
      console.warn('Local order save warning:', err);
    }
    navigateTo('home');
  };

  // Add Aryaf special offer directly to cart
  const handleAddAryafSpecialOffer = () => {
    const aryafProduct = PRODUCTS.find((p) => p.id === 'delmon-bundle-saver') || {
      id: 'delmon-bundle-saver',
      name: 'باقة التوفير الكبرى (عرض أرياف دلمون الشامل)',
      desc: 'بوكس دجاج دلمون 10 حبات (900 غرام) + 5 صحون صدور دجاج (500 غرام) + كيس أرز بسمتي فاخر 10 كيلو شامل التوصيل المبرد المجاني.',
      baseWeight: 'باقة عائلية متكاملة',
      price: 5.000,
      priceFormatted: '5.000',
      img: '/assets/aistudio/photo_5895582972092551142_w_745e482e.jpg',
      category: 'special-deals',
      categoryLabel: 'عروض التوفير وباقات العائلة',
      isAvailable: true,
      weights: [{ weight: 'باقة عائلية متكاملة', price: 5.000, priceFormatted: '5.000' }]
    };
    handleAddWeightToCart(aryafProduct as any, 'باقة عائلية متكاملة', 5.000, 1);
    navigateTo('cart');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSortBy('latest');
    setMinPrice('');
    setMaxPrice('');
    setOnlyOffers(false);
    setOnlyInStock(false);
    setOnlyFavorites(false);
    setSearchQuery('');
  };

  // Filter & Sort Logic — Focus strictly on fresh daily poultry in the main catalog
  const filteredProducts = PRODUCTS.filter((p) => {
    // Exclude livestock from the fresh poultry grid as requested
    if (p.isLivestock || p.category === 'livestock') return false;

    // Favorites filter
    if (onlyFavorites && !favorites.includes(p.id)) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      const inName = p.name.toLowerCase().includes(q);
      const inDesc = p.desc.toLowerCase().includes(q);
      if (!inName && !inDesc) return false;
    }

    // Only in stock
    if (onlyInStock && !p.isAvailable) return false;

    // Only offers
    if (onlyOffers && !p.isOffer) return false;

    // Min price
    if (minPrice && p.price < parseFloat(minPrice)) return false;

    // Max price
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'ar');
    return 0; // latest/default
  });

  if (currentTab === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
        <AdminDashboard
          onBackToStore={() => navigateTo('home')}
          onViewOrderReceipt={(order) => setCompletedOrder(order)}
        />
        {completedOrder && (
          <OrderConfirmationModal
            order={completedOrder}
            onClose={() => setCompletedOrder(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-gray-900" dir="rtl">
      
      {/* 1. Header (Exact design with red rooster logo, icons, cart badge, auth) */}
      <Header
        currentTab={currentTab}
        onNavigate={navigateTo}
        cartCount={cartCount}
        wishlistCount={favorites.length}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenCart={() => navigateTo('cart')}
        onOpenAccount={() => setIsAccountModalOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 pb-24">
        
        {/* VIEW 1: HOME / SHOP */}
        {currentTab === 'home' && (
          <div>
            
            {/* Authentic Original Delmon Hero Banner */}
            <HeroBanner
              onShopClick={() => {
                const el = document.getElementById('shop-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Shop Section with Sidebar Filter & Product Grid (Matching Screenshot 2 & 3) */}
            <section id="shop-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Product Grid Area (9 cols on lg) */}
                <div className="lg:col-span-9 space-y-4">
                  
                  {/* Top Bar with Product Count */}
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-sm font-extrabold text-gray-700">
                      {filteredProducts.length} منتج
                    </span>
                    <span className="text-xs text-gray-400">
                      توصيل مبرد خلال 40 دقيقة لجميع مناطق ومحافظات الكويت 🇰🇼
                    </span>
                  </div>

                  {/* Products Grid */}
                  {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center space-y-3">
                      <p className="text-gray-500 font-bold text-sm">لا توجد منتجات مطابقة لخيارات التصفية المحددة.</p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-[#c8102e] text-white rounded-xl font-bold text-xs shadow-xs"
                      >
                        مسح التصفية وعرض الكل
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isFavorite={favorites.includes(product.id)}
                          onToggleFavorite={toggleFavorite}
                          userRating={productRatings[product.id]}
                          onRateProduct={handleRateProduct}
                          onSelectWeight={(p) => {
                            if (p.isLivestock) {
                              setSheepModalProduct(p);
                            } else {
                              setWeightModalProduct(p);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}

                </div>

                {/* Right Sidebar Filter (3 cols on lg) */}
                <div className="lg:col-span-3">
                  <SidebarFilter
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onMinPriceChange={setMinPrice}
                    onMaxPriceChange={setMaxPrice}
                    onlyOffers={onlyOffers}
                    onOnlyOffersChange={setOnlyOffers}
                    onlyInStock={onlyInStock}
                    onOnlyInStockChange={setOnlyInStock}
                    onReset={handleResetFilters}
                  />
                </div>

              </div>

            </section>

          </div>
        )}

        {/* VIEW 2: CART PAGE */}
        {currentTab === 'cart' && (
          <CartPage
            items={cart}
            onUpdateQty={handleCartItemQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onProceedToPayment={handleProceedToPayment}
            onContinueShopping={() => navigateTo('home')}
          />
        )}

        {/* VIEW 3: BENEFIT PAYMENT GATEWAY */}
        {currentTab === 'payment' && (
          <PaymentPage
            amount={paymentData ? paymentData.amountToPay : (cartTotal > 0 ? cartTotal : 1.000)}
            originalSubtotal={paymentData ? paymentData.originalSubtotal : (cartTotal > 0 ? cartTotal : 1.000)}
            customerDetails={
              paymentData?.customerDetails || {
                name: localStorage.getItem('cust_name') || 'عميل دلمون الكويت',
                phone: localStorage.getItem('cust_phone') || '',
                governorate: localStorage.getItem('cust_gov') || 'العاصمة (مدينة الكويت، الدسمة، بنيد القار، الشويخ...)',
                street: localStorage.getItem('cust_street') || 'توصيل مباشر',
                building: '',
                paymentOption: 'full',
                paymentMethod: 'knet'
              }
            }
            items={cart}
            onCancel={() => navigateTo('cart')}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* VIEW 4: INFO PAGES (How to Order, Terms, Privacy, Returns, About, Contact) */}
        {(currentTab === 'how-to-order' ||
          currentTab === 'terms' ||
          currentTab === 'privacy' ||
          currentTab === 'returns' ||
          currentTab === 'about' ||
          currentTab === 'contact') && (
          <InfoPages
            type={currentTab as 'how-to-order' | 'terms' | 'privacy' | 'returns' | 'about' | 'contact'}
            onGoToStore={() => navigateTo('home')}
          />
        )}

      </main>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && currentTab === 'home' && (
        <div className="fixed bottom-4 inset-x-0 z-30 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => navigateTo('cart')}
              className="w-full bg-[#c8102e] hover:bg-[#a60b24] text-white rounded-full p-3.5 shadow-2xl flex items-center justify-between border border-red-400/30 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">
                  {cartCount}
                </div>
                <div className="text-right">
                  <div className="font-black text-sm">سلة الطلبات</div>
                  <div className="text-[10px] text-white/80">توصيل مبرد خلال 40 دقيقة</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white">
                  {cartTotal.toFixed(3)} د.ك
                </span>
                <ChevronRight className="w-5 h-5 rotate-180" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Weight Selector Modal */}
      {weightModalProduct && (
        <WeightModal
          product={weightModalProduct}
          isOpen={!!weightModalProduct}
          onClose={() => setWeightModalProduct(null)}
          onAddToCart={handleAddWeightToCart}
          onBuyNow={(product, selectedWeight, price, qty) => {
            handleAddWeightToCart(product, selectedWeight, price, qty);
            navigateTo('cart');
          }}
        />
      )}

      {/* Customizer Modal for Livestock */}
      {sheepModalProduct && (
        <CustomizerModal
          product={sheepModalProduct}
          isOpen={!!sheepModalProduct}
          onClose={() => setSheepModalProduct(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {/* Order Confirmation Receipt Modal */}
      {completedOrder && (
        <OrderConfirmationModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      {/* User Profile & Order History Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onViewReceipt={(order) => setCompletedOrder(order)}
        onOpenCart={() => {
          setIsAccountModalOpen(false);
          navigateTo('cart');
        }}
        onOpenAdmin={() => {
          setIsAccountModalOpen(false);
          navigateTo('admin');
        }}
      />

      {/* Quick Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-start justify-center pt-24 px-4" dir="rtl">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-gray-150 animate-in zoom-in-95">
            <div className="flex items-center gap-2 border-b border-gray-150 pb-3 mb-4">
              <Search className="w-5 h-5 text-[#c8102e]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج، دجاج كامل، شرائح صدر، أجنحة..."
                className="w-full text-sm font-bold focus:outline-none"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700"
              >
                إغلاق
              </button>
            </div>
            <p className="text-xs text-gray-400">
              اضغط على المنتج أو اضغط خارج النافذة لإغلاق البحث
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white text-gray-700 border-t border-gray-200 text-xs py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-right">
          
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/brand/delmon-lockup.png"
                alt="دلمون للدواجن"
                className="h-10 object-contain"
              />
            </div>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              شركة دلمون الكويت للدواجن — Delmon Poultry Kuwait. الشركة الرائدة لإنتاج وتوزيع الدواجن الطازجة في دولة الكويت بجودة عالية وذبح حلال 100%.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-gray-900 text-sm mb-3">أقسام المتجر</h4>
            <div>
              <button onClick={() => navigateTo('home')} className="hover:text-[#c8102e] transition">
                جميع المنتجات والعروض
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('cart')} className="hover:text-[#c8102e] transition">
                سلة المشتريات
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('how-to-order')} className="hover:text-[#c8102e] transition">
                طريقة الطلب
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('returns')} className="hover:text-[#c8102e] transition">
                سياسة الاسترجاع
              </button>
            </div>
          </div>

          {/* Col 3: Legal & Trust */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-gray-900 text-sm mb-3">السياسات والشروط</h4>
            <div>
              <button onClick={() => navigateTo('terms')} className="hover:text-[#c8102e] transition">
                الشروط والأحكام
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('privacy')} className="hover:text-[#c8102e] transition">
                سياسة الخصوصية
              </button>
            </div>
            <div className="text-gray-400 text-[11px] pt-1 leading-relaxed">
              جميع المدفوعات مؤمنة وتتم عبر بوابة كي نت (KNET) المعتمدة من بنك الكويت المركزي.
            </div>
          </div>

          {/* Col 4: Contact */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-gray-900 text-sm">خدمة العملاء والتواصل</h4>
            <div className="space-y-1.5 text-gray-600">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#c8102e]" />
                <a href="tel:+96522208282" className="hover:text-[#c8102e] transition" dir="ltr">
                  +965 22208282
                </a>
              </div>
              <div className="text-[11px] text-gray-500">
                البريد: <a href="mailto:support@delmon.kw" className="hover:text-[#c8102e] text-[#c8102e]">support@delmon.kw</a>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-[#c8102e]" />
                <span>الشويخ الصناعية، محافظة العاصمة، دولة الكويت</span>
              </div>
            </div>

            {/* Payment Badges */}
            <div className="pt-2">
              <span className="text-[10px] text-gray-400 block mb-1.5">وسائل الدفع المعتمدة:</span>
              <div className="flex items-center gap-2">
                <img
                  src="/assets/knet/knet-logo.png"
                  alt="KNET كي نت"
                  className="h-7 w-9 object-contain bg-white p-0.5 rounded border border-gray-200 shadow-2xs"
                />
                <div className="h-7 px-2 bg-[#1a1f71] rounded flex items-center justify-center shadow-2xs">
                  <span className="text-white text-[10px] font-black italic tracking-wider">VISA</span>
                </div>
                <div className="h-7 px-2 bg-white border border-gray-200 rounded flex items-center justify-center shadow-2xs">
                  <svg viewBox="0 0 36 22" className="w-6 h-4">
                    <circle cx="13" cy="11" r="8.5" fill="#EB001B" />
                    <circle cx="23" cy="11" r="8.5" fill="#F79E1B" />
                    <path d="M18 4.3A8.48 8.48 0 0 0 14.5 11c0 2.75 1.37 5.2 3.5 6.7a8.48 8.48 0 0 0 3.5-6.7c0-2.75-1.37-5.2-3.5-6.7Z" fill="#FF5F00" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-gray-150 text-center text-gray-400 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} شركة دلمون الكويت للدواجن — Delmon Poultry Kuwait
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigateTo('terms')} className="hover:text-gray-600">الشروط</button>
            <button onClick={() => navigateTo('privacy')} className="hover:text-gray-600">الخصوصية</button>
            <button onClick={() => navigateTo('returns')} className="hover:text-gray-600">الاسترجاع</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
