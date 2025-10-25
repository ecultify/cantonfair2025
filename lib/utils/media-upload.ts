/**
 * Media Upload Utility for Supabase Storage
 * Handles uploading images and videos to Supabase Storage bucket
 * Generates thumbnails for videos
 */

import { supabase } from "@/lib/supabase/client";

interface UploadResult {
  url: string;
  thumbUrl?: string;
  type: 'photo' | 'video';
}

/**
 * Convert data URL to Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Generate video thumbnail from video data URL
 */
async function generateVideoThumbnail(videoDataURL: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoDataURL;
    video.crossOrigin = 'anonymous';
    
    video.addEventListener('loadeddata', () => {
      // Seek to 1 second or 10% of video duration
      video.currentTime = Math.min(1, video.duration * 0.1);
    });
    
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Compress thumbnail to reasonable size (max 800px width)
        const maxWidth = 800;
        if (canvas.width > maxWidth) {
          const ratio = maxWidth / canvas.width;
          canvas.width = maxWidth;
          canvas.height = canvas.height * ratio;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } catch (error) {
        reject(error);
      }
    });
    
    video.addEventListener('error', (e) => {
      reject(new Error('Video loading failed'));
    });
  });
}

/**
 * Upload media (image or video) to Supabase Storage
 * @param dataURL - Base64 data URL of the media
 * @param type - 'photo' or 'video'
 * @param userId - User ID for organizing files
 * @returns Object with public URL and thumbnail URL (for videos)
 */
export async function uploadMediaToStorage(
  dataURL: string,
  type: 'photo' | 'video',
  userId: string
): Promise<UploadResult> {
  try {
    // Convert data URL to blob
    const blob = dataURLtoBlob(dataURL);
    
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = type === 'photo' ? 'jpg' : 'mp4';
    const filename = `${userId}/${timestamp}-${random}.${extension}`;
    
    // Upload main file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('canton-fair-media')
      .upload(filename, blob, {
        contentType: type === 'photo' ? 'image/jpeg' : 'video/mp4',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('canton-fair-media')
      .getPublicUrl(filename);
    
    const result: UploadResult = {
      url: urlData.publicUrl,
      type
    };
    
    // Generate and upload thumbnail for videos
    if (type === 'video') {
      try {
        const thumbDataURL = await generateVideoThumbnail(dataURL);
        const thumbBlob = dataURLtoBlob(thumbDataURL);
        const thumbFilename = `${userId}/${timestamp}-${random}-thumb.jpg`;
        
        const { data: thumbUploadData, error: thumbError } = await supabase.storage
          .from('canton-fair-media')
          .upload(thumbFilename, thumbBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });
        
        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from('canton-fair-media')
            .getPublicUrl(thumbFilename);
          
          result.thumbUrl = thumbUrlData.publicUrl;
        }
      } catch (thumbError) {
        console.warn('Thumbnail generation failed:', thumbError);
        // Continue without thumbnail
      }
    }
    
    return result;
  } catch (error) {
    console.error('Media upload error:', error);
    throw error;
  }
}

/**
 * Delete media from Supabase Storage
 */
export async function deleteMediaFromStorage(url: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.indexOf('canton-fair-media');
    if (bucketIndex === -1) return;
    
    const filename = urlParts.slice(bucketIndex + 1).join('/');
    
    const { error } = await supabase.storage
      .from('canton-fair-media')
      .remove([filename]);
    
    if (error) {
      console.error('Delete error:', error);
    }
  } catch (error) {
    console.error('Media deletion error:', error);
  }
}

/**
 * Compress image before upload (for better performance)
 */
export async function compressImage(dataURL: string, maxWidth = 1920, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataURL;
  });
}

