/**
 * Storage Adapter Interface for Document Handling
 * Supports multiple storage backends: Supabase Storage, Google Drive, Local Disk
 * 
 * ASSUMPTION: Abstracted interface to avoid vendor lock-in
 */

import { supabase } from '@/lib/supabase';
import { uploadFileToDrive } from '@/lib/googleDrive';

export interface StorageMetadata {
  contentType?: string;
  customMetadata?: Record<string, string>;
}

export interface StorageResult {
  key: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface StorageAdapter {
  /**
   * Upload a file to storage
   */
  put(
    file: File | Blob,
    key: string,
    metadata?: StorageMetadata
  ): Promise<StorageResult>;

  /**
   * Get download URL for a file
   */
  getUrl(key: string): Promise<string>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;
}

/**
 * Supabase Storage Adapter
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private bucket: string;
  private basePath: string;

  constructor(bucket: string = 'student-documents', basePath: string = '') {
    this.bucket = bucket;
    this.basePath = basePath;
  }

  async put(
    file: File | Blob,
    key: string,
    metadata?: StorageMetadata
  ): Promise<StorageResult> {
    const fullPath = this.basePath ? `${this.basePath}/${key}` : key;

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(fullPath, file, {
        contentType: metadata?.contentType || (file as File).type || 'application/octet-stream',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(fullPath);

    return {
      key: fullPath,
      url: urlData.publicUrl,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  async getUrl(key: string): Promise<string> {
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(key);
    
    return data.publicUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([key]);
    
    if (error) throw error;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list(key.split('/').slice(0, -1).join('/'), {
          search: key.split('/').pop()
        });
      
      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Google Drive Storage Adapter
 */
export class GoogleDriveStorageAdapter implements StorageAdapter {
  private folderId: string;

  constructor(folderId?: string) {
    this.folderId = folderId || localStorage.getItem('drive_folder_id') || '';
  }

  async put(
    file: File | Blob,
    key: string,
    metadata?: StorageMetadata
  ): Promise<StorageResult> {
    if (!this.folderId) {
      throw new Error('Google Drive folder ID not configured');
    }

    // Convert Blob to File if needed
    const fileToUpload = file instanceof File 
      ? file 
      : new File([file], key, { type: metadata?.contentType || 'application/octet-stream' });

    const result = await uploadFileToDrive(fileToUpload, this.folderId);

    return {
      key: result.fileId,
      url: result.webViewLink,
      size: result.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  async getUrl(key: string): Promise<string> {
    // Google Drive file ID is the key
    return `https://drive.google.com/file/d/${key}/view`;
  }

  async delete(key: string): Promise<void> {
    // ASSUMPTION: Implement Google Drive delete via API
    throw new Error('Google Drive delete not implemented yet');
  }

  async exists(key: string): Promise<boolean> {
    // ASSUMPTION: Would need to check via Google Drive API
    return true;
  }
}

/**
 * Local Storage Adapter (for development/testing)
 */
export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string = '/uploads') {
    this.basePath = basePath;
  }

  async put(
    file: File | Blob,
    key: string,
    metadata?: StorageMetadata
  ): Promise<StorageResult> {
    // ASSUMPTION: In a real implementation, this would save to a local server
    // For browser-based apps, we'll store as data URL in localStorage (not production-ready)
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const storageKey = `${this.basePath}/${key}`;
        
        try {
          localStorage.setItem(storageKey, dataUrl);
          
          resolve({
            key: storageKey,
            url: dataUrl,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          });
        } catch (error) {
          reject(new Error('LocalStorage quota exceeded'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async getUrl(key: string): Promise<string> {
    const dataUrl = localStorage.getItem(key);
    if (!dataUrl) {
      throw new Error('File not found in local storage');
    }
    return dataUrl;
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }
}

/**
 * Storage Factory - returns appropriate adapter based on configuration
 */
export function createStorageAdapter(type?: 'supabase' | 'googledrive' | 'local'): StorageAdapter {
  const storageType = type || (localStorage.getItem('storage_type') as any) || 'supabase';

  switch (storageType) {
    case 'googledrive':
      return new GoogleDriveStorageAdapter();
    case 'local':
      return new LocalStorageAdapter();
    case 'supabase':
    default:
      return new SupabaseStorageAdapter();
  }
}

/**
 * Batch upload documents with progress tracking
 */
export async function batchUploadDocuments(
  files: Array<{ file: File; key: string; metadata?: StorageMetadata }>,
  adapter: StorageAdapter,
  onProgress?: (completed: number, total: number) => void
): Promise<StorageResult[]> {
  const results: StorageResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const { file, key, metadata } = files[i];
    try {
      const result = await adapter.put(file, key, metadata);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Failed to upload ${key}:`, error);
      // Continue with other uploads
    }
  }
  
  return results;
}
