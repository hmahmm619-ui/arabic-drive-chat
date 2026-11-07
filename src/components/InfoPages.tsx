import React from 'react';
import { ArrowRight } from 'lucide-react';

interface InfoPageProps {
  type: 'how-to-order' | 'terms' | 'privacy' | 'returns' | 'about' | 'contact';
  onGoToStore: () => void;
}

export const InfoPages: React.FC<InfoPageProps> = ({ type, onGoToStore }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      {/* Return to Store button */}
      <div className="mb-6">
        <button
          onClick={onGoToStore}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d8212a] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" /> العودة لمتجر دلمون الكويت للدواجن
        </button>
      </div>

      {/* HOW TO ORDER */}
      {type === 'how-to-order' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">دليل الشراء السريع</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">كيف تطلب من دلمون الكويت؟ 🇰🇼</h1>
            <p className="text-xs text-gray-500 mt-1">
              خطوات سهلة ومباشرة لطلب الدواجن الطازجة والمتبلة واستلامها مبردة عند باب منزلك في جميع مناطق الكويت.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: '١',
                title: 'اختر منتجات الدواجن المفضلة',
                desc: 'تصفح تشكيلة منتجات دلمون (الدجاج الكامل بأوزان مختلفة، فيليه الصدور، الشيش طاووق، الدجاج المتبل، أو باقات التوفير الكبرى).'
              },
              {
                step: '٢',
                title: 'راجع سلة المشتريات',
                desc: 'تحقق من الكميات والأوزان والأسعار بالدينار الكويتي (د.ك) قبل المتابعة.'
              },
              {
                step: '٣',
                title: 'أدخل بيانات التواصل والتوصيل',
                desc: 'أدخل اسمك ورقم هاتفك النقال (الكويت +965) وعنوانك بالتفصيل (المحافظة، المنطقة، القطعة، الشارع، المنزل).'
              },
              {
                step: '٤',
                title: 'اختر طريقة السداد المناسبة',
                desc: 'سداد إلكتروني فوري عبر بوابة كي نت (KNET)، أو البطاقات المصرفية، أو خيار دفع عربون 1 د.ك والمتبقي عند الاستلام.'
              },
              {
                step: '٥',
                title: 'استلام الطلب طازجاً ومبرداً',
                desc: 'يصلك طلبك خلال 40 دقيقة في سيارات نقل مبردة مخصصة لحفظ درجة الحرارة والجودة لجميع محافظات الكويت.'
              }
            ].map((s) => (
              <div key={s.step} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 items-start">
                <div className="w-9 h-9 rounded-xl bg-[#d8212a] text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 text-center">
            <button
              onClick={onGoToStore}
              className="bg-[#d8212a] hover:bg-[#b8141d] text-white px-8 py-3 rounded-xl font-black text-sm shadow-md transition cursor-pointer"
            >
              تصفح منتجات دلمون الكويت الآن 🐔
            </button>
          </div>
        </div>
      )}

      {/* TERMS & CONDITIONS */}
      {type === 'terms' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">الشروط والأحكام المعتمدة</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">الشروط والأحكام — دلمون الكويت</h1>
            <p className="text-xs text-gray-500 mt-1">
              شركة دلمون الكويت للدواجن — منطقة الشويخ الصناعية، دولة الكويت
            </p>
          </div>

          <div className="space-y-5 text-xs text-gray-700 leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">١. المنتجات والأسعار والعروض</h3>
              <p>
                تُعرض المنتجات وأسعارها بالدينار الكويتي (د.ك / KWD). تعتمد تفاصيل المنتج والسعر والتوفر على المعلومات المعروضة وقت تقديم الطلب. تُطبق شروط العروض الترويجية كما تظهر مع كل منتج.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٢. التوفر ومناطق التوصيل</h3>
              <p>
                تخضع المنتجات لمدى توفرها اليومي الطازج من مزارع ومسالخ دلمون. نوفر خدمة التوصيل المبرد لكافة محافظات ومناطق دولة الكويت (العاصمة، حولي، الفروانية، الأحمدي، الجهراء، مبارك الكبير) دون رسوم توصيل إضافية.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٣. معايير السلامة والرقابة البيطرية</h3>
              <p>
                تلتزم شركة دلمون الكويت للدواجن بأعلى معايير السلامة الغذائية والذبح الحلال المعتمد 100% وتحت إشراف بيطري كامل ورقابة الهيئة العامة للغذاء والتغذية في دولة الكويت.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٤. التواصل وخدمة المستهلك</h3>
              <p>
                لأي استفسار، يرجى التواصل مع مركز خدمة عملاء دلمون الكويت: <a href="tel:+96522208282" className="text-[#d8212a] font-bold underline" dir="ltr">+965 22208282</a> أو عبر البريد الإلكتروني: <a href="mailto:support@delmon.kw" className="text-[#d8212a] font-bold underline">support@delmon.kw</a>.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY */}
      {type === 'privacy' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">حماية وسرية البيانات</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">سياسة الخصوصية — دلمون الكويت</h1>
            <p className="text-xs text-gray-500 mt-1">
              شركة دلمون الكويت للدواجن — دولة الكويت
            </p>
          </div>

          <div className="space-y-5 text-xs text-gray-700 leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">١. المعلومات المرتبطة بالطلب</h3>
              <p>
                تقتصر المعلومات التي نجمعها على البيانات الضرورية لمعالجة طلبك وإيصاله (الاسم، ورقم الهاتف الكويتي، وعنوان التوصيل).
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٢. أمن المدفوعات والبطاقات</h3>
              <p>
                تتم عمليات الدفع الإلكتروني عبر بوابة كي نت (KNET Gateway) المعتمدة من بنك الكويت المركزي، ولا نقوم بتخزين أرقام بطاقتك أو بياناتك السرية.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٣. سرية البيانات</h3>
              <p>
                نلتزم بالمحافظة التامة على سرية بيانات العملاء وعدم إفشائها أو مشاركتها مع أي أطراف تجارية أخرى.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* RETURNS POLICY */}
      {type === 'returns' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">ضمان الجودة والرضا التام</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">سياسة الاستبدال والاسترجاع</h1>
            <p className="text-xs text-gray-500 mt-1">
              دلمون الكويت — رضاكم وسلامتكم أولويتنا
            </p>
          </div>

          <div className="bg-red-50 border-r-4 border-[#d8212a] p-4 rounded-xl text-red-900 font-bold text-xs leading-relaxed">
            ✅ رضاك أولويتنا: إذا وصلك منتج تالف أو غير مطابق لطلبك، نستبدله فوراً أو نعيد لك قيمته دون أي تأخير.
          </div>

          <div className="space-y-5 text-xs text-gray-700 leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">١. الفحص عند الاستلام</h3>
              <p>
                لطبيعة منتجات الدواجن الطازجة والمبردة، نرجو منك فحص المنتجات أمام مندوب التوصيل عند التسليم مباشرة لضمان سلامتها ومطابقتها.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٢. الحالات المشمولة بالاستبدال الفوري</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>وصول منتج تالف أو بجودة لا تطابق معايير دلمون المعتمدة.</li>
                <li>وصول منتج أو وزن مختلف عما تم تحديده في السلة.</li>
                <li>نقص في أحد أصناف الطلب.</li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٣. آلية استرداد المبالغ</h3>
              <p>
                في حال الدفع ببطاقة كي نت (KNET)، يُعاد المبلغ لنفس الحساب المصرفي خلال 1 إلى 3 أيام عمل. وفي حال الدفع عند الاستلام، يُعاد المبلغ نقداً أو يتم الاستبدال بنفس اليوم.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* ABOUT US */}
      {type === 'about' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">نبذة عن الشركة</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">من نحن — دلمون الكويت للدواجن 🇰🇼</h1>
            <p className="text-xs text-gray-500 mt-1">
              الجودة الطازجة من مزارعنا إلى مائدتكم في دولة الكويت
            </p>
          </div>

          <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
            <p>
              تُعد <strong>شركة دلمون الكويت للدواجن</strong> واحدة من أبرز العلامات الرائدة في توفير الدواجن الطازجة اليومية، الفروج الكامل، المقطعات، الفيليه، والمنتجات المتبلة الجاهزة للطهي والشوي في دولة الكويت.
            </p>
            <p>
              نحرص على تطبيق أعلى معايير الجودة والسلامة الغذائية والذبح الحلال 100% بإشراف بيطري متكامل، مع أسطول توصيل مبرد يغطي جميع محافظات ومناطق الكويت خلال 40 دقيقة.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onGoToStore}
              className="bg-[#d8212a] hover:bg-[#b8141d] text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition cursor-pointer"
            >
              تصفح المنتجات والعروض 🐔
            </button>
          </div>
        </div>
      )}

      {/* CONTACT US */}
      {type === 'contact' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">خدمة العملاء على مدار الساعة</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">تواصل معنا — دلمون الكويت 🇰🇼</h1>
            <p className="text-xs text-gray-500 mt-1">
              يسعدنا استقبال طلباتكم واستفساراتكم في جميع محافظات دولة الكويت
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="font-black text-gray-900 text-sm">الهاتف المباشر (الكويت)</div>
              <a href="tel:+96522208282" className="text-[#d8212a] font-extrabold text-sm block" dir="ltr">
                +965 22208282
              </a>
              <p className="text-gray-500 text-[11px]">متاح يومياً لخدمة العملاء والطلبات السريعة</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="font-black text-gray-900 text-sm">البريد الإلكتروني والموقع</div>
              <a href="mailto:support@delmon.kw" className="text-[#d8212a] font-bold block">
                support@delmon.kw
              </a>
              <p className="text-gray-500 text-[11px]">الشويخ الصناعية، محافظة العاصمة، دولة الكويت</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onGoToStore}
              className="bg-[#d8212a] hover:bg-[#b8141d] text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition cursor-pointer"
            >
              العودة للمتجر والطلب الآن
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
