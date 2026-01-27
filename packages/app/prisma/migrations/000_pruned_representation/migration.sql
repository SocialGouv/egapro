-- Migration: representation_equilibree minimal schema (Prisma formatted migration)
-- This migration creates only the tables/indexes required for the representation_equilibree feature.
BEGIN;

-- Table: representation_equilibree
CREATE TABLE IF NOT EXISTS representation_equilibree (
  siren varchar NOT NULL,
  year integer NOT NULL,
  modified_at timestamptz,
  declared_at timestamptz,
  data jsonb,
  ft tsvector,
  PRIMARY KEY (siren, year)
);

CREATE INDEX IF NOT EXISTS idx_representation_equilibree_year ON representation_equilibree(year);
CREATE INDEX IF NOT EXISTS idx_siren ON representation_equilibree(siren);

-- Table: search_representation_equilibree (search helper for representation_equilibree)
CREATE TABLE IF NOT EXISTS search_representation_equilibree (
  siren varchar NOT NULL,
  year integer NOT NULL,
  declared_at timestamptz,
  ft tsvector,
  region varchar(2),
  departement varchar(3),
  section_naf char(1),
  PRIMARY KEY (siren, year),
  CONSTRAINT fk_representation_equilibree FOREIGN KEY (siren, year) REFERENCES representation_equilibree(siren, year) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_representation_equilibree_declared_at ON search_representation_equilibree(declared_at);
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_departement ON search_representation_equilibree(departement);
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_naf ON search_representation_equilibree(section_naf);
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_region ON search_representation_equilibree(region);
CREATE INDEX IF NOT EXISTS idx_search_representation_equilibree_siren ON search_representation_equilibree(siren);
CREATE INDEX IF NOT EXISTS idx_search_representation_equilibree_year ON search_representation_equilibree(year);

COMMIT;
