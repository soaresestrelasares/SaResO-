import type {
  User,
  Video,
  Comment,
  AuthResponse,
  Company,
  Job,
  JobApplication,
  Conversation,
  Message,
  Notification,
  Story,
  Resume,
} from "./api-types";

const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: { username: string; displayName: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<User>("/auth/me"),
  forgotPassword: (email: string) =>
    request<{ message: string; code?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Videos
  getFeed: (page = 0) => request<Video[]>(`/videos?page=${page}`),
  getVideo: (id: number) => request<Video>(`/videos/${id}`),
  getUserVideos: (userId: number) => request<Video[]>(`/videos/user/${userId}`),
  createVideo: (data: {
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    location?: string;
    musicUrl?: string;
    musicTitle?: string;
  }) => request<{ id: number }>("/videos", { method: "POST", body: JSON.stringify(data) }),
  likeVideo: (id: number) => request<{ liked: boolean }>(`/videos/${id}/like`, { method: "POST" }),
  saveVideo: (id: number) => request<{ saved: boolean }>(`/videos/${id}/save`, { method: "POST" }),
  getSavedVideos: () => request<Video[]>("/videos/saved"),

  // Comments
  getComments: (videoId: number) => request<Comment[]>(`/comments/${videoId}`),
  addComment: (videoId: number, content: string) =>
    request<Comment>(`/comments/${videoId}`, { method: "POST", body: JSON.stringify({ content }) }),

  // Users
  getUser: (username: string) => request<User>(`/users/${username}`),
  updateMe: (data: Partial<User> & { username?: string }) =>
    request<User>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  updateProfile: (data: Partial<User> & { username?: string }) =>
    request<User>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  getUserOnline: (username: string) => request<{ online: boolean }>(`/users/${username}/online`),
  blockUser: (userId: number) =>
    request<{ ok: boolean }>(`/users/block/${userId}`, { method: "POST" }),
  unblockUser: (userId: number) =>
    request<{ ok: boolean }>(`/users/block/${userId}`, { method: "DELETE" }),
  getBlockedUsers: () => request<User[]>("/users/blocked"),

  // Follows
  toggleFollow: (userId: number) =>
    request<{ following: boolean }>(`/follows/${userId}`, { method: "POST" }),
  getFollowStatus: (userId: number) => request<{ following: boolean }>(`/follows/${userId}/status`),

  // Seed
  seed: () => request("/seed", { method: "POST" }),

  // Companies
  createCompany: (data: Partial<Company>) =>
    request<{ id: number; name: string; status: string; trialDays: number }>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  verifyCompany: (id: number, data: { legalDocUrl?: string; taxId?: string }) =>
    request<{ ok: boolean; status: string }>(`/companies/${id}/verify`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyCompanies: () => request<Company[]>("/companies/mine"),
  getCompany: (id: number) => request<Company>(`/companies/${id}`),
  updateCompany: (id: number, data: Partial<Company>) =>
    request<{ ok: boolean }>(`/companies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Jobs
  getJobs: (params?: { keyword?: string; location?: string; type?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.keyword) q.set("keyword", params.keyword);
    if (params?.location) q.set("location", params.location);
    if (params?.type) q.set("type", params.type);
    if (params?.page !== undefined) q.set("page", String(params.page));
    return request<Job[]>(`/jobs?${q}`);
  },
  getJob: (id: number) => request<Job>(`/jobs/${id}`),
  createJob: (data: Partial<Job> & { companyId: number; title: string; description: string }) =>
    request<{ id: number }>("/jobs", { method: "POST", body: JSON.stringify(data) }),
  applyToJob: (id: number, coverLetter: string) =>
    request<{ ok: boolean }>(`/jobs/${id}/apply`, {
      method: "POST",
      body: JSON.stringify({ coverLetter }),
    }),
  getJobApplications: (jobId: number) => request<JobApplication[]>(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (appId: number, status: string) =>
    request<{ ok: boolean }>(`/jobs/applications/${appId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Conversations
  getConversations: () => request<Conversation[]>("/conversations"),
  startConversation: (targetUserId: number) =>
    request<{ id: number }>("/conversations", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    }),
  getMessages: (conversationId: number) =>
    request<Message[]>(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: number, content: string) =>
    request<Message>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // Reports
  reportContent: (contentType: string, contentId: number, reason: string) =>
    request<{ ok: boolean }>("/reports", {
      method: "POST",
      body: JSON.stringify({ contentType, contentId, reason }),
    }),

  // Notifications
  getNotifications: () => request<Notification[]>("/notifications"),
  markNotificationRead: (id: number) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    request<{ ok: boolean }>("/notifications/read-all", { method: "POST" }),

  // Admin
  getAdminStats: () =>
    request<{ userCount: number; videoCount: number; reportCount: number; pendingReports: number }>(
      "/admin/stats",
    ),
  getAdminReports: () =>
    request<
      {
        id: number;
        reporterId: number;
        reporterUsername: string;
        contentType: string;
        contentId: number;
        reason: string;
        resolved: boolean;
        createdAt: string;
      }[]
    >("/admin/reports"),
  resolveReport: (id: number) =>
    request<{ ok: boolean }>(`/admin/reports/${id}/resolve`, { method: "PATCH" }),

  // Subscritores de criadores premium
  subscribeToCreator: (creatorId: number) =>
    request<{ subscribed: boolean }>(`/creators/${creatorId}/subscribe`, { method: "POST" }),
  getSubscribeStatus: (creatorId: number) =>
    request<{ subscribed: boolean; subscribersCount: number }>(
      `/creators/${creatorId}/subscribe-status`,
    ),
  getCreatorSubscribers: (creatorId: number) =>
    request<
      {
        id: number;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        subscribedAt: string;
      }[]
    >(`/creators/${creatorId}/subscribers`),

  getStories: () => request<Story[]>("/discover/stories"),
  getUserStories: (userId: number) => request<Story[]>(`/discover/stories/user/${userId}`),
  createStory: (data: { mediaUrl: string; mediaType: "image" | "video" }) =>
    request<{ id: number }>("/discover/stories", { method: "POST", body: JSON.stringify(data) }),
  viewStory: (storyId: number) =>
    request<{ ok: boolean }>(`/discover/stories/${storyId}/view`, { method: "POST" }),
  getSuggestions: () =>
    request<
      {
        id: number;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
      }[]
    >("/discover/suggestions"),
  getTrending: (page = 0) => request<Video[]>(`/discover/trending?page=${page}`),
  getHashtagVideos: (tag: string, page = 0) =>
    request<Video[]>(`/discover/hashtag/${tag}?page=${page}`),
  searchHashtags: (q: string) =>
    request<{ tag: string; count: number }[]>(
      `/discover/hashtags/search?q=${encodeURIComponent(q)}`,
    ),
  getFollowingFeed: (page = 0) => request<Video[]>(`/discover/feed/following?page=${page}`),

  // Resumes / CVs
  getMyResume: () => request<Resume>("/resumes/me"),
  updateResume: (data: Partial<Resume>) =>
    request<Resume>("/resumes/me", { method: "PUT", body: JSON.stringify(data) }),
  searchResumes: (params?: { q?: string; location?: string; remote?: boolean; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.q) q.set("q", params.q);
    if (params?.location) q.set("location", params.location);
    if (params?.remote !== undefined) q.set("remote", String(params.remote));
    if (params?.page !== undefined) q.set("page", String(params.page));
    return request<Resume[]>(`/resumes?${q}`);
  },

  // Billing / Stripe
  createCheckout: (plan: string, creatorId?: number, companyId?: number) =>
    request<{ url: string | null; sessionId: string; demo?: boolean }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan, creatorId, companyId }),
    }),
  getBillingStatus: () =>
    request<{ isPremiumCreator: boolean; expiresAt: string | null; stripeManaged: boolean }>(
      "/billing/status",
    ),
};
