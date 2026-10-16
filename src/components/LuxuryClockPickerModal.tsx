import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X, Check, Sun, Sunset, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface LuxuryClockPickerModalProps {
  isOpen: boolean;
  title: string;
  initialTime?: string;
  onClose: () => void;
  onSelectTime: (formattedTime: string) => void;
}

// Preset times for quick selection
const CLOCK_PRESETS = [
  { label: '🌅 06:30 AM', time: '06:30 AM' },
  { label: '☀️ 10:00 AM', time: '10:00 AM' },
  { label: '🌤️ 02:00 PM', time: '02:00 PM' },
  { label: '🌇 05:30 PM', time: '05:30 PM' },
  { label: '✨ 07:30 PM', time: '07:30 PM' },
];

export const LuxuryClockPickerModal: React.FC<LuxuryClockPickerModalProps> = ({
  isOpen,
  title,
  initialTime = '09:30 AM',
  onClose,
  onSelectTime,
}) => {
  // Parse incoming time (e.g. "09:30 AM" or "14:00" or fallback)
  const parseTime = (timeStr: string) => {
    let hour = 9;
    let minute = 30;
    let period: 'AM' | 'PM' = 'AM';

    if (timeStr) {
      const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match12) {
        hour = parseInt(match12[1], 10);
        minute = parseInt(match12[2], 10);
        if (match12[3]) {
          period = match12[3].toUpperCase() as 'AM' | 'PM';
        }
      } else {
        const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (match24) {
          const h = parseInt(match24[1], 10);
          minute = parseInt(match24[2], 10);
          if (h === 0) {
            hour = 12;
            period = 'AM';
          } else if (h < 12) {
            hour = h;
            period = 'AM';
          } else if (h === 12) {
            hour = 12;
            period = 'PM';
          } else {
            hour = h - 12;
            period = 'PM';
          }
        }
      }
    }

    if (hour < 1 || hour > 12) hour = 9;
    if (minute < 0 || minute > 59) minute = 30;

    return { hour, minute, period };
  };

  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    if (isOpen) {
      const parsed = parseTime(initialTime);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setPeriod(parsed.period);
      setMode('hour');
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const handleHourClick = (h: number) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    setSelectedHour(h);
    // Smooth auto-transition to minute selection
    setTimeout(() => {
      setMode('minute');
    }, 180);
  };

  const handleMinuteClick = (m: number) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    setSelectedMinute(m);
  };

  const handlePresetClick = (presetTime: string) => {
    soundEngine.playSwitch();
    soundEngine.hapticSelect();
    const parsed = parseTime(presetTime);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setPeriod(parsed.period);
  };

  const handleConfirm = () => {
    soundEngine.playSuccess();
    soundEngine.hapticSuccess();
    const formattedHour = String(selectedHour).padStart(2, '0');
    const formattedMinute = String(selectedMinute).padStart(2, '0');
    const finalTimeStr = `${formattedHour}:${formattedMinute} ${period}`;
    onSelectTime(finalTimeStr);
    onClose();
  };

  // Clock Hand Angle calculations
  const hourAngle = (selectedHour % 12) * 30; // 360 / 12 = 30 deg
  const minuteAngle = selectedMinute * 6; // 360 / 60 = 6 deg
  const currentAngle = mode === 'hour' ? hourAngle : minuteAngle;

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[1000020] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="luxury-clock-modal bg-[#FAF8F5] border-2 border-[#C5A059] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(197,160,89,0.3)] max-w-sm w-full p-5 sm:p-6 text-[#1A1A1A] relative select-none"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#C5A059]/40 text-[#1A1A1A] flex items-center justify-center hover:bg-[#F3EBD8] transition-colors cursor-pointer shadow-xs"
            aria-label="Close time picker"
          >
            <X size={16} />
          </button>

          {/* Modal Header */}
          <div className="text-left mb-4">
            <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C6207]">
              <Clock size={12} className="text-[#C5A059]" />
              <span>LUXURY TIME PICKER</span>
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl uppercase tracking-tight text-[#1A1A1A] mt-0.5">
              {title || 'Select Time'}
            </h3>
          </div>

          {/* Large Digital Readout & AM/PM Toggle */}
          <div className="bg-white rounded-xl border border-[#C5A059]/60 p-3.5 flex items-center justify-between shadow-xs mb-4">
            {/* Hour & Minute Digits */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMode('hour')}
                className={`text-3xl sm:text-4xl font-display font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mode === 'hour'
                    ? 'bg-[#C5A059] text-white shadow-sm ring-2 ring-[#C5A059]/30'
                    : 'text-[#1A1A1A] hover:bg-[#FAF8F5]'
                }`}
              >
                {String(selectedHour).padStart(2, '0')}
              </button>
              <span className="text-2xl font-bold text-[#8C6207] animate-pulse">:</span>
              <button
                type="button"
                onClick={() => setMode('minute')}
                className={`text-3xl sm:text-4xl font-display font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mode === 'minute'
                    ? 'bg-[#C5A059] text-white shadow-sm ring-2 ring-[#C5A059]/30'
                    : 'text-[#1A1A1A] hover:bg-[#FAF8F5]'
                }`}
              >
                {String(selectedMinute).padStart(2, '0')}
              </button>
            </div>

            {/* AM / PM Segmented Control */}
            <div className="flex flex-col gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E5DAC0]">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSwitch();
                  soundEngine.hapticTap();
                  setPeriod('AM');
                }}
                className={`px-3 py-1 text-xs font-sans font-bold uppercase rounded transition-all cursor-pointer ${
                  period === 'AM'
                    ? 'bg-[#C5A059] text-white shadow-xs'
                    : 'text-[#1A1A1A] hover:text-black hover:bg-white'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSwitch();
                  soundEngine.hapticTap();
                  setPeriod('PM');
                }}
                className={`px-3 py-1 text-xs font-sans font-bold uppercase rounded transition-all cursor-pointer ${
                  period === 'PM'
                    ? 'bg-[#C5A059] text-white shadow-xs'
                    : 'text-[#1A1A1A] hover:text-black hover:bg-white'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Mode Switch Tabs (Hours vs Minutes) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-lg mb-4 text-xs font-sans font-bold border border-stone-200">
            <button
              type="button"
              onClick={() => setMode('hour')}
              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                mode === 'hour'
                  ? 'bg-white text-[#1A1A1A] shadow-xs border border-stone-200'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
            >
              Select Hour (1–12)
            </button>
            <button
              type="button"
              onClick={() => setMode('minute')}
              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                mode === 'minute'
                  ? 'bg-white text-[#1A1A1A] shadow-xs border border-stone-200'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
            >
              Select Minute (00–55)
            </button>
          </div>

          {/* RADIAL CLOCK DIAL (Analog Clock Face) */}
          <div className="relative w-[210px] h-[210px] sm:w-[220px] sm:h-[220px] mx-auto my-2 rounded-full bg-white border-2 border-[#C5A059] shadow-inner flex items-center justify-center">
            {/* Ambient concentric clock marks */}
            <div className="absolute inset-2 rounded-full border border-dashed border-[#C5A059]/25 pointer-events-none" />

            {/* Center Pivot Pin */}
            <div className="absolute w-3.5 h-3.5 rounded-full bg-[#C5A059] border-2 border-white shadow-md z-20 pointer-events-none" />

            {/* Rotating Clock Hand */}
            <div
              className="absolute z-10 origin-bottom transition-transform duration-200 pointer-events-none"
              style={{
                width: '2px',
                height: '75px',
                backgroundColor: '#C5A059',
                bottom: '50%',
                left: 'calc(50% - 1px)',
                transform: `rotate(${currentAngle}deg)`,
              }}
            >
              {/* Pointer Tip circle */}
              <div className="absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-[#C5A059]/30 border-2 border-[#C5A059]" />
            </div>

            {/* Numbers on the dial */}
            {mode === 'hour'
              ? hoursList.map((h, i) => {
                  const angleDeg = i * 30; // 0, 30, 60...
                  const isSelected = selectedHour === h;
                  // Trigonometry radius 72px
                  const rad = (angleDeg - 90) * (Math.PI / 180);
                  const x = 75 * Math.cos(rad);
                  const y = 75 * Math.sin(rad);

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourClick(h)}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer z-15 ${
                        isSelected
                          ? 'bg-[#C5A059] text-white shadow-md scale-110 font-extrabold ring-2 ring-white'
                          : 'text-[#1A1A1A] hover:bg-[#FAF8F5] hover:scale-105'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })
              : minutesList.map((m, i) => {
                  const angleDeg = i * 30; // 0, 30, 60...
                  const isSelected = Math.abs(selectedMinute - m) < 3;
                  const rad = (angleDeg - 90) * (Math.PI / 180);
                  const x = 75 * Math.cos(rad);
                  const y = 75 * Math.sin(rad);

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteClick(m)}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer z-15 ${
                        isSelected
                          ? 'bg-[#C5A059] text-white shadow-md scale-110 font-extrabold ring-2 ring-white'
                          : 'text-[#1A1A1A] hover:bg-[#FAF8F5] hover:scale-105'
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  );
                })}
          </div>

          {/* Quick Minute Increments */}
          <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-[#E5DAC0]">
            <span className="text-[10px] font-sans font-bold uppercase text-[#8C6207]">
              Minute:
            </span>
            {[0, 15, 30, 45].map((qm) => (
              <button
                key={qm}
                type="button"
                onClick={() => {
                  soundEngine.playSwitch();
                  soundEngine.hapticTap();
                  setSelectedMinute(qm);
                }}
                className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer font-bold ${
                  selectedMinute === qm
                    ? 'bg-[#C5A059] text-white border-[#C5A059]'
                    : 'bg-white text-[#1A1A1A] border-[#D1D5DB] hover:bg-[#FAF8F5]'
                }`}
              >
                :{String(qm).padStart(2, '0')}
              </button>
            ))}
          </div>

          {/* Quick Lighting Presets */}
          <div className="mt-3">
            <span className="text-[10px] font-sans font-bold uppercase text-[#7A746B] block mb-1">
              Curated Presets:
            </span>
            <div className="flex flex-wrap gap-1 justify-center">
              {CLOCK_PRESETS.map((p) => (
                <button
                  key={p.time}
                  type="button"
                  onClick={() => handlePresetClick(p.time)}
                  className="text-[10px] font-sans font-semibold text-[#1A1A1A] bg-white hover:bg-[#FAF6ED] border border-[#D1D5DB] hover:border-[#C5A059] px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Cancel & SET TIME */}
          <div className="mt-4 pt-3 border-t border-[#E5DAC0] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-sans font-bold uppercase text-[#4A4A4A] hover:text-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="btn-tactile-gold py-2.5 px-6 rounded-xl text-xs font-display font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Check size={14} strokeWidth={3} />
              <span>SET TIME ({String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} {period})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
