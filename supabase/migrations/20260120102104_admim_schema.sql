-- =====================================================
-- Extensions
-- =====================================================
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- =====================================================
-- Companies
-- =====================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  max_users int default 250,
  created_at timestamp with time zone default now()
);

-- =====================================================
-- Users (extends auth.users)
-- =====================================================
create table users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  email text unique not null,
  phone text,
  role text check (role in ('ADMIN', 'EMPLOYEE')) not null default 'EMPLOYEE',
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- =====================================================
-- Vehicles
-- =====================================================
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  vehicle_number text not null,
  vehicle_type text,
  is_active boolean default true
);

create index idx_vehicles_company on vehicles(company_id);

-- =====================================================
-- Trips (one per user per day)
-- =====================================================
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  vehicle_id uuid references vehicles(id),
  trip_date date not null,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  start_km int,
  end_km int,
  start_location geography(point, 4326),
  end_location geography(point, 4326),
  status text check (status in ('STARTED', 'ENDED')) default 'STARTED',
  created_at timestamp with time zone default now(),

  constraint unique_user_trip_per_day unique (user_id, trip_date)
);

create index idx_trips_user on trips(user_id);
create index idx_trips_date on trips(trip_date);

-- =====================================================
-- Work Sessions
-- =====================================================
create table work_sessions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  location geography(point, 4326),
  notes text
);

create index idx_work_sessions_trip on work_sessions(trip_id);

-- =====================================================
-- Vehicle Photos
-- =====================================================
create table vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  photo_type text check (
    photo_type in ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'KM_METER')
  ) not null,
  photo_url text not null,
  taken_at timestamp with time zone default now()
);

-- =====================================================
-- Receipts
-- =====================================================
create table receipts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  amount numeric(10,2),
  description text,
  receipt_url text not null,
  created_at timestamp with time zone default now()
);

-- =====================================================
-- Accident Reports
-- =====================================================
create table accident_reports (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  description text not null,
  photo_url text,
  location geography(point, 4326),
  reported_at timestamp with time zone default now()
);

-- =====================================================
-- GPS Logs (Optional)
-- =====================================================
create table gps_logs (
  id bigserial primary key,
  trip_id uuid references trips(id) on delete cascade,
  latitude decimal(9,6),
  longitude decimal(9,6),
  recorded_at timestamp with time zone default now()
);

create index idx_gps_logs_trip on gps_logs(trip_id);