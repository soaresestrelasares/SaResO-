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
  }) => request<{ id: number }>("/videos", { method: "POST", body: JSON.stringify(data) }),
  likeVideo: (id: number) => request<{ liked: boolean }>(`/videos/${id}/like`, { method: "POST" }),
  saveVideo: (id: number) => request<{ saved: boolean }>(`/videos/${id}/save`, { method: "POST" }),
  getSavedVideos: () => request<Video[]>('/videos/saved'),

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
  getUserOnline: (username: string) =>
    request<{ online: boolean }>(`/users/${username}/online`),
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
    request<{ id: number; name: string }>("/companies", {
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
  report: (data: { contentType: string; contentId: number; reason: string }) =>
    request<{ ok: boolean }>("/reports", { method: "POST", body: JSON.stringify(data) }),

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
  getAdminReports: () => request<any[]>("/admin/reports"),
  resolveReport: (id: number) =>
    request<{ ok: boolean }>(`/admin/reports/${id}/resolve`, { method: "PATCH" }),
};
