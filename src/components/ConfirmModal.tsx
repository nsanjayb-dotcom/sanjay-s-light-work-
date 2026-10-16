import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isDark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isDark,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    try {
      (window as any).__lenis?.stop();
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'auto';
      document.body.classList.remove('modal-open');
      try {
        (window as any).__lenis?.start();
      } catch {}
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClick();
          onCancel();
        }
      }}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity"
    >
      <div
        className={`w-full max-w-md p-6 sm:p-7 rounded-2xl border relative shadow-2xl transition-all animate-scaleUp ${
          isDark
            ? 'bg-[#0f0e0c] border-[#2a2722] text-[#f5f2eb]'
            : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17]'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onCancel();
          }}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-stone-400 hover:text-white hover:bg-white/5' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
          aria-label="Close confirmation dialog"
        >
          <X size={16} />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isDestructive ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              className="font-serif text-xl font-normal tracking-tight text-left"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              className={`text-xs leading-relaxed mt-1 text-left ${
                isDark ? 'text-stone-400' : 'text-stone-600'
              }`}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-stone-500/20">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onCancel();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-transparent text-stone-300 hover:text-white hover:bg-white/5'
                : 'bg-transparent text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isDestructive) soundEngine.playClick();
              else soundEngine.playSuccess();
              onConfirm();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
