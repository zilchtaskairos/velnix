-- ============================================================================
-- Velnix — Database schema (reference design)
-- ----------------------------------------------------------------------------
-- Velnix's prototype runs on localStorage for personal/social state so it works
-- with zero infra. This schema is the production target: a relational model for
-- users, social, library, watch history, Claire, Party, Premium and providers.
-- Migrations + an ORM (Prisma/Drizzle) and a real DB (Postgres) slot in here.
-- Anime & manga METADATA is intentionally NOT duplicated — it is always fetched
-- from AniList by id. Only Velnix-owned relational data is stored.
-- ============================================================================

-- ---------- Users & identity ----------
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         CITEXT UNIQUE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  password_hash TEXT,                  -- NULL for OAuth-only accounts
  role          TEXT NOT NULL DEFAULT 'user',  -- user | admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  user_id         BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio             TEXT,
  avatar_color    TEXT,
  avatar_url      TEXT,
  background_url  TEXT,
  privacy         TEXT NOT NULL DEFAULT 'public', -- public | private
  watch_minutes   INTEGER NOT NULL DEFAULT 0,
  favorite_genres TEXT[],
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Library & history ----------
CREATE TABLE library_entries (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind              TEXT NOT NULL,            -- anime | manga
  media_id          BIGINT NOT NULL,          -- AniList id
  status            TEXT NOT NULL,            -- watching|completed|planned|paused|dropped
  episodes_watched  INTEGER DEFAULT 0,
  chapters_read     INTEGER DEFAULT 0,
  rating            SMALLINT,                 -- 0-10
  favorite          BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, media_id)
);

CREATE TABLE watch_history (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id    BIGINT NOT NULL,
  episode     INTEGER NOT NULL,
  position_s  INTEGER NOT NULL DEFAULT 0,   -- playback position (seconds)
  duration_s  INTEGER,
  watched     BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id, episode)
);

-- ---------- Pulse (social feed) ----------
CREATE TABLE pulse_posts (
  id          BIGSERIAL PRIMARY KEY,
  author_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT,
  image_url   TEXT,
  media_id    BIGINT,                        -- tagged anime
  tags        TEXT[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE comments (
  id          BIGSERIAL PRIMARY KEY,
  post_id     BIGINT REFERENCES pulse_posts(id) ON DELETE CASCADE,
  media_id    BIGINT,                        -- optional: episode discussion
  episode     INTEGER,
  author_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE likes (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target  TEXT NOT NULL,                      -- post | comment
  ref_id  BIGINT NOT NULL,
  PRIMARY KEY (user_id, target, ref_id)
);
CREATE TABLE follows (
  follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);

-- ---------- DMs ----------
CREATE TABLE dm_conversations (
  id        BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE dm_members (
  conversation_id BIGINT NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname        TEXT,
  theme_color     TEXT,
  PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE dm_messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL DEFAULT 'text', -- text|anime|manga|post|sticker|voice
  body            TEXT,
  ref_id          BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Claire AI ----------
CREATE TABLE claire_conversations (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE claire_messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES claire_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,            -- user | claire
  content         TEXT,
  cards           JSONB,                    -- recommended media ids + reasons
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Party (watch together) ----------
CREATE TABLE parties (
  id         BIGSERIAL PRIMARY KEY,
  host_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id   BIGINT NOT NULL,
  episode    INTEGER NOT NULL,
  code       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE party_members (
  party_id BIGINT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (party_id, user_id)
);

-- ---------- Premium / subscriptions ----------
CREATE TABLE subscriptions (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan               TEXT NOT NULL,            -- monthly | annual
  status             TEXT NOT NULL,            -- active | canceled | past_due | trialing
  provider           TEXT NOT NULL,            -- stripe | revenuecat | ...
  provider_sub_id    TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE promo_codes (
  code        TEXT PRIMARY KEY,
  days        INTEGER NOT NULL,
  max_redemptions INTEGER,
  redemptions INTEGER NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ
);

-- ---------- Notifications ----------
CREATE TABLE notifications (
  id      BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type    TEXT NOT NULL,   -- episode|friend|dm|pulse|comment|party|claire|manga|premium
  title   TEXT NOT NULL,
  body    TEXT,
  href    TEXT,
  read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Games ----------
CREATE TABLE games (id BIGSERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, tag TEXT, official_url TEXT);
CREATE TABLE game_accounts (
  user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id  BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  username TEXT,
  connected BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, game_id)
);

-- ---------- Providers (source resolver registry) ----------
CREATE TABLE providers (
  id        TEXT PRIMARY KEY,            -- matches src/providers/*.ts ids
  label     TEXT NOT NULL,
  enabled   BOOLEAN NOT NULL DEFAULT false,
  priority  INTEGER NOT NULL DEFAULT 100
);
CREATE TABLE provider_sources (
  id          BIGSERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  media_id    BIGINT NOT NULL,
  episode     INTEGER,
  url         TEXT NOT NULL,
  type        TEXT NOT NULL,              -- hls|mp4|dash|webm
  quality     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Admin / moderation ----------
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id BIGINT REFERENCES users(id),
  target TEXT NOT NULL,          -- post|comment|dm|user
  ref_id BIGINT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX idx_watch_history_user ON watch_history(user_id, updated_at DESC);
CREATE INDEX idx_pulse_author ON pulse_posts(author_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
