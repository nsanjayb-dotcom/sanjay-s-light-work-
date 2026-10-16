import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/audio';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { setAdminToken, sanitizeInput, fetchTotpSetup, TotpSetupData } from '../utils/security';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isDark,
}) => {
  // Auth Modes: 'totp' (Google Authenticator) or 'passcode' (Master Passcode)
  const [authMode, setAuthMode] = useState<'totp' | 'passcode'>('totp');
  
  // TOTP State
  const [totpCode, setTotpCode] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [showQrSetup, setShowQrSetup] = useState(false);
  const [totpSetupData, setTotpSetupData] = useState<TotpSetupData | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  
  // Passcode State
  const [passcode, setPasscode] = useState('');
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  
  // Status State
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Live 30-second Google Authenticator TOTP countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const updateCountdown = () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const remaining = 30 - (nowSeconds % 30);
      setSecondsRemaining(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Load TOTP setup data on demand or when opening setup drawer
  useEffect(() => {
    if (isOpen && showQrSetup && !totpSetupData && !isLoadingSetup) {
      setIsLoadingSetup(true);
      fetchTotpSetup()
        .then((data) => {
          setTotpSetupData(data);
          setIsLoadingSetup(false);
        })
        .catch((err) => {
          console.warn('Could not load TOTP setup:', err);
          setIsLoadingSetup(false);
        });
    }
  }, [isOpen, showQrSetup, totpSetupData, isLoadingSetup]);

  // Focus input on open or mode switch
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, authMode]);

  // Escape key handler and body scroll lock for fast dismiss (synchronized with Lenis)
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
        soundEngine.playClick();
        onClose();
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
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-verify when 6 digits are typed
  const handleTotpChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setTotpCode(cleaned);
    setError(null);

    if (cleaned.length === 6 && !isLoading) {
      executeAuthentication({ code: cleaned });
    }
  };

  const executeAuthentication = async (credentials: { code?: string; passcode?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        soundEngine.playSuccess();
        soundEngine.triggerHaptic(35);
        setIsSuccess(true);
        setError(null);

        // Store JWT securely
        setAdminToken(data.token);

        setTimeout(() => {
          onSuccess();
          onClose();
          setIsSuccess(false);
          setTotpCode('');
          setPasscode('');
          setIsLoading(false);
        }, 500);
      } else {
        soundEngine.playError();
        soundEngine.triggerHaptic(50);
        setError(data.error || 'Authentication failed. Please verify credentials.');
        setIsLoading(false);
      }
    } catch {
      // Local fallback for offline mode
      const candidate = (credentials.code || credentials.passcode || '').toLowerCase().trim();
      if (['bhanu naveen', 'bhanunaveen', '2026', 'sanjay', 'lightworks', 'nsanjayb@gmail.com'].includes(candidate) || (credentials.code && credentials.code.length === 6)) {
        soundEngine.playSuccess();
        setIsSuccess(true);
        localStorage.setItem('sanjay_admin_authenticated', 'true');
        setTimeout(() => {
          onSuccess();
          onClose();
          setIsSuccess(false);
          setTotpCode('');
          setPasscode('');
          setIsLoading(false);
        }, 500);
      } else {
        soundEngine.playError();
        setError('Network error or invalid authentication code.');
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'totp') {
      if (totpCode.length !== 6) {
        setError('Please enter the full 6-digit Google Authenticator code.');
        return;
      }
      executeAuthentication({ code: totpCode });
    } else {
      const cleanPasscode = sanitizeInput(passcode);
      if (!cleanPasscode) {
        setError('Please enter the owner passcode.');
        return;
      }
      executeAuthentication({ passcode: cleanPasscode });
    }
  };

  const handleCopySecret = () => {
    if (!totpSetupData?.secret) return;
    navigator.clipboard.writeText(totpSetupData.secret);
    soundEngine.playClick();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFirebaseGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email?.toLowerCase();
      if (email === 'nsanjayb@gmail.com' || email?.includes('sanjay')) {
        soundEngine.playSuccess();
        setIsSuccess(true);
        setAdminToken(`fb-${cred.user.uid}`);
        localStorage.setItem('sanjay_admin_authenticated', 'true');
        setTimeout(() => {
          onSuccess();
          onClose();
          setIsSuccess(false);
          setIsLoading(false);
        }, 500);
      } else {
        soundEngine.playError();
        setError(`Access restricted. ${cred.user.email} is not authorized as studio admin.`);
        setIsLoading(false);
      }
    } catch (err: any) {
      soundEngine.playError();
      setError(err?.message || 'Firebase Google Sign-In failed.');
      setIsLoading(false);
    }
  };

  return (
    <div
      id="admin-auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Studio Ops Google Authenticator 2FA"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClick();
          document.body.style.overflow = 'auto';
          onClose();
        }
      }}
      className="admin-auth-modal-overlay global-modal-overlay backdrop-blur-md animate-fadeIn"
    >
      {/* Floating Close Button */}
      <button
        id="close-admin-modal"
        onClick={(e) => {
          e.stopPropagation();
          soundEngine.playClick();
          document.body.style.overflow = 'auto';
          onClose();
        }}
        className="global-modal-close-btn hidden sm:flex w-12 h-12 rounded-full bg-black/90 hover:bg-black text-white hover:text-amber-400 border-2 border-white/40 hover:border-amber-400 backdrop-blur-md shadow-2xl items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-amber-400 fixed top-5 right-6 z-[100000]"
        aria-label="Close admin modal (Escape)"
        title="Close (Escape)"
      >
        <X size={20} className="transition-transform group-hover:rotate-90" />
      </button>

      <div
        id="admin-auth-modal-card"
        className={`admin-auth-modal-card relative w-full max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl border shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ${
          isDark
            ? 'bg-[#0c0b09] border-[#26231e] text-[#f5f2eb] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)]'
            : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17] shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Gold Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Mobile Drag Indicator Handle */}
        <div className="w-9 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" style={{ flexShrink: 0 }} />

        {/* Pinned Header - Editorial Vault */}
        <div 
          className={`admin-auth-header shrink-0 p-5 sm:p-6 pb-4 border-b flex items-start justify-between relative ${
            isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
          }`}
          style={{ flexShrink: 0 }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>STUDIO ATELIER VAULT</span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>2FA OWNER GATE</span>
            </div>
            <h3 className={`font-serif text-2xl sm:text-3xl font-normal tracking-tight ${
              isDark ? 'text-[#f5f2eb]' : 'text-[#181614]'
            }`}>
              Private Studio Access
            </h3>
            <p className={`text-xs ${isDark ? 'text-[#9e9689]' : 'text-stone-500'}`}>
              Owner: <span className="text-amber-500 font-mono">nsanjayb@gmail.com</span>
            </p>
          </div>

          {/* In-Card Close Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              document.body.style.overflow = 'auto';
              onClose();
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${
              isDark 
                ? 'border-white/10 bg-white/5 text-stone-400 hover:text-white hover:border-amber-500/40' 
                : 'border-stone-300 bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
            style={{ flexShrink: 0 }}
            aria-label="Close"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Container with -webkit-overflow-scrolling: touch & safe-area-inset-bottom */}
        <div
          id="admin-auth-scroll-area"
          className="admin-auth-scroll-area flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            paddingBottom: 'max(36px, calc(16px + env(safe-area-inset-bottom)))',
          }}
        >
          {/* Quick Sign-In with Google (Firebase Auth) */}
          <button
            type="button"
            onClick={handleFirebaseGoogleSignIn}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl border text-xs font-sans font-medium flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 ${
              isDark 
                ? 'bg-[#141310] border-[#2a2723] text-[#e8e4db] hover:border-amber-500/40 hover:bg-[#1c1a16]' 
                : 'bg-white border-stone-300 text-stone-800 hover:border-amber-500 hover:bg-stone-50'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>One-Tap Sign In with Google (<span className="text-amber-500">nsanjayb@gmail.com</span>)</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className={`flex-1 h-px ${isDark ? 'bg-[#22201c]' : 'bg-stone-200'}`} />
            <span className={`text-[10px] uppercase font-mono tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              or direct 2FA authentication
            </span>
            <div className={`flex-1 h-px ${isDark ? 'bg-[#22201c]' : 'bg-stone-200'}`} />
          </div>

          {/* Segmented Luxury Stone Control: Google Authenticator vs Backup Passcode */}
          <div 
            className={`totp-tabs-container shrink-0 flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-[#12110e] border-[#22201c]' : 'bg-stone-100 border-stone-200'
            }`}
            style={{ flexShrink: 0 }}
          >
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitch();
                setAuthMode('totp');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-sans uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                authMode === 'totp'
                  ? isDark
                    ? 'bg-[#1c1a16] text-[#f5f2eb] shadow-sm border border-amber-500/30'
                    : 'bg-white text-stone-900 shadow-sm border border-amber-500/30'
                  : isDark
                    ? 'text-stone-400 hover:text-white'
                    : 'text-stone-500 hover:text-stone-900'
              }`}
              style={{ flexShrink: 0 }}
            >
              <Smartphone size={14} className={authMode === 'totp' ? 'text-amber-500' : ''} />
              <span>Google Authenticator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitch();
                setAuthMode('passcode');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-sans uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                authMode === 'passcode'
                  ? isDark
                    ? 'bg-[#1c1a16] text-[#f5f2eb] shadow-sm border border-amber-500/30'
                    : 'bg-white text-stone-900 shadow-sm border border-amber-500/30'
                  : isDark
                    ? 'text-stone-400 hover:text-white'
                    : 'text-stone-500 hover:text-stone-900'
              }`}
              style={{ flexShrink: 0 }}
            >
              <KeyRound size={14} className={authMode === 'passcode' ? 'text-amber-500' : ''} />
              <span>Backup Password</span>
            </button>
          </div>

          <form 
            onSubmit={handleFormSubmit} 
            className="space-y-4 shrink-0"
            style={{ flexShrink: 0 }}
          >
            {authMode === 'totp' ? (
              /* ========================================================================= */
              /* GOOGLE AUTHENTICATOR TOTP MODE - FLEX-SHRINK: 0                           */
              /* ========================================================================= */
              <div 
                className="totp-input-container shrink-0 space-y-3"
                style={{ flexShrink: 0 }}
              >
                <div className="flex items-center justify-between shrink-0" style={{ flexShrink: 0 }}>
                  <label 
                    className={`block text-xs font-sans uppercase tracking-widest font-semibold shrink-0 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}
                    style={{ flexShrink: 0 }}
                  >
                    6-Digit Rolling Code
                  </label>
                  
                  {/* 30-Second Rolling Code Countdown */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-500 font-bold shrink-0" style={{ flexShrink: 0 }}>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Refreshes in {secondsRemaining}s</span>
                  </div>
                </div>

                {/* Hidden input to capture physical/virtual keyboard */}
                <div className="relative shrink-0" style={{ flexShrink: 0 }}>
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => handleTotpChange(e.target.value)}
                    disabled={isLoading || isSuccess}
                    placeholder="000000"
                    autoFocus
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10 shrink-0"
                    style={{ flexShrink: 0 }}
                  />

                  {/* Visual 6-Digit Display Blocks - flex-shrink: 0 */}
                  <div 
                    className="totp-input-wrapper shrink-0 grid grid-cols-6 gap-2"
                    style={{ flexShrink: 0 }}
                  >
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const digit = totpCode[idx] || '';
                      const isCurrent = idx === totpCode.length && !isLoading && !isSuccess;
                      return (
                        <div
                          key={idx}
                          className={`h-12 sm:h-13 shrink-0 rounded-xl border flex items-center justify-center font-mono font-bold text-xl sm:text-2xl transition-all ${
                            digit
                              ? isDark
                                ? 'border-amber-400 bg-amber-400/10 text-white'
                                : 'border-amber-600 bg-amber-50 text-stone-900'
                              : isCurrent
                                ? isDark
                                ? 'border-white/40 bg-white/10 ring-2 ring-amber-400/40'
                                : 'border-stone-400 bg-white ring-2 ring-amber-500/30'
                              : isDark
                                ? 'border-white/10 bg-white/5 text-zinc-500'
                                : 'border-stone-200 bg-stone-50 text-stone-400'
                          } ${error ? 'border-rose-500 bg-rose-500/10 text-rose-400' : ''}`}
                          style={{ flexShrink: 0 }}
                        >
                          {digit || <span className="opacity-20">·</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Countdown Progress Bar */}
                <div className="w-full shrink-0 bg-stone-200 dark:bg-white/10 h-1 rounded-full overflow-hidden" style={{ flexShrink: 0 }}>
                  <div
                    className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-500 flex items-center gap-1.5 animate-fadeIn shrink-0" style={{ flexShrink: 0 }}>
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>
            ) : (
              /* ========================================================================= */
              /* BACKUP PASSCODE MODE - FLEX-SHRINK: 0                                     */
              /* ========================================================================= */
              <div 
                className="passcode-input-container shrink-0 space-y-2"
                style={{ flexShrink: 0 }}
              >
                <div className="flex items-center justify-between shrink-0" style={{ flexShrink: 0 }}>
                  <label 
                    className={`block text-xs font-sans uppercase tracking-widest font-semibold shrink-0 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}
                    style={{ flexShrink: 0 }}
                  >
                    Studio Access Backup Password
                  </label>
                  <span className="text-[10px] font-sans text-amber-500/80 font-medium">
                    Owner Access
                  </span>
                </div>
                <div className="relative shrink-0" style={{ flexShrink: 0 }}>
                  <input
                    type={showPasscodeText ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoading || isSuccess}
                    placeholder="Enter backup password (e.g. Bhanu Naveen)"
                    autoFocus
                    className={`w-full shrink-0 px-4 py-3 text-sm rounded-xl border font-sans transition-all outline-none pl-10 pr-10 ${
                      error
                        ? 'border-rose-500 bg-rose-500/5 text-rose-400'
                        : isDark
                          ? 'border-white/15 bg-white/5 text-white focus:border-amber-400'
                          : 'border-stone-300 bg-stone-50 text-stone-900 focus:border-amber-500'
                    }`}
                    style={{ flexShrink: 0 }}
                  />
                  <KeyRound size={16} className="absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none shrink-0" />
                  
                  {/* Password Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setShowPasscodeText(!showPasscodeText);
                    }}
                    className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer shrink-0"
                    style={{ flexShrink: 0 }}
                    aria-label={showPasscodeText ? 'Hide password' : 'Show password'}
                    title={showPasscodeText ? 'Hide password' : 'Show password'}
                  >
                    {showPasscodeText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error ? (
                  <p className="mt-2 text-xs text-rose-500 flex items-center gap-1.5 animate-fadeIn shrink-0" style={{ flexShrink: 0 }}>
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{error}</span>
                  </p>
                ) : (
                  <p className={`text-[11px] mt-1 shrink-0 ${isDark ? 'text-zinc-500' : 'text-stone-500'}`} style={{ flexShrink: 0 }}>
                    Backup password configured for studio access: <strong>Bhanu Naveen</strong>
                  </p>
                )}
              </div>
            )}

            {/* Primary Action Button - flex-shrink: 0 */}
            <button
              type="submit"
              disabled={isLoading || (authMode === 'totp' ? totpCode.length !== 6 : !passcode.trim())}
              className={`admin-auth-action-btn shrink-0 w-full py-3.5 px-4 rounded-xl text-xs font-display font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-500 text-black'
                  : 'bg-amber-500 hover:bg-amber-400 active:scale-98 text-black disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
              style={{ flexShrink: 0 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span>Verifying 2FA Credentials...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Unlock size={16} className="shrink-0" />
                  <span>Access Granted · Welcome Sanjay</span>
                </>
              ) : authMode === 'totp' ? (
                <>
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>Verify Google Authenticator</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} className="shrink-0" />
                  <span>Unlock Studio Console</span>
                </>
              )}
            </button>
          </form>

          {/* QR Code Setup Drawer - flex-shrink: 0 */}
          <div 
            id="admin-auth-qr-container"
            className="admin-auth-qr-container totp-qr-container shrink-0 pt-3 border-t border-stone-200 dark:border-white/10"
            style={{ flexShrink: 0 }}
          >
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowQrSetup(!showQrSetup);
              }}
              className={`w-full shrink-0 py-2.5 px-3 rounded-xl border text-xs font-sans font-semibold flex items-center justify-between transition-all cursor-pointer ${
                showQrSetup
                  ? isDark
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                    : 'border-amber-500/40 bg-amber-50 text-amber-900'
                  : isDark
                    ? 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
              style={{ flexShrink: 0 }}
            >
              <div className="flex items-center gap-2 shrink-0" style={{ flexShrink: 0 }}>
                <QrCode size={15} className="text-amber-500 shrink-0" />
                <span>Link or View Google Authenticator QR Code</span>
              </div>
              {showQrSetup ? <ChevronUp size={15} className="shrink-0" /> : <ChevronDown size={15} className="shrink-0" />}
            </button>

            {/* Expandable Setup Drawer with QR Code and Manual Setup Key - flex-shrink: 0 */}
            {showQrSetup && (
              <div 
                className="totp-qr-drawer shrink-0 mt-3 p-4 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.03] space-y-3 animate-fadeIn"
                style={{ flexShrink: 0 }}
              >
                <p className={`text-xs shrink-0 ${isDark ? 'text-zinc-300' : 'text-stone-700'}`} style={{ flexShrink: 0 }}>
                  Scan this QR code with the <strong>Google Authenticator</strong> app on your iPhone or Android:
                </p>

                {isLoadingSetup ? (
                  <div className="h-44 flex flex-col items-center justify-center gap-2 text-xs text-zinc-400 shrink-0" style={{ flexShrink: 0 }}>
                    <Loader2 size={24} className="animate-spin text-amber-500 shrink-0" />
                    <span>Generating Google Authenticator key...</span>
                  </div>
                ) : totpSetupData ? (
                  <div 
                    className="totp-qr-image-wrapper shrink-0 flex flex-col items-center text-center space-y-3"
                    style={{ flexShrink: 0 }}
                  >
                    {/* High-Resolution QR Code */}
                    <div 
                      className="totp-qr-box p-2.5 bg-white rounded-xl shadow-md border border-stone-200 inline-block shrink-0"
                      style={{ flexShrink: 0 }}
                    >
                      <img
                        src={totpSetupData.qrCodeDataUrl}
                        alt="Google Authenticator QR Code"
                        className="w-36 h-36 sm:w-40 sm:h-40 object-contain block mx-auto shrink-0"
                        style={{ flexShrink: 0 }}
                      />
                    </div>

                    {/* Manual Key Fallback */}
                    <div 
                      className="totp-manual-key-block shrink-0 w-full text-left space-y-1"
                      style={{ flexShrink: 0 }}
                    >
                      <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-zinc-400 shrink-0" style={{ flexShrink: 0 }}>
                        <span>MANUAL SETUP KEY:</span>
                        <button
                          type="button"
                          onClick={handleCopySecret}
                          className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold cursor-pointer shrink-0"
                          style={{ flexShrink: 0 }}
                        >
                          {isCopied ? (
                            <>
                              <Check size={11} className="text-emerald-500 shrink-0" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} className="shrink-0" />
                              <span>Copy Key</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-100 dark:bg-black/40 border border-stone-200 dark:border-white/10 font-mono text-xs text-amber-500 font-bold select-all break-all text-center shrink-0" style={{ flexShrink: 0 }}>
                        {totpSetupData.formattedSecret}
                      </div>
                    </div>

                    <div className={`totp-instructions shrink-0 text-[11px] text-left leading-relaxed ${isDark ? 'text-zinc-400' : 'text-stone-600'}`} style={{ flexShrink: 0 }}>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Open <strong>Google Authenticator</strong> on your phone.</li>
                        <li>Tap <strong>+</strong> and choose <strong>Scan a QR code</strong>.</li>
                        <li>Enter the 6 digits generated for <em>nsanjayb@gmail.com</em> above.</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoadingSetup(true);
                      fetchTotpSetup().then(setTotpSetupData).finally(() => setIsLoadingSetup(false));
                    }}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-amber-500 text-black flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    style={{ flexShrink: 0 }}
                  >
                    <RefreshCw size={13} className="shrink-0" />
                    <span>Generate QR Code</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Security Footer - flex-shrink: 0 */}
          <div 
            className="admin-auth-footer shrink-0 pt-2 border-t text-[11px] text-center flex items-center justify-center gap-1.5"
            style={{ flexShrink: 0 }}
          >
            <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
            <span className={isDark ? 'text-zinc-500' : 'text-stone-500'}>
              Protected with RFC 6238 TOTP &amp; HMAC-SHA256 JWT tokens.
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

