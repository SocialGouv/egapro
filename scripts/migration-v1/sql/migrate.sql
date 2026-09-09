\set QUIET 1

SELECT :'migration_mode' = 'apply' AS migration_apply,
       :'migration_mode' = 'dry-run' AS migration_dry_run
\gset

\if :migration_apply
\elif :migration_dry_run
\else
  \echo 'invalid migration mode'
  \quit 2
\endif

BEGIN;
SET LOCAL statement_timeout = '30min';
SET LOCAL idle_in_transaction_session_timeout = '5min';

CREATE TEMP TABLE migration_expected_counts (
  representations bigint NOT NULL,
  referents bigint NOT NULL
) ON COMMIT DROP;
INSERT INTO migration_expected_counts
VALUES (:expected_representations::bigint, :expected_referents::bigint);

CREATE TEMP TABLE migration_representation_raw (
  siren text NOT NULL,
  year integer NOT NULL,
  declared_at timestamptz NOT NULL,
  modified_at timestamptz NOT NULL,
  data jsonb NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE migration_referent_raw (
  id text NOT NULL,
  county text,
  name text NOT NULL,
  principal boolean NOT NULL,
  region text NOT NULL,
  type text NOT NULL,
  value text NOT NULL,
  substitute_name text,
  substitute_email text
) ON COMMIT DROP;

CREATE TEMP TABLE migration_region (
  code text PRIMARY KEY,
  label text NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE migration_department (
  code text PRIMARY KEY,
  label text NOT NULL
) ON COMMIT DROP;

\copy migration_representation_raw FROM 'representations.csv' WITH (FORMAT csv, HEADER true)
\copy migration_referent_raw FROM 'referents.csv' WITH (FORMAT csv, HEADER true)
\copy migration_region FROM 'regions.csv' WITH (FORMAT csv, HEADER true)
\copy migration_department FROM 'departments.csv' WITH (FORMAT csv, HEADER true)

DO $validation$
DECLARE
  invalid_count bigint;
BEGIN
  IF current_setting('server_version_num')::integer < 140000 THEN
    RAISE EXCEPTION 'target PostgreSQL version must be 14 or newer';
  END IF;

  SELECT count(*) INTO invalid_count
  FROM (
    VALUES
      ('app_company', 'siren'),
      ('app_company', 'name'),
      ('app_company', 'address'),
      ('app_company', 'naf_code'),
      ('app_company', 'region'),
      ('app_company', 'department_code'),
      ('app_company', 'department_label'),
      ('app_company', 'created_at'),
      ('app_company', 'updated_at'),
      ('app_representation_declaration', 'id'),
      ('app_representation_declaration', 'siren'),
      ('app_representation_declaration', 'year'),
      ('app_representation_declaration', 'legacy_declarant'),
      ('app_representation_declaration', 'imported_from_v1_at'),
      ('app_representation_declaration', 'reference_period_start'),
      ('app_representation_declaration', 'reference_period_end'),
      ('app_representation_declaration', 'executive_women_percent'),
      ('app_representation_declaration', 'executive_men_percent'),
      ('app_representation_declaration', 'not_computable_reason_executives'),
      ('app_representation_declaration', 'member_women_percent'),
      ('app_representation_declaration', 'member_men_percent'),
      ('app_representation_declaration', 'not_computable_reason_members'),
      ('app_representation_declaration', 'publish_date'),
      ('app_representation_declaration', 'publish_url'),
      ('app_representation_declaration', 'publish_modalities'),
      ('app_representation_declaration', 'current_step'),
      ('app_representation_declaration', 'status'),
      ('app_representation_declaration', 'submitted_at'),
      ('app_representation_declaration', 'created_at'),
      ('app_representation_declaration', 'updated_at'),
      ('app_referent', 'id'),
      ('app_referent', 'region'),
      ('app_referent', 'county'),
      ('app_referent', 'name'),
      ('app_referent', 'type'),
      ('app_referent', 'value'),
      ('app_referent', 'principal'),
      ('app_referent', 'substitute_name'),
      ('app_referent', 'substitute_email'),
      ('app_referent', 'created_at'),
      ('app_referent', 'updated_at')
  ) AS required(table_name, column_name)
  LEFT JOIN information_schema.columns AS actual
    ON actual.table_schema = 'public'
   AND actual.table_name = required.table_name
   AND actual.column_name = required.column_name
  WHERE actual.column_name IS NULL;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'target schema misses % required columns', invalid_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_index
    WHERE indexrelid = to_regclass('public.representation_declaration_siren_year_unique')
      AND indisunique
  ) THEN
    RAISE EXCEPTION 'target representation unique index is missing';
  END IF;
  IF to_regprocedure('gen_random_uuid()') IS NULL THEN
    RAISE EXCEPTION 'target gen_random_uuid() function is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS type
    JOIN pg_enum AS value ON value.enumtypid = type.oid
    WHERE type.typnamespace = 'public'::regnamespace
      AND type.typname = 'referent_type' AND value.enumlabel = 'email'
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_type AS type
    JOIN pg_enum AS value ON value.enumtypid = type.oid
    WHERE type.typnamespace = 'public'::regnamespace
      AND type.typname = 'referent_type' AND value.enumlabel = 'url'
  ) THEN
    RAISE EXCEPTION 'target referent enum is incompatible';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type AS type JOIN pg_enum AS value ON value.enumtypid = type.oid
    WHERE type.typnamespace = 'public'::regnamespace
      AND type.typname = 'representation_declaration_status' AND value.enumlabel = 'submitted'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_type AS type JOIN pg_enum AS value ON value.enumtypid = type.oid
    WHERE type.typnamespace = 'public'::regnamespace
      AND type.typname = 'representation_not_computable_executives'
      AND value.enumlabel IN ('aucun_cadre_dirigeant', 'un_seul_cadre_dirigeant')
    GROUP BY type.oid HAVING count(DISTINCT value.enumlabel) = 2
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_type AS type JOIN pg_enum AS value ON value.enumtypid = type.oid
    WHERE type.typnamespace = 'public'::regnamespace
      AND type.typname = 'representation_not_computable_members'
      AND value.enumlabel = 'aucune_instance_dirigeante'
  ) THEN
    RAISE EXCEPTION 'target representation enums are incompatible';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE contype = 'f' AND confrelid = 'public.app_referent'::regclass
  ) THEN
    RAISE EXCEPTION 'target referent table has incoming foreign keys';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.app_referent'::regclass
      AND NOT tgisinternal AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'target referent table has enabled user triggers';
  END IF;

  SELECT count(*) INTO invalid_count
  FROM migration_expected_counts AS expected
  WHERE expected.representations <> (SELECT count(*) FROM migration_representation_raw)
     OR expected.referents <> (SELECT count(*) FROM migration_referent_raw);
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'snapshot row counts do not match its manifest';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM migration_referent_raw) THEN
    RAISE EXCEPTION 'referent snapshot is empty';
  END IF;

  SELECT count(*) INTO invalid_count
  FROM migration_referent_raw AS source
  LEFT JOIN migration_region AS region ON region.code = source.region
  LEFT JOIN migration_department AS department ON department.code = source.county
  WHERE source.id !~* '^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$'
     OR source.name = '' OR char_length(source.name) > 255
     OR region.code IS NULL
     OR (source.county IS NOT NULL AND department.code IS NULL)
     OR source.type NOT IN ('email', 'url')
     OR source.value = '' OR char_length(source.value) > 500
     OR (source.type = 'email' AND source.value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
     OR (source.type = 'url' AND source.value !~ '^[A-Za-z][A-Za-z0-9+.-]*:[^[:space:]]+$')
     OR char_length(source.substitute_name) > 255
     OR char_length(source.substitute_email) > 255
     OR (source.substitute_email IS NOT NULL AND source.substitute_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'referent snapshot contains % invalid rows', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM (
    SELECT id FROM migration_referent_raw GROUP BY id HAVING count(*) > 1
  ) AS duplicates;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'referent snapshot contains % duplicate ids', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM migration_representation_raw AS source
  WHERE source.siren !~ '^[0-9]{9}$'
     OR jsonb_typeof(source.data) <> 'object'
     OR jsonb_typeof(source.data #> '{déclarant}') <> 'object'
     OR jsonb_typeof(source.data #> '{déclaration}') <> 'object'
     OR jsonb_typeof(source.data #> '{entreprise}') <> 'object'
     OR jsonb_typeof(source.data #> '{indicateurs,représentation_équilibrée}') <> 'object'
     OR source.data #>> '{entreprise,siren}' IS DISTINCT FROM source.siren
     OR coalesce(source.data #>> '{entreprise,raison_sociale}', '') = ''
     OR char_length(source.data #>> '{entreprise,raison_sociale}') > 255
     OR char_length(source.data #>> '{entreprise,adresse}') > 500
     OR (
       source.data #>> '{entreprise,code_naf}' IS DISTINCT FROM '[NON-DIFFUSIBLE]'
       AND char_length(source.data #>> '{entreprise,code_naf}') > 10
     )
     OR char_length(source.data #>> '{entreprise,département}') > 3
     OR jsonb_typeof(source.data #> '{déclarant,email}') IS DISTINCT FROM 'string'
     OR jsonb_typeof(source.data #> '{déclarant,nom}') IS DISTINCT FROM 'string'
     OR jsonb_typeof(source.data #> '{déclarant,prénom}') IS DISTINCT FROM 'string'
     OR jsonb_typeof(source.data #> '{déclarant,téléphone}') IS DISTINCT FROM 'string'
     OR coalesce(source.data #>> '{déclaration,fin_période_référence}', '') !~ '^\d{4}-\d{2}-\d{2}$'
     OR to_char(to_date(source.data #>> '{déclaration,fin_période_référence}', 'YYYY-MM-DD'), 'YYYY-MM-DD')
        IS DISTINCT FROM source.data #>> '{déclaration,fin_période_référence}'
     OR (
       source.data #> '{déclaration,publication}' IS NOT NULL
       AND jsonb_typeof(source.data #> '{déclaration,publication}') NOT IN ('object', 'null')
     )
     OR (
       source.data #>> '{déclaration,publication,date}' IS NOT NULL
       AND (
         source.data #>> '{déclaration,publication,date}' !~ '^\d{4}-\d{2}-\d{2}$'
         OR to_char(to_date(source.data #>> '{déclaration,publication,date}', 'YYYY-MM-DD'), 'YYYY-MM-DD')
            IS DISTINCT FROM source.data #>> '{déclaration,publication,date}'
       )
     )
     OR char_length(source.data #>> '{déclaration,publication,url}') > 500
     OR (
       source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_cadres}' IS NOT NULL
       AND source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_cadres}'
           NOT IN ('aucun_cadre_dirigeant', 'un_seul_cadre_dirigeant')
     )
     OR (
       source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_membres}' IS NOT NULL
       AND source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_membres}'
           <> 'aucune_instance_dirigeante'
     )
     OR (
       source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_cadres}' IS NULL
       AND EXISTS (
         SELECT 1
         FROM unnest(ARRAY[
           source.data #>> '{indicateurs,représentation_équilibrée,pourcentage_femmes_cadres}',
           source.data #>> '{indicateurs,représentation_équilibrée,pourcentage_hommes_cadres}'
         ]) AS percentage(value)
         WHERE percentage.value IS NOT NULL
           AND (percentage.value !~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
             OR percentage.value::numeric < 0 OR percentage.value::numeric > 100)
       )
     )
     OR (
       source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_membres}' IS NULL
       AND EXISTS (
         SELECT 1
         FROM unnest(ARRAY[
           source.data #>> '{indicateurs,représentation_équilibrée,pourcentage_femmes_membres}',
           source.data #>> '{indicateurs,représentation_équilibrée,pourcentage_hommes_membres}'
         ]) AS percentage(value)
         WHERE percentage.value IS NOT NULL
           AND (percentage.value !~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
             OR percentage.value::numeric < 0 OR percentage.value::numeric > 100)
       )
     );
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'representation snapshot contains % invalid rows', invalid_count;
  END IF;
END
$validation$;

CREATE FUNCTION pg_temp.migration_reference_period_start(period_end date)
RETURNS date
LANGUAGE sql
IMMUTABLE
STRICT
AS $function$
  SELECT CASE
    WHEN to_char(period_end, 'MM-DD') = '02-29'
      THEN make_date(extract(year FROM period_end)::integer - 1, 3, 2)
    ELSE (period_end - interval '1 year' + interval '1 day')::date
  END
$function$;

CREATE TEMP TABLE migration_representation ON COMMIT DROP AS
SELECT
  source.siren,
  source.year,
  jsonb_build_object(
    'email', source.data #>> '{déclarant,email}',
    'lastname', source.data #>> '{déclarant,nom}',
    'firstname', source.data #>> '{déclarant,prénom}',
    'phone', source.data #>> '{déclarant,téléphone}'
  ) AS legacy_declarant,
  pg_temp.migration_reference_period_start((source.data #>> '{déclaration,fin_période_référence}')::date) AS reference_period_start,
  (source.data #>> '{déclaration,fin_période_référence}')::date AS reference_period_end,
  CASE WHEN source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_cadres}' IS NOT NULL
    THEN NULL ELSE (source.data #>> '{indicateurs,représentation_équilibrée,pourcentage_femmes_cadres}')::numeric END AS executive_women_percent,
  CASE WHEN source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_cadres}' IS NOT NULL
    THEN NULL ELSE (source.data #>> '{indicateurs,représentation_équilibrée,pourcentage_hommes_cadres}')::numeric END AS executive_men_percent,
  source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_cadres}' AS not_computable_reason_executives,
  CASE WHEN source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_membres}' IS NOT NULL
    THEN NULL ELSE (source.data #>> '{indicateurs,représentation_équilibrée,pourcentage_femmes_membres}')::numeric END AS member_women_percent,
  CASE WHEN source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_membres}' IS NOT NULL
    THEN NULL ELSE (source.data #>> '{indicateurs,représentation_équilibrée,pourcentage_hommes_membres}')::numeric END AS member_men_percent,
  source.data #>> '{indicateurs,représentation_équilibrée,motif_non_calculabilité_membres}' AS not_computable_reason_members,
  (source.data #>> '{déclaration,publication,date}')::date AS publish_date,
  source.data #>> '{déclaration,publication,url}' AS publish_url,
  source.data #>> '{déclaration,publication,modalités}' AS publish_modalities,
  source.declared_at AS submitted_at,
  source.declared_at AS created_at,
  source.modified_at AS updated_at,
  source.data #>> '{entreprise,raison_sociale}' AS company_name,
  source.data #>> '{entreprise,adresse}' AS company_address,
  nullif(nullif(source.data #>> '{entreprise,code_naf}', '[NON-DIFFUSIBLE]'), '') AS company_naf_code,
  region.label AS company_region,
  source.data #>> '{entreprise,département}' AS company_department_code,
  department.label AS company_department_label
FROM migration_representation_raw AS source
LEFT JOIN migration_region AS region
  ON region.code = source.data #>> '{entreprise,région}'
LEFT JOIN migration_department AS department
  ON department.code = source.data #>> '{entreprise,département}';

\if :migration_apply
  SET LOCAL lock_timeout = '10s';
  SELECT pg_advisory_xact_lock(3555, 1) \g /dev/null
  LOCK TABLE public.app_representation_declaration IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE public.app_referent IN SHARE ROW EXCLUSIVE MODE;
\endif

CREATE TEMP TABLE migration_representation_plan ON COMMIT DROP AS
SELECT
  source.*,
  CASE
    WHEN target.id IS NULL THEN 'insert'
    WHEN target.imported_from_v1_at IS NULL THEN 'skip_native'
    WHEN target.updated_at IS NULL OR source.updated_at > target.updated_at THEN 'update'
    ELSE 'skip_unchanged'
  END AS action
FROM migration_representation AS source
LEFT JOIN public.app_representation_declaration AS target
  ON target.siren = source.siren AND target.year = source.year;

CREATE TEMP TABLE migration_referent_state ON COMMIT DROP AS
SELECT EXISTS (
  (SELECT id, region, county, name, type::text, value, principal, substitute_name, substitute_email
   FROM public.app_referent
   EXCEPT
   SELECT id, region, county, name, type, value, principal, substitute_name, substitute_email
   FROM migration_referent_raw)
  UNION ALL
  (SELECT id, region, county, name, type, value, principal, substitute_name, substitute_email
   FROM migration_referent_raw
   EXCEPT
   SELECT id, region, county, name, type::text, value, principal, substitute_name, substitute_email
   FROM public.app_referent)
) AS changed;

CREATE TEMP TABLE migration_report ON COMMIT DROP AS
SELECT
  (SELECT count(*) FROM migration_representation_raw) AS representations_read,
  (SELECT count(*) FROM migration_representation_plan WHERE action = 'insert') AS representations_insert,
  (SELECT count(*) FROM migration_representation_plan WHERE action = 'update') AS representations_update,
  (SELECT count(*) FROM migration_representation_plan WHERE action = 'skip_native') AS representations_skip_native,
  (SELECT count(*) FROM migration_representation_plan WHERE action = 'skip_unchanged') AS representations_skip_unchanged,
  (SELECT count(DISTINCT plan.siren)
   FROM migration_representation_plan AS plan
   LEFT JOIN public.app_company AS company ON company.siren = plan.siren
   WHERE plan.action IN ('insert', 'update') AND company.siren IS NULL) AS companies_insert,
  (SELECT count(*) FROM migration_referent_raw) AS referents_read,
  (SELECT count(*) FROM public.app_referent) AS referents_before,
  (SELECT changed FROM migration_referent_state) AS referents_replace;

\if :migration_apply
  INSERT INTO public.app_company (
    siren, name, address, naf_code, region, department_code, department_label,
    created_at, updated_at
  )
  SELECT DISTINCT ON (plan.siren)
    plan.siren, plan.company_name, plan.company_address, plan.company_naf_code,
    plan.company_region, plan.company_department_code, plan.company_department_label,
    transaction_timestamp(), transaction_timestamp()
  FROM migration_representation_plan AS plan
  WHERE plan.action IN ('insert', 'update')
  ORDER BY plan.siren, plan.year DESC
  ON CONFLICT (siren) DO NOTHING;

  INSERT INTO public.app_representation_declaration (
    id, siren, year, legacy_declarant, imported_from_v1_at,
    reference_period_start, reference_period_end,
    executive_women_percent, executive_men_percent, not_computable_reason_executives,
    member_women_percent, member_men_percent, not_computable_reason_members,
    publish_date, publish_url, publish_modalities,
    current_step, status, submitted_at, created_at, updated_at
  )
  SELECT
    gen_random_uuid()::text, siren, year, legacy_declarant, transaction_timestamp(),
    reference_period_start, reference_period_end,
    executive_women_percent, executive_men_percent,
    not_computable_reason_executives::public.representation_not_computable_executives,
    member_women_percent, member_men_percent,
    not_computable_reason_members::public.representation_not_computable_members,
    publish_date, publish_url, publish_modalities,
    5, 'submitted', submitted_at, created_at, updated_at
  FROM migration_representation_plan
  WHERE action = 'insert';

  UPDATE public.app_representation_declaration AS target
  SET legacy_declarant = source.legacy_declarant,
      reference_period_start = source.reference_period_start,
      reference_period_end = source.reference_period_end,
      executive_women_percent = source.executive_women_percent,
      executive_men_percent = source.executive_men_percent,
      not_computable_reason_executives = source.not_computable_reason_executives::public.representation_not_computable_executives,
      member_women_percent = source.member_women_percent,
      member_men_percent = source.member_men_percent,
      not_computable_reason_members = source.not_computable_reason_members::public.representation_not_computable_members,
      publish_date = source.publish_date,
      publish_url = source.publish_url,
      publish_modalities = source.publish_modalities,
      submitted_at = source.submitted_at,
      updated_at = source.updated_at
  FROM migration_representation_plan AS source
  WHERE source.action = 'update'
    AND target.siren = source.siren
    AND target.year = source.year;

  DELETE FROM public.app_referent
  WHERE (SELECT changed FROM migration_referent_state);

  INSERT INTO public.app_referent (
    id, region, county, name, type, value, principal,
    substitute_name, substitute_email, created_at, updated_at
  )
  SELECT
    source.id, source.region, source.county, source.name,
    source.type::public.referent_type, source.value, source.principal,
    source.substitute_name, source.substitute_email,
    transaction_timestamp(), transaction_timestamp()
  FROM migration_referent_raw AS source
  WHERE (SELECT changed FROM migration_referent_state);
\endif

SELECT 'mode=' || :'migration_mode'
UNION ALL SELECT 'representations.read=' || representations_read FROM migration_report
UNION ALL SELECT 'representations.insert=' || representations_insert FROM migration_report
UNION ALL SELECT 'representations.update=' || representations_update FROM migration_report
UNION ALL SELECT 'representations.skip_native=' || representations_skip_native FROM migration_report
UNION ALL SELECT 'representations.skip_unchanged=' || representations_skip_unchanged FROM migration_report
UNION ALL SELECT 'companies.insert=' || companies_insert FROM migration_report
UNION ALL SELECT 'referents.read=' || referents_read FROM migration_report
UNION ALL SELECT 'referents.before=' || referents_before FROM migration_report
UNION ALL SELECT 'referents.replace=' || referents_replace FROM migration_report;

COMMIT;
