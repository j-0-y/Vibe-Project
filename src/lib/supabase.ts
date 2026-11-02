import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export const PERMANENT_SUPABASE_URL = "https://pjmetesiswnoahwpknlg.supabase.co";
export const PERMANENT_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbWV0ZXNpc3dub2Fod3BrbmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MDA3OTgsImV4cCI6MjEwOTE3Njc5OH0.PwKAWoifw8rnSWlCC5FhDSnOar6uyzr71_kHxl__t4w";

export function getSupabaseCredentials(): { url: string; key: string } {
  // 1. Env vars (supports both VITE_ and NEXT_PUBLIC_ prefixes)
  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const envUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
  const envKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (envUrl && envKey) return { url: envUrl, key: envKey };

  // 2. Settings saved in localStorage (if overridden)
  try {
    const raw = localStorage.getItem("bag_shop_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.settings?.supabase?.url && parsed?.settings?.supabase?.anonKey) {
        return {
          url: parsed.settings.supabase.url,
          key: parsed.settings.supabase.anonKey,
        };
      }
    }
  } catch {}

  // 3. Permanent project credentials
  return {
    url: PERMANENT_SUPABASE_URL,
    key: PERMANENT_SUPABASE_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  try {
    const { url, key } = getSupabaseCredentials();
    if (!url || !key) {
      client = null;
      return null;
    }
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  } catch {
    client = null;
    return null;
  }
}

export function resetSupabaseClient() {
  client = undefined;
}

/**
 * Complete, ready-to-paste SQL schema for Supabase SQL Editor.
 * Non-technical user can copy this in 1 click and run it in Supabase!
 */
export const SUPABASE_SQL_SCHEMA = `-- 🛍️ BagBox SaaS - Supabase Database Schema
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run

-- 1. Profiles Table (roles: admin, owner, staff)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'staff' check (role in ('admin', 'owner', 'staff')),
  shop_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Shops Table (1 row per shop, stores JSONB data)
create table if not exists public.shops (
  id text primary key,
  owner_id uuid references auth.users,
  data jsonb default '{"products":[],"orders":[],"moves":[],"ads":[],"notifs":[],"settings":{},"salesDay":null,"salesDays":[],"monthAds":[]}'::jsonb,
  updated_at bigint default 0,
  by_whom text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Shop Events Table (Steadfast webhook queue & tracking logs)
create table if not exists public.shop_events (
  id bigserial primary key,
  shop_id text not null,
  owner_id uuid,
  notification_type text,
  invoice text,
  consignment_id text,
  status text,
  cod_amount numeric default 0,
  delivery_charge numeric default 0,
  tracking_message text,
  provider_updated_at text,
  data jsonb,
  ts bigint default extract(epoch from now()) * 1000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Clean Permissions (No recursion, allows anon sync)
drop policy if exists "Allow users to view own profile or same shop members" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Allow members to read their shop" on public.shops;
drop policy if exists "Allow members to update their shop" on public.shops;
drop policy if exists "Allow owner to insert shop" on public.shops;
drop policy if exists "Allow read and write for shops" on public.shops;
drop policy if exists "Allow members to read shop events" on public.shop_events;
drop policy if exists "Allow service_role or team to manage events" on public.shop_events;

alter table public.profiles disable row level security;
alter table public.shops disable row level security;
alter table public.shop_events disable row level security;

-- 8. Enable Realtime Replication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.shops;
alter publication supabase_realtime add table public.shop_events;
`;
