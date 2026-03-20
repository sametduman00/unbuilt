create table if not exists user_credits (
  user_id text primary key,
  credits integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  paddle_order_id text unique,
  package_slug text,
  credits_added integer not null,
  amount_usd numeric(10,2),
  status text default 'completed',
  created_at timestamptz default now()
);
alter table user_credits enable row level security;
alter table orders enable row level security;
drop policy if exists "service_all_credits" on user_credits;
drop policy if exists "service_all_orders" on orders;
create policy "service_all_credits" on user_credits for all to service_role using (true);
create policy "service_all_orders" on orders for all to service_role using (true);
create or replace function deduct_credit(p_user_id text)
returns boolean language plpgsql security definer as $$
declare current_credits integer;
begin
  select credits into current_credits from user_credits where user_id = p_user_id for update;
  if current_credits is null or current_credits <= 0 then return false; end if;
  update user_credits set credits = credits - 1, updated_at = now() where user_id = p_user_id;
  return true;
end; $$;
create or replace function add_credits(p_user_id text, p_amount integer)
returns void language plpgsql security definer as $$
begin
  insert into user_credits (user_id, credits) values (p_user_id, p_amount)
  on conflict (user_id) do update set credits = user_credits.credits + p_amount, updated_at = now();
end; $$;
