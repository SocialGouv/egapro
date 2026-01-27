-- Migration: create ftdict text search configuration (idempotent)
CREATE EXTENSION IF NOT EXISTS unaccent;
DO
$$BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_ts_config WHERE cfgname = 'ftdict') THEN
        CREATE TEXT SEARCH CONFIGURATION ftdict (COPY = simple);
        ALTER TEXT SEARCH CONFIGURATION ftdict ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- ignore errors to keep migration idempotent
    RAISE NOTICE 'ftdict creation: ignored exception: %', SQLERRM;
END$$;
