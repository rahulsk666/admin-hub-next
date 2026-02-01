--- ===========================================
--- Add image_url column to vehicles table
--- ===========================================

alter table vehicles
add column if not exists image_url text;