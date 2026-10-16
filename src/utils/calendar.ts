import { BookingRequest } from '../types';

export const PHOTOGRAPHER_EMAIL = 'nsanjayb@gmail.com';
export const PHOTOGRAPHER_PHONE = '+1 (905) 588-2047';
export const STUDIO_NAME = "Sanjay's Lightwork Studio";

/**
 * Safely parses date and time strings (supporting "HH:MM", "hh:mm AM/PM", "h:mm am", etc.)
 * into a guaranteed valid Date object. Never throws "Invalid time value".
 */
export function parseDateTimeSafely(
  dateStr?: string, 
  timeStr?: string, 
  fallbackHours = 10, 
  fallbackMinutes = 0
): Date {
  const now = new Date();
  let baseDate = new Date();

  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    const [y, m, d] = dateStr.trim().split('-').map(Number);
    baseDate = new Date(y, m - 1, d);
  } else if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }

  let hours = fallbackHours;
  let minutes = fallbackMinutes;

  if (timeStr) {
    const cleanTime = timeStr.trim();
    // Check for 12-hour format with AM/PM (e.g., "09:30 AM", "9:30pm", "11:00 am")
    const match12 = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = parseInt(match12[2], 10);
      const meridiem = match12[3]?.toUpperCase();

      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;

      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        hours = h;
        minutes = m;
      }
    } else {
      // Check for simple 24-hour "HH:MM"
      const match24 = cleanTime.match(/^(\d{1,2}):(\d{2})/);
      if (match24) {
        const h = parseInt(match24[1], 10);
        const m = parseInt(match24[2], 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          hours = h;
          minutes = m;
        }
      }
    }
  }

  baseDate.setHours(hours, minutes, 0, 0);

  if (isNaN(baseDate.getTime())) {
    now.setHours(fallbackHours, fallbackMinutes, 0, 0);
    return now;
  }

  return baseDate;
}

/**
 * Formats a Date object to Google Calendar's required ISO-like format: YYYYMMDDTHHMMSSZ
 * Safely guards against invalid dates.
 */
function formatToGoogleCalendarDate(date: Date): string {
  try {
    if (!date || isNaN(date.getTime())) {
      const fallback = new Date();
      return fallback.toISOString().replace(/-|:|\.\d+/g, '');
    }
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  } catch {
    return new Date().toISOString().replace(/-|:|\.\d+/g, '');
  }
}

/**
 * Builds an authentic Google Calendar event URL for instant one-click syncing.
 */
export function buildGoogleCalendarUrl(booking: BookingRequest): string {
  try {
    // Parse preferred date and time range safely
    const startDate = parseDateTimeSafely(
      booking.preferredDate, 
      booking.preferredStartTime || booking.preferredTime, 
      10, 
      0
    );
    
    let endDate: Date;
    if (booking.preferredEndTime) {
      endDate = parseDateTimeSafely(
        booking.preferredDate, 
        booking.preferredEndTime, 
        12, 
        0
      );
      // Ensure endDate is after startDate
      if (endDate.getTime() <= startDate.getTime()) {
        endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      }
    } else {
      endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    }

    const title = encodeURIComponent(`📸 Photo Shoot: ${booking.packageName} - ${booking.clientName}`);
    const location = encodeURIComponent(booking.location || 'On-location / Studio (TBD with Sanjay)');
    
    const detailsText = `
PHOTO SHOOT RESERVATION - ${STUDIO_NAME}
----------------------------------------
Client: ${booking.clientName}
Email: ${booking.clientEmail}
Phone: ${booking.clientPhone || 'Not provided'}
Package: ${booking.packageName}
Total Rate: $${booking.totalPrice} CAD
Time Window: ${booking.preferredStartTime || booking.preferredTime || '10:00 AM'} - ${booking.preferredEndTime || 'Flexible'}
Add-ons: ${booking.customAddOns && booking.customAddOns.length > 0 ? booking.customAddOns.join(', ') : 'None'}

Client Notes & Creative Vision:
${booking.notes || 'None provided'}

Photographer: Sanjay (${PHOTOGRAPHER_EMAIL})
Studio: https://sanjay-s-lightwork.vercel.app/
Booking Ref: #${booking.id}
    `.trim();

    const details = encodeURIComponent(detailsText);
    const dates = `${formatToGoogleCalendarDate(startDate)}/${formatToGoogleCalendarDate(endDate)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&add=${encodeURIComponent(PHOTOGRAPHER_EMAIL)}`;
  } catch (err) {
    console.error('Error generating Google Calendar URL:', err);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Photo Shoot with ' + booking.clientName)}`;
  }
}

/**
 * Generates and triggers download of a standardized .ics iCalendar file.
 */
export function downloadIcsFile(booking: BookingRequest): void {
  try {
    const startDate = parseDateTimeSafely(
      booking.preferredDate, 
      booking.preferredStartTime || booking.preferredTime, 
      10, 
      0
    );
    let endDate: Date;
    if (booking.preferredEndTime) {
      endDate = parseDateTimeSafely(
        booking.preferredDate, 
        booking.preferredEndTime, 
        12, 
        0
      );
      if (endDate.getTime() <= startDate.getTime()) {
        endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      }
    } else {
      endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    }

    const formatIcsDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sanjays Lightwork//Photo Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${booking.id}@sanjayslightwork.com`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:📸 Photo Shoot: ${booking.packageName} with ${booking.clientName}`,
      `DESCRIPTION:Client: ${booking.clientName}\\nEmail: ${booking.clientEmail}\\nPackage: ${booking.packageName}\\nTotal: $${booking.totalPrice}\\nSchedule: ${booking.preferredStartTime || booking.preferredTime} - ${booking.preferredEndTime || 'Flexible'}\\nNotes: ${booking.notes}`,
      `LOCATION:${booking.location || 'Studio / On-Location'}`,
      `ORGANIZER;CN=Sanjay's Lightwork:MAILTO:${PHOTOGRAPHER_EMAIL}`,
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${booking.clientName}:MAILTO:${booking.clientEmail}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `shoot-booking-${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error exporting .ics file:', err);
  }
}

/**
 * Generates mailto link formatted to notify Sanjay at nsanjayb@gmail.com
 */
export function generatePhotographerMailto(booking: BookingRequest): string {
  const subject = encodeURIComponent(`📸 New Shoot Booking Confirmed: ${booking.packageName} - ${booking.clientName}`);
  const body = encodeURIComponent(`Hi Sanjay,

A new photoshoot reservation has been placed on your website:

Booking Reference: #${booking.id}
Client Name: ${booking.clientName}
Client Email: ${booking.clientEmail}
Client Phone: ${booking.clientPhone || 'Not provided'}
Package: ${booking.packageName}
Total: $${booking.totalPrice}
Date & Time: ${booking.preferredDate} at ${booking.preferredTime}
Location: ${booking.location || 'Ontario'}

Notes & Vision:
${booking.notes || 'None provided'}

Google Calendar Event:
${buildGoogleCalendarUrl(booking)}
`);
  return `mailto:${PHOTOGRAPHER_EMAIL}?subject=${subject}&body=${body}`;
}

export async function submitBookingToApi(booking: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  packageId: string;
  packageName: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  notes: string;
  totalPrice: number;
}): Promise<{
  success: boolean;
  booking: BookingRequest;
  calendarUrl: string;
  emailStatus: string;
  emailMessage?: string;
}> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        booking: {
          ...data.booking,
          customAddOns: [],
          depositPaid: true,
        },
        calendarUrl: data.calendarUrl,
        emailStatus: data.emailResult?.provider || 'sent',
        emailMessage: data.emailResult?.message || 'Email notifications dispatched.',
      };
    }
  } catch (err) {
    console.warn('API booking endpoint call failed, falling back to client-side generator:', err);
  }

  // Fallback client-side record
  const fallbackBooking: BookingRequest = {
    id: `SL-${Math.floor(1000 + Math.random() * 9000)}`,
    ...booking,
    customAddOns: [],
    depositPaid: true,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  };

  return {
    success: true,
    booking: fallbackBooking,
    calendarUrl: buildGoogleCalendarUrl(fallbackBooking),
    emailStatus: 'simulated',
    emailMessage: 'Booking recorded and ready to add to your calendar.',
  };
}
