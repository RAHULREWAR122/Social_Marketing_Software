export type SocialPlatform = "INSTAGRAM" | "FACEBOOK" | "LINKEDIN_PERSONAL" | "LINKEDIN_ORGANIZATION";

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  externalAccountId: string;
  displayName: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  createdAt: string;
};

export type Media = {
  id: string;
  publicUrl: string;
  mimeType: string;
  mediaType: "IMAGE" | "VIDEO";
  fileSizeBytes: number;
  createdAt: string;
};

export type SocialPostStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "QUEUED"
  | "PUBLISHING"
  | "PUBLISHED"
  | "PARTIALLY_PUBLISHED"
  | "FAILED"
  | "CANCELLED";

export type SocialPostTargetStatus = "PENDING" | "PROCESSING" | "PUBLISHED" | "FAILED";

export type SocialPostTarget = {
  id: string;
  status: SocialPostTargetStatus;
  providerPostId: string | null;
  errorMessage: string | null;
  socialAccount: { platform: SocialPlatform; displayName: string | null };
};

export type SocialPost = {
  id: string;
  caption: string;
  status: SocialPostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  media: { position: number; media: Media }[];
  targets: SocialPostTarget[];
  createdAt: string;
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN_PERSONAL: "LinkedIn (Personal)",
  LINKEDIN_ORGANIZATION: "LinkedIn (Company Page)",
};
