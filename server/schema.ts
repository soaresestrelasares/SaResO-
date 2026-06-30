import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  uniqueIndex,
  text,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  bio: varchar("bio", { length: 500 }).default(""),
  avatarUrl: varchar("avatar_url", { length: 500 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = mysqlTable("videos", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: varchar("description", { length: 2000 }).default(""),
  videoUrl: varchar("video_url", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }).default(""),
  likesCount: int("likes_count").default(0).notNull(),
  commentsCount: int("comments_count").default(0).notNull(),
  viewsCount: int("views_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const likes = mysqlTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    userId: int("user_id").notNull(),
    videoId: int("video_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueLike: uniqueIndex("unique_like").on(table.userId, table.videoId),
  }),
);

export const comments = mysqlTable("comments", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  videoId: int("video_id").notNull(),
  content: varchar("content", { length: 2000 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const follows = mysqlTable(
  "follows",
  {
    id: serial("id").primaryKey(),
    followerId: int("follower_id").notNull(),
    followingId: int("following_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueFollow: uniqueIndex("unique_follow").on(table.followerId, table.followingId),
  }),
);

// ── New tables ──────────────────────────────────────────────

export const companies = mysqlTable("companies", {
  id: serial("id").primaryKey(),
  ownerId: int("owner_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }).default(""),
  description: varchar("description", { length: 2000 }).default(""),
  website: varchar("website", { length: 300 }).default(""),
  industry: varchar("industry", { length: 100 }).default(""),
  location: varchar("location", { length: 200 }).default(""),
  // Subscrição empresa: trial 3 meses, depois paga (month/annual)
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("trial").notNull(), // trial, active, expired
  subscriptionPlan: varchar("subscription_plan", { length: 20 }).default(""), // month, annual
  trialEndsAt: timestamp("trial_ends_at").defaultNow().notNull(),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = mysqlTable("jobs", {
  id: serial("id").primaryKey(),
  companyId: int("company_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: varchar("description", { length: 5000 }).notNull(),
  location: varchar("location", { length: 200 }).default(""),
  type: varchar("type", { length: 50 }).default("full-time"), // full-time, part-time, remote, internship
  salary: varchar("salary", { length: 100 }).default(""),
  requirements: varchar("requirements", { length: 3000 }).default(""),
  active: int("active").default(1).notNull(),
  applicationsCount: int("applications_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobApplications = mysqlTable(
  "job_applications",
  {
    id: serial("id").primaryKey(),
    jobId: int("job_id").notNull(),
    userId: int("user_id").notNull(),
    coverLetter: varchar("cover_letter", { length: 3000 }).default(""),
    status: varchar("status", { length: 20 }).default("pending"), // pending, reviewed, accepted, rejected
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueApplication: uniqueIndex("unique_application").on(table.jobId, table.userId),
  }),
);

export const conversations = mysqlTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    user1Id: int("user1_id").notNull(),
    user2Id: int("user2_id").notNull(),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueConv: uniqueIndex("unique_conversation").on(table.user1Id, table.user2Id),
  }),
);

export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: int("conversation_id").notNull(),
  senderId: int("sender_id").notNull(),
  content: varchar("content", { length: 4000 }).notNull(),
  type: varchar("type", { length: 20 }).default("text"), // text, call
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: int("reporter_id").notNull(),
  contentType: varchar("content_type", { length: 30 }).notNull(), // video, comment, message, job
  contentId: int("content_id").notNull(),
  reason: varchar("reason", { length: 500 }).notNull(),
  resolved: int("resolved").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(), // recipient
  actorId: int("actor_id").notNull(), // who triggered
  type: varchar("type", { length: 30 }).notNull(), // follow, like, comment, message, job_application
  entityId: int("entity_id"), // related entity (video id, job id, etc.)
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockedUsers = mysqlTable(
  "blocked_users",
  {
    id: serial("id").primaryKey(),
    blockerId: int("blocker_id").notNull(),
    blockedId: int("blocked_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueBlock: uniqueIndex("unique_block").on(table.blockerId, table.blockedId),
  }),
);

export const lives = mysqlTable("lives", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  status: varchar("status", { length: 10 }).default("live").notNull(), // live, ended, deleted
  viewerCount: int("viewer_count").default(0).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// Moderadores/banidos de uma live
export const liveBans = mysqlTable("live_bans", {
  id: serial("id").primaryKey(),
  liveId: int("live_id").notNull(),
  userId: int("user_id").notNull(),
  bannedBy: int("banned_by").notNull(),
  reason: varchar("reason", { length: 500 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  token: varchar("token", { length: 64 }).notNull(),
  used: int("used").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedVideos = mysqlTable(
  "saved_videos",
  {
    id: serial("id").primaryKey(),
    userId: int("user_id").notNull(),
    videoId: int("video_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueSave: uniqueIndex("unique_save").on(table.userId, table.videoId),
  }),
);

export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull().unique(),
  plan: varchar("plan", { length: 20 }).default("premium").notNull(), // premium, vip
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verifiedUsers = mysqlTable("verified_users", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull().unique(),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  verifiedBy: int("verified_by").notNull(), // admin user id
});

// Subscritores de criadores premium (diferente de "seguir")
export const creatorSubscribers = mysqlTable(
  "creator_subscribers",
  {
    id: serial("id").primaryKey(),
    subscriberId: int("subscriber_id").notNull(), // quem subscreve
    creatorId: int("creator_id").notNull(), // criador premium
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueSub: uniqueIndex("unique_creator_sub").on(table.subscriberId, table.creatorId),
  }),
);

// Pagamentos / histórico de transações Stripe
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 64 }),
  plan: varchar("plan", { length: 20 }).notNull(), // premium_creator | creator_subscriber | company_month | company_annual
  targetCreatorId: int("target_creator_id"), // preenchido para plan=creator_subscriber
  targetCompanyId: int("target_company_id"), // preenchido para plan=company_*
  amount: int("amount").notNull(), // em cêntimos
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending | active | cancelled | expired
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
