import React, { useState, useEffect } from 'react';
import { soundEngine } from '../utils/audio';
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Plus,
  Trash2,
  X,
  UserCheck
} from 'lucide-react';
import { getWhatsAppUrl } from '../utils/social';
import { secureAdminFetch, escapeHtml, sanitizeInput } from '../utils/security';
import { fetchAdminBookings } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { ConfirmModal } from './ConfirmModal';
import { showToast as triggerToast } from './SupabaseToast';

interface BookingRecord {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  packageId?: string;
  packageName: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  notes: string;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  createdAt?: string;
  calendarEventUrl?: string;
  emailStatus?: 'sent' | 'simulated' | 'failed';
}

interface BookingsLogManagerProps {
  isDark: boolean;
}

export const BookingsLogManager: React.FC<BookingsLogManagerProps> = ({ isDark }) => {
  const [bookingsList, setBookingsList] = useState<BookingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sanjay_bookings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);

  // New Real Booking Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newPackageName, setNewPackageName] = useState('Portraits & Couples Session');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('16:30');
  const [newLocation, setNewLocation] = useState('High Park, Toronto');
  const [newTotalPrice, setNewTotalPrice] = useState(150);
  const [newNotes, setNewNotes] = useState('');

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Fetch live server bookings if backend is up (queried from Supabase PostgreSQL via Service Role)
  const fetchServerBookings = async () => {
    setIsLoading(true);
    try {
      const res = await secureAdminFetch('/api/admin/supabase/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.bookings)) {
          setBookingsList(data.bookings);
          localStorage.setItem('sanjay_bookings', JSON.stringify(data.bookings));
          return;
        }
      }

      const bRes = await secureAdminFetch('/api/admin/bookings');
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData && Array.isArray(bData.bookings)) {
          setBookingsList(bData.bookings);
          localStorage.setItem('sanjay_bookings', JSON.stringify(bData.bookings));
        }
      }
    } catch {
      // client-side persistence remains intact
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServerBookings();

    const handleSynced = (e: Event) => {
      const customEvent = e as CustomEvent<BookingRecord[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setBookingsList(customEvent.detail);
      }
    };
    window.addEventListener('sanjay_bookings_synced', handleSynced);
    return () => window.removeEventListener('sanjay_bookings_synced', handleSynced);
  }, []);

  const handleStatusChange = async (id: string, newStatus: BookingRecord['status']) => {
    soundEngine.playSwitch();
    const updated = bookingsList.map(b => b.id === id ? { ...b, status: newStatus } : b);
    setBookingsList(updated);
    try {
      localStorage.setItem('sanjay_bookings', JSON.stringify(updated));
      await secureAdminFetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      triggerToast(`Booking status updated to ${newStatus}.`, 'success', 'Status Saved');
    } catch {
      // ignore
    }
  };

  const handleDeleteBooking = (id: string) => {
    soundEngine.playClick();
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Reservation Record',
      message: 'Are you sure you want to delete this client shoot reservation from the database ledger?',
      confirmLabel: 'Delete Booking',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        const updated = bookingsList.filter(b => b.id !== id);
        setBookingsList(updated);
        try {
          localStorage.setItem('sanjay_bookings', JSON.stringify(updated));
          await secureAdminFetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
          triggerToast('Reservation deleted successfully.', 'info', 'Reservation Removed');
        } catch {
          // ignore
        }
      },
    });
  };

  const handleClearDemoBookings = () => {
    soundEngine.playClick();
    setConfirmModalConfig({
      isOpen: true,
      title: 'Purge Demo Reservations · Clean Slate',
      message: 'Remove all sample demo booking entries to start with a pristine real studio reservation ledger?',
      confirmLabel: 'Wipe Demo Bookings',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        setBookingsList([]);
        localStorage.removeItem('sanjay_bookings');
        try {
          await secureAdminFetch('/api/admin/data/clear', {
            method: 'POST',
          });
          triggerToast('Demo bookings purged. Clean slate active.', 'success', 'Reservations Cleared');
        } catch {
          // ignore
        }
      },
    });
  };

  const handleCreateRealBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playSuccess();
    const newId = `SL-${Date.now().toString().slice(-4)}`;
    const newRecord: BookingRecord = {
      id: newId,
      clientName: sanitizeInput(newClientName) || 'Private Client',
      clientEmail: sanitizeInput(newClientEmail) || 'client@example.com',
      clientPhone: sanitizeInput(newClientPhone) || '',
      packageName: newPackageName,
      preferredDate: newDate,
      preferredTime: newTime,
      location: sanitizeInput(newLocation) || 'Ontario',
      notes: sanitizeInput(newNotes) || '',
      totalPrice: Number(newTotalPrice) || 150,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      emailStatus: 'sent',
    };

    const updated = [newRecord, ...bookingsList];
    setBookingsList(updated);
    localStorage.setItem('sanjay_bookings', JSON.stringify(updated));

    // Post to server
    try {
      await secureAdminFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
    } catch {
      // ignore
    }

    setShowAddBookingModal(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header: Luxury Editorial Curation */}
      <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors ${
        isDark ? 'bg-[#0f0e0c] border-[#26231e]' : 'bg-[#faf8f4] border-[#e8e4db]'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
            <Calendar size={13} />
            <span>REAL SHOOT RESERVATIONS</span>
            <span className="text-stone-500">·</span>
            <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>{bookingsList.length} Active Records</span>
          </div>
          <h3 className={`font-serif text-2xl sm:text-3xl font-normal tracking-tight ${
            isDark ? 'text-[#f5f2eb]' : 'text-[#181614]'
          }`}>
            Live Shoot Calendar &amp; Client Log
          </h3>
          <p className={`text-xs max-w-xl ${isDark ? 'text-[#9e9689]' : 'text-stone-600'}`}>
            Direct client shoot reservations synced with Google Calendar, WhatsApp links, and automated client notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowAddBookingModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus size={14} />
            <span>Log Real Booking</span>
          </button>

          {bookingsList.length > 0 && (
            <button
              type="button"
              onClick={handleClearDemoBookings}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-sans font-medium transition-all cursor-pointer ${
                isDark
                  ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                  : 'border-rose-300 text-rose-700 hover:bg-rose-50'
              }`}
              title="Clear all demo bookings to start fresh with real data"
            >
              Purge Demo Records
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              fetchServerBookings();
            }}
            disabled={isLoading}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-[#141310] border-[#2a2723] text-stone-300 hover:bg-[#1c1a16]'
                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-amber-500' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Bookings List or Zero State */}
      {bookingsList.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-[#0f0e0c] border-[#26231e]' : 'bg-stone-50 border-stone-200'
        }`}>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <UserCheck size={22} />
          </div>
          <h4 className={`font-serif text-xl font-medium mb-1 ${isDark ? 'text-[#f5f2eb]' : 'text-stone-900'}`}>
            Live Real Data Mode Active
          </h4>
          <p className={`text-xs max-w-md mx-auto mb-5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            All placeholder and dummy bookings have been cleared. As clients book on the website or as you log real shoots, they will appear here.
          </p>
          <button
            type="button"
            onClick={() => setShowAddBookingModal(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-sans font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus size={14} />
            <span>Record Real Shoot Booking</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {bookingsList.map((booking) => (
            <div
              key={booking.id}
              className={`p-5 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                isDark
                  ? 'bg-[#11100d] border-[#22201c] hover:border-amber-500/30'
                  : 'bg-white border-stone-200 hover:border-amber-500/30 shadow-sm'
              }`}
            >
              {/* Left Client & Shoot Info */}
              <div className="space-y-1.5 max-w-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-amber-500 font-semibold">
                    #{booking.id}
                  </span>
                  <span className="text-stone-500">·</span>
                  <span className={`font-serif text-lg font-medium ${isDark ? 'text-[#f5f2eb]' : 'text-stone-900'}`}>
                    {booking.clientName}
                  </span>
                  <span className="text-stone-500">·</span>
                  <span className="text-xs text-stone-400 font-sans">
                    {booking.packageName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-amber-500" />
                    <strong className={isDark ? 'text-stone-200' : 'text-stone-800'}>{booking.preferredDate}</strong> at {booking.preferredTime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-500" />
                    <span>{booking.location || 'Ontario'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={13} className="text-emerald-500" />
                    <strong className="text-emerald-400 font-mono">${booking.totalPrice} CAD</strong>
                  </span>
                </div>

                {/* Contact info */}
                <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
                  <a
                    href={`mailto:${booking.clientEmail}`}
                    className="flex items-center gap-1 text-stone-400 hover:text-amber-400 transition-colors"
                  >
                    <Mail size={12} />
                    <span>{booking.clientEmail}</span>
                  </a>
                  {booking.clientPhone && (
                    <a
                      href={`tel:${booking.clientPhone}`}
                      className="flex items-center gap-1 text-stone-400 hover:text-amber-400 transition-colors"
                    >
                      <Phone size={12} />
                      <span>{booking.clientPhone}</span>
                    </a>
                  )}
                </div>

                {booking.notes && (
                  <p className={`text-xs italic pt-1 line-clamp-2 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    &ldquo;{booking.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Right Action & Status */}
              <div className="flex items-center gap-3 flex-wrap lg:justify-end">
                {/* Status Selector */}
                <select
                  value={booking.status}
                  onChange={(e) => handleStatusChange(booking.id, e.target.value as any)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium focus:outline-none ${
                    booking.status === 'confirmed'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : booking.status === 'completed'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                      : isDark ? 'bg-[#181614] border-[#2a2723] text-stone-300' : 'bg-stone-100 border-stone-300 text-stone-800'
                  }`}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Direct WhatsApp Client */}
                {booking.clientPhone && (
                  <a
                    href={getWhatsAppUrl(`Hi ${booking.clientName}! Sanjay here regarding your ${booking.packageName} shoot scheduled for ${booking.preferredDate}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                      isDark 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                    title="Open WhatsApp chat with client"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteBooking(booking.id)}
                  className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete booking"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Log Real Booking */}
      {showAddBookingModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundEngine.playClick();
              setShowAddBookingModal(false);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            boxSizing: 'border-box',
          }}
          className="global-modal-overlay animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '90vh',
              width: '100%',
              maxWidth: '620px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '16px',
            }}
            className={`border shadow-2xl transition-all ${
              isDark 
                ? 'bg-[#0c0b09] border-[#26231e] text-[#f5f2eb]' 
                : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17]'
            }`}
          >
            <div className={`p-6 pb-4 border-b flex items-start justify-between shrink-0 ${
              isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
            }`}>
              <div className="space-y-1">
                <div className="text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
                  DIRECT STUDIO ENTRY
                </div>
                <h3 className="font-serif text-2xl font-normal tracking-tight">Record Real Client Shoot</h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Log confirmed client reservations directly into your active calendar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBookingModal(false)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateRealBooking} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya &amp; Liam"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@gmail.com"
                    value={newClientEmail}
                    onChange={e => setNewClientEmail(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (416) 555-0199"
                    value={newClientPhone}
                    onChange={e => setNewClientPhone(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Package Title
                  </label>
                  <select
                    value={newPackageName}
                    onChange={e => setNewPackageName(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    <option value="Single Photo Session">Single Photo Session ($50)</option>
                    <option value="Themed & Creative Shoot">Themed &amp; Creative Shoot ($70)</option>
                    <option value="Traditional Cultural Event">Traditional Cultural Event ($200)</option>
                    <option value="Events & Celebrations">Events &amp; Celebrations ($250)</option>
                    <option value="Commercial Campaign">Commercial Campaign ($550+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    <option value="09:30">09:30 AM (Soft Window)</option>
                    <option value="13:00">01:00 PM (High Key)</option>
                    <option value="16:30">04:30 PM (Golden Hour)</option>
                    <option value="18:30">06:30 PM (Dusk Ambient)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Fee (CAD)
                  </label>
                  <input
                    type="number"
                    value={newTotalPrice}
                    onChange={e => setNewTotalPrice(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="High Park, Toronto"
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Client Notes / Vision
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Candid ceremony moments, outdoor park ambient light..."
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBookingModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Booking Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible In-App Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        cancelLabel={confirmModalConfig.cancelLabel}
        isDestructive={confirmModalConfig.isDestructive}
        isDark={isDark}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
