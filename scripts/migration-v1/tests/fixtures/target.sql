CREATE TYPE referent_type AS ENUM ('email', 'url');
CREATE TYPE representation_declaration_status AS ENUM ('draft', 'submitted', 'not_subject');
CREATE TYPE representation_not_computable_executives AS ENUM (
  'aucun_cadre_dirigeant', 'un_seul_cadre_dirigeant'
);
CREATE TYPE representation_not_computable_members AS ENUM ('aucune_instance_dirigeante');

CREATE TABLE app_company (
  siren varchar(9) PRIMARY KEY,
  name varchar(255) NOT NULL,
  address varchar(500),
  naf_code varchar(10),
  region varchar(255),
  department_code varchar(3),
  department_label varchar(255),
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE app_representation_declaration (
  id varchar(255) PRIMARY KEY,
  siren varchar(9) NOT NULL REFERENCES app_company(siren),
  year integer NOT NULL,
  declarant_id varchar(255),
  legacy_declarant jsonb,
  imported_from_v1_at timestamptz,
  reference_period_start date,
  reference_period_end date,
  executive_women_percent numeric(5, 2),
  executive_men_percent numeric(5, 2),
  not_computable_reason_executives representation_not_computable_executives,
  member_women_percent numeric(5, 2),
  member_men_percent numeric(5, 2),
  not_computable_reason_members representation_not_computable_members,
  publish_date date,
  publish_url varchar(500),
  publish_modalities text,
  current_step integer DEFAULT 0,
  status representation_declaration_status DEFAULT 'draft' NOT NULL,
  submitted_at timestamptz,
  draft jsonb,
  draft_updated_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);
CREATE UNIQUE INDEX representation_declaration_siren_year_unique
  ON app_representation_declaration (siren, year);

CREATE TABLE app_referent (
  id varchar(255) PRIMARY KEY,
  region varchar(3) NOT NULL,
  county varchar(3),
  name varchar(255) NOT NULL,
  type referent_type NOT NULL,
  value varchar(500) NOT NULL,
  principal boolean DEFAULT false NOT NULL,
  substitute_name varchar(255),
  substitute_email varchar(255),
  created_at timestamptz,
  updated_at timestamptz
);

INSERT INTO app_company (siren, name)
VALUES ('800000001', 'Existing company'), ('800000002', 'Native company');

INSERT INTO app_representation_declaration (
  id, siren, year, imported_from_v1_at,
  executive_women_percent, current_step, status, updated_at
)
VALUES
  ('imported-row', '800000001', 2023, '2024-01-01T00:00:00Z', 10, 5, 'submitted', '2024-01-02T00:00:00Z'),
  ('native-row', '800000002', 2023, NULL, 10, 2, 'draft', '2024-01-02T00:00:00Z');

INSERT INTO app_referent (id, region, county, name, type, value, principal)
VALUES (
  '33333333-3333-4333-8333-333333333333', '11', '92',
  'Stale referent', 'email', 'stale@example.test', false
);
