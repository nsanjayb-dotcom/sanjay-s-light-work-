import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { soundEngine } from '../utils/audio';
import { Calendar, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

export interface GoldDatePickerModalProps {
  isOpen: boolean;
  selectedDate: string; // "YYYY-MM-DD"
  minDate?: string; // defaults to today "YYYY-MM-DD"
  title?: string;
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FULL_WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const GoldDatePickerModal: React.FC<GoldDatePickerModalProps> = ({
  isOpen,
  selectedDate,
  minDate,
  title = 'Select Shoot Date',
  onSelect,
  onClose,
}) => {
  // Format today as "YYYY-MM-DD"
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const effectiveMinDate = minDate || todayStr;

  // Internal draft date
  const [draftDate, setDraftDate] = useState<string>(selectedDate || todayStr);

  // Month & Year being viewed in calendar
  const [viewYear, setViewYear] = useState<number>(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return parseInt(selectedDate.split('-')[0], 10);
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return parseInt(selectedDate.split('-')[1], 10) - 1;
    }
    return new Date().getMonth();
  });

  // Restore page scrolling safely
  const restorePageScrolling = useCallback(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (typeof window !== 'undefined' && (window as any).__lenis) {
      try {
        (window as any).__lenis.start();
      } catch (e) {
        // Safe fallback
      }
    }
  }, []);

  const handleClose = useCallback(() => {
    soundEngine.playClick();
    restorePageScrolling();
    onClose();
  }, [onClose, restorePageScrolling]);

  // Synchronize on modal open
  useEffect(() => {
    if (isOpen) {
      const active = selectedDate || todayStr;
      setDraftDate(active);
      if (/^\d{4}-\d{2}-\d{2}$/.test(active)) {
        const [y, m] = active.split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      }

      if (typeof window !== 'undefined' && (window as any).__lenis) {
        try {
          (window as any).__lenis.stop();
        } catch (e) {
          // Safe fallback
        }
      }

      document.body.style.overflow = 'hidden';
    } else {
      restorePageScrolling();
    }
    return () => {
      restorePageScrolling();
    };
  }, [isOpen, selectedDate, todayStr, restorePageScrolling]);

  // Navigate months
  const handlePrevMonth = () => {
    soundEngine.playSwitch();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    soundEngine.playSwitch();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    soundEngine.playSwitch();
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setDraftDate(todayStr);
  };

  // Generate calendar days grid
  const calendarDays = useMemo(() => {
    // Total days in current view month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // First day of current view month (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

    // Previous month filler days
    const prevMonthDaysCount = new Date(viewYear, viewMonth, 0).getDate();
    const prevDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean; isDisabled: boolean; targetYear: number; targetMonth: number }[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDaysCount - i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      prevDays.push({
        dayNum,
        dateStr: dStr,
        isCurrentMonth: false,
        isDisabled: dStr < effectiveMinDate,
        targetYear: prevY,
        targetMonth: prevM - 1,
      });
    }

    // Current month days
    const currentDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean; isDisabled: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isDisabled = dStr < effectiveMinDate;
      currentDays.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isDisabled,
      });
    }

    // Next month filler days to complete grid row (must be multiple of 7)
    const totalCurrentSlots = prevDays.length + currentDays.length;
    const nextDaysNeeded = (7 - (totalCurrentSlots % 7)) % 7;
    const nextDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean; isDisabled: boolean; targetYear: number; targetMonth: number }[] = [];
    for (let d = 1; d <= nextDaysNeeded; d++) {
      const nextM = viewMonth === 11 ? 1 : viewMonth + 2;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      nextDays.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isDisabled: dStr < effectiveMinDate, // Next month dates remain available without strikethroughs
        targetYear: nextY,
        targetMonth: nextM - 1,
      });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [viewYear, viewMonth, effectiveMinDate]);

  // Formatted preview of draft date
  const draftFormattedPreview = useMemo(() => {
    if (!draftDate || !/^\d{4}-\d{2}-\d{2}$/.test(draftDate)) return '';
    try {
      const [y, m, d] = draftDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return draftDate;
    }
  }, [draftDate]);

  const handleSelectDay = (dateStr: string, isDisabled: boolean, isCurrentMonth?: boolean, targetYear?: number, targetMonth?: number) => {
    if (isDisabled) return;
    soundEngine.playSwitch();
    setDraftDate(dateStr);
    if (isCurrentMonth === false && targetYear !== undefined && targetMonth !== undefined) {
      setViewYear(targetYear);
      setViewMonth(targetMonth);
    }
  };

  const handleConfirm = () => {
    soundEngine.playClick();
    restorePageScrolling();
    onSelect(draftDate);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      id="calendar-modal-overlay"
      className="calendar-modal-overlay"
      data-lenis-prevent="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        id="calendar-modal-card"
        className="calendar-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#FAF6ED] border border-[#C5A059]/40 flex items-center justify-center text-[#8C6207]">
              <Calendar size={16} />
            </span>
            <div>
              <h3
                id="calendar-modal-title"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                className="text-xl font-bold text-[#1A1A1A] leading-tight"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close calendar"
            className="w-8 h-8 rounded-full bg-white border border-stone-200 text-[#1A1A1A] hover:bg-stone-100 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Selection Indicator Banner */}
        <div className="bg-white border border-[#E5E0D8] rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 block">
              Chosen Date
            </span>
            <span
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="text-lg font-bold text-[#1A1A1A] tracking-tight block"
            >
              {draftFormattedPreview || 'Select a date below'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleJumpToToday}
            className="text-[11px] font-sans font-bold text-[#8C6207] bg-[#FAF6ED] hover:bg-[#F3EBD8] border border-[#C5A059]/40 px-2.5 py-1 rounded-md transition-all cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Month & Year Navigation Row */}
        <div className="flex items-center justify-between px-1 mb-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="calendar-nav-btn w-8 h-8 rounded-lg bg-white border border-stone-200 text-[#1A1A1A] hover:border-[#C5A059] hover:bg-[#FAF6ED] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            className="text-xl font-bold text-[#1A1A1A] tracking-wide"
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="calendar-nav-btn w-8 h-8 rounded-lg bg-white border border-stone-200 text-[#1A1A1A] hover:border-[#C5A059] hover:bg-[#FAF6ED] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Grid Container with Guaranteed Column Alignment & Right-side Padding */}
        <div className="calendar-grid-wrapper bg-white/70 border border-[#E5E0D8] rounded-xl p-2.5 sm:p-3 mb-4">
          {/* Weekday Names Header Row: S, M, T, W, T, F, S */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2 px-0.5">
            {WEEKDAY_NAMES.map((name, idx) => (
              <div
                key={idx}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                className={`text-center text-sm font-bold tracking-wider py-1 ${
                  idx === 0 || idx === 6 ? 'text-[#8C6207]' : 'text-[#1A1A1A]'
                }`}
                title={FULL_WEEKDAY_NAMES[idx]}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid: 7 columns, perfect spacing, rightmost column fully padded */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 px-0.5">
            {calendarDays.map((item, index) => {
              const isSelected = item.dateStr === draftDate;
              const isToday = item.dateStr === todayStr && item.isCurrentMonth;
              const isPastDisabled = item.isDisabled;
              const isOtherMonth = !item.isCurrentMonth;

              let buttonClasses =
                'calendar-day-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-sans transition-all select-none ';

              if (isSelected) {
                buttonClasses += 'is-selected font-bold text-white shadow-md bg-[#C5A059] border-[1.5px] border-[#B8860B]';
              } else if (isPastDisabled) {
                buttonClasses += 'is-past is-disabled cursor-not-allowed text-[#C8C2B8] line-through opacity-50 pointer-events-none';
              } else if (isOtherMonth) {
                buttonClasses += 'is-adjacent is-overflow text-[#A39E93] opacity-40 hover:opacity-90 hover:bg-[#FAF6ED] hover:border hover:border-[#C5A059] hover:text-[#8C6207] cursor-pointer';
              } else if (isToday) {
                buttonClasses += 'is-today font-bold text-[#1A1A1A] bg-[#FAF6ED] border-[1.5px] border-[#C5A059] cursor-pointer';
              } else {
                buttonClasses += 'text-[#1A1A1A] font-medium hover:bg-[#FAF6ED] hover:border hover:border-[#C5A059] cursor-pointer';
              }

              return (
                <div key={index} className="flex items-center justify-center">
                  <button
                    type="button"
                    disabled={isPastDisabled}
                    onClick={() => handleSelectDay(item.dateStr, isPastDisabled, item.isCurrentMonth, item.targetYear, item.targetMonth)}
                    className={buttonClasses}
                    title={item.dateStr}
                  >
                    {item.dayNum}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons: Pinned at bottom */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="gold-calendar-confirm-btn"
            onClick={handleConfirm}
            className="flex-2 py-3 px-5 rounded-xl bg-[#C5A059] hover:bg-[#B8860B] text-[#1A1A1A] font-extrabold text-xs font-sans uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} className="text-[#1A1A1A]" />
            <span>CONFIRM DATE</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
