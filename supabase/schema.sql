-- DimV Community: schema fondasi
-- Jalankan di Supabase Dashboard > SQL Editor setelah meninjau SQL ini.
-- Tidak membuat akun Owner secara otomatis. Owner harus ditetapkan secara tepercaya setelah autentikasi.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique,
  display_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('member','vip','admin','owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_code text not null,
  status text not null default 'active' check (status in ('active','expired','cancelled','pending')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  source text not null default 'manual' check (source in ('manual','payment','promo')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null default '',
  product_type text not null check (product_type in ('membership','token_pack','digital_product','service')),
  price_idr bigint not null default 0 check (price_idr >= 0),
  duration_days integer check (duration_days is null or duration_days > 0),
  token_amount integer not null default 0 check (token_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  promo_type text not null check (promo_type in ('percent_discount','fixed_discount','bonus_tokens','bonus_limit','bonus_membership')),
  value numeric not null default 0 check (value >= 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint promo_dates_valid check (expires_at > starts_at)
);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_id uuid not null references public.promo_codes(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  reward jsonb not null default '{}'::jsonb
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  amount_idr bigint not null check (amount_idr >= 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  payment_provider text,
  provider_reference text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.token_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool_code text not null,
  status text not null default 'recorded' check (status in ('recorded','success','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists memberships_user_status_idx on public.memberships(user_id, status, expires_at);
create index if not exists promo_codes_active_expiry_idx on public.promo_codes(is_active, starts_at, expires_at);
create index if not exists promo_redemptions_user_idx on public.promo_redemptions(user_id, promo_id);
create index if not exists transactions_user_created_idx on public.transactions(user_id, created_at desc);
create index if not exists usage_logs_user_created_idx on public.usage_logs(user_id, created_at desc);

-- Automatically create a basic profile when a new Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, discord_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'provider_id'
  )
  on conflict (id) do nothing;
  insert into public.token_wallets (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_dimv on auth.users;
create trigger on_auth_user_created_dimv
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep RLS enabled. Users may read/update only safe fields of their own profile.
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.products enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;
alter table public.transactions enable row level security;
alter table public.token_wallets enable row level security;
alter table public.usage_logs enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
for select to authenticated using (auth.uid() = id);

-- Deliberately no client update policy for profiles.role; role changes must be trusted server-side.
drop policy if exists "memberships select own" on public.memberships;
create policy "memberships select own" on public.memberships
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "products read active" on public.products;
create policy "products read active" on public.products
for select to anon, authenticated using (is_active = true);

drop policy if exists "promo codes are not publicly readable" on public.promo_codes;
-- No public SELECT policy: promo validation/redemption must happen in a server-side function.

drop policy if exists "promo redemptions select own" on public.promo_redemptions;
create policy "promo redemptions select own" on public.promo_redemptions
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "transactions select own" on public.transactions;
create policy "transactions select own" on public.transactions
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "wallet select own" on public.token_wallets;
create policy "wallet select own" on public.token_wallets
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "usage logs select own" on public.usage_logs;
create policy "usage logs select own" on public.usage_logs
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read" on public.site_settings
for select to anon, authenticated using (true);

-- IMPORTANT:
-- 1. Never expose Supabase service_role key in frontend or Netlify VITE_ variables.
-- 2. Do not let users update their own role, token balance, membership, transaction status, or promo counters.
-- 3. Implement promo redemption and payment fulfillment in trusted server-side functions with transactions/locking.
-- 4. Establish the first owner through a controlled SQL operation after the account exists, then remove SQL editor access as appropriate.
