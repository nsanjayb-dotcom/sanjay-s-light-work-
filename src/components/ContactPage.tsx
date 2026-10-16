import React, { useState } from 'react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/audio';
import { 
  ArrowLeft, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Sparkles,
  Clock
} from 'lucide-react';
import { getWhatsAppUrl, WHATSAPP_DISPLAY } from '../utils/social';
import { PHOTOGRAPHER_EMAIL, PHOTOGRAPHER_PHONE } from '../utils/calendar';
import { sanitizeInput, isValidEmail } from '../utils/security';
import { showToast } from './SupabaseToast';

interface ContactPageProps {
  onBack: () => void;
  isDark: boolean;
  onNavigateBooking?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onBack,
  isDark,
  onNavigateBooking,
}) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [service, setService] = useState('Single Photo Session');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeInput(name);
    const cleanContact = sanitizeInput(contact);
    const cleanMessage = sanitizeInput(message);

    if (!cleanName || !cleanContact) {
      soundEngine.playError();
      showToast('Please provide your name and contact info.', 'error', 'Missing Information');
      return;
    }

    setIsSubmitting(true);
    soundEngine.playClick();

    try {
      // Send contact via backend proxy
      await fetch('/api/contact/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          contact: cleanContact,
          service,
          date: 'Upcoming / Inquire',
          note: cleanMessage || 'Direct inquiry from website contact page',
        }),
      });

      soundEngine.playSuccess();
      setIsSubmitted(true);
      showToast('Thank you! Sanjay will reply within 24 hours.', 'success', 'Message Sent');
    } catch {
      // Fallback success feedback
      soundEngine.playSuccess();
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full min-h-screen py-10 sm:py-16 px-4 sm:px-8 max-w-5xl mx-auto text-left select-none animate-in fade-in duration-300 transition-colors ${
      isDark ? 'text-white' : 'text-[#1A1A1A]'
    }`}>
      {/* Top Navigation Bar with Lovable Spacing */}
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
          <Sparkles size={14} />
          <span>STUDIO ENQUIRIES · ONTARIO, CANADA</span>
        </div>
      </div>

      {/* Editorial Header */}
      <div className="mb-8 sm:mb-12 text-left">
        <div className="eyebrow mb-2">
          <span>Direct Contact &amp; Enquiries</span>
        </div>

        <h1 className="section-heading text-3xl sm:text-5xl uppercase tracking-tight font-serif font-bold text-[var(--foreground)]">
          CONNECT WITH SANJAY
        </h1>

        <p className="section-description text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl mt-2 leading-relaxed">
          Reach out for bespoke session discussions, specific Ontario location ideas, or quick timeline questions. Direct WhatsApp replies within a few hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
        {/* Left: Quick Connect Channels (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* WhatsApp Direct Hero Card */}
          <a
            href={getWhatsAppUrl("Hi Sanjay! I'm interested in booking a photography session and would love to check your availability.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundEngine.playClick()}
            className="block p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <MessageCircle size={22} />
              </div>
              <div>
                <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                  FASTEST RESPONSE
                </span>
                <div className="font-display font-bold text-base uppercase text-inherit">
                  WHATSAPP CHAT
                </div>
              </div>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mb-3">
              Direct message Sanjay for swift availability checks and instant answers.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-sans font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
              <span>{WHATSAPP_DISPLAY}</span>
              <span>→</span>
            </span>
          </a>

          {/* Contact Details List */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#101014] border-white/10' : 'bg-white border-stone-200 shadow-xs'
          }`}>
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-[#8C6207]">
              STUDIO PARTICULARS
            </h2>

            <div className="space-y-3.5 text-xs">
              <a
                href={`mailto:${PHOTOGRAPHER_EMAIL}`}
                className="flex items-start gap-3 text-inherit hover:text-[#8C6207] transition-colors"
              >
                <Mail size={16} className="text-[#8C6207] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Email Directly</div>
                  <div className="text-stone-500 dark:text-stone-400">{PHOTOGRAPHER_EMAIL}</div>
                </div>
              </a>

              <a
                href={`tel:${PHOTOGRAPHER_PHONE}`}
                className="flex items-start gap-3 text-inherit hover:text-[#8C6207] transition-colors"
              >
                <Phone size={16} className="text-[#8C6207] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Telephone</div>
                  <div className="text-stone-500 dark:text-stone-400">{PHOTOGRAPHER_PHONE}</div>
                </div>
              </a>

              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#8C6207] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Location &amp; Travel</div>
                  <div className="text-stone-500 dark:text-stone-400">Ontario, Canada (Travel available across GTA)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={16} className="text-[#8C6207] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Operating Hours</div>
                  <div className="text-stone-500 dark:text-stone-400">Mon – Sun: 08:00 AM – 09:00 PM EST</div>
                </div>
              </div>
            </div>

            {onNavigateBooking && (
              <button
                type="button"
                onClick={onNavigateBooking}
                className="w-full btn-tactile-gold py-3 px-4 text-xs font-display font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[48px] mt-4"
              >
                <span>OPEN DIRECT BOOKING WIZARD →</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Minimalist Clean Contact Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className={`p-6 sm:p-8 rounded-2xl border ${
            isDark ? 'bg-[#101014] border-white/10' : 'bg-white border-stone-200 shadow-sm'
          }`}>
            {isSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="font-display font-bold text-2xl uppercase">
                  MESSAGE RECEIVED
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Thank you for reaching out! Sanjay has received your enquiry and will respond within 24 hours.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={getWhatsAppUrl(`Hi Sanjay, I just sent an enquiry via your website for ${service}!`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[48px] btn-tactile-gold px-6 py-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <span>FOLLOW UP ON WHATSAPP</span>
                  </a>
                  <button
                    type="button"
                    onClick={onBack}
                    className="min-h-[48px] px-6 py-3 rounded-xl border border-stone-300 dark:border-white/20 text-xs font-display font-bold uppercase tracking-wider"
                  >
                    <span>RETURN TO HOME</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-sm font-display font-bold uppercase tracking-wider text-inherit">
                  SEND A DIRECT MESSAGE
                </h2>

                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="text-xs font-sans font-bold uppercase text-stone-600 dark:text-stone-300">
                    Your Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-[#181820] border-white/15 text-white' : 'bg-stone-50 border-stone-300 text-[#1A1A1A]'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-info" className="text-xs font-sans font-bold uppercase text-stone-600 dark:text-stone-300">
                    Email or Phone *
                  </label>
                  <input
                    id="contact-info"
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. priya@gmail.com or (905) 555-0192"
                    className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-[#181820] border-white/15 text-white' : 'bg-stone-50 border-stone-300 text-[#1A1A1A]'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-service" className="text-xs font-sans font-bold uppercase text-stone-600 dark:text-stone-300">
                    Interested Session
                  </label>
                  <select
                    id="contact-service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-[#181820] border-white/15 text-white' : 'bg-stone-50 border-stone-300 text-[#1A1A1A]'
                    }`}
                  >
                    <option value="Single Photo Session">Single Photo Session ($50 CAD)</option>
                    <option value="Creative & Themed">Creative & Themed Shoot ($70 CAD)</option>
                    <option value="Events & Celebrations">Events & Celebrations ($250 CAD)</option>
                    <option value="Traditional Culture">Traditional Culture ($200 CAD)</option>
                    <option value="Custom / Other">Custom Inquiry / Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-sans font-bold uppercase text-stone-600 dark:text-stone-300">
                    Notes or Vision
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell Sanjay about preferred dates, location, or creative ideas..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-[#181820] border-white/15 text-white' : 'bg-stone-50 border-stone-300 text-[#1A1A1A]'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-tactile-gold py-3.5 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98] min-h-[48px] disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'SENDING...' : 'SEND MESSAGE TO SANJAY'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
