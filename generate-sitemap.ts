/**
 * ==============================================================================
 * SANJAY'S LIGHTWORKS - SITEMAP GENERATOR SCRIPT (generate-sitemap.ts)
 * ==============================================================================
 * 
 * Dynamically generates a search-engine-ready sitemap.xml for Google, Bing,
 * and web crawlers, listing all primary routes:
 * - / (Master Portfolio Home)
 * - /portfolio (Portfolio Showcase)
 * - /gallery (High-Resolution Exhibition Gallery)
 * - /dashboard (Studio Operations Console)
 * - Deep Section Anchors (#services, #pricing, #book, #about)
 * 
 * Usage:
 *   npx tsx generate-sitemap.ts
 *   npm run sitemap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL resolution: Environment variable or fallback canonical domain
const DEFAULT_DOMAIN = 'https://ais-pre-uyqvlta5szu3h3fhwdtt2f-301400267540.us-east1.run.app';
const rawBaseUrl = 
  process.env.APP_URL || 
  process.env.SITE_URL || 
  process.env.PUBLIC_URL || 
  process.env.VITE_APP_URL || 
  DEFAULT_DOMAIN;

// Strip trailing slash
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export interface SitemapRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
  comment?: string;
}

/**
 * Route registry representing application views and navigation entry points
 */
export const CORE_ROUTES: SitemapRoute[] = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: 1.0,
    comment: 'Master Portfolio & Daylight Photography Showcase (Home)',
  },
  {
    path: '/portfolio',
    changefreq: 'weekly',
    priority: 1.0,
    comment: 'Candid & Natural Light Photography Portfolio',
  },
  {
    path: '/gallery',
    changefreq: 'weekly',
    priority: 0.9,
    comment: 'Full Curated Exhibition Gallery Collection',
  },
  {
    path: '/dashboard',
    changefreq: 'monthly',
    priority: 0.5,
    comment: 'Studio Operations Console & Pipeline (Restricted)',
  },
  // Section Navigation Anchors for Rich Snippets & Crawlers
  {
    path: '/#services',
    changefreq: 'monthly',
    priority: 0.8,
    comment: 'Photography Services & Session Offerings',
  },
  {
    path: '/#pricing',
    changefreq: 'monthly',
    priority: 0.8,
    comment: 'Transparent Pricing Packages ($15 - $150 CAD)',
  },
  {
    path: '/#calendar-reservation',
    changefreq: 'weekly',
    priority: 0.8,
    comment: 'Direct Real-Time Calendar Booking Engine',
  },
  {
    path: '/#about',
    changefreq: 'monthly',
    priority: 0.7,
    comment: 'Artist Biography & Natural Light Philosophy',
  },
];

/**
 * Formats XML output compliant with Sitemap Protocol 0.9
 */
export function generateSitemapXml(baseUrl: string, routes: SitemapRoute[] = CORE_ROUTES): string {
  const currentDate = new Date().toISOString().split('T')[0];

  const urlsXml = routes
    .map((route) => {
      const fullUrl = `${baseUrl}${route.path}`;
      const lastModDate = route.lastmod || currentDate;

      return `  <!-- ${route.comment || route.path} -->
  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlsXml}
</urlset>
`;
}

/**
 * Main execution function
 */
export function runSitemapGenerator() {
  console.log(`[Sitemap] Generating sitemap for base URL: ${BASE_URL}`);

  const xmlContent = generateSitemapXml(BASE_URL);

  // Targets:
  // 1. /public/sitemap.xml (Served by static file server / Vite)
  // 2. /sitemap.xml (Root directory)
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const publicSitemapPath = path.resolve(publicDir, 'sitemap.xml');
  const rootSitemapPath = path.resolve(__dirname, 'sitemap.xml');

  fs.writeFileSync(publicSitemapPath, xmlContent, 'utf-8');
  fs.writeFileSync(rootSitemapPath, xmlContent, 'utf-8');

  console.log(`[Sitemap] Successfully generated sitemap files:`);
  console.log(`  -> ${publicSitemapPath}`);
  console.log(`  -> ${rootSitemapPath}`);
  console.log(`[Sitemap] Total URLs indexed: ${CORE_ROUTES.length}`);

  // Also ensure public/robots.txt references the sitemap
  const robotsPath = path.resolve(publicDir, 'robots.txt');
  const robotsContent = `# Robots.txt for Sanjay's Lightworks Photography
User-agent: *
Allow: /
Disallow: /api/

# Sitemap Location
Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(robotsPath, robotsContent, 'utf-8');
  console.log(`[Sitemap] Updated robots.txt at: ${robotsPath}`);
}

// Execute immediately if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('generate-sitemap.ts')) {
  runSitemapGenerator();
}
