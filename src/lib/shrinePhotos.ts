import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

export type ShrinePhoto = {
  id: string;
  userId: string;
  shrineId: string;
  visitId: string | null;
  storagePath: string;
  url: string;
  caption: string;
  takenAt: string | null;
  photographerName: string;
  createdAt: string;
  shrineName?: string;
  shrineSlug?: string;
};

type UploadShrinePhotoOptions = {
  file: File;
  shrineId: string;
  userId: string;
  photographerName: string;
  caption?: string;
  visitId?: string;
};

export function resizePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("画像ファイルを選択してください。"));
  if (file.size > MAX_PHOTO_SIZE) return Promise.reject(new Error("画像は10MB以下を選択してください。"));

  return createImageBitmap(file).then((bitmap) => {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      throw new Error("画像を処理できませんでした。");
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("画像の変換に失敗しました。")), "image/jpeg", 0.8);
    });
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "画像を処理できませんでした。") throw error;
    throw new Error("画像を読み込めませんでした。別の画像をお試しください。");
  });
}

function toPhoto(row: Record<string, unknown>): ShrinePhoto {
  const supabase = getSupabaseBrowserClient();
  const storagePath = String(row.storage_path);
  const { data } = supabase.storage.from("shrine-photos").getPublicUrl(storagePath);
  return {
    id: String(row.id),
    userId: String(row.user_id),
    shrineId: String(row.shrine_id),
    visitId: typeof row.visit_id === "string" ? row.visit_id : null,
    storagePath,
    url: data.publicUrl,
    caption: typeof row.caption === "string" ? row.caption : "",
    takenAt: typeof row.taken_at === "string" ? row.taken_at : null,
    photographerName: typeof row.photographer_name === "string" ? row.photographer_name : "参拝者",
    createdAt: String(row.created_at),
    shrineName: typeof row.shrine_name === "string" ? row.shrine_name : undefined,
  };
}

export async function uploadShrinePhoto(options: UploadShrinePhotoOptions): Promise<ShrinePhoto> {
  const supabase = getSupabaseBrowserClient();
  const resizedImage = await resizePhoto(options.file);
  const pathTimestamp = `${Date.now()}${Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0")}`;
  const storagePath = `${options.userId}/${options.shrineId}/${pathTimestamp}.jpg`;
  const { error: uploadError } = await supabase.storage.from("shrine-photos").upload(storagePath, resizedImage, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from("shrine_photos").insert({
    user_id: options.userId,
    shrine_id: options.shrineId,
    visit_id: options.visitId ?? null,
    storage_path: storagePath,
    caption: options.caption?.trim() || null,
    taken_at: options.file.lastModified ? new Date(options.file.lastModified).toISOString() : null,
    photographer_name: options.photographerName,
  }).select("id, user_id, shrine_id, visit_id, storage_path, caption, taken_at, photographer_name, created_at").single();

  if (error) {
    await supabase.storage.from("shrine-photos").remove([storagePath]);
    throw error;
  }
  return toPhoto(data as Record<string, unknown>);
}

export async function fetchShrinePhotos(shrineId: string): Promise<ShrinePhoto[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("shrine_photos")
    .select("id, user_id, shrine_id, visit_id, storage_path, caption, taken_at, photographer_name, created_at")
    .eq("shrine_id", shrineId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toPhoto(row as Record<string, unknown>));
}

export async function fetchMyShrinePhotos(userId: string): Promise<ShrinePhoto[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("shrine_photos")
    .select("id, user_id, shrine_id, visit_id, storage_path, caption, taken_at, photographer_name, created_at, shrines(name, slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const shrineRelation = row.shrines;
    const shrine = Array.isArray(shrineRelation)
      ? shrineRelation[0] as { name: string; slug: string } | undefined
      : shrineRelation as unknown as { name: string; slug: string } | null;
    return { ...toPhoto({ ...row, shrine_name: shrine?.name }), shrineSlug: shrine?.slug };
  });
}

export async function deleteShrinePhoto(photo: ShrinePhoto): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("shrine_photos").delete().eq("id", photo.id);
  if (error) throw error;
  const { error: storageError } = await supabase.storage.from("shrine-photos").remove([photo.storagePath]);
  if (storageError) throw storageError;
}
