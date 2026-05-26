create extension if not exists pgcrypto;

create type use_type as enum ('track', 'race', 'street', 'mixed');
create type part_side as enum ('left', 'right', 'front', 'rear', 'universal', 'unknown');
create type safety_category as enum ('green', 'yellow', 'red', 'source_only');
create type availability_status as enum ('lend', 'sell', 'trade', 'emergency_only', 'private');
create type inventory_visibility as enum ('public_at_event', 'on_request', 'private', 'friends_team');
create type request_urgency as enum ('session_critical', 'today', 'low');
create type request_status as enum ('open', 'pending', 'resolved', 'cancelled');
create type request_type as enum ('borrow', 'buy', 'trade', 'help');
create type response_type as enum ('have_this', 'may_fit', 'have_tools', 'vendor_has_one', 'do_not_ride');
create type printable_file_type as enum ('stl', 'step', 'cad', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  home_track text,
  profile_photo text,
  trust_rating numeric,
  created_at timestamptz not null default now()
);

create table public.bikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  year int not null,
  make text not null,
  model text not null,
  nickname text,
  use_type use_type not null default 'track',
  notes text not null default '',
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.installed_parts (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes(id) on delete cascade,
  name text not null,
  category text not null,
  brand text,
  part_number text,
  side part_side not null default 'universal',
  compatibility_tags text[] not null default '{}',
  notes text not null default '',
  photos text[] not null default '{}',
  safety_category safety_category not null default 'yellow',
  fitment_attributes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.spare_parts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  brand text,
  part_number text,
  quantity int not null default 1,
  condition text not null default '',
  side part_side not null default 'universal',
  compatibility_tags text[] not null default '{}',
  availability_status availability_status not null default 'private',
  price numeric,
  deposit_required text,
  notes text not null default '',
  photos text[] not null default '{}',
  safety_category safety_category not null default 'yellow',
  visibility inventory_visibility not null default 'private',
  visible_at_events uuid[] not null default '{}',
  fitment_attributes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.track_events (
  id uuid primary key default gen_random_uuid(),
  track_name text not null,
  organizer text,
  start_date date not null,
  end_date date not null,
  location text,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.event_check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.track_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  paddock_location text,
  visible_inventory_enabled boolean not null default false,
  checked_in_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.part_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.track_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  bike_id uuid references public.bikes(id) on delete set null,
  title text not null,
  part_needed text not null,
  category text not null,
  urgency request_urgency not null default 'today',
  side part_side not null default 'unknown',
  description text not null default '',
  photos text[] not null default '{}',
  compatibility_tags text[] not null default '{}',
  status request_status not null default 'open',
  request_type request_type not null default 'help',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.request_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.part_requests(id) on delete cascade,
  responder_user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  offered_spare_part_id uuid references public.spare_parts(id) on delete set null,
  response_type response_type not null default 'may_fit',
  created_at timestamptz not null default now()
);

create table public.printable_files (
  id uuid primary key default gen_random_uuid(),
  part_id uuid references public.spare_parts(id) on delete cascade,
  file_url text not null,
  file_type printable_file_type not null,
  material text,
  print_time_estimate text,
  printer_requirements text,
  notes text not null default '',
  safety_category safety_category not null default 'yellow',
  version text not null default '1.0',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.bikes enable row level security;
alter table public.installed_parts enable row level security;
alter table public.spare_parts enable row level security;
alter table public.track_events enable row level security;
alter table public.event_check_ins enable row level security;
alter table public.part_requests enable row level security;
alter table public.request_responses enable row level security;
alter table public.printable_files enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
create policy "profiles own write" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "bikes owner crud" on public.bikes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "installed part owner crud" on public.installed_parts for all
using (exists (select 1 from public.bikes b where b.id = bike_id and b.user_id = auth.uid()))
with check (exists (select 1 from public.bikes b where b.id = bike_id and b.user_id = auth.uid()));

create policy "events readable" on public.track_events for select using (true);
create policy "events authenticated insert" on public.track_events for insert with check (auth.uid() is not null);

create policy "checkins event readable" on public.event_check_ins for select using (
  exists (
    select 1 from public.event_check_ins mine
    where mine.event_id = public.event_check_ins.event_id
      and mine.user_id = auth.uid()
  )
);
create policy "checkins own crud" on public.event_check_ins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "spares owner crud" on public.spare_parts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "event visible spares readable" on public.spare_parts for select using (
  visibility = 'public_at_event'
  and exists (
    select 1 from public.event_check_ins ci
    where ci.user_id = auth.uid()
    and ci.visible_inventory_enabled = true
    and ci.event_id = any(visible_at_events)
  )
);

create policy "requests event readable" on public.part_requests for select using (
  exists (select 1 from public.event_check_ins ci where ci.event_id = part_requests.event_id and ci.user_id = auth.uid())
);
create policy "requests owner insert" on public.part_requests for insert with check (auth.uid() = user_id);
create policy "requests owner update" on public.part_requests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "responses event readable" on public.request_responses for select using (
  exists (
    select 1 from public.part_requests pr
    join public.event_check_ins ci on ci.event_id = pr.event_id
    where pr.id = request_id and ci.user_id = auth.uid()
  )
);
create policy "responses authenticated insert" on public.request_responses for insert with check (auth.uid() = responder_user_id);

create policy "printable owner crud" on public.printable_files for all
using (exists (select 1 from public.spare_parts sp where sp.id = part_id and sp.user_id = auth.uid()))
with check (exists (select 1 from public.spare_parts sp where sp.id = part_id and sp.user_id = auth.uid()));
