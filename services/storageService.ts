import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

// Storage bucket names
const PROOF_ASSETS_BUCKET = 'proof-assets';

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Upload an image to Supabase Storage
 * @param uri - Local file URI from image picker
 * @param userId - The authenticated user's ID
 * @param folder - Optional subfolder (e.g., 'proofs', 'signatures')
 * @returns The public URL of the uploaded file or null if failed
 */
export async function uploadImage(
  uri: string,
  userId: string,
  folder: string = 'proofs'
): Promise<string | null> {
  try {
    // Get the file extension
    const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExtension}`;

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as FileSystem.EncodingType,
    });

    // Convert base64 to Uint8Array
    const bytes = base64ToUint8Array(base64);

    // Determine content type
    const contentType = getContentType(fileExtension);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(PROOF_ASSETS_BUCKET)
      .upload(fileName, bytes, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(PROOF_ASSETS_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload image error:', error);
    return null;
  }
}

/**
 * Upload a signature image (base64 SVG or PNG data)
 * @param signatureData - Base64 encoded signature data
 * @param userId - The authenticated user's ID
 * @returns The public URL of the uploaded signature or null
 */
export async function uploadSignature(
  signatureData: string,
  userId: string
): Promise<string | null> {
  try {
    const fileName = `${userId}/signatures/${Date.now()}.png`;

    // Check if it's already base64 encoded
    let base64Data = signatureData;
    if (signatureData.startsWith('data:')) {
      // Extract base64 from data URL
      base64Data = signatureData.split(',')[1];
    }

    // Convert base64 to Uint8Array
    const bytes = base64ToUint8Array(base64Data);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(PROOF_ASSETS_BUCKET)
      .upload(fileName, bytes, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Signature upload error:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(PROOF_ASSETS_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload signature error:', error);
    return null;
  }
}

/**
 * Delete an image from storage
 * @param url - The public URL of the image
 * @returns True if deleted successfully
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split(`/storage/v1/object/public/${PROOF_ASSETS_BUCKET}/`);
    if (pathParts.length < 2) {
      console.error('Invalid storage URL');
      return false;
    }

    const filePath = decodeURIComponent(pathParts[1]);

    const { error } = await supabase.storage
      .from(PROOF_ASSETS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete image error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete image error:', error);
    return false;
  }
}

/**
 * List all images for a user in a specific folder
 */
export async function listUserImages(
  userId: string,
  folder: string = 'proofs'
): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(PROOF_ASSETS_BUCKET)
      .list(`${userId}/${folder}`, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('List images error:', error);
      return [];
    }

    return (data || []).map(file => {
      const { data: urlData } = supabase.storage
        .from(PROOF_ASSETS_BUCKET)
        .getPublicUrl(`${userId}/${folder}/${file.name}`);
      return urlData.publicUrl;
    });
  } catch (error) {
    console.error('List images error:', error);
    return [];
  }
}

/**
 * Check if storage is available and accessible
 */
export async function checkStorageAvailability(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.storage
      .from(PROOF_ASSETS_BUCKET)
      .list('', { limit: 1 });

    if (error) {
      return { available: false, error: error.message };
    }

    return { available: true };
  } catch (error: any) {
    return { available: false, error: error.message };
  }
}

/**
 * Get content type from file extension
 */
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
  };
  return contentTypes[extension] || 'image/jpeg';
}

/**
 * Generate a signed URL for private file access (if needed)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(PROOF_ASSETS_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
  }
}
