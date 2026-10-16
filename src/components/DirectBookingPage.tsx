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
  HelpCircle,
  MapPin,
  FileText
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
    return selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  }, [selectedAddOns]);

  const grandTotal = useMemo(() => {
    return activePackage.price + addOnsTotal;
  }, [activePackage.price, addOnsTotal]);

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

  // 6. Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState<any>(null);

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
        notes: `Selected package: ${activePackage.name} ($${activePackage.price}). Add-ons: ${selectedAddOns.map(a => `${a.name} (+$${a.price})`).join(', ') || 'None'}. Shoot date: ${formattedDate}. Window: ${startTime} – ${endTime}.`,
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
        packagePrice: activePackage.price,
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
    <div className="w-full min-h-screen py-10 sm:py-16 px-4 sm:px-8 max-w-5xl mx-auto text-left select-none animate-in fade-in duration-300">
      {/* Top Header / Back Button with Lovable Spacing */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="button-editorial inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer group w-fit text-[var(--foreground)] hover:text-[var(--gold)]"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>RETURN TO PORTFOLIO</span>
        </button>

        <div className="inline-flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-[var(--gold)]">
          <ShieldCheck size={14} />
          <span>STUDIO APPOINTMENTS · ONTARIO, CANADA</span>
        </div>
      </div>

      {isConfirmed ? (
        /* CONFIRMATION SCREEN */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="booking-summary max-w-2xl mx-auto text-center space-y-6 p-8 sm:p-12 border border-[var(--border)] rounded-xl shadow-lg bg-[var(--card)]"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <div className="eyebrow mb-1">
              <span>RESERVATION LOGGED</span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-4xl uppercase text-[var(--foreground)] tracking-tight">
              SESSION CONFIRMED, {confirmedDetails?.fullName || 'THANK YOU'}!
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-md mx-auto leading-relaxed">
              Your appointment request has been reserved with Sanjay. You will receive a direct message within 24 hours to coordinate precise location details.
            </p>
          </div>

          {/* Details breakdown */}
          <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-left space-y-3 text-xs">
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
                  {confirmedDetails.addOns.map((a: any) => `${a.name} (+$${a.price})`).join(', ')}
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
              <b className="font-serif text-xl font-bold text-[var(--gold)]">${confirmedDetails?.total} CAD</b>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={getWhatsAppUrl(`Hi Sanjay! Confirming my booking #${confirmedDetails?.bookingId} for ${confirmedDetails?.packageName} on ${confirmedDetails?.formattedDate} at ${confirmedDetails?.timeSlot}. Total: $${confirmedDetails?.total} CAD.`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundEngine.playClick()}
              className="button-primary confirm-booking w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-3.5 px-6"
            >
              <MessageCircle size={16} />
              <span>MESSAGE SANJAY ON WHATSAPP</span>
            </a>
            <button
              type="button"
              onClick={onBack}
              className="button-editorial w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-3.5 px-6 border border-[var(--border)] rounded-md hover:border-[var(--gold)]"
            >
              <span>RETURN TO PORTFOLIO</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* MAIN BOOKING LAYOUT */
        <div>
          {/* Main Title & Editorial Headline */}
          <div className="mb-8">
            <div className="eyebrow mb-2">
              <span>Your next chapter · Ontario, Canada</span>
            </div>
            <h1 className="section-heading text-3xl sm:text-5xl uppercase tracking-tight font-serif font-bold text-[var(--foreground)]">
              RESERVE YOUR SHOOT
            </h1>
            <p className="section-description text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl mt-2 leading-relaxed">
              Transparent CAD rates, dedicated Ontario portraiture, seamless date selection, and zero booking friction.
            </p>
          </div>

          <form onSubmit={handleConfirmReservation} className="booking-layout grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Controls (Left Column) */}
            <div className="booking-controls lg:col-span-7 p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs space-y-6">
              {/* Step 1: Package Selection */}
              <section className="booking-section pt-0">
                <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-2 mb-4">
                  <Camera className="w-3.5 h-3.5" />
                  <span>01 · SELECT YOUR SESSION PACKAGE</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRICING_PACKAGES.map((pkg) => {
                    const isSelected = selectedPkgId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          soundEngine.playSwitch();
                          soundEngine.hapticSelect();
                          setSelectedPkgId(pkg.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedPkgId(pkg.id);
                          }
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--accent)] shadow-xs'
                            : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--gold)]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)]">
                              {pkg.name}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[var(--gold)]" />
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--muted-foreground)] block">
                            {pkg.duration || '1–2 hours dedicated session'}
                          </span>
                        </div>

                        <div className="mt-4 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                          <span className="text-[10px] text-[var(--muted-foreground)] uppercase">
                            Session fee
                          </span>
                          <strong className="font-serif text-base font-bold text-[var(--gold)]">
                            ${pkg.price} <small className="text-[9px] font-sans">CAD</small>
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Step 2: Optional Enhancements */}
              <section className="booking-section">
                <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-2 mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>02 · OPTIONAL ENHANCEMENTS</span>
                </h3>

                <div className="space-y-3">
                  {SHOOT_ADD_ONS.map((addon) => {
                    const isChecked = selectedAddOnIds.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`addon-row transition-all duration-200 cursor-pointer ${
                          isChecked
                            ? 'border-[var(--primary)] bg-[var(--accent)] shadow-xs'
                            : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--gold)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddOn(addon.id)}
                          className="accent-[var(--primary)] cursor-pointer mt-1"
                        />
                        <div>
                          <strong className="text-xs font-bold uppercase text-[var(--foreground)] tracking-wide">
                            {addon.name}
                          </strong>
                          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                            {addon.description}
                          </p>
                        </div>
                        <strong className="addon-price text-xs font-bold text-[var(--gold)] whitespace-nowrap ml-3">
                          +${addon.price} CAD
                        </strong>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Step 3: Date & Time Window */}
              <section className="booking-section">
                <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>03 · DATE &amp; TIME WINDOW</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                      Shoot date *
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setIsDateModalOpen(true);
                      }}
                      className="button-editorial date-control inline-flex items-center justify-between w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm cursor-pointer hover:border-[var(--gold)] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarIcon className="w-4 h-4 text-[var(--gold)]" />
                        <span className="font-semibold text-xs text-[var(--foreground)]">
                          {formattedDate}
                        </span>
                      </div>
                      <span className="text-[var(--gold)] text-[9px] font-bold tracking-widest uppercase">
                        CHANGE DATE
                      </span>
                    </button>
                  </div>

                  <div className="time-fields grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                        Preferred start time
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setTimePickerTarget('start');
                        }}
                        className="button-editorial date-control inline-flex items-center justify-between w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm cursor-pointer hover:border-[var(--gold)] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[var(--gold)]" />
                          <span className="font-semibold text-xs text-[var(--foreground)]">
                            {startTime}
                          </span>
                        </div>
                        <span className="text-[var(--gold)] text-[9px] font-bold tracking-widest uppercase">
                          EDIT
                        </span>
                      </button>
                    </div>

                    <div>
                      <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                        Preferred end time
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setTimePickerTarget('end');
                        }}
                        className="button-editorial date-control inline-flex items-center justify-between w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm cursor-pointer hover:border-[var(--gold)] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[var(--gold)]" />
                          <span className="font-semibold text-xs text-[var(--foreground)]">
                            {endTime}
                          </span>
                        </div>
                        <span className="text-[var(--gold)] text-[9px] font-bold tracking-widest uppercase">
                          EDIT
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 4: Client Contact Details */}
              <section className="booking-section">
                <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-2 mb-4">
                  <User className="w-3.5 h-3.5" />
                  <span>04 · CLIENT CONTACT DETAILS</span>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                        Your Full Name *
                      </span>
                      <input
                        id="booking-full-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="contact-input w-full p-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)]"
                      />
                    </div>

                    <div>
                      <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                        Email Address *
                      </span>
                      <input
                        id="booking-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. priya@gmail.com"
                        className="contact-input w-full p-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                        Phone / WhatsApp
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. (905) 555-0142"
                        className="contact-input w-full p-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)]"
                      />
                    </div>

                    <div>
                      <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                        Preferred Location / Ideas
                      </span>
                      <input
                        type="text"
                        value={locationNotes}
                        onChange={(e) => setLocationNotes(e.target.value)}
                        placeholder="e.g. Toronto Harbourfront, Brampton Studio"
                        className="contact-input w-full p-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)]"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Aside: Reservation Summary (Right Column) */}
            <aside className="booking-summary lg:col-span-5 p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs self-start sticky top-24">
              <div className="eyebrow mb-2">
                <span>The details, beautifully simple</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[var(--foreground)] mb-5">
                Your commission
              </h3>

              <div className="summary-line">
                <span>Package</span>
                <strong className="text-[var(--foreground)] font-bold">{activePackage.name}</strong>
              </div>

              <div className="summary-line">
                <span>Shoot date</span>
                <strong className="text-[var(--foreground)] font-bold">{formattedDate}</strong>
              </div>

              <div className="summary-line">
                <span>Time window</span>
                <strong className="text-[var(--foreground)] font-bold">
                  {startTime} – {endTime}
                </strong>
              </div>

              <div className="summary-line">
                <span>Location</span>
                <strong className="text-[var(--foreground)] font-bold">Ontario, Canada</strong>
              </div>

              <div className="summary-line">
                <span>Package rate</span>
                <strong className="text-[var(--foreground)] font-bold">
                  ${activePackage.price} CAD
                </strong>
              </div>

              {selectedAddOns.map((addon) => (
                <div key={addon.id} className="summary-line">
                  <span>{addon.name}</span>
                  <strong className="text-[var(--gold)] font-bold">+${addon.price} CAD</strong>
                </div>
              ))}

              {!selectedAddOns.length && (
                <div className="summary-line">
                  <span>Enhancements</span>
                  <strong className="text-[var(--foreground)] font-bold">Standard inclusions</strong>
                </div>
              )}

              <div className="summary-line">
                <span>Digital rights &amp; retouching</span>
                <strong className="text-[var(--gold)] font-bold">Included ($0)</strong>
              </div>

              {/* Total */}
              <div className="summary-total">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)]">
                  TOTAL INVESTMENT
                </span>
                <b className="font-serif text-3xl font-bold text-[var(--gold)]">
                  ${grandTotal}{' '}
                  <small className="font-sans text-[10px] text-[var(--muted-foreground)] font-bold">
                    CAD
                  </small>
                </b>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="button-primary confirm-booking w-full min-h-[48px] py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

              <div className="trust-note mt-3">
                <ShieldCheck size={12} className="text-[var(--gold)]" />
                <span>Zero deposit required today · Sanjay will reach out to finalize specifics</span>
              </div>
            </aside>
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
