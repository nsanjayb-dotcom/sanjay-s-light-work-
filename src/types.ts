export type GalleryCategory = 'all' | 'portraits' | 'traditional' | 'landscape' | 'events' | 'editorial' | 'concerts' | 'weddings' | 'cinematography';

export interface GalleryItem {
  id: string;
  title: string;
  category: Exclude<GalleryCategory, 'all'>;
  aspectRatio: 'portrait' | 'landscape' | 'square' | 'tall';
  imageUrl: string;
  thumbnailUrl?: string;
  client?: string;
  location?: string;
  year: string;
  cameraInfo?: {
    body: string;
    lens: string;
    aperture: string;
    shutter: string;
    iso: string;
  };
  tags?: string[];
  description: string;
}

export interface PortfolioSeries {
  id: string;
  num: string;
  category: string;
  title: string;
  description: string;
  images: string[];
}

export interface PricingPackage {
  id: string;
  name: string;
  tagline: string;
  price: number;
  period?: string; // e.g., "per shoot" or "/ month"
  duration: string;
  deliverables: string[];
  popular?: boolean;
  category: 'shoot' | 'subscription';
  includedFeatures: string[];
  depositAmount: number;
}

export interface BookingRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  packageId: string;
  packageName: string;
  customAddOns: string[];
  preferredDate: string;
  preferredTime: string;
  preferredStartTime?: string;
  preferredEndTime?: string;
  location: string;
  notes: string;
  totalPrice: number;
  depositPaid: boolean;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed';
}

export type ProjectStage = 'inquiry' | 'booked' | 'pre_production' | 'shot_complete' | 'editing' | 'delivered';

export interface ProjectProgressItem {
  id: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  shootType: string;
  date: string;
  stage: ProjectStage;
  deliverablesCount: number;
  galleryUrl?: string;
  invoiceStatus: 'unpaid' | 'deposit_paid' | 'paid_in_full';
  totalValue: number;
  notes: string;
}

export interface SubscriptionItem {
  id: string;
  clientName: string;
  companyOrBrand: string;
  clientEmail: string;
  tierName: string;
  monthlyFee: number;
  shootsPerMonth: number;
  shootsUsedThisMonth: number;
  status: 'active' | 'paused' | 'cancelled';
  renewalDate: string;
  features: string[];
}

export interface ShootAddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}
