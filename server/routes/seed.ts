import { Router } from "express";
import { getDb } from "../db.js";
import { users, videos } from "../schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const seedRouter = Router();

const SAMPLE_VIDEOS = [
  {
    title: "Beautiful sunset at the beach",
    description: "Relax and enjoy this stunning sunset view #nature #beach",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
  },
  {
    title: "Mountain hiking adventure",
    description: "Epic mountain views from the top #hiking #adventure",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400",
  },
  {
    title: "City lights at night",
    description: "The city never sleeps! #city #nightlife",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400",
  },
  {
    title: "Cooking pasta from scratch",
    description: "Simple homemade pasta recipe #cooking #food",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400",
  },
  {
    title: "Street dance freestyle",
    description: "Let the music move you! #dance #freestyle",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=400",
  },
  {
    title: "Skateboarding tricks",
    description: "Watch these insane skate tricks #skateboard #sports",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
  },
];

seedRouter.post("/", async (req, res) => {
  try {
    const db = getDb();
    const hash = await bcrypt.hash("password123", 10);

    // Insert users (ignore if exists)
    await db
      .insert(users)
      .values({
        username: "alexcreator",
        displayName: "Alex Creator",
        email: "alex@example.com",
        passwordHash: hash,
        bio: "Content creator & traveler",
      })
      .catch(() => {});
    await db
      .insert(users)
      .values({
        username: "mariafilms",
        displayName: "Maria Films",
        email: "maria@example.com",
        passwordHash: hash,
        bio: "Filmmaker & storyteller",
      })
      .catch(() => {});

    const allUsers = await db.select({ id: users.id }).from(users).limit(2);
    const userId1 = Number(allUsers[0]?.id ?? 1);
    const userId2 = Number(allUsers[1]?.id ?? 2);

    for (let i = 0; i < SAMPLE_VIDEOS.length; i++) {
      await db
        .insert(videos)
        .values({
          userId: i % 2 === 0 ? userId1 : userId2,
          ...SAMPLE_VIDEOS[i],
          likesCount: Math.floor(Math.random() * 1000),
          commentsCount: Math.floor(Math.random() * 50),
          viewsCount: Math.floor(Math.random() * 10000),
        })
        .catch(() => {});
    }
    res.json({ ok: true, message: "Seeded successfully" });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});
