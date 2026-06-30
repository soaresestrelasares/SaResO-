import { getPool } from "./db.js";

export async function ensureTables(): Promise<void> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        bio VARCHAR(500) DEFAULT '',
        avatar_url VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description VARCHAR(2000) DEFAULT '',
        video_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500) DEFAULT '',
        likes_count INT DEFAULT 0 NOT NULL,
        comments_count INT DEFAULT 0 NOT NULL,
        views_count INT DEFAULT 0 NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        video_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (user_id, video_id)
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        video_id INT NOT NULL,
        content VARCHAR(2000) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS follows (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_id, following_id)
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        logo_url VARCHAR(500) DEFAULT '',
        description VARCHAR(2000) DEFAULT '',
        website VARCHAR(300) DEFAULT '',
        industry VARCHAR(100) DEFAULT '',
        location VARCHAR(200) DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description VARCHAR(5000) NOT NULL,
        location VARCHAR(200) DEFAULT '',
        type VARCHAR(50) DEFAULT 'full-time',
        salary VARCHAR(100) DEFAULT '',
        requirements VARCHAR(3000) DEFAULT '',
        active INT DEFAULT 1 NOT NULL,
        applications_count INT DEFAULT 0 NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        user_id INT NOT NULL,
        cover_letter VARCHAR(3000) DEFAULT '',
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_application (job_id, user_id)
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user1_id INT NOT NULL,
        user2_id INT NOT NULL,
        last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_conversation (user1_id, user2_id)
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        content VARCHAR(4000) NOT NULL,
        type VARCHAR(20) DEFAULT 'text',
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        reporter_id INT NOT NULL,
        content_type VARCHAR(30) NOT NULL,
        content_id INT NOT NULL,
        reason VARCHAR(500) NOT NULL,
        resolved INT DEFAULT 0 NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        actor_id INT NOT NULL,
        type VARCHAR(30) NOT NULL,
        entity_id INT,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        blocker_id INT NOT NULL,
        blocked_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_block (blocker_id, blocked_id)
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS lives (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        status VARCHAR(10) NOT NULL DEFAULT 'live',
        viewer_count INT DEFAULT 0 NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL,
        used INT DEFAULT 0 NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("[sareso] All tables ready.");
  } finally {
    conn.release();
  }
}
