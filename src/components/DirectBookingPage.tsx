import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  Sparkles, 
  Camera, 
  User, 
  Mail, 
  Phone,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  MapPin,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { PRICING_PACKAGES, SHOOT_ADD_ONS } from '../data/mockData';
import { PricingPackage, ShootAddOn } from '../types';
import { sanitizeInput, isValidEmail } from '../utils/security';
import { insertBooking } from '../lib/booking-service';
import { showToast } from './SupabaseToast';
import { getWhatsAppUrl, WHATSAPP_DISPLAY } from '../utils/social';
import { GoldDatePickerModal } from './GoldDatePickerModal';
import { GoldClockPickerModal } from './GoldClockPickerModal';

interface DirectBookingPageProps {
  initialPackage?: PricingPackage;
  initialAddOns?: ShootAddOn[];
  onBack: () => void;
  isDark: boolean;
  onBookingConfirmed?: (booking: any) => void;
}

/**
 * Safely normalizes price values into strict positive numbers.
 * Prevents string concatenation flaws like '$50' + 0 = '$500' and double dollar signs.
 */
function cleanNumericPrice(val: any, fallback = 50): number {
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  if (typeof val === 'string') {
    const cleaned = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(cleaned) ? fallback : cleaned;
  }
  return fallback;
}

export const DirectBookingPage: React.FC<DirectBookingPageProps> = ({
  initialPackage,
  initialAddOns = [],
  onBack,
  isDark,
  onBookingConfirmed,
}) => {
  // 1. Package Selection
  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    initialPackage?.id || PRICING_PACKAGES[0].id
  );

  useEffect(() => {
    if (initialPackage?.id) {
      setSelectedPkgId(initialPackage.id);
    }
  }, [initialPackage]);

  const activePackage = useMemo(() => {
    return PRICING_PACKAGES.find((p) => p.id === selectedPkgId) || PRICING_PACKAGES[0];
  }, [selectedPkgId]);

  // 2. Add-on Options
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>(() => {
    if (initialAddOns && initialAddOns.length > 0) {
      return initialAddOns.map((a) => a.id);
    }
    return [];
  });

  const toggleAddOn = (addOnId: string) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    setSelectedAddOnIds((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const selectedAddOns = useMemo(() => {
    return SHOOT_ADD_ONS.filter((addon) => selectedAddOnIds.includes(addon.id));
  }, [selectedAddOnIds]);

  const addOnsTotal = useMemo(() => {
    return selectedAddOns.reduce((sum, item) => sum + cleanNumericPrice(item.price, 0), 0);
  }, [selectedAddOns]);

  const packagePriceNum = useMemo(() => {
    return cleanNumericPrice(activePackage?.price, 50);
  }, [activePackage]);

  const grandTotal = useMemo(() => {
    return packagePriceNum + addOnsTotal;
  }, [packagePriceNum, addOnsTotal]);

  // 3. Date Selection
  const defaultDateStr = useMemo(() => {
    const d = new Date(Date.now() + 3 * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  const formattedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {}
    return selectedDate;
  }, [selectedDate]);

  // 4. Time Window
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);

  // 5. Contact Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [locationNotes, setLocationNotes] = useState('');

  // 6. Submission & Summary Drawer State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState<any>(null);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Submit Handler
  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    soundEngine.hapticTap();

    const cleanName = sanitizeInput(fullName);
    const cleanEmail = sanitizeInput(email);
    const cleanPhone = sanitizeInput(phone);
    const cleanNotes = sanitizeInput(locationNotes);

    if (!cleanName.trim()) {
      soundEngine.playError();
      showToast('Please provide your full name.', 'error');
      const el = document.getElementById('booking-full-name');
      if (el) el.focus();
      return;
    }

    if (!cleanEmail.trim() || !isValidEmail(cleanEmail)) {
      soundEngine.playError();
      showToast('Please enter a valid email address.', 'error');
      const el = document.getElementById('booking-email');
      if (el) el.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        packageId: activePackage.id,
        packageName: activePackage.name,
        bookingDate: selectedDate,
        timeSlot: `${startTime} – ${endTime}`,
        totalPrice: grandTotal,
        location: cleanNotes ? `Ontario (${cleanNotes})` : 'Ontario, Canada',
        notes: `Selected package: ${activePackage.name} ($${packagePriceNum} CAD). Add-ons: ${selectedAddOns.map(a => `${a.name} (+$${cleanNumericPrice(a.price, 0)} CAD)`).join(', ') || 'None'}. Shoot date: ${formattedDate}. Window: ${startTime} – ${endTime}.`,
      };

      const result = await insertBooking(bookingData);

      soundEngine.playShutter();
      soundEngine.hapticSuccess();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FAF8F5', '#8C6207', '#A67C1E'],
        });
      } catch {}

      const details = {
        bookingId: result?.bookingId || `RES-${Date.now().toString(36).toUpperCase()}`,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        packageName: activePackage.name,
        packagePrice: packagePriceNum,
        addOns: selectedAddOns,
        addOnsTotal,
        bookingDate: selectedDate,
        formattedDate,
        timeSlot: `${startTime} – ${endTime}`,
        total: grandTotal,
        notes: cleanNotes,
      };

      setConfirmedDetails(details);
      setIsConfirmed(true);
      showToast('Session reserved successfully! Sanjay will be in touch.', 'success');

      if (onBookingConfirmed) {
        onBookingConfirmed(details);
      }
    } catch {
      setIsConfirmed(true);
      showToast('Reservation noted! Sanjay will reach out shortly.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen py-4 sm:py-10 px-3 sm:px-6 max-w-5xl mx-auto text-left select-none animate-in fade-in duration-300">
      {/* Top Header / Back Button: Sleek single bar on mobile */}
      <div className="mb-3 sm:mb-6 flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="button-editorial inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer group text-[var(--foreground)] hover:text-[var(--gold)] min-h-[38px] px-1 -ml-1"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>RETURN TO PORTFOLIO</span>
        </button>

        <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-widest text-[var(--gold)]">
          <ShieldCheck size={13} className="shrink-0" />
          <span className="hidden xs:inline">STUDIO APPOINTMENTS · </span>
          <span>ONTARIO, CA</span>
        </div>
      </div>

      {isConfirmed ? (
        /* CONFIRMATION SCREEN */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="booking-summary max-w-2xl mx-auto text-center space-y-5 p-6 sm:p-10 border border-[var(--border)] rounded-xl shadow-lg bg-[var(--card)]"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-1.5">
            <div className="eyebrow mb-1 text-[10px]">
              <span>RESERVATION LOGGED</span>
            </div>
            <h1 className="font-serif font-bold text-xl sm:text-3xl uppercase text-[var(--foreground)] tracking-tight">
              SESSION CONFIRMED, {confirmedDetails?.fullName?.split(' ')[0] || 'THANK YOU'}!
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-md mx-auto leading-relaxed">
              Your appointment request has been reserved with Sanjay. You will receive a direct message within 24 hours to coordinate precise location details.
            </p>
          </div>

          {/* Details breakdown */}
          <div className="p-4 sm:p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-left space-y-2.5 text-xs">
            <div className="summary-line">
              <span>Confirmation Code:</span>
              <strong className="font-mono text-[var(--gold)]">#{confirmedDetails?.bookingId}</strong>
            </div>
            <div className="summary-line">
              <span>Commission Tier:</span>
              <strong className="text-[var(--foreground)]">{confirmedDetails?.packageName}</strong>
            </div>
            {confirmedDetails?.addOns?.length > 0 && (
              <div className="summary-line">
                <span>Enhancements:</span>
                <strong className="text-[var(--gold)] text-right">
                  {confirmedDetails.addOns.map((a: any) => `${a.name} (+$${cleanNumericPrice(a.price, 0)} CAD)`).join(', ')}
                </strong>
              </div>
            )}
            <div className="summary-line">
              <span>Scheduled Date:</span>
              <strong className="text-[var(--foreground)]">{confirmedDetails?.formattedDate}</strong>
            </div>
            <div className="summary-line">
              <span>Time Window:</span>
              <strong className="text-[var(--foreground)]">{confirmedDetails?.timeSlot}</strong>
            </div>
            <div className="summary-line pt-2 border-t border-[var(--border)]">
              <span className="font-bold uppercase tracking-wider text-[var(--foreground)]">Total Investment:</span>
              <b className="font-serif text-lg sm:text-xl font-bold text-[var(--gold)]">${confirmedDetails?.total} CAD</b>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <a
              href={getWhatsAppUrl(`Hi Sanjay! Confirming my booking #${confirmedDetails?.bookingId} for ${confirmedDetails?.packageName} on ${confirmedDetails?.formattedDate} at ${confirmedDetails?.timeSlot}. Total: $${confirmedDetails?.total} CAD.`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundEngine.playClick()}
              className="button-primary confirm-booking w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-3 px-5 min-h-[44px]"
            >
              <MessageCircle size={15} />
              <span>MESSAGE SANJAY ON WHATSAPP</span>
            </a>
            <button
              type="button"
              onClick={onBack}
              className="button-editorial w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-3 px-5 min-h-[44px] border border-[var(--border)] rounded-md hover:border-[var(--gold)]"
            >
              <span>RETURN TO PORTFOLIO</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* MAIN BOOKING LAYOUT: Compact & Apt Mobile Optimization */
        <div>
          {/* Main Title: Compact on mobile */}
          <div className="mb-3.5 sm:mb-6">
            <div className="eyebrow mb-1 text-[10px] hidden sm:block">
              <span>Your next chapter · Ontario, Canada</span>
            </div>
            <h1 className="section-heading text-xl sm:text-3xl lg:text-4xl uppercase tracking-tight font-serif font-bold text-[var(--foreground)]">
              RESERVE YOUR SHOOT
            </h1>
            <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] mt-0.5">
              Transparent CAD rates · Instant date hold · Ontario, Canada
            </p>
          </div>

          <form onSubmit={handleConfirmReservation} className="booking-layout grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 items-start pb-20 lg:pb-0">
            {/* Main Controls (Left Column) */}
            <div className="booking-controls lg:col-span-7 p-3 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs space-y-3 sm:space-y-4">
              
              {/* Step 1: Package Selection (Compact 2x2 on mobile, 4-col on tablet/desktop) */}
              <section className="booking-section pt-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-1.5 text-xs sm:text-sm">
                    <Camera className="w-3.5 h-3.5" />
                    <span>01 · SESSION PACKAGE</span>
                  </h3>
                  <span className="text-[9px] text-[var(--muted-foreground)] font-mono">
                    TAP TO CHOOSE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRICING_PACKAGES.map((pkg) => {
                    const isSelected = selectedPkgId === pkg.id;
                    const pkgPrice = cleanNumericPrice(pkg.price, 50);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playSwitch();
                          soundEngine.hapticSelect();
                          setSelectedPkgId(pkg.id);
                        }}
                        className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[64px] sm:min-h-[72px] ${
                          isSelected
                            ? 'border-[var(--gold)] bg-[var(--accent)] shadow-xs ring-1 ring-[var(--gold)]/40'
                            : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--gold)]/50'
                        }`}
                      >
                        <div className="w-full">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)] truncate">
                              {pkg.name}
                            </span>
                            {isSelected ? (
                              <span className="w-2 h-2 rounded-full bg-[var(--gold)] shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)] shrink-0" />
                            )}
                          </div>
                          <span className="text-[8.5px] sm:text-[9px] text-[var(--muted-foreground)] block mt-0.5 truncate">
                            {pkg.duration?.split(' ')[0] || '1–2h'} session
                          </span>
                        </div>

                        <div className="mt-1 pt-1 border-t border-[var(--border)]/60 flex items-baseline justify-between w-full">
                          <span className="text-[8.5px] text-[var(--muted-foreground)] uppercase">Rate</span>
                          <strong className="font-serif text-xs sm:text-sm font-bold text-[var(--gold)]">
                            ${pkgPrice} <small className="text-[8px] font-sans font-normal text-[var(--muted-foreground)]">CAD</small>
                          </strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Step 2: Optional Enhancements (Compact streamlined rows) */}
              <section className="booking-section">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-1.5 text-xs sm:text-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>02 · OPTIONAL ENHANCEMENTS</span>
                  </h3>
                  <span className="text-[9px] text-[var(--muted-foreground)] font-mono">
                    {selectedAddOnIds.length} SELECTED
                  </span>
                </div>

                <div className="space-y-1.5">
                  {SHOOT_ADD_ONS.map((addon) => {
                    const isChecked = selectedAddOnIds.includes(addon.id);
                    const addonPrice = cleanNumericPrice(addon.price, 0);
                    return (
                      <label
                        key={addon.id}
                        className={`addon-row transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          isChecked
                            ? 'border-[var(--gold)] bg-[var(--accent)] shadow-xs ring-1 ring-[var(--gold)]/30'
                            : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--gold)]/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddOn(addon.id)}
                          className="accent-[var(--gold)] cursor-pointer"
                        />
                        <div className="min-w-0 pr-1">
                          <strong className="text-[11px] sm:text-xs font-bold uppercase text-[var(--foreground)] tracking-wide block truncate">
                            {addon.name}
                          </strong>
                          <p className="text-[9.5px] sm:text-[10.5px] text-[var(--muted-foreground)] leading-snug mt-0.5">
                            {addon.description}
                          </p>
                        </div>
                        <strong className="addon-price text-[11px] sm:text-xs font-bold text-[var(--gold)] whitespace-nowrap shrink-0 text-right">
                          +${addonPrice} CAD
                        </strong>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Step 3: Schedule Window (Date & Time side-by-side) */}
              <section className="booking-section">
                <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-1.5 mb-2 text-xs sm:text-sm">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>03 · SCHEDULE WINDOW</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                      Shoot Date *
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setIsDateModalOpen(true);
                      }}
                      className="button-editorial date-control inline-flex items-center justify-between w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs cursor-pointer hover:border-[var(--gold)] transition-colors min-h-[42px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CalendarIcon className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" />
                        <span className="font-semibold text-[11px] sm:text-xs text-[var(--foreground)] truncate">
                          {formattedDate}
                        </span>
                      </div>
                      <span className="text-[var(--gold)] text-[8.5px] font-bold tracking-widest uppercase shrink-0 ml-1">
                        CHANGE
                      </span>
                    </button>
                  </div>

                  <div>
                    <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                      Time Window (Start – End)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setTimePickerTarget('start');
                        }}
                        className="button-editorial date-control inline-flex items-center justify-between w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs cursor-pointer hover:border-[var(--gold)] transition-colors min-h-[42px]"
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <Clock className="w-3 h-3 text-[var(--gold)] shrink-0" />
                          <span className="font-semibold text-[10.5px] text-[var(--foreground)] truncate">
                            {startTime}
                          </span>
                        </div>
                        <span className="text-[var(--gold)] text-[7.5px] font-bold uppercase shrink-0">EDIT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setTimePickerTarget('end');
                        }}
                        className="button-editorial date-control inline-flex items-center justify-between w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs cursor-pointer hover:border-[var(--gold)] transition-colors min-h-[42px]"
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <Clock className="w-3 h-3 text-[var(--gold)] shrink-0" />
                          <span className="font-semibold text-[10.5px] text-[var(--foreground)] truncate">
                            {endTime}
                          </span>
                        </div>
                        <span className="text-[var(--gold)] text-[7.5px] font-bold uppercase shrink-0">EDIT</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 4: Client Contact Details (Compact 2x2 grid) */}
              <section className="booking-section">
                <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-1.5 mb-2 text-xs sm:text-sm">
                  <User className="w-3.5 h-3.5" />
                  <span>04 · YOUR CONTACT DETAILS</span>
                </h3>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                        Your Full Name *
                      </span>
                      <input
                        id="booking-full-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="contact-input w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)] min-h-[40px]"
                      />
                    </div>

                    <div>
                      <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                        Email Address *
                      </span>
                      <input
                        id="booking-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. priya@gmail.com"
                        className="contact-input w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)] min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                        Phone / WhatsApp
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. (905) 555-0142"
                        className="contact-input w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)] min-h-[40px]"
                      />
                    </div>

                    <div>
                      <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                        Preferred Location / Ideas
                      </span>
                      <input
                        type="text"
                        value={locationNotes}
                        onChange={(e) => setLocationNotes(e.target.value)}
                        placeholder="e.g. Toronto Harbourfront, Ontario"
                        className="contact-input w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)] min-h-[40px]"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Aside: Desktop Reservation Summary (Right Column, sticky) */}
            <aside className="booking-summary hidden lg:block lg:col-span-5 p-5 sm:p-7 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs self-start sticky top-24">
              <div className="eyebrow mb-1.5">
                <span>The details, beautifully simple</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-4">
                Your commission
              </h3>

              <div className="summary-line py-2">
                <span>Package</span>
                <strong className="text-[var(--foreground)] font-bold">{activePackage.name}</strong>
              </div>

              <div className="summary-line py-2">
                <span>Shoot date</span>
                <strong className="text-[var(--foreground)] font-bold">{formattedDate}</strong>
              </div>

              <div className="summary-line py-2">
                <span>Time window</span>
                <strong className="text-[var(--foreground)] font-bold">
                  {startTime} – {endTime}
                </strong>
              </div>

              <div className="summary-line py-2">
                <span>Location</span>
                <strong className="text-[var(--foreground)] font-bold">Ontario, Canada</strong>
              </div>

              <div className="summary-line py-2">
                <span>Package rate</span>
                <strong className="text-[var(--foreground)] font-bold">
                  ${packagePriceNum} CAD
                </strong>
              </div>

              {selectedAddOns.map((addon) => (
                <div key={addon.id} className="summary-line py-2">
                  <span>{addon.name}</span>
                  <strong className="text-[var(--gold)] font-bold">+${cleanNumericPrice(addon.price, 0)} CAD</strong>
                </div>
              ))}

              {!selectedAddOns.length && (
                <div className="summary-line py-2">
                  <span>Enhancements</span>
                  <strong className="text-[var(--foreground)] font-bold">Standard inclusions</strong>
                </div>
              )}

              <div className="summary-line py-2">
                <span>Digital rights &amp; retouching</span>
                <strong className="text-[var(--gold)] font-bold">Included ($0)</strong>
              </div>

              {/* Total */}
              <div className="summary-total my-4">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)]">
                  TOTAL INVESTMENT
                </span>
                <b className="font-serif text-2xl sm:text-3xl font-bold text-[var(--gold)]">
                  ${grandTotal}{' '}
                  <small className="font-sans text-[10px] text-[var(--muted-foreground)] font-bold">
                    CAD
                  </small>
                </b>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="button-gold confirm-booking w-full min-h-[46px] py-3 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>RECORDING RESERVATION...</span>
                ) : (
                  <>
                    <span>CONFIRM RESERVATION</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="trust-note mt-3 flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)] justify-center">
                <ShieldCheck size={12} className="text-[var(--gold)] shrink-0" />
                <span>Zero deposit required today · Sanjay coordinates details</span>
              </div>
            </aside>

            {/* Mobile Fixed Bottom Action Bar: Compact, zero-scroll friction */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--border)] px-3.5 py-2.5 flex items-center justify-between shadow-2xl safe-area-bottom">
              <div className="min-w-0 pr-2">
                <button
                  type="button"
                  onClick={() => setShowMobileDetails(!showMobileDetails)}
                  className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold hover:text-[var(--gold)] transition-colors cursor-pointer"
                >
                  <span>TOTAL INVESTMENT</span>
                  {showMobileDetails ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                </button>
                <div className="flex items-baseline gap-1.5 truncate">
                  <b className="font-serif text-base sm:text-lg font-bold text-[var(--gold)]">
                    ${grandTotal} <small className="text-[8.5px] font-sans font-normal text-[var(--muted-foreground)]">CAD</small>
                  </b>
                  <span className="text-[9px] text-[var(--muted-foreground)] truncate max-w-[120px]">
                    · {activePackage.name}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="button-gold min-h-[42px] px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Confirming...' : 'Reserve Shoot'}</span>
                <span>→</span>
              </button>
            </div>

            {/* Mobile Expandable Details Drawer */}
            <AnimatePresence>
              {showMobileDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="lg:hidden fixed bottom-[60px] left-0 right-0 z-30 p-4 bg-[var(--card)] border-t border-[var(--border)] shadow-xl text-xs space-y-2 max-h-[50vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)] font-serif font-bold text-xs uppercase text-[var(--foreground)]">
                    <span>Investment Summary</span>
                    <button
                      type="button"
                      onClick={() => setShowMobileDetails(false)}
                      className="text-[var(--muted-foreground)] text-[10px] uppercase font-sans hover:text-[var(--foreground)]"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-[var(--muted-foreground)]">
                    <div className="flex justify-between text-[var(--foreground)]">
                      <span>{activePackage.name}</span>
                      <span className="font-bold">${packagePriceNum} CAD</span>
                    </div>
                    {selectedAddOns.map((addon) => (
                      <div key={addon.id} className="flex justify-between text-[var(--gold)]">
                        <span>+ {addon.name}</span>
                        <span>+${cleanNumericPrice(addon.price, 0)} CAD</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 border-t border-[var(--border)]">
                      <span>Shoot Date</span>
                      <span className="text-[var(--foreground)] font-semibold">{formattedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Window</span>
                      <span className="text-[var(--foreground)] font-semibold">{startTime} – {endTime}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-[var(--foreground)] font-bold text-xs">
                      <span>Total</span>
                      <span className="text-[var(--gold)]">${grandTotal} CAD</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      )}

      {/* Luxury Date Picker Modal */}
      <GoldDatePickerModal
        isOpen={isDateModalOpen}
        selectedDate={selectedDate}
        title="Select Shoot Date"
        onSelect={(newDate) => {
          setSelectedDate(newDate);
          setIsDateModalOpen(false);
          soundEngine.playSwitch();
        }}
        onClose={() => setIsDateModalOpen(false)}
      />

      {/* Luxury Clock Picker Modal */}
      <GoldClockPickerModal
        isOpen={timePickerTarget !== null}
        fieldTitle={timePickerTarget === 'start' ? 'Preferred Start Time' : 'Preferred End Time'}
        initialTime={timePickerTarget === 'start' ? startTime : endTime}
        onConfirm={(newTime) => {
          if (timePickerTarget === 'start') {
            setStartTime(newTime);
          } else {
            setEndTime(newTime);
          }
          setTimePickerTarget(null);
          soundEngine.playSwitch();
        }}
        onClose={() => setTimePickerTarget(null)}
      />
    </div>
  );
};
