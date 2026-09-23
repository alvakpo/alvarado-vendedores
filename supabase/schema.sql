-- ============================================
-- ALVARADO VENDEDORES - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Event configuration
CREATE TABLE IF NOT EXISTS event_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'Alvarado Vendedores',
  total_tickets INTEGER NOT NULL DEFAULT 500,
  ticket_price INTEGER NOT NULL DEFAULT 10000,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default event config
INSERT INTO event_config (id, name, total_tickets, ticket_price, status)
VALUES (1, 'Alvarado Vendedores', 500, 10000, 'open')
ON CONFLICT (id) DO NOTHING;

-- Users (admin + vendors)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendor' CHECK (role IN ('admin', 'vendor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants (vendors + puntos de venta)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  participant_type TEXT NOT NULL DEFAULT 'vendor' CHECK (participant_type IN ('vendor', 'punto_venta')),
  photo_url TEXT,
  tickets_assigned INTEGER NOT NULL DEFAULT 0 CHECK (tickets_assigned >= 0),
  tickets_sold INTEGER NOT NULL DEFAULT 0 CHECK (tickets_sold >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sold_lte_assigned CHECK (tickets_sold <= tickets_assigned)
);

-- History / audit log
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin user (password: alvaradomdp hashed)
-- NOTE: The actual admin user is created via seed script using bcrypt
-- This is a placeholder; run the seed API route after deployment

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_sort_order ON participants(sort_order);
CREATE INDEX IF NOT EXISTS idx_history_participant ON history(participant_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled ON scheduled_notifications(scheduled_for) WHERE sent = FALSE AND cancelled = FALSE;

-- RLS Policies (disable RLS since we use server-side service role)
ALTER TABLE event_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE history DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications DISABLE ROW LEVEL SECURITY;
