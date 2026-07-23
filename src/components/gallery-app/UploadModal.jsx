import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Upload01Icon,
  Cancel01Icon,
  Delete02Icon
} from '@hugeicons/core-free-icons';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { invalidateArtworkCache } from '../../lib/redis';
import './UploadModal.css';

export function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { user, profile } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('1.4');
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Editorial');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) return;
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Compute aspect ratio from image natural size
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      if (img.width && img.height) {
        setAspectRatio((img.width / img.height).toFixed(1));
      }
    };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setIsUploading(false);
  };

  // Generate 20x20 blurred base64 placeholder using offscreen canvas
  const generateBlurPlaceholder = (imgUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 20, 20);
          resolve(canvas.toDataURL('image/webp', 0.2));
        } else {
          resolve('data:image/webp;base64,UklGRkAAAABXRUJQVlA4WAoAAAAQAAAAAQAAAC0AQUxQSAwAAAABFwAQAP4B5AIWVlA4IDAAAAAQAgCdASoCAAEAAUAmJaQAA3AA/v7WAAAA');
        }
      };
      img.onerror = () => {
        resolve('data:image/webp;base64,UklGRkAAAABXRUJQVlA4WAoAAAAQAAAAAQAAAC0AQUxQSAwAAAABFwAQAP4B5AIWVlA4IDAAAAAQAgCdASoCAAEAAUAmJaQAA3AA/v7WAAAA');
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !previewUrl) return;

    setIsUploading(true);
    setProgress(20);

    try {
      let publicImageUrl = previewUrl;
      let blurPlaceholder = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4WAoAAAAQAAAAAQAAAC0AQUxQSAwAAAABFwAQAP4B5AIWVlA4IDAAAAAQAgCdASoCAAEAAUAmJaQAA3AA/v7WAAAA';

      // 1. Generate 20x20 base64 blur hash thumbnail
      try {
        blurPlaceholder = await generateBlurPlaceholder(previewUrl);
      } catch (err) {
        console.warn('Blurhash placeholder generation notice:', err);
      }

      setProgress(40);

      // 2. Upload file to Supabase Storage 'artworks' bucket if file is selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('artworks')
          .upload(fileName, file, { contentType: file.type, upsert: true });

        if (uploadErr) {
          console.warn('Storage upload notice:', uploadErr.message);
        } else {
          const { data: pubUrlData } = supabase.storage.from('artworks').getPublicUrl(fileName);
          if (pubUrlData?.publicUrl) {
            publicImageUrl = pubUrlData.publicUrl;
          }
        }
      }

      setProgress(70);

      // 3. Insert record in Supabase Database 'artworks' table
      const newArtworkData = {
        title: title || 'Untitled Makima Creation',
        description: description || '',
        image_url: publicImageUrl,
        thumbnail_url: publicImageUrl,
        blur_hash: blurPlaceholder,
        category: category,
        media_type: 'Illustration',
        is_animated: file?.type === 'image/gif' || file?.name?.endsWith('.webp') || false,
        aspect_ratio: aspectRatio || '1.4',
        tags: ['Makima', 'User Upload', category],
        artist_id: user?.id,
      };

      let createdArtworkRow = null;

      if (user?.id) {
        const { data: inserted, error: insertErr } = await supabase
          .from('artworks')
          .insert(newArtworkData)
          .select(`
            *,
            artist:profiles!artworks_artist_id_fkey(
              id, display_name, handle, avatar_url
            )
          `)
          .single();

        if (insertErr) {
          console.warn('DB artwork insert notice:', insertErr.message);
        } else {
          createdArtworkRow = inserted;
        }
      }

      setProgress(90);

      // 4. Invalidate Redis artwork cache
      await invalidateArtworkCache();

      setProgress(100);

      // Construct formatted item for UI state
      const formattedArtwork = {
        id: createdArtworkRow?.id || `art-${Date.now()}`,
        title: title || 'Untitled Makima Creation',
        description: description || '',
        artist: profile?.display_name || user?.email?.split('@')[0] || 'Makima',
        artistHandle: profile?.handle || '@makima',
        artistAvatar: profile?.avatar_url || '/images/coming-soon.jpg',
        src: publicImageUrl,
        thumbnailUrl: publicImageUrl,
        blurHash: blurPlaceholder,
        likes: 1,
        saves: 0,
        category,
        media: 'Illustration',
        isAnimated: file?.type === 'image/gif' || false,
        aspectRatio: aspectRatio || '1.4',
        tags: ['Makima', 'User Upload', category],
        createdAt: new Date().toISOString()
      };

      if (onUploadSuccess) {
        onUploadSuccess(formattedArtwork);
      }
      onClose();
    } catch (err) {
      console.warn('Upload artwork exception:', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="upload-modal-overlay" onClick={onClose}>
        <motion.div
          className="upload-modal-container"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="upload-modal-header">
            <h3 className="upload-modal-title">Upload Fan Artwork</h3>
            <button className="close-btn" onClick={onClose} aria-label="Close modal">
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="upload-modal-body">
            {!previewUrl ? (
              /* Drag & Drop Target Area */
              <div
                className={`drag-drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon-circle">
                  <HugeiconsIcon icon={Upload01Icon} size={28} />
                </div>
                <h4 className="drag-title">Drag and drop your artwork here</h4>
                <p className="drag-subtitle">Supports PNG, JPG, WEBP or GIF up to 15MB</p>
                <button
                  type="button"
                  className="browse-files-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  hidden
                />
              </div>
            ) : (
              /* File Selected / Upload Progress & Preview Area */
              <div className="upload-preview-area">
                <div className="preview-image-wrapper">
                  <img src={previewUrl} alt="Upload Preview" className="preview-img" />
                  <button
                    type="button"
                    className="remove-preview-btn"
                    onClick={handleReset}
                    title="Remove file"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={18} />
                  </button>
                </div>

                {/* Progress Indicator */}
                {isUploading && (
                  <div className="upload-progress-box">
                    <div className="progress-info">
                      <span className="file-name">{file?.name || 'Artwork.png'}</span>
                      <span className="progress-percentage">{progress}%</span>
                    </div>
                    <div className="progress-track">
                      <motion.div
                        className="progress-bar"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {/* Artwork Metadata Inputs */}
                <div className="form-fields-container">
                  <div className="upload-field-group">
                    <label className="upload-label">Artwork Title</label>
                    <input
                      type="text"
                      className="upload-input"
                      placeholder="e.g. Control in Silence"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="upload-field-group">
                    <label className="upload-label">Category</label>
                    <select
                      className="upload-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Editorial">Editorial</option>
                      <option value="Digital Art">Digital Art</option>
                      <option value="Fan Art">Fan Art</option>
                      <option value="Vector">Vector</option>
                      <option value="Concept">Concept</option>
                    </select>
                  </div>

                  <div className="upload-field-group">
                    <label className="upload-label">Description (Optional)</label>
                    <textarea
                      className="upload-textarea"
                      rows={2}
                      placeholder="Tell the story behind this artwork..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="upload-modal-footer">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="publish-btn"
                disabled={!previewUrl || isUploading}
              >
                {isUploading ? `Uploading (${progress}%)` : 'Publish Artwork →'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UploadModal;
