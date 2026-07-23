import React, { useState, useEffect, useRef } from 'react';
import { decode } from 'blurhash';
import { HugeiconsIcon } from '@hugeicons/react';
import { Image01Icon } from '@hugeicons/core-free-icons';
import './ProgressiveImage.css';

export function ProgressiveImage({
  src,
  lowResSrc,
  blurHash,
  alt = 'Gallery Artwork',
  aspectRatio = '1.4',
  className = '',
  onClick,
  onLoad: externalOnLoad,
  onError: externalOnError,
  style = {},
}) {
  const [isLowResLoaded, setIsLowResLoaded] = useState(false);
  const [isFullResLoaded, setIsFullResLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const canvasRef = useRef(null);
  const fullImgRef = useRef(null);

  // Compute 400px transformed URL ONLY for Supabase remote storage images
  const computeLowResUrl = (originalSrc) => {
    if (lowResSrc) return lowResSrc;
    if (!originalSrc) return '';
    if (originalSrc.includes('/storage/v1/object/public/')) {
      return (
        originalSrc.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') +
        '?width=400&quality=70'
      );
    }
    // For local assets, do NOT duplicate low-res src to avoid blur filter overlay
    return null;
  };

  const effectiveLowResSrc = computeLowResUrl(src);

  // Reset load/error state when src changes & check image completion
  useEffect(() => {
    setHasError(false);
    setIsLowResLoaded(false);
    setIsFullResLoaded(false);

    // Instant check for cached/local images that complete immediately
    if (fullImgRef.current && fullImgRef.current.complete && fullImgRef.current.naturalWidth > 0) {
      setIsFullResLoaded(true);
    }
  }, [src, lowResSrc]);

  // Decode BlurHash onto 32x32 canvas if provided
  useEffect(() => {
    if (!blurHash || blurHash.startsWith('data:') || hasError || isFullResLoaded) return;
    try {
      const width = 32;
      const height = 32;
      const pixels = decode(blurHash, width, height);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.createImageData(width, height);
          imageData.data.set(pixels);
          ctx.putImageData(imageData, 0, 0);
        }
      }
    } catch (err) {
      // Ignore blurhash decode error gracefully
    }
  }, [blurHash, hasError, isFullResLoaded]);

  const handleFullResLoad = (e) => {
    setIsFullResLoaded(true);
    if (externalOnLoad) externalOnLoad(e);
  };

  const handleImageError = (e) => {
    setHasError(true);
    if (externalOnError) externalOnError(e);
  };

  return (
    <div
      className={`progressive-img-wrapper ${className}`}
      style={{ aspectRatio, ...style }}
      onClick={onClick}
    >
      {/* Fallback state when image fails to load */}
      {hasError ? (
        <div className="progressive-image-fallback" role="img" aria-label={`Failed to load: ${alt}`}>
          <HugeiconsIcon icon={Image01Icon} size={28} className="progressive-fallback-icon" />
          <span className="progressive-fallback-text">Image Unavailable</span>
        </div>
      ) : (
        <>
          {/* Stage 1: Skeleton Shimmer (Only while not loaded) */}
          {!isLowResLoaded && !isFullResLoaded && (
            <div className="progressive-skeleton-shimmer" />
          )}

          {/* Stage 2: BlurHash / Base64 Display (Only while full-res is loading) */}
          {blurHash && !isFullResLoaded && (
            blurHash.startsWith('data:') ? (
              <img
                src={blurHash}
                alt="Blur placeholder"
                className="progressive-blur-img"
              />
            ) : (
              <canvas
                ref={canvasRef}
                className="progressive-blur-canvas"
              />
            )
          )}

          {/* Stage 3: Distinct Low-Resolution Image (Only if distinct low-res URL exists & loading) */}
          {effectiveLowResSrc && !isFullResLoaded && (
            <img
              src={effectiveLowResSrc}
              alt={alt}
              className="progressive-lowres-img"
              onLoad={() => setIsLowResLoaded(true)}
              onError={handleImageError}
            />
          )}

          {/* Stage 4: Sharp Full-Resolution Image */}
          <img
            ref={fullImgRef}
            src={src}
            alt={alt}
            className={`progressive-fullres-img ${isFullResLoaded ? 'loaded' : ''}`}
            onLoad={handleFullResLoad}
            onError={handleImageError}
          />
        </>
      )}
    </div>
  );
}

export default ProgressiveImage;
