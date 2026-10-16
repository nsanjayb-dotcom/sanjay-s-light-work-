import React, { useState, useEffect, useRef } from 'react';
import { ProjectProgressItem, SubscriptionItem, ProjectStage, GalleryItem, GalleryCategory } from '../types';
import { soundEngine } from '../utils/audio';
import { GalleryManager } from './GalleryManager';
import { BookingsLogManager } from './BookingsLogManager';
import { secureAdminFetch, sanitizeInput, fetchTotpSetup, TotpSetupData } from '../utils/security';
import { 
  fetchStudioDashboardData, 
  updateStudioPipelineStage, 
  createStudioPipelineProject, 
  deleteStudioPipelineProject, 
  configureSupabaseServiceRole,
  getSupabaseConfig,
  StudioDashboardData 
} from '../services/supabaseService';
import { 
  BarChart3, 
  Layers, 
  Repeat, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  DollarSign, 
  Mail, 
  X,
  Lock,
  KeyRound,
  Image as ImageIcon,
  CalendarCheck,
  Smartphone,
  Trash2,
  Database,
  Sparkles,
  Upload,
  Camera,
  Sliders,
  Loader2,
  RefreshCw,
  Download,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { showToast as triggerToast } from './SupabaseToast';
import { SecureImageUpload } from './SecureImageUpload';

interface DashboardProps {
  projects: ProjectProgressItem[];
  onUpdateProjects?: (projects: ProjectProgressItem[]) => void;
  subscriptions: SubscriptionItem[];
  galleryItems?: GalleryItem[];
  onUpdateGalleryItems?: (items: GalleryItem[]) => void;
  onUpdateProjectStage: (id: string, newStage: ProjectStage) => void;
  onAddProject: (project: ProjectProgressItem) => void;
  onDeleteProject?: (id: string) => void;
  onAddSubscription: (sub: SubscriptionItem) => void;
  onDeleteSubscription?: (id: string) => void;
  onClearAllDemoData?: () => void;
  onResetDemoData?: () => void;
  onClose: () => void;
  isDark: boolean;
  isAdmin?: boolean;
  onLogoutAdmin?: () => void;
  onOpenAdminAuth?: () => void;
}

const STAGE_CONFIG: { stage: ProjectStage; label: string; color: string }[] = [
  { stage: 'inquiry', label: 'Inquiry & Booking', color: 'border-stone-500 text-stone-300 bg-stone-500/10' },
  { stage: 'pre_production', label: 'Pre-Production & Moodboard', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
  { stage: 'shot_complete', label: 'Shot Complete (Culling)', color: 'border-amber-500 text-amber-400 bg-amber-500/15' },
  { stage: 'editing', label: 'Color Grading & Retouching', color: 'border-orange-500/50 text-orange-400 bg-orange-500/10' },
  { stage: 'delivered', label: 'Gallery Delivered', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
];

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onUpdateProjects,
  subscriptions,
  galleryItems = [],
  onUpdateGalleryItems,
  onUpdateProjectStage,
  onAddProject,
  onDeleteProject,
  onAddSubscription,
  onDeleteSubscription,
  onClearAllDemoData,
  onResetDemoData,
  onClose,
  isDark,
  isAdmin = false,
  onLogoutAdmin,
  onOpenAdminAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'pipeline' | 'bookings' | 'gallery' | 'subscriptions' | 'data-control'>('analytics');
  
  // Real or Demo data mode tracker
  const [isRealDataMode, setIsRealDataMode] = useState<boolean>(() => {
    return localStorage.getItem('sanjay_data_mode') === 'real' || (projects.length === 0 && subscriptions.length === 0);
  });

  // Supabase PostgreSQL State
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    source: 'supabase_postgres' | 'in_memory';
    supabaseUrl: string;
    serviceRoleActive: boolean;
  }>({
    configured: false,
    source: 'in_memory',
    supabaseUrl: '',
    serviceRoleActive: false,
  });

  // Dynamic Analytics Data from Supabase
  const [analyticsData, setAnalyticsData] = useState<{
    siteVisits: number;
    galleryViews: number;
    directBookings: number;
    totalRevenue: number;
    topClickedPackages: { name: string; clicks: number; share: string }[];
  }>({
    siteVisits: 0,
    galleryViews: 0,
    directBookings: 0,
    totalRevenue: 0,
    topClickedPackages: [],
  });

  // User-configurable real metrics baseline
  const [realMetricsBaseline, setRealMetricsBaseline] = useState<{
    verifiedVisits: number;
    careerBaseRevenue: number;
    quarterlyGoal: number;
  }>(() => {
    try {
      const saved = localStorage.getItem('sanjay_real_metrics');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      verifiedVisits: 0,
      careerBaseRevenue: 0,
      quarterlyGoal: 10000,
    };
  });

  // Fetch dynamic studio dashboard records from Supabase PostgreSQL (via Service Role)
  const syncSupabaseDashboard = async (showToast = false) => {
    setIsSupabaseLoading(true);
    try {
      const data: StudioDashboardData | null = await fetchStudioDashboardData();
      if (data && data.success) {
        setSupabaseStatus({
          configured: data.configured,
          source: data.source,
          supabaseUrl: data.supabaseUrl || '',
          serviceRoleActive: data.serviceRoleActive,
        });

        // Replace mock projects with dynamic PostgreSQL records
        if ((data.source === 'supabase_postgres' || data.configured) && Array.isArray(data.projects)) {
          onUpdateProjects?.(data.projects);
          setIsRealDataMode(true);
          localStorage.setItem('sanjay_data_mode', 'real');
          localStorage.setItem('sanjay_projects', JSON.stringify(data.projects));
        }

        // Dynamically update analytics metrics from PostgreSQL
        if (data.metrics) {
          setAnalyticsData(data.metrics);
        }

        // Dynamically persist verified reservations from PostgreSQL
        if (Array.isArray(data.bookings)) {
          localStorage.setItem('sanjay_bookings', JSON.stringify(data.bookings));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sanjay_bookings_synced', { detail: data.bookings }));
          }
        }

        if (showToast) {
          soundEngine.playSuccess();
          triggerToast(
            data.configured
              ? `Synchronized ${data.projects?.length || 0} shoots and ${data.bookings?.length || 0} reservations from Supabase PostgreSQL.`
              : 'Studio database synchronized.',
            'success',
            data.configured ? 'Supabase PostgreSQL Live' : 'Database Synced'
          );
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Supabase sync error:', err);
    } finally {
      setIsSupabaseLoading(false);
    }
  };

  useEffect(() => {
    syncSupabaseDashboard();
  }, []);

  // Dynamic Calculated Real Totals
  const activeRetainersCount = subscriptions.filter(s => s.status === 'active').length;
  const monthlyRetainerRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.monthlyFee, 0);
  
  const pipelineValue = projects.reduce((sum, p) => sum + p.totalValue, 0);
  const activeShootsCount = projects.filter(p => p.stage !== 'delivered').length;
  const deliveredShootsCount = projects.filter(p => p.stage === 'delivered').length;

  // Real Calculated Total Revenue: Supabase Revenue + Monthly Retainers + baseline
  const calculatedTotalRevenue = Math.max(
    analyticsData.totalRevenue,
    realMetricsBaseline.careerBaseRevenue + 
      projects.reduce((sum, p) => sum + (p.invoiceStatus === 'paid_in_full' ? p.totalValue : p.invoiceStatus === 'deposit_paid' ? Math.round(p.totalValue * 0.5) : 0), 0)
  ) + (monthlyRetainerRevenue * 3);

  // Modals State
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTotpConfigModal, setShowTotpConfigModal] = useState(false);
  const [showAdjustMetricsModal, setShowAdjustMetricsModal] = useState(false);
  const [showSupabaseConfigModal, setShowSupabaseConfigModal] = useState(false);
  
  // Supabase Configuration Modal State
  const [inputSupabaseUrl, setInputSupabaseUrl] = useState('');
  const [inputServiceKey, setInputServiceKey] = useState('');
  const [inputAnonKey, setInputAnonKey] = useState('');
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<{ success?: string; error?: string } | null>(null);

  // Accessible In-App Confirmation Dialog State (replaces window.confirm)
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

  // Auto-fetch current configuration when Supabase settings modal opens
  useEffect(() => {
    if (showSupabaseConfigModal) {
      getSupabaseConfig().then((cfg) => {
        if (cfg) {
          if (cfg.supabaseUrl && !inputSupabaseUrl) {
            setInputSupabaseUrl(cfg.supabaseUrl);
          }
          if (cfg.anonKey && !inputAnonKey) {
            setInputAnonKey(cfg.anonKey);
          }
        }
      });
    }
  }, [showSupabaseConfigModal]);

  const [totpData, setTotpData] = useState<TotpSetupData | null>(null);
  const [isCopiedTotp, setIsCopiedTotp] = useState(false);
  const [isLoadingTotp, setIsLoadingTotp] = useState(false);

  // New Real Project Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newShootType, setNewShootType] = useState('Portraits & Couples');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLocation, setNewLocation] = useState('High Park, Toronto');
  const [newTotalValue, setNewTotalValue] = useState(350);
  const [newInvoiceStatus, setNewInvoiceStatus] = useState<'pending' | 'deposit_paid' | 'paid_in_full'>('deposit_paid');
  const [newDeliverablesCount, setNewDeliverablesCount] = useState(35);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // New Real Subscription Form State
  const [subClientName, setSubClientName] = useState('');
  const [subBrand, setSubBrand] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subFee, setSubFee] = useState(550);
  const [subShootsCount, setSubShootsCount] = useState(2);

  // Handle photo uploaded via SecureImageUpload (Supabase Storage)
  const handlePhotoUploadedSuccess = (newPhoto: GalleryItem) => {
    const updated = [newPhoto, ...galleryItems.filter(i => i.id !== newPhoto.id)];
    onUpdateGalleryItems?.(updated);
    try {
      localStorage.setItem('sanjay_gallery_items', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setShowUploadModal(false);
    setActiveTab('gallery');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProject(true);
    soundEngine.playSuccess();

    const newProjData: Partial<ProjectProgressItem> = {
      clientName: sanitizeInput(newClientName) || 'Private Client',
      clientEmail: sanitizeInput(newClientEmail) || 'client@example.com',
      projectName: sanitizeInput(newProjectName) || `${newShootType} Shoot`,
      shootType: newShootType,
      date: newDate,
      stage: 'inquiry',
      deliverablesCount: Number(newDeliverablesCount) || 30,
      invoiceStatus: newInvoiceStatus,
      totalValue: Number(newTotalValue) || 150,
      notes: sanitizeInput(newNotes) || (newLocation ? `Location: ${newLocation}` : ''),
    };

    // Dynamically insert into Supabase PostgreSQL (via Service Role)
    const saved = await createStudioPipelineProject(newProjData);
    const finalProject: ProjectProgressItem = saved || {
      id: `proj-${Date.now().toString().slice(-4)}`,
      ...(newProjData as any)
    };

    onAddProject(finalProject);
    setIsRealDataMode(true);
    localStorage.setItem('sanjay_data_mode', 'real');
    setIsSubmittingProject(false);
    setShowAddProjectModal(false);
    
    // Reset Form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewProjectName('');
    setNewNotes('');

    // Re-sync dashboard totals
    syncSupabaseDashboard();
  };

  const handleStageChange = async (projId: string, newStage: ProjectStage) => {
    soundEngine.playSwitch();
    onUpdateProjectStage(projId, newStage);
    // Persist to Supabase PostgreSQL using service role
    await updateStudioPipelineStage(projId, newStage);
  };

  const handleDeleteProjectClick = (projId: string) => {
    soundEngine.playClick();
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Client Shoot Record',
      message: 'Are you sure you want to remove this shoot from your active pipeline? This will delete the record from your PostgreSQL database ledger.',
      confirmLabel: 'Delete Shoot',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        onDeleteProject?.(projId);
        await deleteStudioPipelineProject(projId);
        triggerToast('Shoot record deleted from database ledger.', 'info', 'Pipeline Updated');
        syncSupabaseDashboard();
      },
    });
  };

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playSuccess();
    const createdSub: SubscriptionItem = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      clientName: sanitizeInput(subClientName) || 'Commercial Client',
      companyOrBrand: sanitizeInput(subBrand) || sanitizeInput(subClientName) || 'Studio Retainer',
      clientEmail: sanitizeInput(subEmail) || 'brand@example.com',
      tierName: 'Commercial Content Retainer',
      monthlyFee: Number(subFee) || 550,
      shootsPerMonth: Number(subShootsCount) || 2,
      shootsUsedThisMonth: 0,
      status: 'active',
      renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      features: [`${subShootsCount} Sessions / Month`, 'High-Res Digital Retouching', 'Priority 48hr Turnaround'],
    };
    onAddSubscription(createdSub);
    setIsRealDataMode(true);
    localStorage.setItem('sanjay_data_mode', 'real');
    setShowAddSubModal(false);
    setSubClientName('');
    setSubBrand('');
    setSubEmail('');
    triggerToast('Commercial retainer recorded successfully.', 'success', 'Retainer Active');
  };

  const handlePurgeAllDemo = () => {
    soundEngine.playClick();
    setConfirmModalConfig({
      isOpen: true,
      title: 'Purge Mock Records · Clean Slate',
      message: 'Permanently remove placeholder demo shoots, sample clients, and mock retainers to operate with 100% genuine studio records?',
      confirmLabel: 'Wipe Mock Data',
      isDestructive: true,
      onConfirm: () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        onClearAllDemoData?.();
        setIsRealDataMode(true);
        localStorage.setItem('sanjay_data_mode', 'real');
        triggerToast('All placeholder demo records cleared. Studio is operating in clean slate mode.', 'success', 'Clean Slate Active');
      },
    });
  };

  const handleRestoreDemoPreset = () => {
    soundEngine.playClick();
    setConfirmModalConfig({
      isOpen: true,
      title: 'Restore Showcase Sample Preset',
      message: 'Load sample photography pipeline contracts, active retainers, and reservation showcase records for client demonstration?',
      confirmLabel: 'Restore Demo Records',
      isDestructive: false,
      onConfirm: () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        onResetDemoData?.();
        setIsRealDataMode(false);
        localStorage.setItem('sanjay_data_mode', 'demo');
        triggerToast('Showcase sample records restored.', 'info', 'Showcase Mode');
      },
    });
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigFeedback(null);

    const res = await configureSupabaseServiceRole(
      inputSupabaseUrl.trim(),
      inputServiceKey.trim(),
      inputAnonKey.trim() || undefined
    );

    setIsSavingConfig(false);
    if (res.success) {
      soundEngine.playSuccess();
      setConfigFeedback({ success: res.message || 'Successfully connected to Supabase PostgreSQL!' });
      setTimeout(() => {
        setShowSupabaseConfigModal(false);
        setConfigFeedback(null);
        syncSupabaseDashboard(true);
      }, 1500);
    } else {
      soundEngine.playError();
      setConfigFeedback({ error: res.error || 'Failed to connect. Please check credentials.' });
    }
  };

  const handleExportData = () => {
    soundEngine.playClick();
    const exportBundle = {
      studio: "Sanjay's Lightworks",
      exportedAt: new Date().toISOString(),
      mode: isRealDataMode ? 'real' : 'demo',
      supabase: supabaseStatus,
      projects,
      subscriptions,
      galleryItemsCount: galleryItems.length,
      baseline: realMetricsBaseline,
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanjays-lightworks-studio-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // RESTRICTED ACCESS GATE: Studio Ops Private Vault Door
  if (!isAdmin) {
    return (
      <section id="sanjay-dashboard-locked" className="py-24 px-4 max-w-md mx-auto text-center animate-fadeIn">
        <div className={`p-8 sm:p-10 rounded-2xl border relative overflow-hidden transition-all ${
          isDark 
            ? 'bg-[#0a0907] border-[#26231e] text-[#f5f2eb] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)]' 
            : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17] shadow-xl'
        }`}>
          {/* Ambient Gold Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-24 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
            <Lock size={26} />
          </div>
          
          <div className="text-[10px] font-sans uppercase tracking-[0.25em] text-amber-500 font-semibold mb-1">
            2FA RESTRICTED // OWNER ONLY
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight mb-2">
            Private Studio Vault
          </h2>
          <p className={`text-xs leading-relaxed mb-6 ${isDark ? 'text-[#9e9689]' : 'text-stone-600'}`}>
            Direct operations, shoot pipeline, real client logs, and portfolio curation for Sanjay (<span className="text-amber-500 font-mono">nsanjayb@gmail.com</span>).
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenAdminAuth?.();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <KeyRound size={16} />
              <span>Unlock Studio Access</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-sans font-medium uppercase tracking-wider border transition-colors cursor-pointer ${
                isDark ? 'border-[#262420] text-stone-400 hover:text-white hover:bg-white/5' : 'border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Return to Public Portfolio
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="sanjay-dashboard-section" className={`py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left transition-colors ${
      isDark ? 'text-[#f5f2eb]' : 'text-[#181614]'
    }`}>
      {/* Studio Header: Luxury Obsidian & Warm Bronze Aesthetic */}
      <div className={`p-6 sm:p-8 rounded-2xl border relative overflow-hidden transition-colors ${
        isDark ? 'bg-[#0a0907] border-[#26231e]' : 'bg-[#faf8f4] border-[#e8e4db]'
      }`}>
        {/* Subtle Ambient Gold Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-36 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2 h-2 rounded-full ${supabaseStatus.configured ? 'bg-emerald-400 animate-pulse' : isRealDataMode ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-amber-500 font-semibold">
                SANJAY&apos;S LIGHTWORKS · STUDIO VAULT
              </span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              
              {/* Dynamic Supabase Status Badge */}
              <button
                type="button"
                onClick={() => setShowSupabaseConfigModal(true)}
                className={`text-[10px] font-sans uppercase tracking-widest px-2.5 py-0.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                  supabaseStatus.configured
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:border-emerald-500'
                    : 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:border-amber-500'
                }`}
                title="View or configure Supabase Service Role credentials"
              >
                <Database size={11} className={supabaseStatus.configured ? 'text-emerald-400' : 'text-amber-400'} />
                <span>
                  {supabaseStatus.configured ? 'SUPABASE POSTGRESQL · LIVE' : 'SUPABASE STANDBY'}
                </span>
                <span className="text-stone-500">·</span>
                <span className="underline font-mono text-[9px]">SERVICE ROLE</span>
              </button>

              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className={`text-xs font-mono ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                nsanjayb@gmail.com
              </span>
            </div>

            <h2 className={`font-serif text-3xl sm:text-4xl font-normal tracking-tight ${
              isDark ? 'text-[#f5f2eb]' : 'text-[#181614]'
            }`}>
              Studio Operations &amp; Real Data Hub
            </h2>
            <p className={`text-xs max-w-2xl leading-relaxed ${isDark ? 'text-[#9e9689]' : 'text-stone-600'}`}>
              Dynamic client shoot pipeline, verified reservations, and live metrics queried from your Supabase PostgreSQL database using service role authorization.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync Database Button */}
            <button
              onClick={() => syncSupabaseDashboard(true)}
              disabled={isSupabaseLoading}
              className={`px-3 py-2.5 rounded-xl border text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#14120e] border-[#2a2723] text-stone-200 hover:border-amber-500/40 hover:bg-[#1a1713]' 
                  : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
              }`}
              title="Pull latest live records from Supabase PostgreSQL"
            >
              <RefreshCw size={13} className={isSupabaseLoading ? 'animate-spin text-amber-500' : 'text-amber-500'} />
              <span>{isSupabaseLoading ? 'Syncing...' : 'Sync Database'}</span>
            </button>

            {/* Primary Golden CTA: Upload Real Photo */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowUploadModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Upload size={14} />
              <span>Upload Real Photo</span>
            </button>

            {/* Record Real Shoot */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowAddProjectModal(true);
              }}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-sans font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-[#14120e] border-[#2a2723] text-stone-200 hover:border-amber-500/40 hover:bg-[#1a1713]' 
                  : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
              }`}
            >
              <Plus size={14} className="text-amber-500" />
              <span>Log Client Shoot</span>
            </button>

            {/* Add Retainer */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowAddSubModal(true);
              }}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-sans font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-[#14120e] border-[#2a2723] text-stone-200 hover:border-amber-500/40 hover:bg-[#1a1713]' 
                  : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
              }`}
            >
              <Repeat size={14} className="text-amber-500" />
              <span>Add Retainer</span>
            </button>

            {/* 2FA Setup */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowTotpConfigModal(true);
                if (!totpData) {
                  setIsLoadingTotp(true);
                  fetchTotpSetup()
                    .then(setTotpData)
                    .finally(() => setIsLoadingTotp(false));
                }
              }}
              className={`px-3 py-2.5 rounded-xl border text-xs font-sans font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-[#14120e] border-[#2a2723] text-stone-300 hover:text-white' 
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
              title="Google Authenticator 2FA QR Code"
            >
              <Smartphone size={14} className="text-amber-500" />
              <span>2FA</span>
            </button>

            {/* Lock Vault */}
            {onLogoutAdmin && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onLogoutAdmin();
                }}
                className="px-3 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Lock Studio Vault"
              >
                <Lock size={13} />
                <span>Lock</span>
              </button>
            )}

            {/* Return to Public Portfolio */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-3 py-2.5 rounded-xl text-xs font-sans font-medium text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              Portfolio &rarr;
            </button>
          </div>
        </div>

        {/* Real Data Mode Status Strip */}
        <div className={`mt-5 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-semibold uppercase tracking-wider text-[11px]">Database Ledger:</span>
            {supabaseStatus.configured ? (
              <span className="text-stone-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 inline" />
                Live PostgreSQL Connected via Service Role ({projects.length} dynamic shoots, {subscriptions.length} active retainers)
              </span>
            ) : isRealDataMode ? (
              <span className="text-stone-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 inline" />
                Pure Real Data Mode active ({projects.length} real shoots, {subscriptions.length} active retainers)
              </span>
            ) : (
              <span className="text-stone-400">
                Displaying sample showcase records. Click <strong>&quot;Clean Slate&quot;</strong> or <strong>&quot;Configure Supabase&quot;</strong> to link PostgreSQL.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSupabaseConfigModal(true)}
              className="text-[11px] font-sans text-amber-400 hover:text-amber-300 underline cursor-pointer flex items-center gap-1"
            >
              <Database size={11} />
              <span>Supabase Service Config</span>
            </button>
            <span className="text-stone-600">·</span>
            <button
              type="button"
              onClick={handleExportData}
              className="text-[11px] font-sans text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              <Download size={11} />
              <span>Export Ledger JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row: Dynamic Studio Performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        {/* Metric 1: Real Total Revenue */}
        <div className={`p-5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0f0e0c] border-[#22201c]' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-widest text-stone-400">
            <span>POSTGRESQL REVENUE</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <div className="font-serif text-3xl font-medium mt-2 text-emerald-400">
            ${calculatedTotalRevenue.toLocaleString()} CAD
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-stone-400">
            <span>{supabaseStatus.configured ? 'Dynamic from PostgreSQL' : 'Verified receipts'}</span>
            <button
              type="button"
              onClick={() => setShowAdjustMetricsModal(true)}
              className="text-amber-500 hover:underline text-[10px]"
            >
              Adjust
            </button>
          </div>
        </div>

        {/* Metric 2: Pipeline Value */}
        <div className={`p-5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0f0e0c] border-[#22201c]' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-widest text-stone-400">
            <span>ACTIVE PIPELINE</span>
            <Layers size={14} className="text-amber-500" />
          </div>
          <div className={`font-serif text-3xl font-medium mt-2 ${isDark ? 'text-[#f5f2eb]' : 'text-stone-900'}`}>
            ${pipelineValue.toLocaleString()} CAD
          </div>
          <span className="text-xs mt-1 block text-stone-400">
            Across {activeShootsCount} ongoing shoots
          </span>
        </div>

        {/* Metric 3: Active Retainers */}
        <div className={`p-5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0f0e0c] border-[#22201c]' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-widest text-stone-400">
            <span>BRAND RETAINERS</span>
            <Repeat size={14} className="text-amber-500" />
          </div>
          <div className={`font-serif text-3xl font-medium mt-2 ${isDark ? 'text-[#f5f2eb]' : 'text-stone-900'}`}>
            {activeRetainersCount} Active
          </div>
          <span className="text-xs mt-1 block font-mono text-amber-500/90">
            ${monthlyRetainerRevenue}/mo recurring
          </span>
        </div>

        {/* Metric 4: Portfolio Works */}
        <div className={`p-5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0f0e0c] border-[#22201c]' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-widest text-stone-400">
            <span>LIVE PORTFOLIO</span>
            <Camera size={14} className="text-amber-500" />
          </div>
          <div className="font-serif text-3xl font-medium mt-2 text-amber-400">
            {galleryItems.length} Works
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-stone-400">
            <span>Public photographs</span>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="text-amber-500 hover:underline text-[10px] font-semibold"
            >
              + Upload
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Segmented Luxury Stone Bar */}
      <div className={`flex items-center gap-2 border-b pb-4 mb-8 overflow-x-auto ${
        isDark ? 'border-[#1e1c18]' : 'border-stone-300'
      }`}>
        {[
          { id: 'analytics', label: 'Studio Intelligence & Revenue', icon: BarChart3 },
          { id: 'gallery', label: `Portfolio Curation & Uploads (${galleryItems.length})`, icon: ImageIcon },
          { id: 'pipeline', label: `Shoot Pipeline (${projects.length})`, icon: Layers },
          { id: 'bookings', label: 'Reservations Vault', icon: CalendarCheck },
          { id: 'subscriptions', label: `Commercial Retainers (${subscriptions.length})`, icon: Repeat },
          { id: 'data-control', label: 'Supabase PostgreSQL & Clean Slate', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playSwitch();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-sans uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-black font-semibold shadow-md'
                  : isDark 
                    ? 'text-stone-400 hover:text-white hover:bg-white/5' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-black' : 'text-amber-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 0: Studio Intelligence & Revenue                                  */}
      {/* ===================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 text-left">
          {/* Revenue Breakdown Card */}
          <div className={`p-6 sm:p-8 rounded-2xl border ${
            isDark ? 'bg-[#0f0e0c] border-[#26231e]' : 'bg-white border-stone-200 shadow-sm'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-amber-500 font-semibold">
                  {supabaseStatus.configured ? 'SUPABASE POSTGRESQL FINANCIALS' : 'FINANCIAL PERFORMANCE'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight mt-1">
                  Studio Revenue &amp; Retainer Run-Rate
                </h3>
                <p className="text-xs text-stone-400">
                  Real revenue dynamically computed from verified Supabase PostgreSQL bookings and monthly commercial retainers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Log New Shoot</span>
                </button>
                <button
                  type="button"
                  onClick={() => syncSupabaseDashboard(true)}
                  className={`px-3 py-2 rounded-xl border text-xs font-sans transition-all cursor-pointer ${
                    isDark ? 'border-white/10 text-stone-300 hover:text-white' : 'border-stone-300 text-stone-700'
                  }`}
                >
                  <RefreshCw size={13} className="inline mr-1 text-amber-500" />
                  <span>Re-fetch</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#14120e] border-[#22201c]' : 'bg-stone-50 border-stone-200'}`}>
                <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 block">Commissions &amp; Shoots</span>
                <span className="font-serif text-2xl font-medium text-emerald-400 mt-1 block">
                  ${projects.reduce((sum, p) => sum + p.totalValue, 0).toLocaleString()} CAD
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">Across {projects.length} real projects</span>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#14120e] border-[#22201c]' : 'bg-stone-50 border-stone-200'}`}>
                <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 block">Annual Retainer Run-Rate</span>
                <span className="font-serif text-2xl font-medium text-amber-400 mt-1 block">
                  ${(monthlyRetainerRevenue * 12).toLocaleString()} CAD / yr
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">${monthlyRetainerRevenue}/mo from {activeRetainersCount} brands</span>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#14120e] border-[#22201c]' : 'bg-stone-50 border-stone-200'}`}>
                <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 block">Delivered Deliverables</span>
                <span className={`font-serif text-2xl font-medium mt-1 block ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {projects.reduce((sum, p) => sum + (p.stage === 'delivered' ? p.deliverablesCount : 0), 0)} Retouched Assets
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">{deliveredShootsCount} shoots completed</span>
              </div>
            </div>
          </div>

          {/* Service Package Demand Breakdown from Supabase */}
          <div className={`p-6 sm:p-8 rounded-2xl border ${
            isDark ? 'bg-[#0f0e0c] border-[#26231e]' : 'bg-white border-stone-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-serif text-xl font-normal tracking-tight">
                  Package Client Inquiries &amp; Distribution
                </h4>
                <p className="text-xs text-stone-400">
                  {supabaseStatus.configured 
                    ? 'Dynamic breakdown pulled directly from Supabase service packages & bookings.'
                    : 'Distribution of client inquiries across Sanjay\'s signature services.'}
                </p>
              </div>
              <span className="text-[11px] font-sans text-amber-500 font-semibold uppercase tracking-wider">
                {supabaseStatus.configured ? 'PostgreSQL Aggregated' : 'Live Tracking'}
              </span>
            </div>

            {analyticsData.topClickedPackages.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                <p>No package reservations recorded yet.</p>
                <p className="text-[11px] text-stone-500 mt-1">Verified reservations from Supabase PostgreSQL will calculate dynamic service popularity here.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {analyticsData.topClickedPackages.map((pkg) => (
                  <div key={pkg.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-medium">{pkg.name}</span>
                      <span className="text-amber-400 font-mono">
                        {pkg.clicks} bookings ({pkg.share})
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1c1a16]' : 'bg-stone-100'}`}>
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-700"
                        style={{ width: pkg.share }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: Gallery CMS & Dedicated Real Photo Ingestion                   */}
      {/* ===================================================================== */}
      {activeTab === 'gallery' && (
        <GalleryManager
          items={galleryItems}
          onUpdateItems={onUpdateGalleryItems || (() => {})}
          isDark={isDark}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB 2: Shoot Pipeline & Client Deliverables                           */}
      {/* ===================================================================== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-serif text-2xl font-normal tracking-tight">
                {supabaseStatus.configured ? 'Supabase PostgreSQL Client Pipeline' : 'Real Client Shoot Pipeline'}
              </h3>
              <p className="text-xs text-stone-400">
                {supabaseStatus.configured 
                  ? 'Dynamic shoot pipeline queried from PostgreSQL. Stage updates synchronize to the bookings table.'
                  : 'Track client deliverables through moodboard, culling, color grading, and final delivery.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => syncSupabaseDashboard(true)}
                className={`p-2 rounded-xl border text-stone-300 hover:text-white transition-colors cursor-pointer ${
                  isDark ? 'border-[#262420]' : 'border-stone-300'
                }`}
                title="Refresh from PostgreSQL"
              >
                <RefreshCw size={14} className={isSupabaseLoading ? 'animate-spin text-amber-500' : ''} />
              </button>
              <button
                onClick={() => setShowAddProjectModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus size={14} />
                <span>Record Client Shoot</span>
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#0f0e0c] border-[#26231e]' : 'bg-stone-50 border-stone-200'
            }`}>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Layers size={20} />
              </div>
              <h4 className="font-serif text-xl font-medium mb-1">
                {supabaseStatus.configured ? 'PostgreSQL Bookings Empty' : 'Clean Slate · Real Studio Ledger Active'}
              </h4>
              <p className="text-xs text-stone-400 max-w-md mx-auto mb-5">
                {supabaseStatus.configured
                  ? 'Your Supabase database has zero bookings yet. Add a real client shoot to insert into PostgreSQL.'
                  : 'All placeholder mock projects have been removed. Add your real photography contracts to track them.'}
              </p>
              <button
                onClick={() => setShowAddProjectModal(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-sans font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus size={14} />
                <span>+ Log First Client Shoot</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {projects.map(proj => (
                <div
                  key={proj.id}
                  className={`p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark ? 'bg-[#0f0e0c] border-[#22201c] hover:border-amber-500/30' : 'bg-white border-stone-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-medium">
                        {proj.projectName}
                      </span>
                      <span className="text-stone-500">·</span>
                      <span className="text-xs font-sans text-amber-500 font-medium">
                        {proj.shootType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span>Client: <strong className={isDark ? 'text-stone-200' : 'text-stone-900'}>{proj.clientName}</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-amber-500" />
                        {proj.date}
                      </span>
                    </div>
                    {proj.notes && (
                      <p className="text-xs italic text-stone-400 pt-1 line-clamp-1">
                        &ldquo;{proj.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 flex-wrap">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-sans text-stone-500 block mb-1">
                        Production Stage
                      </span>
                      <select
                        value={proj.stage}
                        onChange={(e) => handleStageChange(proj.id, e.target.value as ProjectStage)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium focus:outline-none ${
                          isDark ? 'bg-[#181614] border-[#2a2723] text-amber-400' : 'bg-white border-stone-300 text-stone-800'
                        }`}
                      >
                        {STAGE_CONFIG.map(st => (
                          <option key={st.stage} value={st.stage}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <span className="text-[10px] font-sans text-stone-500 block">
                        Contract Value
                      </span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        ${proj.totalValue} CAD
                      </span>
                      <span className="text-[10px] block uppercase font-sans text-stone-400">
                        {proj.invoiceStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <a
                      href={`mailto:${proj.clientEmail}?subject=Update on your shoot: ${encodeURIComponent(proj.projectName)}`}
                      className="p-2 rounded-lg border border-[#2a2723] hover:border-amber-500 text-stone-400 hover:text-white transition-colors"
                      title={`Email ${proj.clientName}`}
                    >
                      <Mail size={14} />
                    </a>

                    <button
                      onClick={() => handleDeleteProjectClick(proj.id)}
                      className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: Shoot Reservations Calendar Log                                */}
      {/* ===================================================================== */}
      {activeTab === 'bookings' && (
        <BookingsLogManager isDark={isDark} />
      )}

      {/* ===================================================================== */}
      {/* TAB 4: Commercial Retainers & Subscriptions                          */}
      {/* ===================================================================== */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-serif text-2xl font-normal tracking-tight">Commercial Brand Retainers</h3>
              <p className="text-xs text-stone-400">Recurring creative content contracts and monthly editorial allocations.</p>
            </div>
            <button
              onClick={() => setShowAddSubModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus size={14} />
              <span>Record Retainer Contract</span>
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#0f0e0c] border-[#26231e]' : 'bg-stone-50 border-stone-200'
            }`}>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Repeat size={20} />
              </div>
              <h4 className="font-serif text-xl font-medium mb-1">Clean Slate · No Mock Retainers</h4>
              <p className="text-xs text-stone-400 max-w-md mx-auto mb-5">
                Ready to track real recurring brand partnerships. Record your commercial retainer agreements.
              </p>
              <button
                onClick={() => setShowAddSubModal(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-sans font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus size={14} />
                <span>+ Add Real Retainer Contract</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map(sub => (
                <div
                  key={sub.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-[#0f0e0c] border-[#22201c] hover:border-amber-500/30' : 'bg-white border-stone-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-amber-500 font-bold">
                        {sub.tierName}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                        {sub.status}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-normal tracking-tight">
                      {sub.companyOrBrand}
                    </h3>
                    <p className="text-xs text-stone-400">
                      Contact: {sub.clientName} ({sub.clientEmail})
                    </p>

                    <div className={`p-4 rounded-xl border ${
                      isDark ? 'bg-[#14120e] border-[#262420]' : 'bg-stone-50 border-stone-200'
                    }`}>
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-serif text-amber-400 font-medium">
                          ${sub.monthlyFee} CAD
                        </span>
                        <span className="text-xs text-stone-400">/ month</span>
                      </div>
                      <div className="mt-2 text-xs flex justify-between text-stone-300">
                        <span>Sessions used:</span>
                        <span className="text-amber-400 font-mono font-medium">
                          {sub.shootsUsedThisMonth} of {sub.shootsPerMonth} allocation
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1e1c18]">
                    <span className="text-[11px] text-stone-500">
                      Renews: {sub.renewalDate}
                    </span>
                    {onDeleteSubscription && (
                      <button
                        onClick={() => onDeleteSubscription(sub.id)}
                        className="text-stone-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Delete retainer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: Supabase PostgreSQL & Clean Slate Hub                          */}
      {/* ===================================================================== */}
      {activeTab === 'data-control' && (
        <div className="space-y-6 text-left">
          <div className={`p-6 sm:p-8 rounded-2xl border ${
            isDark ? 'bg-[#0a0907] border-[#26231e]' : 'bg-[#faf8f4] border-[#e8e4db]'
          }`}>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold mb-1">
              <Database size={13} />
              <span>SUPABASE POSTGRESQL DATA ENGINE</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight mb-2">
              PostgreSQL Service Role &amp; Clean Slate Hub
            </h3>
            <p className="text-xs text-stone-400 max-w-2xl leading-relaxed mb-6">
              Your studio dashboard connects directly to Supabase using elevated service role privileges. Query and mutate real records across users, service packages, and shoot bookings.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Option A: Supabase Connection Details */}
              <div className={`p-6 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#12100d] border-[#262420]' : 'bg-white border-stone-200'
              }`}>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-sans font-semibold uppercase tracking-wider">
                  <Database size={15} />
                  <span>PostgreSQL Status</span>
                </div>
                <h4 className="font-serif text-xl font-medium">Service Role Engine</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Status: <strong className={supabaseStatus.configured ? 'text-emerald-400' : 'text-amber-400'}>
                    {supabaseStatus.configured ? 'Live PostgreSQL Connected' : 'Local Fallback Active'}
                  </strong>
                  <br />
                  Endpoint: {supabaseStatus.supabaseUrl || 'server proxy (/api/admin/supabase/*)'}
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowSupabaseConfigModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Configure Service Key
                  </button>
                  <button
                    type="button"
                    onClick={() => syncSupabaseDashboard(true)}
                    disabled={isSupabaseLoading}
                    className={`px-3 py-2 rounded-xl border text-xs font-sans font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isDark ? 'border-[#2a2723] text-stone-300 hover:text-white hover:bg-white/5' : 'border-stone-300 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <RefreshCw size={13} className={isSupabaseLoading ? 'animate-spin text-amber-500' : 'text-amber-500'} />
                    <span>Sync PostgreSQL</span>
                  </button>
                </div>
              </div>

              {/* Option B: Purge Rough Demo Data */}
              <div className={`p-6 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#12100d] border-[#262420]' : 'bg-white border-stone-200'
              }`}>
                <div className="flex items-center gap-2 text-rose-400 text-xs font-sans font-semibold uppercase tracking-wider">
                  <Trash2 size={15} />
                  <span>Clean Slate Mode</span>
                </div>
                <h4 className="font-serif text-xl font-medium">Purge Mock Records</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Permanently clears out sample demo bookings, placeholder clients (Aarav, Elena, Atelier Minimalist), and dummy retainers.
                </p>
                <button
                  type="button"
                  onClick={handlePurgeAllDemo}
                  className="px-4 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Wipe Rough Data Now
                </button>
              </div>

              {/* Option C: Restore Sample Preset */}
              <div className={`p-6 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#12100d] border-[#262420]' : 'bg-white border-stone-200'
              }`}>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-sans font-semibold uppercase tracking-wider">
                  <Sparkles size={15} />
                  <span>Showcase Mode</span>
                </div>
                <h4 className="font-serif text-xl font-medium">Load Showcase Sample Preset</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Re-populates preview records with realistic photography pipeline items and active retainers for demonstration.
                </p>
                <button
                  type="button"
                  onClick={handleRestoreDemoPreset}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Restore Sample Preset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Configure Supabase Service Role Connection                     */}
      {/* ===================================================================== */}
      {showSupabaseConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingConfig) {
              soundEngine.playClick();
              setShowSupabaseConfigModal(false);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            boxSizing: 'border-box',
          }}
          className="global-modal-overlay animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '92vh',
              width: '100%',
              maxWidth: '560px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '20px',
            }}
            className={`border shadow-2xl transition-all ${
              isDark 
                ? 'bg-[#0a0907] border-[#26231e] text-[#f5f2eb] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)]' 
                : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17]'
            }`}
          >
            <div className={`p-6 pb-4 border-b flex items-start justify-between shrink-0 ${
              isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
                  <Database size={13} />
                  <span>SUPABASE SERVICE ROLE INTEGRATION</span>
                </div>
                <h3 className={`font-serif text-2xl font-normal tracking-tight ${
                  isDark ? 'text-[#f5f2eb]' : 'text-[#181614]'
                }`}>
                  Connect Supabase PostgreSQL
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#9e9689]' : 'text-stone-600'}`}>
                  Authorize direct queries via Service Role Key to bypass RLS and dynamically power studio analytics, pipelines, and reservations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSupabaseConfigModal(false)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="p-6 space-y-4">
              {configFeedback?.success && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{configFeedback.success}</span>
                </div>
              )}

              {configFeedback?.error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{configFeedback.error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Supabase Project URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://your-project.supabase.co"
                  value={inputSupabaseUrl}
                  onChange={e => setInputSupabaseUrl(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono ${
                    isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Find under Supabase Project Settings &rarr; API &rarr; Project URL
                </span>
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Supabase Service Role Key (Secret) *
                </label>
                <div className="relative">
                  <input
                    type={showServiceKey ? "text" : "password"}
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={inputServiceKey}
                    onChange={e => setInputServiceKey(e.target.value)}
                    className={`w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowServiceKey(p => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title={showServiceKey ? "Hide secret key" : "Show secret key"}
                  >
                    {showServiceKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Saved strictly on the server to bypass RLS for administrative studio operations. Never leaked to client.
                </span>
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Public Anon Key (Optional)
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputAnonKey}
                  onChange={e => setInputAnonKey(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono ${
                    isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e1c18]">
                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => setShowSupabaseConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig || !inputSupabaseUrl.trim() || !inputServiceKey.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying Connection...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Verify &amp; Connect</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Dedicated Secure Supabase Storage Photo Upload Component       */}
      {/* ===================================================================== */}
      {showUploadModal && (
        <SecureImageUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onPhotoUploaded={handlePhotoUploadedSuccess}
          isDark={isDark}
          supabaseConfigured={supabaseStatus.configured}
        />
      )}

      {/* ===================================================================== */}
      {/* MODAL: New Real Client Project                                        */}
      {/* ===================================================================== */}
      {showAddProjectModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingProject) {
              soundEngine.playClick();
              setShowAddProjectModal(false);
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
                ? 'bg-[#0a0907] border-[#26231e] text-[#f5f2eb]' 
                : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17]'
            }`}
          >
            <div className={`p-6 pb-4 border-b flex items-start justify-between shrink-0 ${
              isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
                  <Database size={12} />
                  <span>{supabaseStatus.configured ? 'SUPABASE POSTGRESQL INSERT' : 'REAL PIPELINE ENTRY'}</span>
                </div>
                <h3 className="font-serif text-2xl font-normal tracking-tight">Log Client Shoot</h3>
                <p className="text-xs text-stone-400">
                  {supabaseStatus.configured 
                    ? 'Records user profile and booking directly into Supabase PostgreSQL tables using service role.' 
                    : 'Record a real commissioned portrait, ceremony, or creative editorial shoot.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya &amp; Arjun"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
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
                    placeholder="client@example.com"
                    value={newClientEmail}
                    onChange={e => setNewClientEmail(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Shoot Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Traditional Wedding &amp; Sunset Portraits"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Shoot Type
                  </label>
                  <select
                    value={newShootType}
                    onChange={e => setNewShootType(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    <option value="Portraits & Couples">Portraits &amp; Couples</option>
                    <option value="Traditional Celebration">Traditional Celebration</option>
                    <option value="Themed & Creative">Themed &amp; Creative</option>
                    <option value="Events & Parties">Events &amp; Parties</option>
                    <option value="Commercial Campaign">Commercial Campaign</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Shoot Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Contract Value (CAD)
                  </label>
                  <input
                    type="number"
                    value={newTotalValue}
                    onChange={e => setNewTotalValue(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={newInvoiceStatus}
                    onChange={e => setNewInvoiceStatus(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="paid_in_full">Paid in Full</option>
                    <option value="pending">Pending Deposit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="High Park, Toronto"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Deliverables Count
                  </label>
                  <input
                    type="number"
                    value={newDeliverablesCount}
                    onChange={e => setNewDeliverablesCount(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Vision &amp; Special Client Requests
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Focus on family candid reactions, golden hour outdoor frames in High Park..."
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e1c18]">
                <button
                  type="button"
                  disabled={isSubmittingProject}
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold shadow-md cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                >
                  {isSubmittingProject ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving to PostgreSQL...</span>
                    </>
                  ) : (
                    <span>Save to Real Pipeline</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: New Retainer                                                   */}
      {/* ===================================================================== */}
      {showAddSubModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundEngine.playClick();
              setShowAddSubModal(false);
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
              maxWidth: '560px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '16px',
            }}
            className={`border shadow-2xl transition-all ${
              isDark ? 'bg-[#0a0907] border-[#26231e] text-[#f5f2eb]' : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17]'
            }`}
          >
            <div className={`p-6 pb-4 border-b flex items-start justify-between shrink-0 ${
              isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
            }`}>
              <div className="space-y-1">
                <div className="text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
                  COMMERCIAL CONTRACT
                </div>
                <h3 className="font-serif text-2xl font-normal tracking-tight">Record Brand Retainer</h3>
                <p className="text-xs text-stone-400">Monthly recurring photography agreements for brands and artists.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubModal(false)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Brand / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atelier Minimalist"
                  value={subBrand}
                  onChange={e => setSubBrand(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Clara Jensen"
                    value={subClientName}
                    onChange={e => setSubClientName(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@brand.com"
                    value={subEmail}
                    onChange={e => setSubEmail(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Monthly Retainer Fee (CAD)
                  </label>
                  <input
                    type="number"
                    value={subFee}
                    onChange={e => setSubFee(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Sessions / Month
                  </label>
                  <input
                    type="number"
                    value={subShootsCount}
                    onChange={e => setSubShootsCount(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e1c18]">
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Save Retainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Adjust Real Baseline & Target Metrics                          */}
      {/* ===================================================================== */}
      {showAdjustMetricsModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundEngine.playClick();
              setShowAdjustMetricsModal(false);
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
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '16px',
            }}
            className={`border shadow-2xl transition-all ${
              isDark ? 'bg-[#0a0907] border-[#26231e] text-[#f5f2eb]' : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17]'
            }`}
          >
            <div className={`p-6 pb-4 border-b flex items-start justify-between shrink-0 ${
              isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
            }`}>
              <div className="space-y-1">
                <div className="text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
                  STUDIO BENCHMARKS
                </div>
                <h3 className="font-serif text-2xl font-normal tracking-tight">Configure Real Metrics</h3>
                <p className="text-xs text-stone-400">Set your verified career baseline revenue and performance goals.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustMetricsModal(false)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                soundEngine.playSuccess();
                localStorage.setItem('sanjay_real_metrics', JSON.stringify(realMetricsBaseline));
                setShowAdjustMetricsModal(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Historical Career Revenue Baseline (CAD)
                </label>
                <input
                  type="number"
                  value={realMetricsBaseline.careerBaseRevenue}
                  onChange={e => setRealMetricsBaseline(prev => ({ ...prev, careerBaseRevenue: Number(e.target.value) }))}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Added to current pipeline and retainer receipts.
                </span>
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Verified Unique Visitors
                </label>
                <input
                  type="number"
                  value={realMetricsBaseline.verifiedVisits}
                  onChange={e => setRealMetricsBaseline(prev => ({ ...prev, verifiedVisits: Number(e.target.value) }))}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Quarterly Revenue Target (CAD)
                </label>
                <input
                  type="number"
                  value={realMetricsBaseline.quarterlyGoal}
                  onChange={e => setRealMetricsBaseline(prev => ({ ...prev, quarterlyGoal: Number(e.target.value) }))}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e1c18]">
                <button
                  type="button"
                  onClick={() => setShowAdjustMetricsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Save Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: 2FA QR Code Setup Drawer                                       */}
      {/* ===================================================================== */}
      {showTotpConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundEngine.playClick();
              setShowTotpConfigModal(false);
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
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '16px',
            }}
            className={`border shadow-2xl transition-all ${
              isDark ? 'bg-[#0a0907] border-[#26231e] text-[#f5f2eb]' : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17]'
            }`}
          >
            <div className={`p-6 pb-4 border-b flex items-start justify-between shrink-0 ${
              isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
            }`}>
              <div className="space-y-1">
                <div className="text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
                  GOOGLE AUTHENTICATOR
                </div>
                <h3 className="font-serif text-2xl font-normal tracking-tight">2FA Security Key</h3>
                <p className="text-xs text-stone-400">Scan QR code on your phone for one-touch login.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTotpConfigModal(false)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              {isLoadingTotp ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={24} className="animate-spin text-amber-500" />
                  <span className="text-xs text-stone-400">Loading Google Authenticator secret...</span>
                </div>
              ) : totpData ? (
                <div className="space-y-4">
                  <div className="p-3 bg-white rounded-xl shadow-md border border-stone-200 inline-block">
                    <img
                      src={totpData.qrCodeDataUrl}
                      alt="Google Authenticator QR Code"
                      className="w-44 h-44 object-contain mx-auto"
                    />
                  </div>
                  <div className="text-left space-y-1">
                    <div className="flex items-center justify-between text-xs text-stone-400 font-sans">
                      <span>MANUAL SECRET KEY:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(totpData.secret);
                          soundEngine.playClick();
                          setIsCopiedTotp(true);
                          setTimeout(() => setIsCopiedTotp(false), 2000);
                        }}
                        className="text-amber-500 hover:text-amber-400 font-semibold cursor-pointer"
                      >
                        {isCopiedTotp ? 'Copied!' : 'Copy Key'}
                      </button>
                    </div>
                    <div className={`p-2 rounded font-mono text-xs text-amber-500 select-all break-all border text-center ${
                      isDark ? 'bg-black/40 border-[#262420]' : 'bg-stone-100 border-stone-300'
                    }`}>
                      {totpData.formattedSecret}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Accessible Global In-App Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        cancelLabel={confirmModalConfig.cancelLabel}
        isDestructive={confirmModalConfig.isDestructive}
        isDark={isDark}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </section>
  );
};
