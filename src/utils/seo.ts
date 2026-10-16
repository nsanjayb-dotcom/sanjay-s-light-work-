/**
 * SEO & View Metadata Configuration
 * Sanjay's Lightworks Studio · Ontario, Canada
 */

export interface PageMetadata {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  canonicalPath: string;
}

export type SEOView = 'portfolio' | 'gallery' | 'services' | 'pricing' | 'booking' | 'contact' | 'dashboard' | 'not-found';

export const VIEW_METADATA: Record<SEOView, PageMetadata> = {
  portfolio: {
    title: "Sanjay's Lightworks – Natural Light Photography & Cinematography Ontario",
    description: "Authentic, unposed photography capturing natural light portraits, traditional ceremonies, couples, and creative sessions across Ontario, Canada.",
    ogTitle: "Sanjay's Lightworks – Natural Light Photography & Cinematography",
    ogDescription: "Discover authentic candid photography and timeless visual storytelling by Sanjay in Ontario. Transparent pricing and instant calendar booking.",
    canonicalPath: "/",
  },
  services: {
    title: "Services We Provide – Natural Light Photography & Events | Sanjay's Lightworks",
    description: "Explore our 4 natural light photography disciplines: Portraits & Couples, Themed & Creative, Events & Celebrations, and Heritage Ceremonies across Ontario.",
    ogTitle: "Services We Provide – Sanjay's Lightworks Photography",
    ogDescription: "From intimate daylight portraits to multi-hour heritage celebrations across Ontario. Relaxed posture, organic ambient light, and artisanal retouching.",
    canonicalPath: "/services",
  },
  gallery: {
    title: "Exhibition Gallery – Sanjay's Lightworks Photography Collection",
    description: "Explore the full high-resolution portfolio collection featuring traditional silk portraiture, atmospheric landscapes, and candid editorial stories.",
    ogTitle: "Exhibition Gallery – Sanjay's Lightworks Photography Collection",
    ogDescription: "High-resolution curated portfolio of natural light photography, traditional heritage ceremonies, and intimate portraits across Ontario.",
    canonicalPath: "/gallery",
  },
  pricing: {
    title: "Transparent Pricing & Packages ($50 – $200 CAD) – Sanjay's Lightworks",
    description: "All-inclusive photography packages with flat CAD rates, high-res downloads, and natural light direction in Ontario, Canada.",
    ogTitle: "Transparent Pricing & Packages – Sanjay's Lightworks",
    ogDescription: "Explore 4 transparent photography tiers ($50 to $200 CAD) with no hidden fees and instant booking.",
    canonicalPath: "/pricing",
  },
  booking: {
    title: "Direct Reservation & Calendar – Sanjay's Lightworks",
    description: "Reserve your photography session directly with Sanjay. Live schedule availability, transparent CAD rates, and zero booking delays.",
    ogTitle: "Direct Reservation & Calendar – Sanjay's Lightworks",
    ogDescription: "Instant direct scheduling for portrait, creative, event, and traditional cultural photography in Ontario, Canada.",
    canonicalPath: "/book",
  },
  contact: {
    title: "Contact & Studio Inquiries – Sanjay's Lightworks Ontario",
    description: "Direct WhatsApp and email messaging with Sanjay for portrait, event, and traditional ceremony sessions in Ontario, Canada.",
    ogTitle: "Contact & Inquiries – Sanjay's Lightworks",
    ogDescription: "Connect directly with Sanjay for custom session inquiries, dates, and Ontario photoshoot locations.",
    canonicalPath: "/contact",
  },
  dashboard: {
    title: "Studio Ops & Creative Pipeline – Sanjay's Lightworks (Owner Console)",
    description: "Private operations dashboard for Sanjay's Lightworks: direct booking management, analytics tracking, and portfolio content management.",
    ogTitle: "Studio Ops & Creative Pipeline – Sanjay's Lightworks",
    ogDescription: "Private administrative management console for Sanjay's Lightworks studio.",
    canonicalPath: "/dashboard",
  },
  'not-found': {
    title: "404 Page Not Found – Sanjay's Lightworks Studio",
    description: "The photo exhibition or page you are searching for does not exist. Return to Sanjay's Lightworks photography portfolio.",
    ogTitle: "404 Page Not Found – Sanjay's Lightworks Studio",
    ogDescription: "The requested page was not found. Return to the home portfolio to explore shoots and book sessions.",
    canonicalPath: "/404",
  },
};

/**
 * Updates document <title>, meta descriptions, and OpenGraph tags dynamically based on the active view.
 */
export function updatePageSEO(view: SEOView): void {
  if (typeof document === 'undefined') return;

  const meta = VIEW_METADATA[view] || VIEW_METADATA.portfolio;

  // 1. Update Title
  document.title = meta.title;

  // 2. Update or create Meta Description
  let descTag = document.querySelector('meta[name="description"]');
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.setAttribute('name', 'description');
    document.head.appendChild(descTag);
  }
  descTag.setAttribute('content', meta.description);

  // 3. Update or create OpenGraph Title
  let ogTitleTag = document.querySelector('meta[property="og:title"]');
  if (!ogTitleTag) {
    ogTitleTag = document.createElement('meta');
    ogTitleTag.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitleTag);
  }
  ogTitleTag.setAttribute('content', meta.ogTitle);

  // 4. Update or create OpenGraph Description
  let ogDescTag = document.querySelector('meta[property="og:description"]');
  if (!ogDescTag) {
    ogDescTag = document.createElement('meta');
    ogDescTag.setAttribute('property', 'og:description');
    document.head.appendChild(ogDescTag);
  }
  ogDescTag.setAttribute('content', meta.ogDescription);

  // 5. Update or create Twitter tags
  let twitterTitleTag = document.querySelector('meta[name="twitter:title"]');
  if (!twitterTitleTag) {
    twitterTitleTag = document.createElement('meta');
    twitterTitleTag.setAttribute('name', 'twitter:title');
    document.head.appendChild(twitterTitleTag);
  }
  twitterTitleTag.setAttribute('content', meta.ogTitle);

  let twitterDescTag = document.querySelector('meta[name="twitter:description"]');
  if (!twitterDescTag) {
    twitterDescTag = document.createElement('meta');
    twitterDescTag.setAttribute('name', 'twitter:description');
    document.head.appendChild(twitterDescTag);
  }
  twitterDescTag.setAttribute('content', meta.ogDescription);

  // 6. Update Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sanjayslightworks.ca';
  canonicalLink.setAttribute('href', `${baseUrl}${meta.canonicalPath}`);
}
