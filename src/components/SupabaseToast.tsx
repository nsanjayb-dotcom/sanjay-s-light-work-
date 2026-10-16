import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

// Global Custom Event Dispatcher for Toast Feedback
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent<ToastMessage>('supabase-toast-event', {
      detail: {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title,
        message,
        duration: 4500,
      },
    });
    window.dispatchEvent(event);
  }
}

export const SupabaseToastContainer: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setToasts((prev) => [...prev, newToast]);

        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration || 4500);
      }
    };

    window.addEventListener('supabase-toast-event', handleToastEvent);
    return () => window.removeEventListener('supabase-toast-event', handleToastEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-2.5 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-start gap-3 transition-all animate-slideUp ${
            toast.type === 'success'
              ? isDark
                ? 'bg-[#15151A] border-emerald-500/40 text-white'
                : 'bg-white border-emerald-600/40 text-stone-900'
              : toast.type === 'error'
                ? isDark
                  ? 'bg-[#181113] border-rose-500/50 text-white'
                  : 'bg-white border-rose-500/60 text-stone-900'
                : isDark
                  ? 'bg-[#15151A] border-amber-400/30 text-white'
                  : 'bg-white border-amber-500/40 text-stone-900'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle size={18} className="text-rose-500" />}
            {toast.type === 'info' && <ShieldCheck size={18} className="text-amber-500" />}
          </div>

          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-xs font-sans font-bold uppercase tracking-wider mb-0.5">
                {toast.title}
              </h4>
            )}
            <p className="text-xs font-sans leading-relaxed opacity-90">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="shrink-0 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
