export interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  followersCount?: number;
  followingCount?: number;
  videosCount?: number;
}

export interface Video {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  liked: boolean;
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
  type: "follow" | "like" | "comment" | "message" | "job_application";
  entityId: number | null;
  readAt: string | null;
  createdAt: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
}
