-- Play Entertainment Platform - Neon Serverless PostgreSQL Schema
-- Database: neondb (AWS us-east-2)

CREATE TABLE IF NOT EXISTS play_projects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(32) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  platform VARCHAR(64) DEFAULT 'web',
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_saves (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  game_id VARCHAR(128) NOT NULL,
  console VARCHAR(32) NOT NULL,
  save_type VARCHAR(16) NOT NULL,
  save_data TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_game_saves UNIQUE (user_id, game_id, save_type)
);

CREATE TABLE IF NOT EXISTS play_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  status_text VARCHAR(255),
  library_ids JSONB DEFAULT '[]'::jsonb,
  wishlist_ids JSONB DEFAULT '[]'::jsonb,
  cart_ids JSONB DEFAULT '[]'::jsonb,
  fast_launch_ids JSONB DEFAULT '[]'::jsonb,
  streaming_list_ids JSONB DEFAULT '[]'::jsonb,
  streaming_liked_ids JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streaming_watch_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title_id VARCHAR(128) NOT NULL,
  episode_id VARCHAR(128) NOT NULL DEFAULT '',
  current_time_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_user_watch_progress UNIQUE (user_id, title_id, episode_id)
);

CREATE TABLE IF NOT EXISTS play_games_catalog (
  id VARCHAR(128) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  console VARCHAR(32) NOT NULL,
  category VARCHAR(64) NOT NULL,
  release_year INTEGER NOT NULL,
  developer VARCHAR(128),
  rating NUMERIC(3,1),
  size_gb NUMERIC(6,2),
  rom_filename VARCHAR(255),
  short_tagline TEXT,
  is_hero_featured BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS play_streaming_catalog (
  id VARCHAR(128) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  year INTEGER NOT NULL,
  maturity VARCHAR(16),
  rating NUMERIC(3,1),
  quality VARCHAR(32),
  synopsis TEXT,
  hero_image TEXT,
  card_image TEXT,
  duration_label VARCHAR(64),
  is_hero_featured BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
