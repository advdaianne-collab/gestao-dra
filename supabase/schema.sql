-- =====================================================================
--  Gestão do Escritório · Método D.R.A.
--  Estrutura do banco no Supabase (rodar UMA vez no SQL Editor).
--  Pode rodar de novo sem perder dados: tudo usa "if not exists".
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Escritório e quem faz parte dele ----------
create table if not exists public.escritorios (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'Meu escritório',
  criado_em timestamptz not null default now()
);

create table if not exists public.membros (
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'titular',
  criado_em timestamptz not null default now(),
  primary key (escritorio_id, user_id)
);

-- Funções de apoio às regras de acesso (rodam com permissão do dono,
-- mas só olham o usuário logado).
create or replace function public.sou_membro(e uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m where m.escritorio_id = e and m.user_id = auth.uid());
$$;

create or replace function public.sou_membro_txt(e text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m where m.escritorio_id::text = e and m.user_id = auth.uid());
$$;

create or replace function public.meu_escritorio()
returns uuid language sql stable security definer set search_path = public as $$
  select m.escritorio_id from public.membros m where m.user_id = auth.uid()
  order by m.criado_em limit 1;
$$;

-- Chamado pelo app logo após o login: se o usuário ainda não tem
-- escritório, cria um e o coloca como titular.
create or replace function public.garantir_escritorio(nome_escritorio text default 'Meu escritório')
returns uuid language plpgsql security definer set search_path = public as $$
declare e uuid;
begin
  if auth.uid() is null then raise exception 'É preciso estar logado.'; end if;
  e := public.meu_escritorio();
  if e is null then
    insert into public.escritorios(nome) values (coalesce(nullif(nome_escritorio,''),'Meu escritório')) returning id into e;
    insert into public.membros(escritorio_id, user_id, papel) values (e, auth.uid(), 'titular');
  end if;
  return e;
end $$;

-- ---------- Tabelas de trabalho ----------
-- Todas têm: id, escritorio_id (preenchido sozinho), criado_em, atualizado_em.

create table if not exists public.listas (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  nome text not null,
  ordem numeric default 55,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
-- chave: prazo | acompanhamento | audiencia | feito guarda nome e posição das colunas fixas.
-- referencia: lista de consulta (não entra na agenda nem nos alertas).
alter table public.listas add column if not exists chave text;
alter table public.listas add column if not exists referencia boolean not null default false;
alter table public.listas add column if not exists obs text;

create table if not exists public.compromissos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  tipo text not null default 'prazo',            -- prazo | audiencia | acompanhamento
  titulo text not null,
  data date,
  hora text,
  processo text,
  cliente text,
  local text,
  descricao text,
  etiquetas jsonb not null default '[]',
  checklist jsonb not null default '[]',
  prioridade text default 'normal',              -- normal | alta
  status text not null default 'aberto',         -- aberto | feito
  baixa_em date,
  feito_resumo text,
  lista uuid references public.listas(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.processos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  numero text,
  titulo text not null,
  cliente text,
  parte_contraria text,
  orgao text,
  area text,
  fase text,
  risco text,
  valor_causa numeric,
  situacao text not null default 'ativo',        -- ativo | suspenso | encerrado
  encerrado_em date,
  obs text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  nome text not null,
  cpf_cnpj text,
  whatsapp text,
  email text,
  nascimento date,
  endereco text,
  obs text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.publicacoes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  data date,
  processo text,
  fonte text,
  texto text,
  status text not null default 'nova',           -- nova | triada | descartada
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.comunicacoes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  data date,
  cliente text,
  processo text,
  canal text default 'WhatsApp',
  texto text,
  status text not null default 'rascunho',       -- rascunho | enviada
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  nome text not null,
  data date,
  processo text,
  cliente text,
  compromisso_id uuid,
  caminho text,                                  -- caminho do arquivo no Storage
  tipo text,
  tamanho bigint,
  obs text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.financeiro (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  tipo text not null default 'recebimento',      -- recebimento | despesa
  descricao text,
  cliente text,
  processo text,
  valor numeric not null default 0,
  vencimento date,
  pagamento date,
  status text not null default 'pendente',       -- pendente | recebido | cancelado
  forma text,
  obs text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.manual (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null default public.meu_escritorio() references public.escritorios(id) on delete cascade,
  titulo text not null,
  ordem numeric default 99,
  texto text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Regras de acesso (Row Level Security) ----------
create or replace function public.toca_atualizado()
returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['listas','compromissos','processos','clientes','publicacoes','comunicacoes','documentos','financeiro','manual'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "so_do_meu_escritorio" on public.%I', t);
    execute format('create policy "so_do_meu_escritorio" on public.%I for all to authenticated using (public.sou_membro(escritorio_id)) with check (public.sou_membro(escritorio_id))', t);
    execute format('drop trigger if exists toca_%I on public.%I', t, t);
    execute format('create trigger toca_%I before update on public.%I for each row execute function public.toca_atualizado()', t, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create index if not exists %I on public.%I (escritorio_id)', t || '_esc_idx', t);
  end loop;
end $$;

alter table public.escritorios enable row level security;
alter table public.membros enable row level security;
drop policy if exists "ver_meu_escritorio" on public.escritorios;
create policy "ver_meu_escritorio" on public.escritorios for select to authenticated using (public.sou_membro(id));
drop policy if exists "renomear_meu_escritorio" on public.escritorios;
create policy "renomear_meu_escritorio" on public.escritorios for update to authenticated using (public.sou_membro(id)) with check (public.sou_membro(id));
drop policy if exists "ver_meus_vinculos" on public.membros;
create policy "ver_meus_vinculos" on public.membros for select to authenticated using (user_id = auth.uid());
revoke all on public.escritorios, public.membros from anon;
grant select, update on public.escritorios to authenticated;
grant select on public.membros to authenticated;

revoke execute on function public.garantir_escritorio(text) from anon, public;
grant execute on function public.garantir_escritorio(text) to authenticated;

-- ---------- Arquivos (Storage): pasta privada "documentos" ----------
-- Cada arquivo fica em documentos/<id do escritório>/<arquivo>.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;

drop policy if exists "docs_ler" on storage.objects;
create policy "docs_ler" on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and public.sou_membro_txt((storage.foldername(name))[1]));
drop policy if exists "docs_enviar" on storage.objects;
create policy "docs_enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and public.sou_membro_txt((storage.foldername(name))[1]));
drop policy if exists "docs_alterar" on storage.objects;
create policy "docs_alterar" on storage.objects for update to authenticated
  using (bucket_id = 'documentos' and public.sou_membro_txt((storage.foldername(name))[1]));
drop policy if exists "docs_apagar" on storage.objects;
create policy "docs_apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and public.sou_membro_txt((storage.foldername(name))[1]));

-- Pronto. Agora crie o usuário em Authentication > Users > Add user.
