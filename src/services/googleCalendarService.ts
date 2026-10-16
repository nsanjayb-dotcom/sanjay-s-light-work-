/**
 * Google Calendar API Service
 * Sanjay's Lightworks - Direct Calendar Integration & Availability Engine
 * 
 * Interfaces with Google Calendar API using .env credentials (GOOGLE_CALENDAR_ID, 
 * GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_API_KEY) via secure backend proxy 
 * (/api/calendar/availability), enabling real-time shoot slot availability checks.
 */

import { parseDateTimeSafely } from '../utils/calendar';

export interface CalendarSlot {
  time: string; // e.g. '09:30'
  label: string; // e.g. 'Morning Soft Light (09:30 - 11:30 AM)'
  available: boolean;
  type: 'morning' | 'afternoon' | 'golden_hour' | 'twilight';
  description: string;
  recommendedFor: string;
  isGoldenHour?: boolean;
  conflictDetails?: string;
}

export interface CalendarAvailabilityResponse {
  date: string;
  isConnectedToGoogle: boolean;
  calendarSource: 'google_api' | 'studio_schedule';
  calendarId: string;
  slots: CalendarSlot[];
  photographerEmail: string;
  statusMessage: string;
}

export interface ShootBookingPayload {
  id?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  packageId?: string;
  packageName: string;
  preferredDate: string;
  preferredTime: string;
  preferredStartTime?: string;
  preferredEndTime?: string;
  location: string;
  notes?: string;
  totalPrice: number;
  customAddOns?: string[];
}

export const PHOTOGRAPHER_EMAIL = 'nsanjayb@gmail.com';
export const STUDIO_NAME = "Sanjay's Lightworks Studio";

/**
 * Natural Light & Studio shoot slots designed for Ontario's latitude & golden hour curves
 */
export const DEFAULT_STUDIO_SLOTS: CalendarSlot[] = [
  {
    time: '09:30',
    label: 'Morning Soft Light',
    available: true,
    type: 'morning',
    description: '09:30 AM – 11:30 AM · Gentle directional window light with low contrast and flattering skin wrap.',
    recommendedFor: 'Editorial portraits, quiet indoor studio captures, and headshots.',
  },
  {
    time: '13:00',
    label: 'Afternoon High Key',
    available: true,
    type: 'afternoon',
    description: '01:00 PM – 03:00 PM · Punchy daylight and controlled studio diffusion with crisp shadows.',
    recommendedFor: 'Fashion looks, traditional silk details, and vibrant family celebrations.',
  },
  {
    time: '16:30',
    label: 'Golden Hour (Signature)',
    available: true,
    type: 'golden_hour',
    isGoldenHour: true,
    description: '04:30 PM – 06:30 PM · Warm 3200K natural amber sunburst, rim lighting, and dramatic cinematic flares.',
    recommendedFor: 'Couples, sunset heritage rituals, outdoor portraits, and scenic Ontario parks.',
  },
  {
    time: '19:00',
    label: 'Sunset & Twilight',
    available: true,
    type: 'twilight',
    description: '07:00 PM – 09:00 PM · Deep violet-blue ambient skylight mixed with subtle warm bounce.',
    recommendedFor: 'Atmospheric evening portraits, dusk ceremonies, and lantern/candlelight shoots.',
  },
];

/**
 * Fetches real-time slot availability from the Google Calendar backend service.
 */
export async function fetchCalendarAvailability(dateStr: string): Promise<CalendarAvailabilityResponse> {
  try {
    const res = await fetch(`/api/calendar/availability?date=${encodeURIComponent(dateStr)}`);
    if (res.ok) {
      const data: CalendarAvailabilityResponse = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[GoogleCalendarService] Failed to reach live server, using resilient fallback:', err);
  }

  // Resilient fallback checking local storage bookings
  let bookedTimes: string[] = [];
  try {
    const saved = localStorage.getItem('sanjay_bookings');
    if (saved) {
      const localBookings = JSON.parse(saved);
      bookedTimes = localBookings
        .filter((b: any) => b.preferredDate === dateStr && b.status !== 'cancelled')
        .map((b: any) => b.preferredTime);
    }
  } catch {
    // fallback
  }

  return {
    date: dateStr,
    isConnectedToGoogle: false,
    calendarSource: 'studio_schedule',
    calendarId: PHOTOGRAPHER_EMAIL,
    photographerEmail: PHOTOGRAPHER_EMAIL,
    statusMessage: 'Live studio schedule active. (Google Calendar API available when env credentials connected)',
    slots: DEFAULT_STUDIO_SLOTS.map(slot => ({
      ...slot,
      available: !bookedTimes.includes(slot.time),
      conflictDetails: bookedTimes.includes(slot.time) ? 'Reserved by prior client booking' : undefined,
    })),
  };
}

/**
 * Checks a specific date and time slot for conflicts.
 */
export async function checkSlotAvailability(dateStr: string, timeStr: string): Promise<{
  available: boolean;
  conflictReason?: string;
  slotInfo?: CalendarSlot;
}> {
  const availability = await fetchCalendarAvailability(dateStr);
  const matched = availability.slots.find(s => s.time === timeStr);
  if (!matched) {
    return { available: true };
  }
  return {
    available: matched.available,
    conflictReason: matched.conflictDetails,
    slotInfo: matched,
  };
}

/**
 * Submits a new booking to the server with instant calendar integration and automated notifications.
 */
export async function submitShootBooking(payload: ShootBookingPayload): Promise<{
  success: boolean;
  booking: any;
  calendarUrl: string;
  emailResult: any;
}> {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit shoot reservation.');
  }

  return await response.json();
}

/**
 * Builds a direct Google Calendar 1-click sync link for the client.
 */
export function buildGoogleCalendarDirectUrl(booking: ShootBookingPayload): string {
  try {
    const rawTime = booking.preferredStartTime || booking.preferredTime || '10:00';
    const startDate = parseDateTimeSafely(booking.preferredDate, rawTime, 10, 0);
    const endRawTime = booking.preferredEndTime || '';
    let endDate: Date;
    if (endRawTime) {
      endDate = parseDateTimeSafely(booking.preferredDate, endRawTime, 12, 0);
      if (endDate.getTime() <= startDate.getTime()) {
        endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      }
    } else {
      endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    }

    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const title = encodeURIComponent(`📸 Photo Shoot: ${booking.packageName} · ${booking.clientName}`);
    const location = encodeURIComponent(booking.location || 'Ontario (TBD with Sanjay)');
    
    const details = encodeURIComponent(
      `SHOOT RESERVATION · ${STUDIO_NAME}\n` +
      `----------------------------------------\n` +
      `Client: ${booking.clientName}\n` +
      `Email: ${booking.clientEmail}\n` +
      `Phone: ${booking.clientPhone || 'Not provided'}\n` +
      `Package: ${booking.packageName}\n` +
      `Total Rate: $${booking.totalPrice}\n` +
      `Selected Time Slot: ${booking.preferredTime}\n` +
      `Location: ${booking.location || 'Ontario'}\n\n` +
      `Creative Notes:\n${booking.notes || 'None provided'}\n\n` +
      `Photographer: Sanjay (${PHOTOGRAPHER_EMAIL})\n` +
      `Booking Ref: #${booking.id || 'NEW'}`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${details}&location=${location}&add=${encodeURIComponent(PHOTOGRAPHER_EMAIL)},${encodeURIComponent(booking.clientEmail)}`;
  } catch {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Photo Shoot with ${booking.clientName}`)}`;
  }
}

/**
 * Generates an .ics file download for Apple Calendar, Outlook, and offline calendars.
 */
export function downloadCalendarIcsFile(booking: ShootBookingPayload): void {
  try {
    const rawTime = booking.preferredStartTime || booking.preferredTime || '10:00';
    const startDate = parseDateTimeSafely(booking.preferredDate, rawTime, 10, 0);
    const endRawTime = booking.preferredEndTime || '';
    let endDate: Date;
    if (endRawTime) {
      endDate = parseDateTimeSafely(booking.preferredDate, endRawTime, 12, 0);
      if (endDate.getTime() <= startDate.getTime()) {
        endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      }
    } else {
      endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    }

    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sanjays Lightworks//Shoot Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${booking.id || Date.now()}@sanjayslightworks.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(startDate)}`,
      `DTEND:${fmt(endDate)}`,
      `SUMMARY:📸 Photo Shoot: ${booking.packageName} - ${booking.clientName}`,
      `DESCRIPTION:Photo session with Sanjay (${PHOTOGRAPHER_EMAIL})\\nPackage: ${booking.packageName}\\nRate: $${booking.totalPrice}\\nNotes: ${booking.notes || 'None'}`,
      `LOCATION:${booking.location || 'Ontario'}`,
      `ORGANIZER;CN=Sanjay's Lightworks:mailto:${PHOTOGRAPHER_EMAIL}`,
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${booking.clientName}:mailto:${booking.clientEmail}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Sanjays-Lightworks-Shoot-${booking.preferredDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to export .ics file:', err);
  }
}
