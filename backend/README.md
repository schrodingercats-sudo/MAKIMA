# Makima Interactive Fan Art Gallery — Backend & Architecture Specification

This repository contains the backend database migrations, serverless Redis caching utilities, Supabase image storage configuration, seed data migration scripts, and Firebase FCM notification setup for the **Makima Interactive Fan Art Gallery**.

---

## 1. Architecture Overview

```
                                +---------------------------+
                                |    React Frontend App     |
                                |  (Vite + Framer Motion)   |
                                +-------------+-------------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
                     v                        v                        v
        +-------------------------+  +------------------+  +-----------------------+
        |   Supabase Database     |  |  Upstash Redis   |  | Firebase FCM Service  |
        | (PostgreSQL + Realtime) |  | (REST TTL Cache) |  |   (Push Notifications)|
        +-------------------------+  +------------------+  +-----------------------+
        | - Profiles (Users)      |  | - cache:trending |  | - Webpush / Background|
        | - Artworks (FTS GIN)    |  | - cache:profile  |  | - Token registration  |
        | - Likes & Bookmarks     |  | - ratelimit      |  | - Service Worker      |
        | - Comments & Follows    |  +------------------+  +-----------------------+
        | - Storage (artworks/    |
        |   avatars buckets)      |
        +-------------------------+
```

---

## 2. Environment Variables Specification (`.env`)

Create or verify the `.env` file in the project root with the following variables:

```ini
# -----------------------------------------------------------------------------
# Supabase Configuration
# -----------------------------------------------------------------------------
# Public Supabase Project API URL
VITE_SUPABASE_URL=https://enrrsnbfushieufmqmuq.supabase.co

# Public Supabase Anonymous Key (safe for client-side bundle)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Privileged Supabase Service Role Key (used ONLY for server-side / seed scripts)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# -----------------------------------------------------------------------------
# Upstash Redis Configuration (HTTP REST API)
# -----------------------------------------------------------------------------
# Upstash Redis REST URL endpoint
UPSTASH_REDIS_REST_URL=https://amusing-sponge-41172.upstash.io

# Upstash Redis REST Authentication Token
UPSTASH_REDIS_REST_TOKEN=AaDUAAIgcDE2OGE1OWZhZTI0MDY0ZWUxOGY3NmM4YjEyZDJkMTY5ZA

# -----------------------------------------------------------------------------
# Firebase Cloud Messaging (FCM) Configuration
# -----------------------------------------------------------------------------
VITE_FIREBASE_API_KEY=AIzaSyDXa7OMlqUwiWxkwLq_6_B7A1ZJAWQPqkM
VITE_FIREBASE_AUTH_DOMAIN=artist-gallery-193c5.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=artist-gallery-193c5
VITE_FIREBASE_STORAGE_BUCKET=artist-gallery-193c5.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=50268171435
VITE_FIREBASE_APP_ID=1:50268171435:web:775545056c062d30d35bee
VITE_FIREBASE_MEASUREMENT_ID=G-LP3J8RBHZT
```

---

## 3. Supabase Setup & Database Migration

### 3.1 Initial Schema Migration
Execute `backend/migrations/001_initial_schema.sql` in the **Supabase Dashboard -> SQL Editor**. This script creates:
1. `public.profiles`: User profile extension table with handle, avatar, bio, and social links.
2. `public.artworks`: Artwork records with full-text search (`search_vector` TSVECTOR GIN index).
3. `public.likes` & `public.bookmarks`: Unique user-artwork relations with automatic trigger counter updates.
4. `public.comments`: Threaded comments table.
5. `public.follows`: Follower-following social graph table with `cant_follow_self` constraint.
6. `public.notifications` & `public.fcm_tokens`: Notification queue and browser push tokens.
7. Database Triggers & Security Definer Functions:
   - `handle_new_user()`: Automatic profile creation when a user signs up.
   - `update_artwork_likes_count()`: Automatic like count increment/decrement.
   - `update_artwork_saves_count()`: Automatic save count increment/decrement.
   - `create_notification_on_activity()`: Trigger notifications on likes, comments, and follows.

### 3.2 Storage Buckets Setup
The application requires two public storage buckets:
- `artworks`: Max file size 15MB. MIME types: PNG, JPG, WEBP, GIF.
- `avatars`: Max file size 5MB. MIME types: PNG, JPG, WEBP.

These buckets are automatically created and set to public by running the seed script.

---

## 4. Upstash Redis Caching Strategy

The Redis caching layer is implemented in `src/lib/redis.js` using `@upstash/redis`.

### 4.1 TTL Caching Matrix
| Cache Key Pattern | TTL (Seconds) | Description | Invalidation Event |
|---|---|---|---|
| `cache:trending` | 300 (5 mins) | Trending & default homepage artwork feed | New artwork uploaded |
| `cache:profile:{userId}` | 600 (10 mins) | User profile details & stats | Profile update |
| `cache:search:{query}` | 120 (2 mins) | Cached search query results | TTL Expiry |

### 4.2 Rate Limiting Sliding Window
Action rate limiting is enforced via `checkActionRateLimit(userId, actionType, maxLimit, windowSeconds)`.
- Default: Max 30 like/save/comment/follow actions per minute per user.
- Prevents API spamming while keeping responsive client-side UI feedback.

---

## 5. Firebase Cloud Messaging (FCM) & Push Notifications

- **Service Worker Location**: `public/firebase-messaging-sw.js` and `dist/firebase-messaging-sw.js`.
- **Foreground Notifications**: Handled in `src/lib/notifications.js` via `requestNotificationPermission()` and `onMessageListener()`.
- **Token Registration**: Device push tokens are stored in `public.fcm_tokens` table upon browser permission grant.

---

## 6. Seed Migration Script & Execution

To populate the database and Supabase Storage with mock artists, artwork files, blurhash placeholders, initial comments, likes, and follows:

```bash
# Option 1: Direct backend script execution
node backend/scripts/seed.js

# Option 2: Forwarding script execution
node scripts/seed-supabase.js
```

What the seed script performs:
1. Parses `.env` for Supabase credentials.
2. Creates `artworks` and `avatars` public storage buckets.
3. Uploads local images from `public/images/` and root to Supabase Storage.
4. Generates 20x20px base64 blurhash placeholders using `sharp`.
5. Creates/upserts 7 artist user profiles in `public.profiles`.
6. Populates 25+ artwork records in `public.artworks`.
7. Inserts initial comments, likes, and follows into Supabase tables.

---

## 7. Verification & Build Commands

Confirm compilation and zero-warning build output:

```bash
npm run build
```
