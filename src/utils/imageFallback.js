/**
 * Editorial Image Fallback Helper
 * Returns actual high-resolution generated assets from /images/
 */

export const getFallbackImageUrl = (type = 'hero', customTitle = '') => {
  switch (type) {
    case 'hero':
      return '/images/hero-bg.jpg';
    case 'story':
      return '/images/story-1.jpg';
    case 'relationship':
      return customTitle.toLowerCase().includes('aki') ? '/images/aki-portrait.jpg' : '/images/story-1.jpg';
    case 'quote':
      return '/images/quote-bg.jpg';
    case 'timeline':
      return '/images/story-1.jpg';
    case 'gallery':
    default:
      return '/images/story-1.jpg';
  }
};

export const handleImageError = (e, fallbackType = 'gallery', customTitle = '') => {
  e.target.onerror = null;
  e.target.src = getFallbackImageUrl(fallbackType, customTitle);
};

export default getFallbackImageUrl;
