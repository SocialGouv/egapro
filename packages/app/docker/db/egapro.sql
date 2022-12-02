CREATE EXTENSION IF NOT EXISTS unaccent;
DO
$$BEGIN
    CREATE TEXT SEARCH CONFIGURATION ftdict (COPY=simple);
    ALTER TEXT SEARCH CONFIGURATION ftdict ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
EXCEPTION
   WHEN unique_violation THEN
      NULL;  -- ignore error
END;$$;
CREATE TABLE IF NOT EXISTS declaration
(siren TEXT, year INT, modified_at TIMESTAMP WITH TIME ZONE, declared_at TIMESTAMP WITH TIME ZONE, declarant TEXT, data JSONB, draft JSONB, legacy JSONB, ft TSVECTOR,
PRIMARY KEY (siren, year));
CREATE TABLE IF NOT EXISTS representation_equilibree
(siren TEXT, year INT, modified_at TIMESTAMP WITH TIME ZONE, declared_at TIMESTAMP WITH TIME ZONE, data JSONB, ft TSVECTOR,
PRIMARY KEY (siren, year));
CREATE TABLE IF NOT EXISTS simulation
(id uuid PRIMARY KEY, modified_at TIMESTAMP WITH TIME ZONE, data JSONB);

-- search declaration
CREATE TABLE IF NOT EXISTS search
(siren TEXT, year INT, declared_at TIMESTAMP WITH TIME ZONE, ft TSVECTOR, region VARCHAR(2), departement VARCHAR(3), section_naf CHAR, note INT,
PRIMARY KEY (siren, year));
ALTER TABLE search DROP CONSTRAINT IF EXISTS declaration_exists;
ALTER TABLE search ADD CONSTRAINT declaration_exists FOREIGN KEY (siren,year) REFERENCES declaration(siren,year) ON DELETE CASCADE ON UPDATE CASCADE;

-- search representation equilibree
CREATE TABLE IF NOT EXISTS search_representation_equilibree
(siren TEXT, year INT, declared_at TIMESTAMP WITH TIME ZONE, ft TSVECTOR, region VARCHAR(2), departement VARCHAR(3), section_naf CHAR,
PRIMARY KEY (siren, year));
ALTER TABLE search_representation_equilibree DROP CONSTRAINT IF EXISTS representation_equilibree_exists;
ALTER TABLE search_representation_equilibree ADD CONSTRAINT representation_equilibree_exists FOREIGN KEY (siren,year) REFERENCES representation_equilibree(siren,year) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS archive
(siren TEXT, year INT, at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), by TEXT, ip INET, data JSONB);
CREATE TABLE IF NOT EXISTS ownership (siren TEXT, email TEXT, PRIMARY KEY (siren, email));

--
-- indexes
--

CREATE INDEX IF NOT EXISTS idx_effectifs ON declaration ((data->'entreprise'->'effectifs'->>'tranche'));
CREATE INDEX IF NOT EXISTS idx_status ON declaration (declared_at) WHERE declared_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ft ON search USING GIN (ft);
CREATE INDEX IF NOT EXISTS idx_region ON search(region);
CREATE INDEX IF NOT EXISTS idx_departement ON search(departement);
CREATE INDEX IF NOT EXISTS idx_naf ON search(section_naf);
CREATE INDEX IF NOT EXISTS idx_declared_at ON search (declared_at);
CREATE INDEX IF NOT EXISTS idx_email ON representation_equilibree((data->'déclarant'->>'email'));
CREATE INDEX IF NOT EXISTS idx_siren ON representation_equilibree(siren);
