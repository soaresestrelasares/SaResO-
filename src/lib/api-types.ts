export interface Story {
  id: number;
  userId: number;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  location?: string | null;
  isPrivate?: boolean;
  followersCount?: number;
  followingCount?: number;
  videosCount?: number;
  subscribersCount?: number;
  isPremium?: boolean;
  isVerified?: boolean;
  canViewContent?: boolean;
  isFollowing?: boolean;
}

export interface Video {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  location: string | null;
  musicUrl: string | null;
  musicTitle: string | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  liked: boolean;
  saved?: boolean;
  savedCount?: number;
  isPremium?: boolean;
  isVerified?: boolean;
}

export interface Comment {
  id: number;
  userId: number;
  videoId: number;
  content: string;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Company {
  id: number;
  ownerId: number;
  name: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  subscriptionStatus: "trial" | "active" | "expired";
  subscriptionPlan: string | null;
  trialEndsAt: string;
  subscriptionEndsAt: string | null;
  stripeSubscriptionId: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  legalDocUrl: string | null;
  taxId: string | null;
  isActive: boolean;
  createdAt: string;
  jobs?: Job[];
}

export interface Job {
  id: number;
  companyId: number;
  title: string;
  description: string;
  location: string | null;
  type: string;
  salary: string | null;
  requirements: string | null;
  applicationsCount: number;
  createdAt: string;
  companyName: string;
  companyLogo: string | null;
  companyLocation: string | null;
  companyWebsite?: string | null;
  companyIndustry?: string | null;
  applied?: boolean;
}

export interface JobApplication {
  id: number;
  userId: number;
  coverLetter: string | null;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface Resume {
  id: number;
  userId: number;
  summary: string | null;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  desiredRole: string | null;
  desiredLocation: string | null;
  remote: boolean;
  cvUrl: string | null;
  isPublic: boolean;
  updatedAt: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  location?: string | null;
}

export interface ResumeExperience {
  role: string;
  company: string;
  location?: string;
  start: string;
  end?: string;
  current?: boolean;
  description?: string;
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  field?: string;
  start: string;
  end?: string;
}

export interface Conversation {
  id: number;
  other: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  lastMessage: { content: string; createdAt: string } | null;
  lastMessageAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  senderUsername?: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string | null;
}

export interface Notification {
  id: number;
  userId: number;
  actorId: number;
  type: "follow" | "like" | "comment" | "message" | "job_application" | "mention" | "subscribe";
  entityId: number | null;
  readAt: string | null;
  createdAt: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
}
