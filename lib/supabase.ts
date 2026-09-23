import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabaseAdmin: SupabaseClient | null = null;
let _supabase: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Supabase environment variables are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
    _supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _supabaseAdmin;
}

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase environment variables are not configured.");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Convenience exports using lazy getters
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") return val.bind(client);
    return val;
  },
});

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") return val.bind(client);
    return val;
  },
});

export type EventConfig = {
  id: number;
  name: string;
  total_tickets: number;
  ticket_price: number;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  username: string;
  password_hash: string;
  role: "admin" | "vendor";
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  participant_type: "vendor" | "punto_venta";
  photo_url: string | null;
  tickets_assigned: number;
  tickets_sold: number;
  status: "active" | "inactive";
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type HistoryEntry = {
  id: string;
  participant_id: string;
  changed_by: string | null;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
  created_at: string;
};

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
};

export type ScheduledNotification = {
  id: string;
  title: string;
  message: string;
  scheduled_for: string;
  sent: boolean;
  sent_at: string | null;
  cancelled: boolean;
  created_by: string | null;
  created_at: string;
};
