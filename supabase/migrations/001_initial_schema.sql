-- CivicMind: Complete Initial Schema, Triggers, Functions, RLS, and Seed Data
-- Designed for PostgreSQL on Supabase Cloud (Managed DB + Storage via service role only)

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. ENUMS
do $$ begin
  create type user_role as enum ('citizen', 'officer', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type issue_category as enum ('garbage','road_damage','streetlight','water_leakage','drainage','other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type priority_level as enum ('critical','high','medium','low');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type issue_status as enum ('submitted','triaged','assigned','in_progress','resolved','closed','reopened','rejected');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type report_state as enum ('received','processing','processed','failed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type agent_run_status as enum ('running','succeeded','failed','fallback');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type notification_channel as enum ('in_app','email');
exception
  when duplicate_object then null;
end $$;

-- 3. UTILITY FUNCTIONS
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 4. TABLES

-- Departments Table
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  handles_categories issue_category[] not null,
  contact_email text,
  sla_hours jsonb not null default '{"critical":24,"high":72,"medium":168,"low":336}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_departments_updated on departments;
create trigger trg_departments_updated before update on departments
  for each row execute function set_updated_at();

-- Users Table (Custom Auth with bcrypt password hash)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role user_role not null default 'citizen',
  department_id uuid references departments(id) on delete set null,
  phone text,
  email_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_users_updated on users;
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

-- Refresh Tokens Table (Hashed 64-byte tokens for custom auth)
create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_refresh_tokens_hash on refresh_tokens(token_hash);
create index if not exists idx_refresh_tokens_user on refresh_tokens(user_id);

-- Sequence for issue reference numbers
create sequence if not exists issue_ref_seq start 1;

-- Canonical Issues Table
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  category issue_category not null,
  title text not null,
  summary text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address_text text,
  department_id uuid references departments(id),
  status issue_status not null default 'submitted',
  priority priority_level not null default 'medium',
  priority_score int not null default 40 check (priority_score between 0 and 100),
  priority_reasoning text,
  severity_factors jsonb not null default '{}',
  report_count int not null default 1 check (report_count >= 1),
  primary_image_path text,
  complaint jsonb,
  sla_due_at timestamptz,
  first_reported_at timestamptz not null default now(),
  last_reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  ai_overridden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_issues_geo on issues (latitude, longitude);
create index if not exists idx_issues_open_cat on issues (category, status);
create index if not exists idx_issues_dept_priority on issues (department_id, status, priority_score desc);

drop trigger if exists trg_issues_updated on issues;
create trigger trg_issues_updated before update on issues
  for each row execute function set_updated_at();

-- Reports Table
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  issue_id uuid references issues(id) on delete set null,
  description text,
  image_path text,
  latitude double precision not null,
  longitude double precision not null,
  address_text text,
  landmark text,
  state report_state not null default 'received',
  is_duplicate boolean not null default false,
  ai_analysis jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_report_has_evidence check (description is not null or image_path is not null)
);

create index if not exists idx_reports_user on reports (user_id, created_at desc);
create index if not exists idx_reports_issue on reports (issue_id);

drop trigger if exists trg_reports_updated on reports;
create trigger trg_reports_updated before update on reports
  for each row execute function set_updated_at();

-- Status History Table
create table if not exists issue_status_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  from_status issue_status,
  to_status issue_status not null,
  note text,
  actor_type text not null check (actor_type in ('agent','officer','admin','system','citizen')),
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_status_history_issue on issue_status_history (issue_id, created_at);

-- Agent Runs Table
create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  issue_id uuid references issues(id) on delete set null,
  pipeline_run_id uuid not null,
  step_order int not null,
  agent_name text not null,
  status agent_run_status not null default 'running',
  input_summary jsonb,
  output jsonb,
  reasoning text,
  model text,
  latency_ms int,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_runs_report on agent_runs (report_id, step_order);
create index if not exists idx_agent_runs_pipeline on agent_runs (pipeline_run_id);

-- Notifications Table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  issue_id uuid references issues(id) on delete cascade,
  report_id uuid references reports(id) on delete cascade,
  channel notification_channel not null default 'in_app',
  title text not null,
  message text not null,
  is_read boolean not null default false,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications (user_id, is_read, created_at desc);

-- Officer Overrides Table
create table if not exists ai_overrides (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  officer_id uuid not null references users(id),
  field text not null check (field in ('category','priority','department')),
  old_value text not null,
  new_value text not null,
  reason text not null check (char_length(reason) >= 10),
  created_at timestamptz not null default now()
);

-- 5. GEOSPATIAL & AGENT HELPER FUNCTIONS

-- Haversine distance in metres
create or replace function haversine_m(lat1 double precision, lon1 double precision,
                                       lat2 double precision, lon2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- Nearby open issues of a category (used by the Duplicate Agent)
create or replace function find_nearby_open_issues(
  p_lat double precision, p_lng double precision, p_category issue_category,
  p_radius_m double precision, p_days int, p_limit int
) returns table (
  id uuid, reference_no text, title text, summary text, status issue_status,
  priority priority_level, report_count int, distance_m double precision,
  latitude double precision, longitude double precision, last_reported_at timestamptz
) language sql stable as $$
  select i.id, i.reference_no, i.title, i.summary, i.status, i.priority, i.report_count,
         haversine_m(p_lat, p_lng, i.latitude, i.longitude) as distance_m,
         i.latitude, i.longitude, i.last_reported_at
  from issues i
  where i.category = p_category
    and i.status not in ('closed','rejected')
    and i.last_reported_at >= now() - make_interval(days => p_days)
    and i.latitude  between p_lat - 0.05 and p_lat + 0.05
    and i.longitude between p_lng - 0.05 and p_lng + 0.05
    and haversine_m(p_lat, p_lng, i.latitude, i.longitude) <= p_radius_m
  order by distance_m asc
  limit p_limit;
$$;

-- Atomic merge helper: attach a report to an issue and bump counters
create or replace function attach_report_to_issue(p_report_id uuid, p_issue_id uuid)
returns void language plpgsql as $$
begin
  update reports set issue_id = p_issue_id, is_duplicate = true where id = p_report_id;
  update issues set report_count = report_count + 1, last_reported_at = now() where id = p_issue_id;
end; $$;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Amendment A: Keep RLS enabled on all tables with NO policies (deny-all for direct anon access).
-- Delete every policy and helper that uses auth.uid().
-- All authorization is enforced in Express middleware (deny by default).

alter table users enable row level security;
alter table refresh_tokens enable row level security;
alter table departments enable row level security;
alter table issues enable row level security;
alter table reports enable row level security;
alter table issue_status_history enable row level security;
alter table agent_runs enable row level security;
alter table notifications enable row level security;
alter table ai_overrides enable row level security;

-- 7. SEED DEPARTMENTS
insert into departments (code, name, description, handles_categories, contact_email) values
('SWM','Solid Waste Management','Garbage collection, bin overflow, illegal dumping, street sweeping','{garbage}','swm@city.example'),
('RPW','Roads & Public Works','Potholes, road cracks, broken pavements, road restoration','{road_damage}','roads@city.example'),
('ESL','Electrical & Street Lighting','Streetlight installation, repair and exposed street wiring','{streetlight}','lighting@city.example'),
('WSB','Water Supply & Sewerage Board','Water mains, pipe leaks, burst pipes, supply disruptions','{water_leakage}','water@city.example'),
('DSW','Drainage & Storm Water','Blocked drains, sewer overflow, waterlogging, culvert cleaning','{drainage}','drainage@city.example'),
('GGC','General Grievance Cell','Triage for unclassified or ambiguous civic complaints','{other}','grievance@city.example')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  handles_categories = excluded.handles_categories,
  contact_email = excluded.contact_email;

-- 8. STORAGE BUCKET HELPER (Supabase Storage)
insert into storage.buckets (id, name, public)
values ('issue-images', 'issue-images', false)
on conflict (id) do nothing;
