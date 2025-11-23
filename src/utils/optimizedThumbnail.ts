/**
 * Helper to get an optimized thumbnail URL.
 * In a real-world scenario with Cloudinary/Imgix, we would append transformation params here.
 * For now, it returns the original URL.
 * 
 * @param url The original image URL
 * @param width Target width (default 64)
 * @returns optimized URL
 */
export const optimizedThumbnail = (url: string, width: number = 64): string => {
  if (!url) return '';
  
  // Placeholder for future optimization logic
  // e.g. if (url.includes('cloudinary')) return `${url.replace('/upload/', `/upload/w_${width},c_fill/`)}`;
  
  return url;
};
