import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const CONTRIBUTION_TYPES = ["deity", "history", "benefit", "photo_ocr", "other"] as const;
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  deity: "御祭神",
  history: "由緒・歴史",
  benefit: "御利益",
  photo_ocr: "由緒書き OCR",
  other: "その他",
};

export const MAX_CONTRIBUTION_LENGTH = 20000;
export const MAX_CONTRIBUTION_IMAGE_SIZE = 10 * 1024 * 1024;
const SOURCE_BUCKET = "shrine-contribution-sources";

export type ShrineContribution = {
  id: string;
  shrineId: string;
  userId: string | null;
  contributionType: ContributionType;
  content: string;
  sourceImagePath: string | null;
  status: "published" | "hidden";
  createdAt: string;
  updatedAt: string;
};

type ContributionRow = {
  id: string;
  shrine_id: string;
  user_id: string | null;
  contribution_type: ContributionType;
  content: string;
  source_image_path: string | null;
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
};

function mapContribution(row: ContributionRow): ShrineContribution {
  return {
    id: row.id,
    shrineId: row.shrine_id,
    userId: row.user_id,
    contributionType: row.contribution_type,
    content: row.content,
    sourceImagePath: row.source_image_path,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function assertCurrentUser(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== userId) {
    throw new Error("ログイン状態を確認できませんでした。再度ログインしてください。");
  }
  return supabase;
}

function imageExtension(file: File): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  const extension = extensions[file.type];
  if (!extension) throw new Error("JPEG、PNG、WebP、HEIC形式の画像を選択してください。");
  if (file.size > MAX_CONTRIBUTION_IMAGE_SIZE) throw new Error("画像は10MB以下を選択してください。");
  return extension;
}

export async function fetchShrineContributions(shrineId: string): Promise<ShrineContribution[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("shrine_user_contributions")
    .select("id, shrine_id, user_id, contribution_type, content, source_image_path, status, created_at, updated_at")
    .eq("shrine_id", shrineId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as ContributionRow[]).map(mapContribution);
}

export async function createShrineContribution(input: {
  shrineId: string;
  userId: string;
  contributionType: ContributionType;
  content: string;
  sourceImage?: File | null;
}): Promise<ShrineContribution> {
  const content = input.content.trim();
  if (!content) throw new Error("投稿する内容を入力してください。");
  if (content.length > MAX_CONTRIBUTION_LENGTH) throw new Error("内容は20,000文字以内で入力してください。");

  const supabase = await assertCurrentUser(input.userId);
  let sourceImagePath: string | null = null;
  if (input.sourceImage) {
    const extension = imageExtension(input.sourceImage);
    sourceImagePath = `${input.userId}/${input.shrineId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(SOURCE_BUCKET).upload(sourceImagePath, input.sourceImage, {
      contentType: input.sourceImage.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) throw uploadError;
  }

  const { data, error } = await supabase.from("shrine_user_contributions").insert({
    shrine_id: input.shrineId,
    user_id: input.userId,
    contribution_type: input.contributionType,
    content,
    source_image_path: sourceImagePath,
  }).select("id, shrine_id, user_id, contribution_type, content, source_image_path, status, created_at, updated_at").single();

  if (error) {
    if (sourceImagePath) await supabase.storage.from(SOURCE_BUCKET).remove([sourceImagePath]);
    throw error;
  }
  return mapContribution(data as ContributionRow);
}

export async function updateShrineContribution(input: {
  id: string;
  userId: string;
  contributionType: ContributionType;
  content: string;
}): Promise<ShrineContribution> {
  const content = input.content.trim();
  if (!content) throw new Error("投稿する内容を入力してください。");
  if (content.length > MAX_CONTRIBUTION_LENGTH) throw new Error("内容は20,000文字以内で入力してください。");

  const supabase = await assertCurrentUser(input.userId);
  const { data, error } = await supabase.from("shrine_user_contributions").update({
    contribution_type: input.contributionType,
    content,
  }).eq("id", input.id).eq("user_id", input.userId)
    .select("id, shrine_id, user_id, contribution_type, content, source_image_path, status, created_at, updated_at").single();
  if (error) throw error;
  return mapContribution(data as ContributionRow);
}

export async function deleteShrineContribution(contribution: ShrineContribution, userId: string): Promise<void> {
  const supabase = await assertCurrentUser(userId);
  const { error } = await supabase.from("shrine_user_contributions").delete()
    .eq("id", contribution.id).eq("user_id", userId);
  if (error) throw error;
  if (contribution.sourceImagePath) {
    const { error: storageError } = await supabase.storage.from(SOURCE_BUCKET).remove([contribution.sourceImagePath]);
    if (storageError) throw storageError;
  }
}
