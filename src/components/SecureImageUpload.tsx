import React, { useState, useRef, useEffect } from 'react';
import { GalleryItem, GalleryCategory } from '../types';
import { soundEngine } from '../utils/audio';
import { sanitizeInput } from '../utils/security';
import { uploadPhotoToSupabaseStorage } from '../services/supabaseService';
import { showToast as triggerToast } from './SupabaseToast';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Camera, 
  Sliders, 
  Loader2, 
  Database, 
  Sparkles,
  Maximize2,
  FileImage,
  Check,
  ShieldCheck,
  Layers,
  MapPin,
  Calendar,
  User
} from 'lucide-react';

export interface SecureImageUploadProps {
  isOpen?: boolean;
  onClose?: () => void;
  onPhotoUploaded: (newPhoto: GalleryItem) => void;
  isDark: boolean;
  supabaseConfigured?: boolean;
}

export const SecureImageUpload: React.FC<SecureImageUploadProps> = ({
  isOpen = true,
  onClose,
  onPhotoUploaded,
  isDark,
  supabaseConfigured = true,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<'portrait' | 'landscape' | 'square' | 'tall'>('portrait');
  const [isDragOver, setIsDragOver] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<GalleryCategory, 'all'>>('portraits');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Ontario, Canada');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [client, setClient] = useState('');
  const [customTags, setCustomTags] = useState('natural light, editorial, ontario');
  const [applyWatermark, setApplyWatermark] = useState(true);

  // Camera Tech Specs (Editorial metadata)
  const [showCameraSpecs, setShowCameraSpecs] = useState(false);
  const [cameraBody, setCameraBody] = useState('Sony A7 IV');
  const [lensModel, setLensModel] = useState('85mm f/1.4 GM');
  const [aperture, setAperture] = useState('f/1.8');
  const [shutterSpeed, setShutterSpeed] = useState('1/500s');
  const [isoSpeed, setIsoSpeed] = useState('100');

  // Status & Progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<GalleryItem | null>(null);
  const [uploadDestination, setUploadDestination] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid photographic image file (JPG, PNG, WebP, AVIF, TIFF).');
      soundEngine.playError();
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Photograph exceeds the 50MB limit. Please upload an image under 50MB.');
      soundEngine.playError();
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Auto-populate Title if empty
    if (!title) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewDataUrl(result);

      // Measure dimensions & aspect ratio
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setImageDimensions({ width: w, height: h });

        const ratio = w / h;
        if (ratio > 1.25) {
          setDetectedAspectRatio('landscape');
        } else if (ratio < 0.65) {
          setDetectedAspectRatio('tall');
        } else if (ratio < 0.88) {
          setDetectedAspectRatio('portrait');
        } else {
          setDetectedAspectRatio('square');
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    soundEngine.playClick();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewDataUrl(null);
    setImageDimensions(null);
    setTitle('');
    setDescription('');
    setClient('');
    setUploadedPhoto(null);
    setUploadDestination(null);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDataUrl) {
      setUploadError('Please select or drop a photograph before uploading.');
      soundEngine.playError();
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const cleanTitle = sanitizeInput(title) || 'Untitled Studio Capture';
    const cleanDesc = sanitizeInput(description) || `Natural light capture by Sanjay's Lightworks in ${location}.`;
    const cleanLoc = sanitizeInput(location) || 'Ontario, Canada';
    const cleanYear = sanitizeInput(year) || '2026';
    const cleanClient = sanitizeInput(client) || undefined;

    const parsedTags = customTags
      .split(',')
      .map((t) => sanitizeInput(t.trim()))
      .filter(Boolean);

    try {
      const result = await uploadPhotoToSupabaseStorage({
        data: previewDataUrl,
        title: cleanTitle,
        category,
        aspectRatio: detectedAspectRatio,
        description: cleanDesc,
        location: cleanLoc,
        year: cleanYear,
        client: cleanClient,
        tags: parsedTags.length > 0 ? parsedTags : [category, 'studio-upload', cleanLoc.toLowerCase()],
        cameraInfo: {
          body: cameraBody,
          lens: lensModel,
          aperture,
          shutter: shutterSpeed,
          iso: isoSpeed,
        },
        watermark: applyWatermark,
      });

      if (!result.success || !result.photo) {
        throw new Error(result.error || 'Failed to upload photo.');
      }

      const finalPhoto: GalleryItem = {
        id: result.photo.id || `photo-supa-${Date.now()}`,
        title: cleanTitle,
        category,
        aspectRatio: detectedAspectRatio,
        imageUrl: result.imageUrl || result.photo.imageUrl || previewDataUrl,
        thumbnailUrl: result.imageUrl || result.photo.imageUrl || previewDataUrl,
        description: cleanDesc,
        location: cleanLoc,
        year: cleanYear,
        client: cleanClient,
        cameraInfo: {
          body: cameraBody,
          lens: lensModel,
          aperture,
          shutter: shutterSpeed,
          iso: isoSpeed,
        },
        tags: parsedTags.length > 0 ? parsedTags : [category, 'studio-upload', cleanLoc.toLowerCase()],
      };

      setUploadedPhoto(finalPhoto);
      setUploadDestination(result.storage === 'supabase_storage' ? 'Supabase Storage (gallery-photos)' : 'Local Storage Cache');
      soundEngine.playSuccess();

      // Automatically update parent gallery state
      onPhotoUploaded(finalPhoto);

      // Persist to local storage
      try {
        const saved = localStorage.getItem('sanjay_gallery_items');
        const currentList: GalleryItem[] = saved ? JSON.parse(saved) : [];
        const updatedList = [finalPhoto, ...currentList.filter((item) => item.id !== finalPhoto.id)];
        localStorage.setItem('sanjay_gallery_items', JSON.stringify(updatedList));

        // Global Event Dispatcher to synchronize all open views
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sanjay_gallery_updated', { detail: updatedList }));
        }
      } catch (err) {
        console.warn('[SecureImageUpload] Local persistence warning:', err);
      }

      triggerToast(
        result.storage === 'supabase_storage'
          ? `"${cleanTitle}" uploaded directly to Supabase Storage and published to gallery!`
          : `"${cleanTitle}" optimized with WebP and published to gallery!`,
        'success',
        result.storage === 'supabase_storage' ? 'Supabase Storage Live' : 'Photo Published'
      );
    } catch (err: any) {
      console.error('[SecureImageUpload] Submission error:', err);
      setUploadError(err.message || 'Error occurred while saving photograph.');
      soundEngine.playError();
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading && onClose) {
          soundEngine.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all animate-scaleUp ${
          isDark
            ? 'bg-[#0a0907] border-[#26231e] text-[#f5f2eb] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)]'
            : 'bg-[#faf8f4] border-[#e2ddd2] text-[#1c1a17]'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`p-5 sm:p-6 pb-4 border-b flex items-start justify-between shrink-0 ${
            isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
                SUPABASE STORAGE · SECURE UPLOADER
              </span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Bucket: gallery-photos
              </span>
            </div>

            <h3
              id="upload-modal-title"
              className={`font-serif text-2xl sm:text-3xl font-normal tracking-tight ${
                isDark ? 'text-[#f5f2eb]' : 'text-[#181614]'
              }`}
            >
              Upload Photograph to Supabase
            </h3>
            <p className={`text-xs ${isDark ? 'text-[#9e9689]' : 'text-stone-600'}`}>
              High-resolution ingestion for Sanjay. Optimizes with Sharp WebP, writes to Supabase Storage, and updates the public portfolio in real-time.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                isDark
                  ? 'border-white/10 bg-white/5 text-stone-400 hover:text-white hover:border-amber-500/40'
                  : 'border-stone-300 bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-left">
          {/* Success Banner */}
          {uploadedPhoto ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="font-serif text-2xl font-medium text-emerald-400">
                  Photograph Published Successfully
                </h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  &quot;{uploadedPhoto.title}&quot; has been added to your gallery ledger.
                </p>
                <div className="mt-2 text-[11px] font-mono text-amber-500">
                  Destination: {uploadDestination || 'Supabase Storage'}
                </div>
              </div>

              {/* Photo Preview Card */}
              <div
                className={`max-w-xs mx-auto p-3 rounded-xl border overflow-hidden ${
                  isDark ? 'bg-[#14120e] border-[#262420]' : 'bg-white border-stone-200 shadow-md'
                }`}
              >
                <img
                  src={uploadedPhoto.imageUrl}
                  alt={uploadedPhoto.title}
                  className="w-full h-44 object-cover rounded-lg"
                />
                <div className="pt-2 text-left">
                  <div className="text-xs font-semibold">{uploadedPhoto.title}</div>
                  <div className="text-[10px] text-stone-500">
                    {uploadedPhoto.category} · {uploadedPhoto.location} · {uploadedPhoto.year}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer"
                >
                  + Upload Another Photo
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-sans font-bold uppercase tracking-wider shadow-md hover:bg-amber-400 transition-all cursor-pointer"
                  >
                    Done · Return to Dashboard
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileProcess(file);
                }}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              {!previewDataUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                      : isDark
                      ? 'border-[#2a2723] hover:border-amber-500/50 bg-[#12100d] hover:bg-[#161410]'
                      : 'border-stone-300 hover:border-amber-500/60 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <Upload size={24} />
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-medium mb-1">
                    Drag &amp; drop high-resolution photograph here
                  </h4>
                  <p className={`text-xs max-w-sm mx-auto mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Select raw or export captures from your camera. Supported formats: JPG, PNG, WebP, AVIF, TIFF up to 50MB.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-xs font-sans font-semibold uppercase tracking-wider transition-all"
                  >
                    Browse Files from Device
                  </button>
                </div>
              ) : (
                /* Instant Image Preview and File Details */
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${
                    isDark ? 'bg-[#12100d] border-[#262420]' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="relative group shrink-0">
                    <img
                      src={previewDataUrl}
                      alt="Upload preview"
                      className="w-32 h-32 sm:w-28 sm:h-28 object-cover rounded-xl border border-stone-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewDataUrl(null);
                        setSelectedFile(null);
                        setImageDimensions(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-500 cursor-pointer"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="flex-1 space-y-1 text-left w-full sm:w-auto">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base font-medium truncate max-w-[240px]">
                        {selectedFile?.name || 'Selected Photograph'}
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-amber-500 hover:underline cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
                      <span>{selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}</span>
                      {imageDimensions && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{imageDimensions.width} &times; {imageDimensions.height} px</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize text-amber-500 font-semibold">{detectedAspectRatio}</span>
                        </>
                      )}
                    </div>

                    <div className="pt-1.5 flex items-center gap-2">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck size={12} />
                        <span>Ready for Supabase Storage</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Title & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Photograph Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Golden Grace · Temple Pavilion"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Portfolio Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-amber-400 font-medium' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    <option value="portraits">Portraits &amp; Couples</option>
                    <option value="traditional">Traditional &amp; Heritage Rituals</option>
                    <option value="creative">Themed &amp; Creative Silks</option>
                    <option value="events">Events, Concerts &amp; Celebrations</option>
                    <option value="landscape">Cinematic Landscapes &amp; Mood</option>
                    <option value="editorial">Editorial Fashion</option>
                    <option value="weddings">Weddings &amp; Milestones</option>
                  </select>
                </div>
              </div>

              {/* Location, Year, Client */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder="High Park, Toronto"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Year Captured
                  </label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder="2026"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Client Name (Optional)
                  </label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Private Commission"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Story / Description */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Story &amp; Creative Context
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Atmospheric natural sunlight, candid heritage moment, warm silk tones..."
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              {/* Tags & Aspect Ratio Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    placeholder="natural light, portraits, gold, ontario"
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#14120e] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Aspect Ratio Display Mode
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border border-stone-500/20 bg-stone-500/5">
                    {(['portrait', 'landscape', 'square', 'tall'] as const).map((aspect) => (
                      <button
                        key={aspect}
                        type="button"
                        onClick={() => setDetectedAspectRatio(aspect)}
                        className={`py-1 text-[11px] font-sans font-medium rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                          detectedAspectRatio === aspect
                            ? 'bg-amber-500 text-black font-bold shadow-sm'
                            : isDark
                            ? 'text-stone-400 hover:text-white'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {aspect}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Camera Tech Specs Accordion */}
              <div className={`rounded-xl border ${isDark ? 'border-[#262420]' : 'border-stone-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowCameraSpecs((p) => !p)}
                  className={`w-full px-4 py-2.5 text-xs font-sans flex items-center justify-between cursor-pointer transition-colors ${
                    isDark ? 'text-stone-300 hover:text-white' : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Camera size={14} className="text-amber-500" />
                    <span className="font-medium uppercase tracking-wider text-[11px]">Editorial Camera Gear Specs (EXIF)</span>
                  </span>
                  <span className="text-amber-500 font-mono text-[11px]">
                    {showCameraSpecs ? '− Collapse' : '+ Expand'}
                  </span>
                </button>

                {showCameraSpecs && (
                  <div className={`p-4 pt-2 border-t grid grid-cols-2 sm:grid-cols-5 gap-2.5 ${isDark ? 'border-[#262420]' : 'border-stone-200'}`}>
                    <div>
                      <label className="text-[10px] font-sans text-stone-400 block mb-0.5">Camera</label>
                      <input
                        type="text"
                        value={cameraBody}
                        onChange={(e) => setCameraBody(e.target.value)}
                        placeholder="Sony A7 IV"
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                          isDark ? 'bg-[#181614] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-sans text-stone-400 block mb-0.5">Lens</label>
                      <input
                        type="text"
                        value={lensModel}
                        onChange={(e) => setLensModel(e.target.value)}
                        placeholder="85mm f/1.4 GM"
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                          isDark ? 'bg-[#181614] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-sans text-stone-400 block mb-0.5">Aperture</label>
                      <input
                        type="text"
                        value={aperture}
                        onChange={(e) => setAperture(e.target.value)}
                        placeholder="f/1.8"
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                          isDark ? 'bg-[#181614] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-sans text-stone-400 block mb-0.5">Shutter</label>
                      <input
                        type="text"
                        value={shutterSpeed}
                        onChange={(e) => setShutterSpeed(e.target.value)}
                        placeholder="1/500s"
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                          isDark ? 'bg-[#181614] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-sans text-stone-400 block mb-0.5">ISO</label>
                      <input
                        type="text"
                        value={isoSpeed}
                        onChange={(e) => setIsoSpeed(e.target.value)}
                        placeholder="100"
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                          isDark ? 'bg-[#181614] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Watermark Toggle */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyWatermark}
                    onChange={(e) => setApplyWatermark(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                  />
                  <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>
                    Apply subtle Sanjay&apos;s Lightworks watermark protection
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div
                className={`pt-4 border-t flex items-center justify-between gap-3 ${
                  isDark ? 'border-[#1e1c18]' : 'border-[#e8e4db]'
                }`}
              >
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  <Database size={13} className="text-amber-500" />
                  <span>
                    {supabaseConfigured
                      ? 'Destination: Supabase Storage bucket (gallery-photos)'
                      : 'Destination: Local Optimized Storage (Sharp WebP)'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {onClose && (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={onClose}
                      className={`px-4 py-2.5 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
                        isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading || !previewDataUrl}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-black" />
                        <span>Uploading to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Publish to Supabase Storage</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
