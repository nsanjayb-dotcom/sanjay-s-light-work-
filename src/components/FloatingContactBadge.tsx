import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Mail, Phone, X, Check, ArrowRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../utils/social';

interface FloatingContactBadgeProps {
  onOpenBooking: () => void;
  onOpenEnquiry?: () => void;
  isDark: boolean;
  isAnyModalOpen?: boolean;
}

/**
 * Floating contact button matching https://lightworks-studio-gold.lovable.app
 */
export const FloatingContactBadge: React.FC<FloatingContactBadgeProps> = ({
  onOpenBooking,
  isDark,
  isAnyModalOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  if (isAnyModalOpen) return null;

  const handleToggle = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    setIsOpen(!isOpen);
    setSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playShutter();
    soundEngine.hapticSuccess();
    setSubmitted(true);
  };

  return (
    <>
      {/* Floating Pill Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="button-editorial floating-contact inline-flex items-center justify-center gap-2 select-none cursor-pointer"
        aria-label="Direct Studio Contact"
      >
        <span className="availability-dot" />
        <span className="font-bold tracking-widest text-[9px] uppercase">CONTACT</span>
        <MessageCircle className="w-3 h-3" />
      </button>

      {/* Contact Drawer Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-modal bg-[var(--card)] relative shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
                <div>
                  <div className="eyebrow">
                    <span>ONTARIO, CANADA</span>
                  </div>
                  <h2 className="text-xl font-serif font-semibold text-[var(--foreground)] mt-1">
                    Connect With Sanjay
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {submitted ? (
                <div className="text-center py-6">
                  <div className="confirmation-icon flex items-center justify-center">
                    <Check className="w-8 h-8 text-[var(--gold)]" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[var(--foreground)] mt-2">
                    Inquiry Received
                  </h3>
                  <p className="confirmation-note mt-2">
                    Thank you. Sanjay responds personally within 4–6 business hours to plan your Ontario session.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="button-gold rounded-md w-full py-2.5 mt-5 text-xs font-semibold cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">
                    Have questions about dates, permits, or locations? Send a note or reach out directly.
                  </p>

                  {/* Direct Contact Links */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-editorial flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-[10px] font-bold tracking-wider uppercase text-[var(--foreground)] hover:border-[var(--gold)] transition-colors"
                    >
                      <MessageCircle className="w-3 h-3 text-[var(--gold)]" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href="tel:+19055882047"
                      className="button-editorial flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-[10px] font-bold tracking-wider uppercase text-[var(--foreground)] hover:border-[var(--gold)] transition-colors"
                    >
                      <Phone className="w-3 h-3 text-[var(--gold)]" />
                      <span>(905) 588-2047</span>
                    </a>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="contact-input"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="contact-input"
                      />
                    </div>
                    <div>
                      <textarea
                        required
                        rows={3}
                        placeholder="How can Sanjay help capture your story?"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="contact-input resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="button-gold rounded-md w-full py-2.5 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Send Direct Message</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
