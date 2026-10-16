import React, { useState, useRef } from 'react';
import { GalleryItem, GalleryCategory } from '../types';
import { soundEngine } from '../utils/audio';
import { 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Edit3, 
  Image as ImageIcon, 
  Check, 
  X,
  Sparkles,
  Upload,
  Camera,
  FileImage,
  Sliders,
  Loader2,
  Maximize2
} from 'lucide-react';
import { secureAdminFetch, sanitizeInput } from '../utils/security';
import { GALLERY_ITEMS } from '../data/mockData';
import { ConfirmModal } from './ConfirmModal';
import { showToast as triggerToast } from './SupabaseToast';
import { SecureImageUpload } from './SecureImageUpload';

interface GalleryManagerProps {
  items: GalleryItem[];
  onUpdateItems: (newItems: GalleryItem[]) => void;
  isDark: boolean;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({
  items,
  onUpdateItems,
  isDark,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Accessible Global In-App Confirmation Modal State
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

  // Upload vs URL Mode
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePurgeStockPhotos = () => {
    soundEngine.playClick();
    setConfirmModalConfig({
      isOpen: true,
      title: 'Curate Genuine Camera Uploads',
      message: 'Remove all stock sample photos to curate strictly your authentic photographer camera uploads in the portfolio?',
      confirmLabel: 'Remove Stock Photos',
      isDestructive: true,
      onConfirm: () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        const customOnly = items.filter(i => 
          i.id.startsWith('photo-') || 
          i.id.startsWith('gallery-custom-') || 
          i.imageUrl.startsWith('data:') || 
          i.imageUrl.includes('/images/upload')
        );
        onUpdateItems(customOnly);
        try {
          localStorage.setItem('sanjay_gallery_items', JSON.stringify(customOnly));
        } catch {
          // ignore
        }
        triggerToast('Stock photos cleared. Authentic camera uploads active.', 'success', 'Gallery Curated');
      },
    });
  };

  const handleRestoreStockPhotos = () => {
    soundEngine.playClick();
    setConfirmModalConfig({
      isOpen: true,
      title: 'Restore Default Showcase Works',
      message: 'Restore default signature photographs (Golden Grace, Silken Shadows, etc.) into the public gallery?',
      confirmLabel: 'Restore Showcase Works',
      isDestructive: false,
      onConfirm: () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        soundEngine.playSuccess();
        onUpdateItems(GALLERY_ITEMS);
        try {
          localStorage.setItem('sanjay_gallery_items', JSON.stringify(GALLERY_ITEMS));
        } catch {
          // ignore
        }
        triggerToast('Default showcase photos restored.', 'info', 'Gallery Restored');
      },
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    soundEngine.playSuccess();
    const sanitizedItem: GalleryItem = {
      ...editingItem,
      title: sanitizeInput(editingItem.title),
      imageUrl: sanitizeInput(editingItem.imageUrl),
      description: sanitizeInput(editingItem.description),
      location: sanitizeInput(editingItem.location),
      year: sanitizeInput(editingItem.year),
      client: editingItem.client ? sanitizeInput(editingItem.client) : undefined,
    };

    const updated = items.map(item => item.id === editingItem.id ? sanitizedItem : item);
    onUpdateItems(updated);
    try {
      localStorage.setItem('sanjay_gallery_items', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Sync to backend
    try {
      secureAdminFetch(`/api/admin/gallery/${encodeURIComponent(sanitizedItem.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedItem),
      }).catch(() => {});
    } catch {
      // ignore
    }

    setEditingItem(null);
  };

  const handleDeletePhoto = (id: string, title: string) => {
    soundEngine.playClick();
    setConfirmModalConfig({
      isOpen: true,
      title: 'Remove Photo from Portfolio',
      message: `Are you sure you want to remove "${title}" from the portfolio gallery?`,
      confirmLabel: 'Remove Photo',
      isDestructive: true,
      onConfirm: () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        const updated = items.filter(item => item.id !== id);
        onUpdateItems(updated);
        try {
          localStorage.setItem('sanjay_gallery_items', JSON.stringify(updated));
        } catch {
          // ignore
        }

        try {
          secureAdminFetch(`/api/admin/gallery/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          }).catch(() => {});
        } catch {
          // ignore
        }
        triggerToast(`Photo "${title}" removed from gallery.`, 'info', 'Photo Removed');
      },
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    soundEngine.playSwitch();
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    onUpdateItems(newItems);
    try {
      localStorage.setItem('sanjay_gallery_items', JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    soundEngine.playSwitch();
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    onUpdateItems(newItems);
    try {
      localStorage.setItem('sanjay_gallery_items', JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Controls Header: Luxury Editorial Curation */}
      <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors ${
        isDark ? 'bg-[#0f0e0c] border-[#26231e]' : 'bg-[#faf8f4] border-[#e8e4db]'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500 font-semibold">
            <Camera size={13} />
            <span>PORTFOLIO CURATION</span>
            <span className="text-stone-500" aria-hidden="true">·</span>
            <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>{items.length} Master Photographs</span>
          </div>
          <h3 className={`font-serif text-2xl sm:text-3xl font-normal tracking-tight ${
            isDark ? 'text-[#f5f2eb]' : 'text-[#181614]'
          }`}>
            Live Portfolio Archive &amp; Real Photo Ingestion
          </h3>
          <p className={`text-xs max-w-2xl ${isDark ? 'text-[#9e9689]' : 'text-stone-600'}`}>
            Upload real camera captures directly from your computer, adjust sequence ordering, or curate titles and storytelling notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowAddModal(true);
            }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Upload size={15} />
            <span>Upload Real Photograph</span>
          </button>

          <button
            type="button"
            onClick={handlePurgeStockPhotos}
            className={`px-3.5 py-3 rounded-xl border text-xs font-sans font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              isDark 
                ? 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10' 
                : 'border-stone-300 text-rose-600 hover:bg-rose-50'
            }`}
            title="Remove stock showcase samples to display only your real uploaded photographs"
          >
            <Trash2 size={13} />
            <span>Clear Stock Samples</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreStockPhotos}
            className={`px-3 py-3 rounded-xl border text-xs font-sans font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              isDark 
                ? 'border-white/10 text-stone-400 hover:text-white hover:bg-white/5' 
                : 'border-stone-300 text-stone-600 hover:bg-stone-100'
            }`}
            title="Restore default portfolio works"
          >
            <Sparkles size={13} className="text-amber-500" />
            <span>Restore Samples</span>
          </button>
        </div>
      </div>

      {/* Grid of Manageable Photographs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between group ${
              isDark
                ? 'bg-[#11100d] border-[#22201c] hover:border-amber-500/30'
                : 'bg-white border-stone-200 hover:border-amber-500/40 shadow-sm'
            }`}
          >
            {/* Image Thumbnail & Reorder controls */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black mb-3.5 border border-white/5">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              {/* Unboxed Metadata Badge */}
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md text-[10px] font-sans text-[#f5f2eb] uppercase tracking-wider font-medium border border-white/10 flex items-center gap-1.5">
                <span className="text-amber-400 font-mono">#{index + 1}</span>
                <span className="text-stone-500">·</span>
                <span>{item.category}</span>
                <span className="text-stone-500">·</span>
                <span className="capitalize">{item.aspectRatio || 'portrait'}</span>
              </div>

              {/* Order Controls */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-md rounded-lg p-1 border border-white/10">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                  title="Move forward in gallery sequence"
                  className="p-1 rounded text-stone-300 hover:text-amber-400 disabled:opacity-20 transition-colors cursor-pointer"
                >
                  <MoveUp size={13} />
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => handleMoveDown(index)}
                  title="Move backward in gallery sequence"
                  className="p-1 rounded text-stone-300 hover:text-amber-400 disabled:opacity-20 transition-colors cursor-pointer"
                >
                  <MoveDown size={13} />
                </button>
              </div>
            </div>

            {/* Meta info */}
            <div className="space-y-1.5 mb-3.5">
              <h4 className={`font-serif text-lg tracking-tight font-medium truncate ${
                isDark ? 'text-[#f5f2eb]' : 'text-stone-900'
              }`}>
                {item.title}
              </h4>
              <p className={`text-xs line-clamp-2 leading-relaxed ${
                isDark ? 'text-[#9e9689]' : 'text-stone-600'
              }`}>
                {item.description}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-sans text-stone-500">
                <span>{item.location || 'Ontario'}</span>
                <span aria-hidden="true">·</span>
                <span>{item.year || '2026'}</span>
                {item.client && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate text-amber-500/80">{item.client}</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className={`flex items-center justify-between pt-3 border-t ${
              isDark ? 'border-[#1e1c18]' : 'border-stone-100'
            }`}>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setEditingItem(item);
                }}
                className={`flex items-center gap-1.5 text-xs font-sans font-medium px-2.5 py-1 rounded transition-colors ${
                  isDark 
                    ? 'text-stone-300 hover:text-amber-400 hover:bg-white/5' 
                    : 'text-stone-700 hover:text-amber-600 hover:bg-stone-100'
                }`}
              >
                <Edit3 size={12} />
                <span>Edit Metadata</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeletePhoto(item.id, item.title)}
                className="flex items-center gap-1.5 text-xs font-sans font-medium px-2.5 py-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Real Photo Upload & Curation Studio (Supabase Storage)             */}
      {/* ========================================================================= */}
      {showAddModal && (
        <SecureImageUpload
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPhotoUploaded={(newPhoto) => {
            const updated = [newPhoto, ...items.filter((i) => i.id !== newPhoto.id)];
            onUpdateItems(updated);
            setShowAddModal(false);
          }}
          isDark={isDark}
          supabaseConfigured={true}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: Edit Metadata                                                      */}
      {/* ========================================================================= */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Photograph Details"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundEngine.playClick();
              setEditingItem(null);
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
              <div>
                <h3 className="font-serif text-2xl font-normal tracking-tight">Edit Photograph Metadata</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Update title, location, client name, and artistic description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editingItem.location || 'Ontario'}
                    onChange={e => setEditingItem({ ...editingItem, location: e.target.value })}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                    Client / Series
                  </label>
                  <input
                    type="text"
                    value={editingItem.client || ''}
                    onChange={e => setEditingItem({ ...editingItem, client: e.target.value })}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-widest font-semibold text-stone-400 mb-1">
                  Story &amp; Description
                </label>
                <textarea
                  rows={3}
                  value={editingItem.description}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-[#141310] border-[#2a2723] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Changes
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
