--- ===========================================
--- Add auth_user_id column to users table
--- ===========================================
alter table public.users
add column if not exists auth_user_id uuid;

create unique index if not exists users_auth_user_id_unique
on public.users (auth_user_id)
where auth_user_id is not null;

alter table public.users
add constraint users_auth_user_id_fkey
foreign key (auth_user_id)
references auth.users(id)
on delete set null;
