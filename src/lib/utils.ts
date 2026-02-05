import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"
import { compressImage } from "./imageCompression"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function uploadOrderPhoto(file: File): Promise<string> {
  try {
    const compressedFile = await compressImage(file);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('order-photos')
      .upload(filePath, compressedFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('order-photos').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

export function formatOrderId(id: number | string | undefined): string {
  if (!id) return '';
  if (typeof id === 'number') {
    return `OS${id.toString().padStart(4, '0')}`;
  }
  // Fallback for UUIDs if short_id is missing for some reason
  return `ID:${id.toString().substring(0, 8).toUpperCase()}`;
}
