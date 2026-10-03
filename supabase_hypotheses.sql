-- =====================================================================
-- Solar PAYG — sauvegarde des hypothèses du modèle financier (Supabase)
-- À exécuter UNE SEULE FOIS : Supabase > SQL Editor > New query > Run
-- (même projet que la plateforme d'enquête).
-- =====================================================================

create table if not exists public.payg_hypotheses (
  project_key    text primary key,                 -- = SURVEY_SLUG de index.html (ex. solar-payg-mauritanie-2027)
  state          jsonb,                            -- hypothèses communes + 3 scénarios (prudent / central / dynamique)
  profiles       jsonb not null default '{"list":[],"active":null}'::jsonb,  -- jeux d'hypothèses nommés
  schema_version integer not null default 3,
  updated_at     timestamptz not null default now()
);

alter table public.payg_hypotheses enable row level security;

-- Le site utilise la clé publique « anon » : lecture + création + modification d'UNE ligne par projet.
-- (Pas de suppression.) Voir la remarque de sécurité dans le message de livraison.
drop policy if exists "payg_hyp_select" on public.payg_hypotheses;
drop policy if exists "payg_hyp_insert" on public.payg_hypotheses;
drop policy if exists "payg_hyp_update" on public.payg_hypotheses;

create policy "payg_hyp_select" on public.payg_hypotheses for select to anon, authenticated using (true);
create policy "payg_hyp_insert" on public.payg_hypotheses for insert to anon, authenticated with check (true);
create policy "payg_hyp_update" on public.payg_hypotheses for update to anon, authenticated using (true) with check (true);

grant select, insert, update on public.payg_hypotheses to anon, authenticated;
