CREATE EXTENSION IF NOT EXISTS unaccent;
DO
$$BEGIN
    CREATE TEXT SEARCH CONFIGURATION ftdict (COPY=simple);
    ALTER TEXT SEARCH CONFIGURATION ftdict ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
EXCEPTION
   WHEN unique_violation THEN
      NULL;  -- ignore error
END;$$;

CREATE TABLE IF NOT EXISTS representation_equilibree
(siren TEXT, year INT, modified_at TIMESTAMP WITH TIME ZONE, declared_at TIMESTAMP WITH TIME ZONE, data JSONB, ft TSVECTOR,
PRIMARY KEY (siren, year));

CREATE TABLE IF NOT EXISTS search_representation_equilibree
(siren TEXT, year INT, declared_at TIMESTAMP WITH TIME ZONE, ft TSVECTOR, region VARCHAR(2), departement VARCHAR(3), section_naf CHAR,
PRIMARY KEY (siren, year));
ALTER TABLE search_representation_equilibree DROP CONSTRAINT IF EXISTS representation_equilibree_exists;
ALTER TABLE search_representation_equilibree ADD CONSTRAINT representation_equilibree_exists FOREIGN KEY (siren,year) REFERENCES representation_equilibree(siren,year) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_email ON representation_equilibree((data->'déclarant'->>'email'));
CREATE INDEX IF NOT EXISTS idx_siren ON representation_equilibree(siren);
