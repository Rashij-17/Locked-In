-- ============================================================
-- LOCKED IN — Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================

-- User settings / profile
CREATE TABLE user_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme       TEXT DEFAULT 'sand',
  focus_mins  INT DEFAULT 25,
  short_break INT DEFAULT 5,
  long_break  INT DEFAULT 15,
  long_interval INT DEFAULT 4,
  auto_start  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Tags
CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color_slot TEXT NOT NULL DEFAULT 'mint',
  icon       TEXT NOT NULL DEFAULT 'tag',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  due_date    DATE,
  start_time  TIME,
  end_time    TIME,
  priority    TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  completed   BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  tag_id      UUID REFERENCES tags(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Focus sessions log
CREATE TABLE focus_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
  started_at  TIMESTAMPTZ NOT NULL,
  ended_at    TIMESTAMPTZ,
  duration_sec INT,
  completed   BOOLEAN DEFAULT false,
  type        TEXT DEFAULT 'focus' CHECK (type IN ('focus','short_break','long_break'))
);

-- Row Level Security on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users see only their own data)
CREATE POLICY "Own data" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON focus_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Default tags (inserted via application code after signup)
-- See src/types/index.ts DEFAULT_TAGS

-- ============================================================
-- Web Push Subscriptions
-- Stores one row per device per user for background notifications.
-- ============================================================

CREATE TABLE push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  timezone      TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  reminder_mins INT  NOT NULL DEFAULT 15,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own push subscriptions"
  ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Tracks which push notifications have been sent recently
-- (prevents duplicate pushes within a 30-minute window)
CREATE TABLE push_notifications_sent (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES tasks(id) ON DELETE CASCADE,
  sent_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_notifications_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only"
  ON push_notifications_sent FOR ALL
  USING (true);  -- Edge Function uses service role key, bypasses RLS

-- Index for fast dedup lookup
CREATE INDEX idx_push_sent_lookup
  ON push_notifications_sent(subscription_id, task_id, sent_at);

