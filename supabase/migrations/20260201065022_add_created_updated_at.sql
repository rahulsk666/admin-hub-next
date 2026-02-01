-- =====================================================
-- Add created_at & updated_at columns
-- =====================================================

alter table companies
  add column if not exists updated_at timestamptz default now();

alter table users
  add column if not exists updated_at timestamptz default now();

alter table vehicles
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table trips
  add column if not exists updated_at timestamptz default now();

alter table work_sessions
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table vehicle_photos
  add column if not exists updated_at timestamptz default now();

alter table receipts
  add column if not exists updated_at timestamptz default now();

alter table accident_reports
  add column if not exists updated_at timestamptz default now();

alter table gps_logs
  add column if not exists updated_at timestamptz default now();