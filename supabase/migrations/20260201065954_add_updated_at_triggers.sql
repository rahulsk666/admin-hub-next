-- =====================================================
-- updated_at trigger function
-- =====================================================

create or replace function public.fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- Triggers (drop + recreate for safety)
-- =====================================================

-- Companies
drop trigger if exists trg_companies_updated_at on companies;
create trigger trg_companies_updated_at
before update on companies
for each row
execute function public.fn_set_updated_at();

-- Users
drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row
execute function public.fn_set_updated_at();

-- Vehicles
drop trigger if exists trg_vehicles_updated_at on vehicles;
create trigger trg_vehicles_updated_at
before update on vehicles
for each row
execute function public.fn_set_updated_at();

-- Trips
drop trigger if exists trg_trips_updated_at on trips;
create trigger trg_trips_updated_at
before update on trips
for each row
execute function public.fn_set_updated_at();

-- Work Sessions
drop trigger if exists trg_work_sessions_updated_at on work_sessions;
create trigger trg_work_sessions_updated_at
before update on work_sessions
for each row
execute function public.fn_set_updated_at();

-- Vehicle Photos
drop trigger if exists trg_vehicle_photos_updated_at on vehicle_photos;
create trigger trg_vehicle_photos_updated_at
before update on vehicle_photos
for each row
execute function public.fn_set_updated_at();

-- Receipts
drop trigger if exists trg_receipts_updated_at on receipts;
create trigger trg_receipts_updated_at
before update on receipts
for each row
execute function public.fn_set_updated_at();

-- Accident Reports
drop trigger if exists trg_accident_reports_updated_at on accident_reports;
create trigger trg_accident_reports_updated_at
before update on accident_reports
for each row
execute function public.fn_set_updated_at();

-- GPS Logs
drop trigger if exists trg_gps_logs_updated_at on gps_logs;
create trigger trg_gps_logs_updated_at
before update on gps_logs
for each row
execute function public.fn_set_updated_at();
