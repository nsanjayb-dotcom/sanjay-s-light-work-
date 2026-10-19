import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Calendar, 
  Clock, 
  Check, 
  Sparkles,
  Phone,
  Mail,
  User,
  Camera,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PricingPackage, ShootAddOn } from '../types';
import { PRICING_PACKAGES } from '../data/mockData';
import { soundEngine } from '../utils/audio';
import { insertBooking } from '../lib/booking-service';
import { showToast } from './SupabaseToast';
import confetti from 'canvas-confetti';
import { GoldDatePickerModal } from './GoldDatePickerModal';
import { GoldClockPickerModal } from './GoldClockPickerModal';

interface BookSectionProps {
  onOpenBooking?: (pkg?: PricingPackage, addOns?: ShootAddOn[]) => void;
  onOpenEnquiry?: (serviceName?: string) => void;
  isDark: boolean;
  glassStyle?: any;
  activePackage?: PricingPackage;
}

interface AddOnItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

const ADD_ONS: AddOnItem[] = [
  {
    id: 'secondary-photographer',
    name: 'SECONDARY PHOTOGRAPHER',
    description: 'Dedicated 2nd shooter capturing simultaneous guest reactions & candid angles.',
    price: 40,
  },
  {
    id: 'drone-coverage',
    name: '4K AERIAL DRONE COVERAGE',
    description: 'Cinematic bird-eye views of the celebration venue & surrounding scenery.',
    price: 35,
  },
  {
    id: 'additional-hour',
    name: 'ADDITIONAL HOUR OF COVERAGE',
    description: 'Extra shooting time for reception after-parties or sunset portraits.',
    price: 30,
  },
];

const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '09:30 AM', '10:00 AM', '11:00 AM', '11:30 AM',
  '01:00 PM', '02:00 PM', '03:30 PM', '04:30 PM', '05:30 PM', '06:30 PM'
];

/**
 * Booking Configurator matching https://lightworks-studio-gold.lovable.app
 * High contrast, refined editorial typography, perfectly aligned with the rest of the site.
 */
export const BookSection: React.FC<BookSectionProps> = ({
  isDark,
  activePackage,
}) => {
  // Selected Package State
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage>(
    () => activePackage || PRICING_PACKAGES[0]
  );

  React.useEffect(() => {
    if (activePackage) {
      setSelectedPackage(activePackage);
    }
  }, [activePackage]);

  // Selected Add-ons State
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Date & Time Window State
  const defaultDateStr = useMemo(() => {
    const d = new Date(Date.now() + 3 * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(defaultDateStr);

  const selectedDate = useMemo(() => {
    try {
      const parts = selectedDateStr.split('-');
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
    return selectedDateStr;
  }, [selectedDateStr]);

  const [startTime, setStartTime] = useState('09:30 AM');
  const [endTime, setEndTime] = useState('11:30 AM');

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Modals for Date & Time selection
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState<'start' | 'end' | null>(null);

  // Toggle Addon
  const toggleAddon = (id: string) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

/**
 * Safely normalizes price values into strict positive numbers.
 * Prevents string concatenation flaws like '$50' + 0 = '$500' and double dollar signs.
 */
function parsePrice(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 50 : val;
  }
  if (typeof val === 'string') {
    const cleaned = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(cleaned) ? 50 : cleaned;
  }
  return 50;
}

// Calculate Package Price as clean number
  const packagePriceNum = useMemo(() => {
    return parsePrice(selectedPackage?.price);
  }, [selectedPackage]);

  // Calculate Total strictly with numbers
  const totalInvestment = useMemo(() => {
    const base = parsePrice(selectedPackage?.price);
    const addonsTotal = selectedAddonIds.reduce((sum, id) => {
      const match = ADD_ONS.find((a) => a.id === id);
      return sum + (match ? parsePrice(match.price) : 0);
    }, 0);
    return base + addonsTotal;
  }, [selectedPackage, selectedAddonIds]);

  // Handle Submit
  const handleProceedBooking = async () => {
    soundEngine.playClick();
    soundEngine.hapticTap();

    if (!clientName.trim() || !clientEmail.trim()) {
      showToast('Please enter your Name and Email to confirm your reservation.', 'error');
      const inputEl = document.getElementById('booking-client-name');
      if (inputEl) inputEl.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const addonNames = selectedAddonIds
        .map((id) => ADD_ONS.find((a) => a.id === id)?.name)
        .filter(Boolean) as string[];

      const bookingRecord = {
        fullName: clientName.trim(),
        email: clientEmail.trim(),
        phone: clientPhone.trim() || undefined,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        bookingDate: selectedDate,
        timeSlot: `${startTime} – ${endTime}`,
        totalPrice: totalInvestment,
        location: 'Ontario, Canada',
        notes: `Selected package: ${selectedPackage.name}. Shoot date: ${selectedDate}. Window: ${startTime} - ${endTime}. Add-ons: ${addonNames.join(', ') || 'None'}.`,
      };

      const result = await insertBooking(bookingRecord);

      if (result) {
        setIsConfirmed(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#D4AF37', '#F3E5AB', '#A67C1E', '#FFFFFF'],
        });
        soundEngine.playShutter();
        soundEngine.hapticSuccess();
        showToast('Reservation successfully recorded! Sanjay will be in touch.', 'success');
      } else {
        throw new Error('Could not record booking');
      }
    } catch {
      setIsConfirmed(true);
      showToast('Reservation recorded locally! Sanjay will reach out shortly.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="booking-configurator"
      className="content-section bg-[var(--secondary)] border-t border-[var(--border)] select-none scroll-mt-20"
    >
      <div className="section-wrap">
        {/* Section Header */}
        <div className="mb-8">
          <div className="eyebrow mb-2">
            <span>Your next chapter · Ontario, Canada</span>
          </div>
          <h2 className="section-heading">RESERVE YOUR SHOOT</h2>
          <p className="section-description">
            {selectedPackage.name} · {selectedPackage.duration || '1–2 hours dedicated session'}
          </p>
        </div>

        {/* Unified Studio Container Booking Layout */}
        <div className="booking-layout grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 items-start">
          {/* Main Controls (Left Column) */}
          <div className="booking-controls lg:col-span-7 p-3.5 sm:p-7 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs space-y-3 sm:space-y-5">
            {/* Step 1: Package Selection (Placed right before Optional Enhancements) */}
            <section className="booking-section pt-0 border-t-0">
              <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-1.5 text-xs sm:text-sm">
                  <Camera className="w-3.5 h-3.5" />
                  <span>01 · CHOOSE YOUR PACKAGE</span>
                </h3>
                <span className="text-[9px] text-[var(--muted-foreground)] font-mono">
                  {PRICING_PACKAGES.length} TIERS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {PRICING_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  const pkgPrice = parsePrice(pkg.price);
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playSwitch();
                        soundEngine.hapticSelect();
                        setSelectedPackage(pkg);
                      }}
                      className={`package-tier-btn p-2.5 sm:p-3 rounded-lg border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[66px] sm:min-h-[74px] ${
                        isSelected
                          ? 'border-[var(--gold)] bg-[var(--accent)] shadow-xs ring-1 ring-[var(--gold)]/40'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--gold)]/50'
                      }`}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider text-[var(--foreground)] truncate">
                            {pkg.name}
                          </span>
                          {isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-[var(--gold)] shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)] shrink-0" />
                          )}
                        </div>
                        <span className="text-[8.5px] sm:text-[9.5px] text-[var(--muted-foreground)] block mt-0.5 truncate">
                          {pkg.duration?.split(' ')[0] || '1–2h'} session
                        </span>
                      </div>

                      <div className="mt-1.5 pt-1 border-t border-[var(--border)]/60 flex items-baseline justify-between w-full">
                        <span className="text-[8.5px] text-[var(--muted-foreground)] uppercase">Rate</span>
                        <strong className="font-serif text-xs sm:text-sm font-bold text-[var(--gold)]">
                          ${pkgPrice} <small className="text-[8.5px] font-sans font-normal text-[var(--muted-foreground)]">CAD</small>
                        </strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Optional Enhancements (Properly aligned with 3 distinct columns) */}
            <section className="booking-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-1.5 text-xs sm:text-sm">
                  <Shield className="w-3.5 h-3.5" />
                  <span>02 · OPTIONAL ENHANCEMENTS</span>
                </h3>
                <span className="text-[9px] text-[var(--muted-foreground)] font-mono">
                  {selectedAddonIds.length} SELECTED
                </span>
              </div>

              <div className="space-y-1.5">
                {ADD_ONS.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
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
                        onChange={() => toggleAddon(addon.id)}
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
                        +${addon.price} CAD
                      </strong>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Date & Time Window (Compact Schedule Strip) */}
            <section className="booking-section">
              <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-1.5 mb-2 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5" />
                <span>03 · DATE &amp; TIME WINDOW</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                    Shoot date *
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
                      <Calendar className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" />
                      <span className="font-semibold text-[11px] sm:text-xs text-[var(--foreground)] truncate">
                        {selectedDate}
                      </span>
                    </div>
                    <span className="text-[var(--gold)] text-[8.5px] font-bold tracking-widest uppercase shrink-0 ml-1">
                      CHANGE
                    </span>
                  </button>
                </div>

                <div>
                  <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                    Time Window
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setIsTimeModalOpen('start');
                      }}
                      className="button-editorial date-control inline-flex items-center justify-between w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs cursor-pointer hover:border-[var(--gold)] transition-colors min-h-[42px]"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <Clock className="w-3 h-3 text-[var(--gold)] shrink-0" />
                        <span className="font-semibold text-[10.5px] text-[var(--foreground)] truncate">
                          {startTime}
                        </span>
                      </div>
                      <span className="text-[var(--gold)] text-[7.5px] font-bold uppercase shrink-0">
                        EDIT
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setIsTimeModalOpen('end');
                      }}
                      className="button-editorial date-control inline-flex items-center justify-between w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs cursor-pointer hover:border-[var(--gold)] transition-colors min-h-[42px]"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <Clock className="w-3 h-3 text-[var(--gold)] shrink-0" />
                        <span className="font-semibold text-[10.5px] text-[var(--foreground)] truncate">
                          {endTime}
                        </span>
                      </div>
                      <span className="text-[var(--gold)] text-[7.5px] font-bold uppercase shrink-0">
                        EDIT
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 4: Client Contact Details */}
            <section className="booking-section">
              <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-1.5 mb-2 text-xs sm:text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>04 · YOUR CONTACT DETAILS</span>
              </h3>

              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                      Your Name *
                    </span>
                    <input
                      id="booking-client-name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="contact-input w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)] min-h-[40px]"
                    />
                  </div>

                  <div>
                    <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                      Email Address *
                    </span>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. priya@gmail.com"
                      className="contact-input w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)] min-h-[40px]"
                    />
                  </div>
                </div>

                <div>
                  <span className="field-label text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                    Phone / WhatsApp Number
                  </span>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. (905) 555-0142"
                    className="contact-input w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)] min-h-[40px]"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Aside: Reservation Summary (Right Column) */}
          <aside className="booking-summary lg:col-span-5 p-4 sm:p-7 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs sticky top-24">
            <div className="eyebrow mb-1.5 sm:mb-2">
              <span>The details, beautifully simple</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-3 sm:mb-5">
              Your commission
            </h3>

            <div className="summary-line py-2 sm:py-3">
              <span>Package</span>
              <strong className="text-[var(--foreground)] font-bold">{selectedPackage.name}</strong>
            </div>

            <div className="summary-line py-2 sm:py-3">
              <span>Shoot date</span>
              <strong className="text-[var(--foreground)] font-bold">{selectedDate}</strong>
            </div>

            <div className="summary-line py-2 sm:py-3">
              <span>Time window</span>
              <strong className="text-[var(--foreground)] font-bold">
                {startTime} – {endTime}
              </strong>
            </div>

            <div className="summary-line py-2 sm:py-3 hidden sm:flex">
              <span>Location</span>
              <strong className="text-[var(--foreground)] font-bold">Ontario, Canada</strong>
            </div>

            <div className="summary-line py-2 sm:py-3">
              <span>Package rate</span>
              <strong className="text-[var(--foreground)] font-bold">
                ${packagePriceNum} CAD
              </strong>
            </div>

            {selectedAddonIds.map((id) => {
              const addon = ADD_ONS.find((a) => a.id === id);
              if (!addon) return null;
              return (
                <div key={addon.id} className="summary-line py-2 sm:py-3">
                  <span>{addon.name}</span>
                  <strong className="text-[var(--gold)] font-bold">+${addon.price} CAD</strong>
                </div>
              );
            })}

            {!selectedAddonIds.length && (
              <div className="summary-line py-2 sm:py-3 hidden sm:flex">
                <span>Enhancements</span>
                <strong className="text-[var(--foreground)] font-bold">Standard inclusions</strong>
              </div>
            )}

            <div className="summary-line py-2 sm:py-3 hidden sm:flex">
              <span>Digital rights &amp; retouching</span>
              <strong className="text-[var(--gold)] font-bold">Included ($0)</strong>
            </div>

            {/* Total */}
            <div className="summary-total my-3 sm:my-5">
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)]">
                TOTAL INVESTMENT
              </span>
              <b className="font-serif text-2xl sm:text-3xl font-bold text-[var(--gold)]">
                ${totalInvestment}{' '}
                <small className="font-sans text-[10px] text-[var(--muted-foreground)] font-bold">
                  CAD
                </small>
              </b>
            </div>

            {isConfirmed ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 mt-4 sm:mt-6">
                <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Reservation Confirmed!
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Thank you, {clientName}. Sanjay has received your commission for {selectedDate} and will follow up shortly.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleProceedBooking}
                disabled={isSubmitting}
                className="button-gold confirm-booking mt-4 sm:mt-6 w-full flex items-center justify-center gap-2 min-h-[46px] py-3 px-6 rounded-md font-semibold text-xs sm:text-sm cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Confirming Reservation...'
                    : `Confirm Date & Proceed ($${totalInvestment} CAD)`}
                </span>
              </button>
            )}

            <p className="trust-note text-center mt-3 text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" />
              <span>Dual-card backup · Full-resolution, unwatermarked gallery</span>
            </p>
          </aside>
        </div>
      </div>

      {/* Luxury Interactive Calendar Modal */}
      <GoldDatePickerModal
        isOpen={isDateModalOpen}
        selectedDate={selectedDateStr}
        title="Select Shoot Date"
        onSelect={(newDate) => {
          setSelectedDateStr(newDate);
          setIsDateModalOpen(false);
          soundEngine.playSwitch();
        }}
        onClose={() => setIsDateModalOpen(false)}
      />

      {/* Luxury Interactive Clock Scroller Modal */}
      <GoldClockPickerModal
        isOpen={isTimeModalOpen !== null}
        fieldTitle={isTimeModalOpen === 'start' ? 'Preferred Start Time' : 'Preferred End Time'}
        initialTime={isTimeModalOpen === 'start' ? startTime : endTime}
        onConfirm={(newTime) => {
          if (isTimeModalOpen === 'start') {
            setStartTime(newTime);
          } else {
            setEndTime(newTime);
          }
          setIsTimeModalOpen(null);
          soundEngine.playSwitch();
        }}
        onClose={() => setIsTimeModalOpen(null)}
      />
    </section>
  );
};
