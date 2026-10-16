/**
 * Social media and direct messaging configurations for Sanjay's Lightwork.
 */

export const WHATSAPP_NUMBER = '19055882047'; // Sanjay's Canadian WhatsApp number (+1 905-588-2047)
export const WHATSAPP_DISPLAY = '+1 (905) 588-2047';
export const INSTAGRAM_HANDLE = 'sanjays_lightworks';
export const INSTAGRAM_URL = 'https://www.instagram.com/sanjays_lightworks/';

/**
 * Builds a direct WhatsApp click-to-chat URL with an optional prefilled message.
 */
export function getWhatsAppUrl(message?: string): string {
  const defaultText =
    'Hi Sanjay, I am reaching out from your portfolio website. I would love to inquire about booking a photography session!';
  const text = encodeURIComponent(message || defaultText);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

/**
 * Builds a WhatsApp URL tailored for a specific photoshoot genre & duration.
 */
export function getWhatsAppBookingInquiryUrl(
  shootType: string,
  durationHours: number,
  addOns: string[] = []
): string {
  const addOnsText = addOns.length > 0 ? ` with add-ons (${addOns.join(', ')})` : '';
  const message = `Hi Sanjay! I saw your portfolio and would like to inquire about booking a ${shootType} for ${durationHours} ${
    durationHours === 1 ? 'hour' : 'hours'
  }${addOnsText}. Are you available for an upcoming date?`;
  return getWhatsAppUrl(message);
}
