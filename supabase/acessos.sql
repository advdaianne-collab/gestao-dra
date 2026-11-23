-- =====================================================================
--  Acessos: administradora libera e-mails pelo próprio app.
--  Rodar DEPOIS do schema.sql. Pode rodar de novo sem perder dados.
--  Na última linha, troque o e-mail pelo da administradora.
-- =====================================================================

create table if not exists public.administradoras (email text primary key);
create table if not exists public.convites (
  email text primary key,
  nome text,
  convidado_por text,
  criado_em timestamptz not null default now()
);

create or replace function public.sou_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.administradoras a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

alter table public.administradoras enable row level security;
alter table public.convites enable row level security;
drop policy if exists "adm_ver" on public.administradoras;
create policy "adm_ver" on public.administradoras for select to authenticated using (public.sou_admin());
drop policy if exists "convites_admin" on public.convites;
create policy "convites_admin" on public.convites for all to authenticated using (public.sou_admin()) with check (public.sou_admin());
revoke all on public.administradoras, public.convites from anon;
grant select on public.administradoras to authenticated;
grant select, insert, update, delete on public.convites to authenticated;

-- Só consegue criar conta quem está na lista de convites (ou é administradora).
create or replace function public.checar_convite()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.convites c where lower(c.email) = lower(new.email))
     and not exists (select 1 from public.administradoras a where lower(a.email) = lower(new.email)) then
    raise exception 'EMAIL_NAO_LIBERADO';
  end if;
  return new;
end $$;
drop trigger if exists checar_convite on auth.users;
create trigger checar_convite before insert on auth.users for each row execute function public.checar_convite();

-- Lista para a tela Acessos do app (só a administradora recebe linhas).
create or replace function public.lista_acessos()
returns table (email text, nome text, criado_em timestamptz, cadastrada boolean, confirmada boolean, ultimo_acesso timestamptz, escritorio text)
language sql stable security definer set search_path = public as $$
  select c.email, c.nome, c.criado_em, u.id is not null, u.email_confirmed_at is not null, u.last_sign_in_at,
    (select e.nome from public.membros m join public.escritorios e on e.id = m.escritorio_id where m.user_id = u.id order by m.criado_em limit 1)
  from public.convites c
  left join auth.users u on lower(u.email) = lower(c.email)
  where public.sou_admin()
  order by c.criado_em desc;
$$;

-- Remove o acesso: apaga o convite e o login. Os dados do escritório ficam guardados.
create or replace function public.remover_acesso(alvo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'Somente a administradora pode remover acessos.'; end if;
  if lower(alvo) = lower(coalesce(auth.jwt() ->> 'email', '')) then raise exception 'Você não pode remover o próprio acesso.'; end if;
  delete from public.convites where lower(email) = lower(alvo);
  delete from auth.users where lower(email) = lower(alvo);
end $$;

revoke execute on function public.lista_acessos(), public.remover_acesso(text) from anon, public;
grant execute on function public.sou_admin(), public.lista_acessos(), public.remover_acesso(text) to authenticated;

-- Administradora (troque pelo e-mail dela):
-- insert into public.administradoras (email) values ('email@exemplo.com') on conflict do nothing;
-- insert into public.convites (email, nome, convidado_por) values ('email@exemplo.com', 'Administradora', 'sistema') on conflict do nothing;
