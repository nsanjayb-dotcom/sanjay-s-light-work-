import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { soundEngine } from '../utils/audio';
import { Clock, Check, X } from 'lucide-react';

interface GoldClockPickerModalProps {
  isOpen: boolean;
  initialTime?: string; // e.g. "09:30 AM"
  fieldTitle: string; // "Preferred Start Time" or "Preferred End Time"
  onConfirm: (formattedTime: string) => void;
  onClose: () => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export const GoldClockPickerModal: React.FC<GoldClockPickerModalProps> = ({
  isOpen,
  initialTime = '09:30 AM',
  fieldTitle,
  onConfirm,
  onClose,
}) => {
  // Parse initial time string
  const parseTimeString = (str: string) => {
    let hour = 9;
    let minute = 30;
    let period: 'AM' | 'PM' = 'AM';

    const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
      if (match[3]) {
        period = match[3].toUpperCase() as 'AM' | 'PM';
      }
    }
    if (hour < 1) hour = 12;
    if (hour > 12) hour = 12;
    if (minute < 0) minute = 0;
    if (minute > 59) minute = 59;

    return { hour, minute, period };
  };

  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(30);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  // Restore background scrolling safely
  const restorePageScrolling = useCallback(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (typeof window !== 'undefined' && (window as any).__lenis) {
      try {
        (window as any).__lenis.start();
      } catch (e) {
        // safe fallback
      }
    }
  }, []);

  const handleClose = useCallback(() => {
    soundEngine.playClick();
    restorePageScrolling();
    onClose();
  }, [onClose, restorePageScrolling]);

  // Sync state whenever modal opens and scroll selected items into view
  useEffect(() => {
    if (isOpen) {
      const parsed = parseTimeString(initialTime);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setPeriod(parsed.period);

      if (typeof window !== 'undefined' && (window as any).__lenis) {
        try {
          (window as any).__lenis.stop();
        } catch (e) {
          // safe fallback
        }
      }

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Auto-scroll selected hour & minute to center of column
      const scrollTimer = setTimeout(() => {
        if (hourListRef.current) {
          const selectedHourEl = hourListRef.current.querySelector(`[data-hour="${parsed.hour}"]`) as HTMLElement;
          if (selectedHourEl) {
            selectedHourEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        if (minuteListRef.current) {
          const selectedMinuteEl = minuteListRef.current.querySelector(`[data-minute="${parsed.minute}"]`) as HTMLElement;
          if (selectedMinuteEl) {
            selectedMinuteEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 50);

      return () => {
        clearTimeout(scrollTimer);
        document.body.style.overflow = prevOverflow || '';
        document.documentElement.style.overflow = '';
        if (typeof window !== 'undefined' && (window as any).__lenis) {
          try {
            (window as any).__lenis.start();
          } catch (e) {
            // safe fallback
          }
        }
      };
    }
  }, [isOpen, initialTime]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const formattedHour = String(selectedHour).padStart(2, '0');
  const formattedMinute = String(selectedMinute).padStart(2, '0');
  const formattedDisplayTime = `${formattedHour} : ${formattedMinute} ${period}`;
  const finalTimeValue = `${formattedHour}:${formattedMinute} ${period}`;

  const handleSelectHour = (h: number) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    setSelectedHour(h);
  };

  const handleSelectMinute = (m: number) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    setSelectedMinute(m);
  };

  const handleConfirm = () => {
    soundEngine.playSuccess();
    soundEngine.hapticSuccess();
    restorePageScrolling();
    onConfirm(finalTimeValue);
  };

  const modalContent = (
    <div
      id="clock-modal-overlay"
      data-lenis-prevent="true"
      className="clock-modal-overlay fixed inset-0 z-[10000002] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000002,
        overscrollBehavior: 'contain',
      }}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Time Picker Card with guaranteed overflow: hidden & padding-bottom: 20px */}
      <div
        id="clock-modal-card"
        data-lenis-prevent="true"
        className="clock-modal-card relative w-full max-w-[360px] rounded-2xl bg-[#FAF8F5] text-[#1A1A1A] p-5 shadow-2xl border border-[#C5A059]/70 text-center select-none my-auto flex flex-col"
        style={{
          overflow: 'hidden',
          paddingBottom: '20px',
          boxSizing: 'border-box',
          overscrollBehavior: 'contain',
        }}
        onWheel={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white border border-stone-300 text-[#1A1A1A] hover:bg-stone-100 flex items-center justify-center shadow-xs cursor-pointer transition-all hover:scale-105 z-30"
          aria-label="Close Time Picker"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="text-left border-b border-stone-200 pb-2.5 mb-3 pr-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-widest text-[#8C6207] uppercase">
              <Clock size={12} className="text-[#8C6207]" />
              <span>EXACT TIME SELECTOR</span>
            </div>
            <h3 className="font-display font-bold text-base sm:text-lg text-[#1A1A1A] uppercase tracking-tight mt-0.5">
              {fieldTitle}
            </h3>
          </div>
          <div className="bg-[#FAF6ED] px-2.5 py-1 rounded-lg border border-[#C5A059]/50 text-right">
            <span className="text-[9px] font-sans font-bold uppercase text-stone-500 block">SELECTED:</span>
            <span className="text-xs font-mono font-black text-[#8C6207]">{finalTimeValue}</span>
          </div>
        </div>

        {/* Live Digital Preview & AM/PM Toggle */}
        <div className="flex items-center justify-between bg-white border border-[#C5A059] rounded-xl px-3.5 py-2 mb-3 shadow-xs">
          {/* Prominent Large Digital Display */}
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-[#1A1A1A]">
              {formattedHour}
            </span>
            <span className="font-sans text-xl font-bold text-[#8C6207] animate-pulse">:</span>
            <span className="font-sans text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-[#1A1A1A]">
              {formattedMinute}
            </span>
            <span className="font-sans text-xs font-bold text-[#8C6207] ml-1.5 uppercase">
              {period}
            </span>
          </div>

          {/* AM / PM High-Contrast Gold Toggle Pills */}
          <div className="flex rounded-lg border border-[#C5A059] overflow-hidden bg-[#FAF8F5] p-0.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitch();
                setPeriod('AM');
              }}
              className={`px-3 py-1 text-xs font-sans font-extrabold uppercase transition-all cursor-pointer rounded-md ${
                period === 'AM'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitch();
                setPeriod('PM');
              }}
              className={`px-3 py-1 text-xs font-sans font-extrabold uppercase transition-all cursor-pointer rounded-md ${
                period === 'PM'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Customizable Minute Adjustment Controls (No Fixed Presets) */}
        <div className="flex items-center justify-between gap-1 mb-2.5 px-0.5">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500">
            Adjust Minute:
          </span>
          <div className="flex items-center gap-1">
            {[
              { label: '-5m', delta: -5 },
              { label: '-1m', delta: -1 },
              { label: '+1m', delta: 1 },
              { label: '+5m', delta: 5 },
            ].map((adj) => (
              <button
                key={adj.label}
                type="button"
                onClick={() => {
                  soundEngine.playSwitch();
                  setSelectedMinute((prev) => {
                    let next = prev + adj.delta;
                    if (next < 0) next = 60 + next;
                    if (next >= 60) next = next % 60;
                    return next;
                  });
                }}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border bg-white text-stone-700 border-stone-200 hover:border-[#C5A059] active:scale-95"
              >
                {adj.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Wheel / Scroll Selector: Hour Column & Minute Column */}
        <div className="bg-white border border-[#C5A059]/40 rounded-xl p-2.5 mb-3.5 shadow-inner">
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* Column 1: Hour Selector */}
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#8C6207] pb-1.5 border-b border-stone-100">
                HOUR (01–12)
              </span>
              <div
                ref={hourListRef}
                data-lenis-prevent="true"
                className="h-[170px] overflow-y-auto space-y-1 py-1.5 px-1 pr-1.5 focus:outline-none"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#C5A059 #FAF8F5',
                  overscrollBehavior: 'contain',
                }}
              >
                {HOURS.map((h) => {
                  const isSelected = selectedHour === h;
                  const label = String(h).padStart(2, '0');
                  return (
                    <button
                      key={`hour-${h}`}
                      type="button"
                      data-hour={h}
                      onClick={() => handleSelectHour(h)}
                      className={`w-full py-1.5 px-2 rounded-lg font-sans text-sm font-bold tabular-nums transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-white shadow-xs scale-[1.02] border border-[#C5A059]'
                          : 'text-[#1A1A1A] hover:bg-[#FAF6ED] hover:text-[#8C6207]'
                      }`}
                      style={{ fontSize: '13px', lineHeight: '1.2' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Minute Selector */}
            <div className="flex flex-col border-l border-stone-200 pl-2">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#8C6207] pb-1.5 border-b border-stone-100">
                MINUTE (00–59)
              </span>
              <div
                ref={minuteListRef}
                data-lenis-prevent="true"
                className="h-[170px] overflow-y-auto space-y-1 py-1.5 px-1 pr-1.5 focus:outline-none"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#C5A059 #FAF8F5',
                  overscrollBehavior: 'contain',
                }}
              >
                {MINUTES.map((m) => {
                  const isSelected = selectedMinute === m;
                  const label = String(m).padStart(2, '0');
                  return (
                    <button
                      key={`minute-${m}`}
                      type="button"
                      data-minute={m}
                      onClick={() => handleSelectMinute(m)}
                      className={`w-full py-1.5 px-2 rounded-lg font-sans text-sm font-bold tabular-nums transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-white shadow-xs scale-[1.02] border border-[#C5A059]'
                          : 'text-[#1A1A1A] hover:bg-[#FAF6ED] hover:text-[#8C6207]'
                      }`}
                      style={{ fontSize: '13px', lineHeight: '1.2' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Action Buttons at Bottom - Clean spacing, guaranteed NO overflow */}
        <div className="space-y-2 pt-1 border-t border-stone-200">
          <button
            type="button"
            id="gold-clock-confirm-btn"
            onClick={handleConfirm}
            className="w-full py-3 px-4 rounded-xl bg-[#C5A059] hover:bg-[#B8860B] text-[#1A1A1A] font-display font-extrabold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
          >
            <Check size={16} strokeWidth={3} />
            <span>CONFIRM TIME ({formattedHour}:{formattedMinute} {period})</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-1 text-xs font-sans font-bold text-stone-500 hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
