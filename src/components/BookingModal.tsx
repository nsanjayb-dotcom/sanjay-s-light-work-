import React, { useState, useEffect } from 'react';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  X, 
  Send, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  MessageSquare,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Clock,
  Camera,
  Heart,
  Palette,
  Users,
  AlertCircle
} from 'lucide-react';
import { sanitizeInput, isValidEmail } from '../utils/security';
import { getWhatsAppUrl, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../utils/social';
import { insertBooking } from '../lib/booking-service';
import { showToast } from './SupabaseToast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  selectedPackage?: any;
  selectedAddOns?: any[];
  onBookingConfirmed?: (booking: any) => void;
}

const QUICK_SESSION_TYPES = [
  { id: 'portrait', label: 'Portraits & Couples', icon: Heart },
  { id: 'creative', label: 'Themed / Editorial', icon: Palette },
  { id: 'family', label: 'Traditional & Heritage', icon: Sparkles },
  { id: 'event', label: 'Celebration / Event', icon: Users },
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
  selectedPackage,
  onBookingConfirmed,
}) => {
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState(''); // Email or Phone in one smart input
  const [selectedType, setSelectedType] = useState('Portraits & Couples');
  const [timeframe, setTimeframe] = useState('Flexible / Next 2 Months');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<any>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Sync default package name if passed
  useEffect(() => {
    if (selectedPackage?.name) {
      setSelectedType(selectedPackage.name);
    }
  }, [selectedPackage]);

  // Enhanced body scroll lock and Escape key dismiss (locks Lenis & document body)
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    try {
      (window as any).__lenis?.stop();
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundEngine.playClick();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'auto';
      document.body.style.touchAction = originalTouchAction || 'auto';
      document.body.classList.remove('modal-open');
      try {
        (window as any).__lenis?.start();
      } catch {}
    };
  }, [isOpen]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setIsShaking(false);
      setAttemptedSubmit(false);
      setConflictError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    soundEngine.playClick();
    document.body.style.overflow = 'auto';
    onClose();
  };

  const triggerShake = () => {
    try {
      soundEngine.playError();
    } catch {}
    setIsShaking(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsShaking(true);
      });
    });
    setTimeout(() => {
      setIsShaking(false);
    }, 550);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setConflictError(null);

    const cleanFullName = sanitizeInput(fullName);
    const cleanContact = sanitizeInput(contactInfo);
    const cleanMessage = sanitizeInput(message);

    const isNameValid = !!cleanFullName;
    // Check if contactInfo is either a valid email or contains reasonable digits for phone
    const isContactValid = !!cleanContact && (
      isValidEmail(cleanContact) || cleanContact.replace(/[^0-9]/g, '').length >= 7
    );

    if (!isNameValid || !isContactValid) {
      triggerShake();
      return;
    }

    setIsSubmitting(true);

    const clientEmail = isValidEmail(cleanContact) ? cleanContact : 'client@sanjayslightworks.com';
    const clientPhone = !isValidEmail(cleanContact) ? cleanContact : undefined;
    const targetDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

    try {
      // 1. Post atomically via Supabase RPC insertBooking (guarantees race condition prevention)
      const res = await insertBooking({
        fullName: cleanFullName,
        email: clientEmail,
        phone: clientPhone,
        packageId: selectedPackage?.id || 'portrait',
        packageName: selectedType,
        bookingDate: targetDate,
        timeSlot: timeframe || 'Morning Natural Light (09:30 AM)',
        location: 'Ontario, Canada',
        notes: cleanMessage || `Session inquiry for ${selectedType} (${timeframe})`,
        totalPrice: selectedPackage?.price || 50,
      });

      if (!res.success) {
        if (res.isConflict) {
          triggerShake();
          setConflictError(res.message);
          showToast(res.message, 'error', 'Slot Already Reserved');
        } else {
          showToast(res.message || 'Unable to submit reservation inquiry.', 'error', 'Booking Notice');
        }
        setIsSubmitting(false);
        return;
      }

      // 2. Successful RPC transaction
      soundEngine.playSuccess();
      soundEngine.hapticSuccess();

      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.55 },
          colors: ['#D4AF37', '#1A1A1A', '#FAF8F5', '#8C6207'],
        });
      } catch {
        // safe fallback
      }

      const currentDetails = {
        bookingId: res.bookingId || `RES-${Date.now().toString(36).toUpperCase()}`,
        fullName: cleanFullName,
        contact: cleanContact,
        sessionType: selectedType,
        timeframe,
        message: cleanMessage || 'Interested in booking or checking open shoot dates.',
        status: res.status || 'confirmed',
      };

      setLastSubmitted(currentDetails);
      setIsSubmitted(true);
      showToast(res.message || 'Session inquiry confirmed!', 'success', 'Session Reserved');

      // Dispatch server proxy notification in background
      try {
        fetch('/api/contact/enquire', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: cleanFullName,
            email: clientEmail,
            phone: clientPhone || 'Provided via form',
            service: `${selectedType} (${timeframe})`,
            message: cleanMessage || `Interested in ${selectedType}. Preferred window: ${timeframe}. Ref: ${res.bookingId}`,
          }),
        }).catch(err => console.warn('Server dispatch notice:', err));
      } catch (err) {
        console.warn('Server fetch error:', err);
      }

      if (onBookingConfirmed) {
        onBookingConfirmed({
          id: res.bookingId || `ENQ-${Date.now().toString(36).toUpperCase()}`,
          clientName: cleanFullName,
          clientEmail: clientEmail,
          clientPhone: cleanContact,
          packageName: selectedType,
          preferredDate: timeframe,
          location: 'Ontario, Canada',
          notes: cleanMessage,
          totalPrice: selectedPackage?.price || 0,
          depositPaid: false,
          status: 'confirmed',
        } as any);
      }
    } catch (err: any) {
      console.warn('[Supabase BookingModal] Exception:', err);
      showToast('An unexpected issue occurred. Please try again.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppMessageUrl = () => {
    const details = lastSubmitted || { fullName, contact: contactInfo, sessionType: selectedType, timeframe, message };
    const text = `Hi Sanjay! Reaching out from your website:\n• Name: ${details.fullName || 'Client'}\n• Contact: ${details.contact || 'Not provided'}\n• Session: ${details.sessionType}\n• Timeline: ${details.timeframe}${details.message ? `\n• Note: ${details.message}` : ''}`;
    return getWhatsAppUrl(text);
  };

  return (
    <div
      id="booking-modal-overlay"
      className="booking-modal-overlay fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity pt-16 sm:pt-6 pb-0 sm:pb-6 overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Zero-Scroll Optimized Mobile Card / Bottom Sheet (max-h leaves room for header) */}
      <div
        id="booking-modal"
        className={`inquiry-modal-card relative w-full sm:max-w-lg bg-[#FAF7F0] text-[#1A1A1A] sm:rounded-2xl rounded-t-2xl shadow-2xl border border-stone-300 transition-all flex flex-col max-h-[calc(100dvh-4.25rem)] sm:max-h-[85vh] overflow-hidden ${
          isShaking ? 'shake-error form-shake-error' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator Bar */}
        <div className="w-12 h-1.5 rounded-full bg-stone-300 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Sticky Header with Backdrop Blur and Distinct Close (X) Icon */}
        <div className="sticky top-0 z-20 px-5 pt-3 pb-3 sm:pt-4 sm:pb-3.5 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-stone-200/90 flex items-center justify-between shrink-0">
          <div className="space-y-0.5 text-left">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-widest uppercase text-[#8C6207]">
              <Sparkles size={11} className="text-[#8C6207]" />
              <span>DIRECT INQUIRY · ONTARIO</span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1A1A1A] tracking-tight uppercase leading-tight">
              RESERVE WITH SANJAY
            </h2>
          </div>

          {/* Distinct Close Button with 48px Touch Target & High Contrast */}
          <button
            type="button"
            id="booking-modal-close-btn"
            onClick={handleClose}
            aria-label="Close Reserve Dialog"
            className="min-w-[48px] min-h-[48px] w-12 h-12 -mr-1.5 rounded-full flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-200/80 active:bg-stone-300 cursor-pointer active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X size={22} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        {isSubmitted ? (
          /* Zero-scroll Success Confirmation View */
          <div className="p-6 sm:p-7 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={30} />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-sans font-bold tracking-widest uppercase text-[#8C6207]">
                INQUIRY DELIVERED
              </span>
              <h3 className="font-display font-bold text-2xl text-[#1A1A1A] tracking-tight uppercase">
                THANK YOU, {lastSubmitted?.fullName?.split(' ')[0] || 'FRIEND'}!
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 max-w-sm mx-auto leading-relaxed">
                Your message has been sent directly to Sanjay. You'll receive a personal response within 24 hours.
              </p>
            </div>

            {/* Quick summary pill */}
            <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-xs text-left space-y-1.5 shadow-xs">
              <div className="flex justify-between text-stone-600">
                <span>Booking Ref:</span>
                <span className="font-mono font-bold text-[#8C6207]">{lastSubmitted?.bookingId || 'CONFIRMED'}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Session:</span>
                <span className="font-bold text-black">{lastSubmitted?.sessionType}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Contact:</span>
                <span className="font-bold text-black">{lastSubmitted?.contact}</span>
              </div>
            </div>

            {/* Action buttons with min 48px touch targets */}
            <div className="space-y-2 pt-1">
              <a
                href={getWhatsAppMessageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEngine.playClick()}
                className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <MessageCircle size={16} />
                <span>CHAT INSTANTLY ON WHATSAPP</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl border border-stone-300 bg-white text-stone-800 font-display font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                RETURN TO WEBSITE
              </button>
            </div>
          </div>
        ) : (
          /* Streamlined Form with min 48px touch target inputs */
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-y-auto p-4 sm:p-5 pt-3 space-y-3.5 text-left"
          >
            {/* 1. Quick Session Selector (Single tap, 48px min height per option) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between">
                <span>1. Select Shoot Type</span>
                <span className="text-[10px] text-[#8C6207] font-semibold lowercase">tap to select</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_SESSION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType.toLowerCase().includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playSwitch();
                        soundEngine.hapticSelect();
                        setSelectedType(type.label);
                      }}
                      className={`min-h-[48px] py-2 px-3 rounded-xl border text-xs font-sans font-semibold flex items-center gap-2 transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isSelected
                          ? 'bg-[#FAF6ED] border-[#8C6207] text-[#8C6207] ring-1 ring-[#8C6207]/40 font-bold shadow-xs'
                          : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      <Icon size={15} className={isSelected ? 'text-[#8C6207]' : 'text-stone-500'} />
                      <span className="truncate">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Client Name & Contact Info with min 48px inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label
                  htmlFor="inquiry-client-name"
                  className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1">
                    <User size={12} className="text-[#8C6207]" />
                    <span>Your Name *</span>
                  </span>
                  {attemptedSubmit && !fullName.trim() && (
                    <span className="text-[10px] text-rose-600 font-semibold lowercase">required</span>
                  )}
                </label>
                <input
                  id="inquiry-client-name"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-white text-[#1A1A1A] font-sans font-medium placeholder-stone-400 focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                    attemptedSubmit && !fullName.trim()
                      ? 'border-rose-500 focus:ring-rose-500 input-error-highlight'
                      : 'border-stone-300 focus:ring-[#8C6207]'
                  }`}
                />
              </div>

              {/* Email or Phone in one convenient field */}
              <div className="space-y-1">
                <label
                  htmlFor="inquiry-client-contact"
                  className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-[#8C6207]" />
                    <span>Email or Phone *</span>
                  </span>
                  {attemptedSubmit && !contactInfo.trim() && (
                    <span className="text-[10px] text-rose-600 font-semibold lowercase">required</span>
                  )}
                </label>
                <input
                  id="inquiry-client-contact"
                  name="contact"
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="email@domain.com or (905) 555-0199"
                  className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-white text-[#1A1A1A] font-sans font-medium placeholder-stone-400 focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                    attemptedSubmit && !contactInfo.trim()
                      ? 'border-rose-500 focus:ring-rose-500 input-error-highlight'
                      : 'border-stone-300 focus:ring-[#8C6207]'
                  }`}
                />
              </div>
            </div>

            {/* 3. Preferred Timeline Buttons with min 48px height */}
            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1">
                <Clock size={12} className="text-[#8C6207]" />
                <span>Preferred Timeline</span>
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  'This Month',
                  'Next 2 Months',
                  'Flexible / Planning'
                ].map((time) => {
                  const isSelected = timeframe === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        soundEngine.playSwitch();
                        setTimeframe(time);
                      }}
                      className={`min-h-[48px] py-2 px-2 rounded-xl border text-[11px] font-sans font-semibold text-center transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isSelected
                          ? 'bg-[#8C6207] text-white border-[#8C6207] shadow-xs font-bold'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Optional Note Field */}
            <div className="space-y-1">
              <label
                htmlFor="inquiry-message"
                className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} className="text-[#8C6207]" />
                  <span>Notes / Vision (Optional)</span>
                </span>
                <span className="text-[10px] text-stone-500 lowercase font-normal">locations, questions, ideas</span>
              </label>
              <textarea
                id="inquiry-message"
                name="message"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Looking for outdoor golden hour shots in GTA / Ontario..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white text-[#1A1A1A] font-sans font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6207] shadow-xs resize-none min-h-[52px]"
              />
            </div>

            {/* Validation Feedback Warning */}
            {conflictError && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-medium flex items-start gap-1.5 animate-fadeIn">
                <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block uppercase tracking-wider text-[9px] text-amber-800">Time Window Conflict</span>
                  <span>{conflictError}</span>
                </div>
              </div>
            )}

            {attemptedSubmit && (!fullName.trim() || !contactInfo.trim()) && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span>Please fill in your name and contact details above.</span>
              </div>
            )}

            {/* Sticky/Pinned Submit & Direct WhatsApp Row */}
            <div className="pt-2 border-t border-stone-200/90 space-y-2 shrink-0 pb-1">
              <button
                type="submit"
                id="enquiry-modal-submit-btn"
                disabled={isSubmitting}
                className="btn-tactile-gold w-full py-3.5 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[48px]"
              >
                <Send size={15} />
                <span>{isSubmitting ? 'DISPATCHING...' : 'CONFIRM INQUIRY'}</span>
              </button>

              {/* Direct Alternative: One-tap WhatsApp */}
              <div className="flex items-center justify-between text-[11px] font-sans text-stone-600 px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#8C6207]" />
                  <span>Personal response in 24h</span>
                </span>

                <a
                  href={getWhatsAppUrl(`Hi Sanjay! Inquiring about a ${selectedType} session.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer min-h-[36px] flex items-center"
                  onClick={() => soundEngine.playClick()}
                >
                  <MessageCircle size={13} />
                  <span>Or text WhatsApp</span>
                </a>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
