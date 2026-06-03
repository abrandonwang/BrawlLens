-- BrawlLens AI daily usage accounting.
-- Server routes write through the service role. No client policies are exposed.

create table if not exists public.ai_message_usage (
  id bigserial primary key,
  subject_type text not null check (subject_type in ('anonymous', 'user')),
  subject_key text not null,
  usage_day date not null,
  message_count integer not null default 0 check (message_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_type, subject_key, usage_day)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ai_message_usage_touch_updated_at on public.ai_message_usage;
create trigger ai_message_usage_touch_updated_at
before update on public.ai_message_usage
for each row execute function public.touch_updated_at();

alter table public.ai_message_usage enable row level security;

revoke all on public.ai_message_usage from anon, authenticated;
grant select, insert, update on public.ai_message_usage to service_role;
grant usage, select on sequence public.ai_message_usage_id_seq to service_role;

create or replace function public.increment_ai_message_usage(
  p_subject_type text,
  p_subject_key text,
  p_usage_day date
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  next_count integer;
begin
  if p_subject_type not in ('anonymous', 'user') then
    raise exception 'invalid subject_type';
  end if;

  insert into public.ai_message_usage (subject_type, subject_key, usage_day, message_count)
  values (p_subject_type, p_subject_key, p_usage_day, 1)
  on conflict (subject_type, subject_key, usage_day)
  do update set
    message_count = public.ai_message_usage.message_count + 1,
    updated_at = now()
  returning message_count into next_count;

  return next_count;
end;
$$;

revoke all on function public.increment_ai_message_usage(text, text, date) from public;
grant execute on function public.increment_ai_message_usage(text, text, date) to service_role;
