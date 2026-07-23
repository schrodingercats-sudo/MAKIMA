import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Upload01Icon,
  Cancel01Icon,
  Image01Icon,
  Delete02Icon
} from '@hugeicons/core-free-icons';
import './UploadModal.css';

export function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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
    setPreviewUrl(URL.createObjectURL(selectedFile));
    simulateProgress();
  };

  const simulateProgress = () => {
    setIsUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file && !previewUrl) return;

    const newArtwork = {
      id: `art-${Date.now()}`,
      title: title || 'Untitled Makima Creation',
      artist: 'Makima',
      artistHandle: '@makima',
      artistAvatar: '/images/coming-soon.jpg',
      src: previewUrl || '/images/gallery-1.webp',
      likes: 1,
      saves: 0,
      category,
      media: 'Illustration',
      isAnimated: false,
      aspectRatio: '1.4',
      tags: ['Makima', 'User Upload', category],
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (onUploadSuccess) {
      onUploadSuccess(newArtwork);
    }
    onClose();
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
                disabled={!previewUrl || isUploading || progress < 100}
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
