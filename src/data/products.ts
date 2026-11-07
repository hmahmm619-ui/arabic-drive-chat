import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'delmon-whole-chicken-600',
    name: 'دجاج كامل',
    desc: 'دجاج دلمون كامل طازج ومبرد، مذبوح ومجهز محلياً 100% تحت إشراف بيطري كامل.',
    baseWeight: '600 جم',
    price: 0.950,
    priceFormatted: '0.950',
    img: '/assets/products/whole-chicken.png',
    category: 'whole-chicken',
    categoryLabel: 'دجاج كامل طازج',
    isAvailable: true,
    weights: [
      { weight: '600 جم', price: 0.950, priceFormatted: '0.950' },
      { weight: '700 جم', price: 1.100, priceFormatted: '1.100' },
      { weight: '800 جم', price: 1.250, priceFormatted: '1.250' },
      { weight: '900 جم', price: 1.400, priceFormatted: '1.400' },
      { weight: '1000 جم (1 كجم)', price: 1.550, priceFormatted: '1.550' },
      { weight: '1100 جم', price: 1.700, priceFormatted: '1.700' },
      { weight: '1200 جم', price: 1.850, priceFormatted: '1.850' },
      { weight: '1300 جم', price: 2.000, priceFormatted: '2.000' },
      { weight: '1400 جم', price: 2.150, priceFormatted: '2.150' },
    ]
  },
  {
    id: 'delmon-breast-strips-400',
    name: 'شرائح صدر',
    desc: 'شرائح صدور دجاج المزرعة طازجة بدون عظم أو جلد، مقطعة ومجهزة بعناية في طبق حفظ صحي أصفر.',
    baseWeight: '400 جم',
    price: 1.450,
    priceFormatted: '1.450',
    img: '/assets/products/strips.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    weights: [
      { weight: '400 جم', price: 1.450, priceFormatted: '1.450' },
      { weight: '500 جم', price: 1.800, priceFormatted: '1.800' },
      { weight: '1000 جم (1 كجم)', price: 3.500, priceFormatted: '3.500' },
    ]
  },
  {
    id: 'delmon-drumsticks-500',
    name: 'أرجل صغيرة',
    desc: 'أفخاذ وسيقان دجاج المزرعة طازجة ناعمة ولذيذة، مثالية للقلي والشواء والمجابيس الكويتية.',
    baseWeight: '500 جم',
    price: 1.100,
    priceFormatted: '1.100',
    img: '/assets/products/drumsticks.png',
    category: 'wings-legs',
    categoryLabel: 'أفخاذ وأجنحة',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 1.100, priceFormatted: '1.100' },
      { weight: '1000 جم (1 كجم)', price: 2.150, priceFormatted: '2.150' },
    ]
  },
  {
    id: 'delmon-whole-legs-400',
    name: 'أفخاذ كاملة',
    desc: 'أفخاذ دجاج كاملة بالعظم طازجة من مزارع دلمون، غنية بالبروتين ومجهزة يومياً في طبق أصفر صحي.',
    baseWeight: '400 جم',
    price: 0.900,
    priceFormatted: '0.900',
    img: '/assets/products/whole-legs.png',
    category: 'wings-legs',
    categoryLabel: 'أفخاذ وأجنحة',
    isAvailable: true,
    weights: [
      { weight: '400 جم', price: 0.900, priceFormatted: '0.900' },
      { weight: '500 جم', price: 1.100, priceFormatted: '1.100' },
      { weight: '1000 جم (1 كجم)', price: 2.100, priceFormatted: '2.100' },
    ]
  },
  {
    id: 'delmon-thigh-strips-500',
    name: 'شرائح فخذ',
    desc: 'شرائح لحم أفخاذ دجاج المزرعة مخلية من العظم والجلد تماماً، طرية جداً ونكهة مميزة.',
    baseWeight: '500 جم',
    price: 1.850,
    priceFormatted: '1.850',
    img: '/assets/products/breast-fillet.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: false,
    weights: [
      { weight: '500 جم', price: 1.850, priceFormatted: '1.850' }
    ]
  },
  {
    id: 'delmon-wings-500',
    name: 'أجنحة',
    desc: 'أجنحة دجاج المزرعة كاملة طازجة ونظيفة، مقطعة وجاهزة للطهي والشواء بالفرن أو المقلاة الهوائية.',
    baseWeight: '500 جم',
    price: 1.050,
    priceFormatted: '1.050',
    img: '/assets/products/wings.png',
    category: 'wings-legs',
    categoryLabel: 'أفخاذ وأجنحة',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 1.050, priceFormatted: '1.050' },
      { weight: '1000 جم (1 كجم)', price: 2.050, priceFormatted: '2.050' },
    ]
  },
  {
    id: 'delmon-minced-500',
    name: 'مفروم',
    desc: 'لحم دجاج المزرعة طازج مفروم ناعم نخب أول، بدون أي إضافات صناعية أو مواد حافظة.',
    baseWeight: '500 جم',
    price: 0.850,
    priceFormatted: '0.850',
    img: '/assets/products/minced.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 0.850, priceFormatted: '0.850' },
      { weight: '1000 جم (1 كجم)', price: 1.650, priceFormatted: '1.650' },
    ]
  },
  {
    id: 'delmon-thighs-500',
    name: 'فخذ',
    desc: 'أفخاذ دجاج عليا طازجة ومختارة بعناية في طبق حفظ محكم لضمان الطزاجة القصوى.',
    baseWeight: '500 جم',
    price: 0.950,
    priceFormatted: '0.950',
    img: '/assets/products/thighs.png',
    category: 'wings-legs',
    categoryLabel: 'أفخاذ وأجنحة',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 0.950, priceFormatted: '0.950' },
      { weight: '1000 جم (1 كجم)', price: 1.850, priceFormatted: '1.850' },
    ]
  },
  {
    id: 'delmon-breast-fillet-500',
    name: 'فيليه صدور دجاج',
    desc: 'فيليه صدور دجاج المزرعة طازج مخلي من الجلد والعظم، طري وغني بالبروتين، مثالي للدايت والأطباق الصحية.',
    baseWeight: '400 جم',
    price: 1.550,
    priceFormatted: '1.550',
    img: '/assets/brand/hero-3.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    badge: 'الأكثر طلباً 🔥',
    weights: [
      { weight: '400 جم', price: 1.550, priceFormatted: '1.550' },
      { weight: '500 جم', price: 1.950, priceFormatted: '1.950' },
      { weight: '1000 جم (1 كجم)', price: 3.800, priceFormatted: '3.800' },
    ]
  },
  {
    id: 'delmon-breast-cubes-500',
    name: 'فهيتا الدجاج',
    desc: 'شرائح ومكعبات صدور دجاج المزرعة طازجة مقطعة للفاهيتا والشيش طاووق والشوربات.',
    baseWeight: '400 جم',
    price: 1.600,
    priceFormatted: '1.600',
    img: '/assets/products/cubes.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    weights: [
      { weight: '400 جم', price: 1.600, priceFormatted: '1.600' },
      { weight: '500 جم', price: 2.000, priceFormatted: '2.000' },
      { weight: '1000 جم (1 كجم)', price: 3.900, priceFormatted: '3.900' },
    ]
  },
  {
    id: 'delmon-shish-tawook-500',
    name: 'تبهيرة الفاهيتا (دلمون)',
    desc: 'شرائح صدور دجاج متبلة بخلطة الفاهيتا الخاصة من دلمون، جاهزة للطهي والشوي مباشرة.',
    baseWeight: '400 جم',
    price: 1.520,
    priceFormatted: '1.520',
    img: '/assets/products/shish-tawook.png',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    isNew: true,
    weights: [
      { weight: '400 جم', price: 1.520, priceFormatted: '1.520' },
      { weight: '800 جم', price: 2.950, priceFormatted: '2.950' },
    ]
  },
  {
    id: 'delmon-livers-500',
    name: 'كبدة دجاج طازجة',
    desc: 'كبدة دجاج المزرعة طازجة نخب أول غنية بالحديد والمعادن، مفحوصة ومنظفة بعناية.',
    baseWeight: '500 جم',
    price: 0.900,
    priceFormatted: '0.900',
    img: '/assets/products/livers.png',
    category: 'giblets',
    categoryLabel: 'كبدة وأحشاء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 0.900, priceFormatted: '0.900' },
      { weight: '1000 جم (1 كجم)', price: 1.750, priceFormatted: '1.750' },
    ]
  },
  {
    id: 'delmon-hearts-500',
    name: 'قلوب دجاج طازجة',
    desc: 'قلوب دجاج المزرعة طازجة ونظيفة، ممتازة للتشويح مع البصل والبهارات.',
    baseWeight: '500 جم',
    price: 0.850,
    priceFormatted: '0.850',
    img: '/assets/products/hearts.png',
    category: 'giblets',
    categoryLabel: 'كبدة وأحشاء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 0.850, priceFormatted: '0.850' },
    ]
  },
  {
    id: 'delmon-gizzards-500',
    name: 'قوانص دجاج طازجة',
    desc: 'قوانص دجاج المزرعة طازجة منظفة تماماً وخالية من أي شوائب، ومغلفة بطريقة صحية.',
    baseWeight: '500 جم',
    price: 0.800,
    priceFormatted: '0.800',
    img: '/assets/products/gizzards.png',
    category: 'giblets',
    categoryLabel: 'كبدة وأحشاء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 0.800, priceFormatted: '0.800' },
    ]
  },
  {
    id: 'delmon-marinated-bbq',
    name: 'نص دجاجة (باربكيو)',
    desc: 'نصف دجاجة طازجة متبلة بصلصة الباربكيو المدخنة من دلمون، جاهزة للشوي الفوري بالفرن أو الفحم.',
    baseWeight: '500 جم',
    price: 0.950,
    priceFormatted: '0.950',
    img: '/assets/products/half-chicken-bbq.jpg',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 0.950, priceFormatted: '0.950' }
    ]
  },
  {
    id: 'delmon-marinated-madhbi',
    name: 'نص دجاجة (مندي)',
    desc: 'نصف دجاجة طازجة متبلة ببهارات المندي الأصيلة من دلمون لنكهة الشواء التقليدي الشهي.',
    baseWeight: '500 جم',
    price: 0.950,
    priceFormatted: '0.950',
    img: '/assets/products/half-chicken-mandi.jpg',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 0.950, priceFormatted: '0.950' }
    ]
  },
  {
    id: 'delmon-marinated-biryani',
    name: 'نص دجاجة (مكس دلمون)',
    desc: 'نصف دجاجة طازجة بتبهيرة دلمون مكس الخاصة الغنية بالأعشاب والتوابل الطبيعية.',
    baseWeight: '500 جم',
    price: 0.950,
    priceFormatted: '0.950',
    img: '/assets/products/half-chicken-delmon-mix.webp',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    isNew: true,
    weights: [
      { weight: '500 جم', price: 0.950, priceFormatted: '0.950' }
    ]
  },
  {
    id: 'delmon-marinated-tandoori',
    name: 'أجنحة (مكس دلمون)',
    desc: 'أجنحة دجاج طازجة بتبهيرة دلمون مكس الخاصة 500 جم، جاهزة للشوي أو القلي الهوائي.',
    baseWeight: '500 جم',
    price: 1.025,
    priceFormatted: '1.025',
    img: '/assets/products/wings-delmon-mix.webp',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 1.025, priceFormatted: '1.025' }
    ]
  },
  {
    id: 'delmon-marinated-spicy',
    name: 'شرائح صدر (مكس دلمون)',
    desc: 'شرائح صدور دجاج طازجة بتبهيرة دلمون مكس الخاصة 300 جم، طرية وسريعة التحضير.',
    baseWeight: '300 جم',
    price: 1.140,
    priceFormatted: '1.140',
    img: '/assets/products/breast-delmon-mix.webp',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '300 جم', price: 1.140, priceFormatted: '1.140' }
    ]
  },
  {
    id: 'delmon-free-range-1000',
    name: 'دجاج الشوي الطازج',
    desc: 'دجاج شوي كامل طازج ومجهز بعناية من مزارع دلمون في طبق حفظ صحي أصفر.',
    baseWeight: '700 جم',
    price: 1.150,
    priceFormatted: '1.150',
    img: '/assets/products/whole-grill-chicken.jpg',
    category: 'whole-chicken',
    categoryLabel: 'دجاج كامل طازج',
    isAvailable: true,
    badge: 'طازج يومياً 🌿',
    weights: [
      { weight: '700 جم', price: 1.150, priceFormatted: '1.150' },
      { weight: '900 جم', price: 1.400, priceFormatted: '1.400' },
      { weight: '1000 جم (1 كجم)', price: 1.550, priceFormatted: '1.550' },
    ]
  },
  {
    id: 'delmon-smoked-1000',
    name: 'قطع دجاج مشكل',
    desc: 'تشكيلة قطع دجاج المزرعة طازجة ومقطعة بعناية في طبق حفظ صحي كبير 900 جم.',
    baseWeight: '900 جم',
    price: 1.250,
    priceFormatted: '1.250',
    img: '/assets/products/mixed-portions.jpg',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    weights: [
      { weight: '900 جم', price: 1.250, priceFormatted: '1.250' },
    ]
  },
  {
    id: 'delmon-bundle-saver',
    name: 'سلة المزرعة التوفيرية الكبرى',
    desc: 'سلة المزرعة العائلية المتكاملة من دلمون: تشكيلة دجاج طازج وصدور وفيليه وستربس، شامل التوصيل المبرد المجاني لجميع مناطق الكويت.',
    baseWeight: 'سلة عائلية متكاملة',
    price: 5.000,
    priceFormatted: '5.000',
    img: '/assets/brand/hero-2.png',
    category: 'special-deals',
    categoryLabel: 'عروض التوفير وباقات العائلة',
    isAvailable: true,
    isOffer: true,
    badge: 'عرض حصري 💥',
    weights: [
      { weight: 'سلة عائلية متكاملة', price: 5.000, priceFormatted: '5.000' }
    ]
  },
  {
    id: 'delmon-naemi-1',
    name: 'خروف نعيمي كويتي طازج (ذبح محلي)',
    desc: 'خروف نعيمي حي أو مذبوح طازج تحت إشراف طبيب بيطري في مسالخ الكويت، صافي وزن 15 إلى 18 كجم، شامل الذبح والتقطيع والتوصيل مع إمكانية الذبح في منزلك.',
    baseWeight: 'ذبيحة كاملة 15-18 كجم',
    price: 65.000,
    priceFormatted: '65.000',
    img: '/assets/aistudio/photo_5895582972092551142_w_745e482e.jpg',
    category: 'livestock',
    categoryLabel: 'ذبائح وخراف ومواشي',
    isAvailable: true,
    isLivestock: true,
    badge: 'ذبح محلي 🐑',
    weights: [
      { weight: 'ذبيحة كاملة', price: 65.000, priceFormatted: '65.000' }
    ]
  }
];

export const KUWAIT_AREAS = [
  'مدينة الكويت (العاصمة) - Kuwait City',
  'السالمية - Salmiya',
  'حولي - Hawalli',
  'الجابرية - Jabriya',
  'الفروانية - Farwaniya',
  'خيطان - Khaitan',
  'الأحمدي - Ahmadi',
  'الفحيحيل - Fahaheel',
  'المنقف - Mangaf',
  'العقيلة - Egaila',
  'المهبولة - Mahboula',
  'الجهراء - Jahra',
  'مبارك الكبير - Mubarak Al-Kabeer',
  'صباح السالم - Sabah Al-Salem',
  'القرين - Qurain',
  'القصور والعدان - Qusour & Adan',
  'سلوى والرميثية - Salwa & Rumaithiya',
  'بيان ومشرف - Bayan & Mishref',
  'الزهراء وحطين والصديق - South Surra',
  'السرة وقرطبة واليرموك - Surra, Qortuba & Yarmouk',
  'العارضية والفردوس والأندلس - Ardiya, Ferdous & Andalus',
  'عبدالله المبارك وصباح الناصر - Abdullah Al-Mubarak',
  'سعد العبدالله والمطلاع - Saad Al-Abdullah & Mutlaa',
  'صباح الأحمد والوفرة - Sabah Al-Ahmad & Wafra'
];

// Alias for backward compatibility
export const BAHRAIN_AREAS = KUWAIT_AREAS;
