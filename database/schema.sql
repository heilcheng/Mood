-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users,
  display_name text,
  avatar_choice text default 'farmer_girl',
  created_at timestamptz default now()
);

-- journal_entries
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  text text not null,
  mood text not null,
  confidence numeric,
  tags text[],
  short_prompt text
);

-- garden_state
create table if not exists garden_state (
  user_id uuid primary key references auth.users,
  last_active timestamptz default now(),
  streak int default 0,
  weather_state text default 'sunshine',
  unlocked_items text[] default '{}',
  growth_boost_until timestamptz
);

-- plants
create table if not exists plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  tile_x int not null,
  tile_y int not null,
  plant_type text not null,
  stage int default 0,
  planted_at timestamptz default now(),
  last_updated timestamptz default now()
);

-- quests
create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  quest_key text not null,
  status text default 'active',
  progress int default 0,
  updated_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
create policy if not exists "own_profiles" on profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table journal_entries enable row level security;
create policy if not exists "own_journal" on journal_entries
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table garden_state enable row level security;
create policy if not exists "own_garden" on garden_state
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table plants enable row level security;
create policy if not exists "own_plants" on plants
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table quests enable row level security;
create policy if not exists "own_quests" on quests
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
