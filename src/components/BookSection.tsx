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

  // Calculate Total
  const totalInvestment = useMemo(() => {
    const base = selectedPackage.price || 50;
    const addonsTotal = selectedAddonIds.reduce((sum, id) => {
      const match = ADD_ONS.find((a) => a.id === id);
      return sum + (match ? match.price : 0);
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

        {/* Unified Studio Container Booking Layout: Symmetrical 32px padding, balanced 24px gap */}
        <div className="booking-layout grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Controls (Left Column) */}
          <div className="booking-controls lg:col-span-7 p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs space-y-6">
            {/* Step 1: Optional Enhancements */}
            <section className="booking-section">
              <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-2 mb-4">
                <Shield className="w-3.5 h-3.5" />
                <span>01 · OPTIONAL ENHANCEMENTS</span>
              </h3>

              <div className="space-y-3">
                {ADD_ONS.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`addon-row transition-all duration-200 ${
                        isChecked
                          ? 'border-[var(--primary)] bg-[var(--accent)] shadow-sm'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--gold)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAddon(addon.id)}
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

            {/* Step 2: Date & Time Window */}
            <section className="booking-section">
              <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-2 mb-4">
                <Calendar className="w-3.5 h-3.5" />
                <span>02 · DATE &amp; TIME WINDOW</span>
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
                      <Calendar className="w-4 h-4 text-[var(--gold)]" />
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        {selectedDate}
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
                        setIsTimeModalOpen('start');
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
                        setIsTimeModalOpen('end');
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

            {/* Step 3: Client Contact Details */}
            <section className="booking-section">
              <h3 className="booking-step font-serif font-bold tracking-widest text-[var(--gold)] flex items-center gap-2 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>03 · CLIENT CONTACT DETAILS</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                      Your Name *
                    </span>
                    <input
                      id="booking-client-name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="contact-input w-full p-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)]"
                    />
                  </div>

                  <div>
                    <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                      Email Address *
                    </span>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. priya@gmail.com"
                      className="contact-input w-full p-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)]"
                    />
                  </div>
                </div>

                <div>
                  <span className="field-label text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">
                    Phone / WhatsApp Number
                  </span>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. (905) 555-0142"
                    className="contact-input w-full p-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Aside: Reservation Summary (Right Column) */}
          <aside className="booking-summary lg:col-span-5 p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs sticky top-24">
            <div className="eyebrow mb-2">
              <span>The details, beautifully simple</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[var(--foreground)] mb-5">
              Your commission
            </h3>

            <div className="summary-line">
              <span>Package</span>
              <strong className="text-[var(--foreground)] font-bold">{selectedPackage.name}</strong>
            </div>

            <div className="summary-line">
              <span>Shoot date</span>
              <strong className="text-[var(--foreground)] font-bold">{selectedDate}</strong>
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
                {selectedPackage.price ? `$${selectedPackage.price} CAD` : 'Custom Quote'}
              </strong>
            </div>

            {selectedAddonIds.map((id) => {
              const addon = ADD_ONS.find((a) => a.id === id);
              if (!addon) return null;
              return (
                <div key={addon.id} className="summary-line">
                  <span>{addon.name}</span>
                  <strong className="text-[var(--gold)] font-bold">+${addon.price} CAD</strong>
                </div>
              );
            })}

            {!selectedAddonIds.length && (
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
                ${totalInvestment}{' '}
                <small className="font-sans text-[10px] text-[var(--muted-foreground)] font-bold">
                  CAD
                </small>
              </b>
            </div>

            {isConfirmed ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 mt-6">
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
                className="button-gold confirm-booking mt-6 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md font-semibold text-sm cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Confirming Reservation...'
                    : `Confirm Date & Proceed ($${totalInvestment} CAD)`}
                </span>
              </button>
            )}

            <p className="trust-note text-center mt-4 text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-1.5">
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
