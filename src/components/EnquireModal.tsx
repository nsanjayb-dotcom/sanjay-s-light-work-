import React, { useState } from 'react';
import { soundEngine } from '../utils/audio';
import { X, MessageCircle, Send, CheckCircle2, Calendar, User, Phone, Mail, Sparkles, Heart, Palette, Users } from 'lucide-react';
import { getWhatsAppUrl } from '../utils/social';
import { PHOTOGRAPHER_EMAIL } from '../utils/calendar';
import { sanitizeInput, isValidEmail } from '../utils/security';

interface EnquireModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
  isDark: boolean;
}

const QUICK_SERVICES = [
  'Portraits & Couples',
  'Themed / Creative',
  'Traditional Heritage',
  'Celebration / Event'
];

export const EnquireModal: React.FC<EnquireModalProps> = ({
  isOpen,
  onClose,
  defaultService = 'Portraits & Couples',
  isDark,
}) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [service, setService] = useState(defaultService);
  const [timeline, setTimeline] = useState('Flexible / Upcoming');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<any>(null);

  // Escape key handler and body scroll lock (synchronized with Lenis)
  React.useEffect(() => {
    if (!isOpen) return;
    setIsShaking(false);
    setAttemptedSubmit(false);
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

  const handleWhatsAppEnquiry = () => {
    setAttemptedSubmit(true);
    const cleanName = sanitizeInput(name);
    const cleanContact = sanitizeInput(contact);
    const cleanNote = sanitizeInput(note);

    if (!cleanName || !cleanContact) {
      triggerShake();
      return;
    }
    soundEngine.playSuccess();
    const details = {
      name: cleanName || 'Friend',
      contact: cleanContact || 'Not provided',
      service,
      date: timeline,
      note: cleanNote || 'Tell me about pricing & upcoming open dates!',
    };
    setLastSubmitted(details);

    // Send server-side proxy notification
    try {
      fetch('/api/contact/enquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: details.name,
          phone: details.contact,
          email: isValidEmail(details.contact) ? details.contact : undefined,
          service: `${details.service} (${details.date})`,
          date: details.date,
          message: details.note,
        }),
      }).catch((e) => console.warn('Server inquiry dispatch caught:', e));
    } catch (e) {}

    const message = `Hi Sanjay! I'd like to ask about availability for a shoot.\n\n• Name: ${details.name}\n• Contact: ${details.contact}\n• Service: ${details.service}\n• Target Timeline: ${details.date}${details.note ? `\n• Details: ${details.note}` : ''}`;

    // Safe navigation avoiding window.open in iframe environments
    const waUrl = getWhatsAppUrl(message);
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    setSubmitted(true);
  };

  const handleEmailEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    const cleanName = sanitizeInput(name);
    const cleanContact = sanitizeInput(contact);
    const cleanNote = sanitizeInput(note);

    if (!cleanName || !cleanContact) {
      triggerShake();
      return;
    }

    soundEngine.playSuccess();

    const details = {
      name: cleanName || 'Valued Client',
      contact: cleanContact || 'Not provided',
      service,
      date: timeline,
      note: cleanNote || 'Shoot enquiry',
    };
    setLastSubmitted(details);

    try {
      fetch('/api/contact/enquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: details.name,
          phone: details.contact,
          email: isValidEmail(details.contact) ? details.contact : undefined,
          service: `${details.service} (${details.date})`,
          date: details.date,
          message: details.note,
        }),
      })
      .then((res) => res.json())
      .catch((err) => console.warn('Server dispatch error:', err));
    } catch (err) {
      console.warn('Server request caught:', err);
    }

    setSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Direct Commission Inquiry"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="global-modal-overlay fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity pt-16 sm:pt-6 pb-0 sm:pb-6 overscroll-contain"
    >
      {/* Zero-Scroll Streamlined Mobile Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full sm:max-w-lg bg-[#FAF7F0] text-[#1A1A1A] sm:rounded-2xl rounded-t-2xl shadow-2xl border border-stone-300 transition-all flex flex-col max-h-[calc(100dvh-4.25rem)] sm:max-h-[85vh] overflow-hidden ${
          isShaking ? 'shake-error form-shake-error' : ''
        }`}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-stone-300 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Sticky Header with 48px close button */}
        <div className="sticky top-0 z-20 px-5 pt-3 pb-3 sm:pt-4 sm:pb-3.5 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-stone-200/90 flex items-center justify-between shrink-0">
          <div className="space-y-0.5 text-left">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-widest uppercase text-[#8C6207]">
              <Sparkles size={11} className="text-[#8C6207]" />
              <span>DIRECT COMMISSION · ONTARIO</span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1A1A1A] tracking-tight uppercase leading-tight">
              COMMISSION A SESSION
            </h2>
          </div>

          <button
            type="button"
            id="close-enquire-modal"
            onClick={handleClose}
            aria-label="Close Dialog"
            className="min-w-[48px] min-h-[48px] w-12 h-12 -mr-1.5 rounded-full flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-200/80 active:bg-stone-300 cursor-pointer active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X size={22} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Body Content */}
        {submitted ? (
          <div className="p-6 sm:p-7 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto text-left">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={30} />
            </div>

            <div className="space-y-1 text-center">
              <span className="text-[11px] font-sans font-bold tracking-widest uppercase text-[#8C6207]">
                COMMISSION NOTE SENT
              </span>
              <h3 className="font-display font-bold text-2xl text-[#1A1A1A] tracking-tight uppercase">
                WE'LL BE IN TOUCH!
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 max-w-sm mx-auto leading-relaxed">
                Thank you, {lastSubmitted?.name}! Sanjay has received your request and will reply shortly.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-xs space-y-1.5 shadow-xs">
              <div className="flex justify-between text-stone-600">
                <span>Category:</span>
                <span className="font-bold text-black">{lastSubmitted?.service}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Contact:</span>
                <span className="font-bold text-black">{lastSubmitted?.contact}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 px-4 rounded-xl btn-tactile-gold font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md text-center"
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleEmailEnquiry}
            className="flex flex-col flex-1 overflow-y-auto sm:overflow-visible p-4 sm:p-5 pt-3 space-y-3 text-left"
          >
            {/* Quick Service Selection Chips */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between">
                <span>1. Shoot Category</span>
                <span className="text-[10px] text-[#8C6207] font-semibold lowercase">tap to select</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_SERVICES.map((s) => {
                  const isSelected = service === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        soundEngine.playSwitch();
                        setService(s);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-sans font-semibold text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF6ED] border-[#8C6207] text-[#8C6207] ring-1 ring-[#8C6207]/30 font-bold shadow-xs'
                          : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      <span className="truncate">{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs: Name & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User size={12} className="text-[#8C6207]" />
                    <span>Your Name *</span>
                  </span>
                  {attemptedSubmit && !name.trim() && (
                    <span className="text-[10px] text-rose-600 font-semibold lowercase">required</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-white text-[#1A1A1A] font-sans font-medium placeholder-stone-400 focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                    attemptedSubmit && !name.trim()
                      ? 'border-rose-500 focus:ring-rose-500 input-error-highlight'
                      : 'border-stone-300 focus:ring-[#8C6207]'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-[#8C6207]" />
                    <span>Email or Phone *</span>
                  </span>
                  {attemptedSubmit && !contact.trim() && (
                    <span className="text-[10px] text-rose-600 font-semibold lowercase">required</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Phone or Email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-white text-[#1A1A1A] font-sans font-medium placeholder-stone-400 focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                    attemptedSubmit && !contact.trim()
                      ? 'border-rose-500 focus:ring-rose-500 input-error-highlight'
                      : 'border-stone-300 focus:ring-[#8C6207]'
                  }`}
                />
              </div>
            </div>

            {/* Target Timeline Chips with min 48px */}
            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800">
                Target Timeline
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['This Month', 'Next 1-2 Mo.', 'Flexible'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      soundEngine.playSwitch();
                      setTimeline(t);
                    }}
                    className={`min-h-[48px] py-2 px-2 rounded-xl border text-[11px] font-sans font-semibold text-center transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      timeline === t
                        ? 'bg-[#8C6207] text-white border-[#8C6207] shadow-xs font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-800">
                Vision / Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Preferred venue, outdoor/studio, aesthetic ideas..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white text-[#1A1A1A] font-sans font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8C6207] shadow-xs resize-none min-h-[52px]"
              />
            </div>

            {/* Validation Feedback */}
            {attemptedSubmit && (!name.trim() || !contact.trim()) && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span>Please provide your name and phone/email.</span>
              </div>
            )}

            {/* Dual Action Buttons with min 48px height */}
            <div className="pt-2 border-t border-stone-200/90 flex flex-col sm:flex-row gap-2 shrink-0 pb-1">
              <button
                type="submit"
                id="enquire-send-btn"
                className="btn-tactile-gold flex-1 py-3.5 px-4 text-xs font-display font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[48px]"
              >
                <Send size={14} />
                <span>SEND COMMISSION NOTE</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppEnquiry}
                className="flex-1 py-3 px-4 border border-[#25D366]/40 bg-[#25D366]/10 text-emerald-800 font-display font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              >
                <MessageCircle size={15} />
                <span>TEXT ON WHATSAPP</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
